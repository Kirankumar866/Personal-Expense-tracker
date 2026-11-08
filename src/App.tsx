/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Expense, BudgetConfig, UserProfile } from './types/expense';
import { 
  loadStoredExpenses, 
  saveStoredExpenses, 
  loadStoredBudgetConfig, 
  saveStoredBudgetConfig, 
  loadStoredUserProfile, 
  saveStoredUserProfile, 
  resetToDemoData, 
  clearAllData 
} from './utils/storage';
import { 
  getMonthComparison, 
  getWeekComparison, 
  calculateSafeDailySpend, 
  generateSmartInsights,
  calculateBuddyBalance
} from './utils/analytics';
import { Header } from './components/Header';
import { QuickLogBar } from './components/QuickLogBar';
import { MetricCards } from './components/MetricCards';
import { InsightsBanner } from './components/InsightsBanner';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { BudgetManager } from './components/BudgetManager';
import { BuddySettlement } from './components/BuddySettlement';
import { ExpenseList } from './components/ExpenseList';
import { SyncModal } from './components/SyncModal';
import { MonthlyLogsView } from './components/MonthlyLogsView';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { ActivityFeedModal } from './components/ActivityFeedModal';
import { LogExpenseModal } from './components/LogExpenseModal';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { 
  Users, 
  ArrowUpRight, 
  Check 
} from 'lucide-react';

function TrackerContent() {
  const { 
    user, 
    isCloudConnected,
    cloudExpenses, 
    cloudActivities, 
    cloudProfile,
    cloudBudget,
    addExpenseToCloud, 
    updateExpenseInCloud,
    deleteExpenseFromCloud, 
    logActivityToCloud,
    saveProfileToCloud,
    saveBudgetToCloud
  } = useFirebase();

  const [localExpenses, setLocalExpenses] = useState<Expense[]>(() => loadStoredExpenses());
  const [budget, setBudget] = useState<BudgetConfig>(() => loadStoredBudgetConfig());
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredUserProfile());

  // Sync cloud profile & budget when user is authenticated
  useEffect(() => {
    if (cloudProfile) {
      setProfile(cloudProfile);
    }
  }, [cloudProfile]);

  useEffect(() => {
    if (cloudBudget) {
      setBudget(cloudBudget);
    }
  }, [cloudBudget]);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'comparison' | 'monthly' | 'budget' | 'buddy' | 'expenses'>('dashboard');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isLogExpenseModalOpen, setIsLogExpenseModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Active expenses: Cloud data when signed in and available; otherwise local storage
  const expenses = useMemo(() => {
    if (user && cloudExpenses.length > 0) {
      return cloudExpenses;
    }
    return localExpenses;
  }, [user, cloudExpenses, localExpenses]);

  // Persist local state
  useEffect(() => {
    saveStoredExpenses(localExpenses);
  }, [localExpenses]);

  useEffect(() => {
    saveStoredBudgetConfig(budget);
  }, [budget]);

  useEffect(() => {
    saveStoredUserProfile(profile);
  }, [profile]);

  // Calculations
  const monthComp = useMemo(() => {
    return getMonthComparison(expenses, userFilter);
  }, [expenses, userFilter]);

  const weekComp = useMemo(() => {
    return getWeekComparison(expenses, userFilter);
  }, [expenses, userFilter]);

  const safeDailyData = useMemo(() => {
    return calculateSafeDailySpend(budget, monthComp.currentTotal);
  }, [budget, monthComp.currentTotal]);

  const smartInsights = useMemo(() => {
    return generateSmartInsights(
      monthComp,
      weekComp,
      budget,
      monthComp.currentTotal
    );
  }, [monthComp, weekComp, budget]);

  // Handlers
  const handleAddExpense = async (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...newExpData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };

    setLocalExpenses((prev) => [newExpense, ...prev]);

    if (user) {
      await addExpenseToCloud(newExpense);
    }

    setSyncToast(`Logged "${newExpense.title}" ($${newExpense.amount.toFixed(2)})`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleBatchAddExpenses = async (newExpenses: Omit<Expense, 'id' | 'createdAt'>[]) => {
    const created: Expense[] = newExpenses.map((exp, idx) => ({
      ...exp,
      id: `exp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now() + idx,
    }));

    setLocalExpenses((prev) => [...created, ...prev]);

    if (user) {
      for (const exp of created) {
        await addExpenseToCloud(exp);
      }
      await logActivityToCloud(
        'scanned_receipt',
        `Scanned receipt and imported ${created.length} line items with voice analysis`
      );
    }

    setSyncToast(`Successfully imported ${created.length} expense${created.length > 1 ? 's' : ''} from receipt!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleDeleteExpense = async (id: string) => {
    setLocalExpenses((prev) => prev.filter((e) => e.id !== id));

    if (user) {
      await deleteExpenseFromCloud(id);
      await logActivityToCloud('logged_expense', `Deleted an expense record`);
    }
  };

  const handleVerifyExpense = async (id: string, verifierName: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const debtors = target.splitWithNames && target.splitWithNames.length > 0
      ? target.splitWithNames
      : [target.splitWithName || profile.friendName || 'Alex'];

    const currentVerified = target.verifiedByNames || (target.verifiedByFriend ? debtors : []);
    const updatedVerified = Array.from(new Set([...currentVerified, verifierName]));
    const isFullyVerified = debtors.every((d) => updatedVerified.some((v) => v.toLowerCase() === d.toLowerCase()));

    const updated: Expense = {
      ...target,
      verifiedByNames: updatedVerified,
      verifiedByFriend: isFullyVerified,
      verifiedAt: Date.now(),
    };

    setLocalExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));

    if (user) {
      await updateExpenseInCloud(updated);
      await logActivityToCloud('logged_expense', `${verifierName} verified their share for "${target.title}"`);
    }

    // Automated notification to other roommates that this user verified
    try {
      await fetch('/api/notify-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: target.id,
          expenseTitle: target.title,
          amount: target.amount,
          action: 'verified',
          senderName: verifierName,
          recipientName: target.paidBy === 'me' ? profile.meName : (target.splitWithName || 'Roommate'),
          recipientEmail: profile.meEmail || 'kirankumar201018@gmail.com',
        }),
      });
    } catch (e) {}

    setSyncToast(`✅ ${verifierName} verified share for "${target.title}"!`);
    setTimeout(() => setSyncToast(null), 3200);
  };

  const handleUpdateExpense = async (updatedExpense: Expense, diffSummary: string) => {
    setLocalExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));

    if (user) {
      await updateExpenseInCloud(updatedExpense);
      await logActivityToCloud('logged_expense', `Adjusted "${updatedExpense.title}": ${diffSummary}`, updatedExpense.amount);
    }

    // Automated direct notification dispatch of adjustment and difference
    if (updatedExpense.split === 'equal') {
      const buddyName = updatedExpense.splitWithName || profile.friendName || 'Alex';
      const buddy = profile.buddies?.find((b) => b.name.toLowerCase() === buddyName.toLowerCase());
      const buddyEmail = buddy?.email || profile.friendEmail || 'alex.rivera@example.com';

      try {
        await fetch('/api/notify-buddy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expenseId: updatedExpense.id,
            expenseTitle: updatedExpense.title,
            amount: updatedExpense.amount,
            splitShare: updatedExpense.amount / 2,
            action: 'updated',
            changeDiff: diffSummary,
            senderName: profile.meName,
            recipientName: buddyName,
            recipientEmail: buddyEmail,
          }),
        });
      } catch (e) {}
    }

    setSyncToast(`Adjusted "${updatedExpense.title}" (${diffSummary}) & auto-notified roommate!`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleUpdateBudget = async (newBudget: BudgetConfig) => {
    setBudget(newBudget);
    if (user) {
      await saveBudgetToCloud(newBudget);
      await logActivityToCloud('updated_budget', `Updated monthly budget to $${newBudget.totalMonthlyBudget.toLocaleString()}`);
    }
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (user) {
      await saveProfileToCloud(newProfile);
    }
  };

  const handleSettleDebt = async (debtor: 'me' | 'friend', amount: number) => {
    const settlementRecord: Expense = {
      id: `settle-${Date.now()}`,
      title: `Debt Settlement: ${debtor === 'friend' ? profile.friendName : profile.meName} paid back ${debtor === 'friend' ? profile.meName : profile.friendName}`,
      amount: amount,
      category: 'other',
      date: new Date().toISOString(),
      paidBy: debtor,
      split: debtor === 'friend' ? 'me_full' : 'friend_full',
      notes: 'Equalized shared balance with receipt notification',
      createdAt: Date.now(),
    };

    setLocalExpenses((prev) => [settlementRecord, ...prev]);

    if (user) {
      await addExpenseToCloud(settlementRecord);
      await logActivityToCloud('settled', `Settled debt balance of $${amount.toFixed(2)} between roommates`, amount);
    }
  };

  const handleResetDemo = () => {
    const res = resetToDemoData();
    setLocalExpenses(res.expenses);
    setBudget(res.budget);
    setProfile(res.profile);
  };

  const handleClearAll = () => {
    const res = clearAllData();
    setLocalExpenses(res.expenses);
  };

  const handleReloadFromStorage = () => {
    setLocalExpenses(loadStoredExpenses());
    setBudget(loadStoredBudgetConfig());
    setProfile(loadStoredUserProfile());
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col antialiased selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userFilter={userFilter}
        onChangeUserFilter={setUserFilter}
        profile={profile}
        onOpenQuickLog={() => setIsLogExpenseModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
        onOpenActivityFeed={() => setIsActivityModalOpen(true)}
        activityCount={cloudActivities.length}
      />

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="bg-[#34C759] text-white text-xs font-semibold px-4 py-2 text-center animate-in fade-in duration-200 flex items-center justify-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dashboard Overview */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Log Bar */}
            <div id="quick-log-section">
              <QuickLogBar
                onAddExpense={handleAddExpense}
                profile={profile}
              />
            </div>

            {/* Smart Apple-style Proactive Insight */}
            <InsightsBanner
              insights={smartInsights}
              onOpenComparisons={() => setCurrentTab('comparison')}
              onOpenBudget={() => setCurrentTab('budget')}
            />

            {/* Metric KPI Cards with Safe Daily Spend & Month Pace */}
            <MetricCards
              monthComp={monthComp}
              weekComp={weekComp}
              safeDaily={safeDailyData.safeDaily}
              daysLeft={safeDailyData.daysLeft}
              projectedMonthTotal={safeDailyData.projectedMonthTotal}
              budget={budget}
              userFilterName={userFilter === 'all' ? 'All Members' : userFilter === 'me' ? profile.meName : userFilter}
            />

            {/* Live Roommate Split & Settle Quick Snapshot */}
            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                    Live Roommate Split Balance
                  </h4>
                  <p className="text-sm font-semibold text-[#1D1D1F]">
                    {(() => {
                      const bal = calculateBuddyBalance(expenses);
                      if (bal.creditor === 'even') return 'All settled up! No balance owed.';
                      if (bal.creditor === 'me') {
                        return `${profile.friendName} owes you $${bal.amount.toFixed(2)}`;
                      }
                      return `You owe ${profile.friendName} $${bal.amount.toFixed(2)}`;
                    })()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('buddy')}
                className="px-3 py-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto flex items-center gap-1"
              >
                <span>View Settlement Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Detailed Comparisons: Week vs Week & Month vs Month */}
            <ComparisonDashboard
              monthComp={monthComp}
              weekComp={weekComp}
              allExpenses={expenses}
              userFilter={userFilter}
              profile={profile}
            />

            {/* Recent Expenses List with Delete & Category Icons */}
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onVerifyExpense={handleVerifyExpense}
              onUpdateExpense={handleUpdateExpense}
              profile={profile}
              userFilter={userFilter}
            />
          </div>
        )}

        {/* Tab 2: Comparisons */}
        {currentTab === 'comparison' && (
          <div className="animate-in fade-in duration-300">
            <ComparisonDashboard
              monthComp={monthComp}
              weekComp={weekComp}
              allExpenses={expenses}
              userFilter={userFilter}
              profile={profile}
            />
          </div>
        )}

        {/* Tab: Monthly Logs & Multi-Month Archive */}
        {currentTab === 'monthly' && (
          <div className="animate-in fade-in duration-300">
            <MonthlyLogsView
              expenses={expenses}
              userFilter={userFilter}
              profile={profile}
            />
          </div>
        )}

        {/* Tab 3: Budget Settings & Spending Goals */}
        {currentTab === 'budget' && (
          <div className="animate-in fade-in duration-300">
            <BudgetManager
              budget={budget}
              onUpdateBudget={handleUpdateBudget}
              categoryComparisons={monthComp.categories}
            />
          </div>
        )}

        {/* Tab 4: Buddy & Roommate Split with Settlement Notifications */}
        {currentTab === 'buddy' && (
          <div className="animate-in fade-in duration-300">
            <BuddySettlement
              expenses={expenses}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSettleDebt={handleSettleDebt}
            />
          </div>
        )}

        {/* Tab 5: Activity History */}
        {currentTab === 'expenses' && (
          <div className="animate-in fade-in duration-300">
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
              onVerifyExpense={handleVerifyExpense}
              onUpdateExpense={handleUpdateExpense}
              profile={profile}
              userFilter={userFilter}
            />
          </div>
        )}
      </main>

      {/* Minimalist Apple Footer */}
      <footer className="border-t border-[#E5E5EA] bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F]">Lumen</span>
            <span>·</span>
            <span>Shared Expense & Budget Tracker</span>
            {user && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5 text-[#34C759] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  Synced as {user.email}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="hover:text-[#1D1D1F] transition-colors flex items-center gap-1 text-[#0071E3]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              Real-Time Feed
            </button>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-[#1D1D1F] transition-colors"
            >
              Export / Import
            </button>
            <button
              onClick={handleResetDemo}
              className="hover:text-[#1D1D1F] transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </footer>

      {/* Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataChanged={handleReloadFromStorage}
        onResetDemo={handleResetDemo}
        onClearAll={handleClearAll}
      />

      {/* AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onAddExpenses={handleBatchAddExpenses}
        profile={profile}
      />

      {/* Dedicated Log Expense Modal */}
      <LogExpenseModal
        isOpen={isLogExpenseModalOpen}
        onClose={() => setIsLogExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
        profile={profile}
        onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
      />

      {/* Real-Time Activity Feed Modal */}
      <ActivityFeedModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        activities={cloudActivities}
        isCloudConnected={isCloudConnected}
        userEmail={user?.email}
      />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <TrackerContent />
    </FirebaseProvider>
  );
}
