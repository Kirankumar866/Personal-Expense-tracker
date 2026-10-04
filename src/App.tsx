/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Expense, BudgetConfig, UserProfile, ExpenseCategory } from './types/expense';
import { 
  loadStoredExpenses, 
  saveStoredExpenses, 
  loadStoredLiveExpenses,
  saveStoredLiveExpenses,
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
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { 
  Calendar, 
  Users, 
  Cloud, 
  Check, 
  ArrowUpRight, 
  Sparkles, 
  FlaskConical, 
  Database, 
  ArrowRight,
  RotateCcw,
  Copy
} from 'lucide-react';

function TrackerContent() {
  const { 
    user, 
    isCloudConnected, 
    databaseMode,
    setDatabaseMode,
    cloudExpenses, 
    cloudActivities, 
    addExpenseToCloud, 
    deleteExpenseFromCloud, 
    logActivityToCloud,
    syncLocalExpensesToCloud,
    copySandboxToLive
  } = useFirebase();

  const [localSandboxExpenses, setLocalSandboxExpenses] = useState<Expense[]>(() => loadStoredExpenses());
  const [localLiveExpenses, setLocalLiveExpenses] = useState<Expense[]>(() => loadStoredLiveExpenses());
  const [budget, setBudget] = useState<BudgetConfig>(() => loadStoredBudgetConfig());
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredUserProfile());

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'comparison' | 'monthly' | 'budget' | 'buddy' | 'expenses'>('dashboard');
  const [userFilter, setUserFilter] = useState<'all' | 'me' | 'friend'>('all');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [hasPromptedCloudSync, setHasPromptedCloudSync] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [copySuccessToast, setCopySuccessToast] = useState(false);

  // Active expenses depending on databaseMode: Sandbox vs Live
  const expenses = useMemo(() => {
    if (databaseMode === 'sandbox') {
      if (user && cloudExpenses.length > 0) return cloudExpenses;
      return localSandboxExpenses;
    } else {
      if (user && cloudExpenses.length > 0) return cloudExpenses;
      return localLiveExpenses;
    }
  }, [databaseMode, user, cloudExpenses, localSandboxExpenses, localLiveExpenses]);

  // Persist to localStorage
  useEffect(() => {
    saveStoredExpenses(localSandboxExpenses);
  }, [localSandboxExpenses]);

  useEffect(() => {
    saveStoredLiveExpenses(localLiveExpenses);
  }, [localLiveExpenses]);

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

    if (databaseMode === 'sandbox') {
      setLocalSandboxExpenses((prev) => [newExpense, ...prev]);
    } else {
      setLocalLiveExpenses((prev) => [newExpense, ...prev]);
    }

    if (user) {
      await addExpenseToCloud(newExpense);
    }
  };

  const handleBatchAddExpenses = async (newExpenses: Omit<Expense, 'id' | 'createdAt'>[]) => {
    const created: Expense[] = newExpenses.map((exp, idx) => ({
      ...exp,
      id: `exp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now() + idx,
    }));

    if (databaseMode === 'sandbox') {
      setLocalSandboxExpenses((prev) => [...created, ...prev]);
    } else {
      setLocalLiveExpenses((prev) => [...created, ...prev]);
    }

    if (user) {
      for (const exp of created) {
        await addExpenseToCloud(exp);
      }
      await logActivityToCloud(
        'scanned_receipt',
        `[${databaseMode.toUpperCase()}] Scanned receipt and imported ${created.length} line items with voice analysis`
      );
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (databaseMode === 'sandbox') {
      setLocalSandboxExpenses((prev) => prev.filter((e) => e.id !== id));
    } else {
      setLocalLiveExpenses((prev) => prev.filter((e) => e.id !== id));
    }

    if (user) {
      await deleteExpenseFromCloud(id);
      await logActivityToCloud('logged_expense', `[${databaseMode.toUpperCase()}] Deleted an expense record`);
    }
  };

  const handleUpdateBudget = async (newBudget: BudgetConfig) => {
    setBudget(newBudget);
    if (user) {
      await logActivityToCloud('updated_budget', `Updated monthly budget to $${newBudget.totalMonthlyBudget.toLocaleString()}`);
    }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
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

    if (databaseMode === 'sandbox') {
      setLocalSandboxExpenses((prev) => [settlementRecord, ...prev]);
    } else {
      setLocalLiveExpenses((prev) => [settlementRecord, ...prev]);
    }

    if (user) {
      await addExpenseToCloud(settlementRecord);
      await logActivityToCloud('settled', `[${databaseMode.toUpperCase()}] Settled debt balance of $${amount.toFixed(2)} between roommates`, amount);
    }
  };

  const handleResetDemo = () => {
    const res = resetToDemoData();
    setLocalSandboxExpenses(res.expenses);
    setBudget(res.budget);
    setProfile(res.profile);
  };

  const handleClearAll = () => {
    if (databaseMode === 'sandbox') {
      const res = clearAllData();
      setLocalSandboxExpenses(res.expenses);
    } else {
      setLocalLiveExpenses([]);
    }
  };

  const handleReloadFromStorage = () => {
    setLocalSandboxExpenses(loadStoredExpenses());
    setLocalLiveExpenses(loadStoredLiveExpenses());
    setBudget(loadStoredBudgetConfig());
    setProfile(loadStoredUserProfile());
  };

  const handleCopySandboxToLive = async () => {
    if (user) {
      await copySandboxToLive();
    }
    setLocalLiveExpenses([...localSandboxExpenses]);
    setDatabaseMode('live');
    setCopySuccessToast(true);
    setTimeout(() => setCopySuccessToast(false), 3500);
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
        onOpenQuickLog={() => {
          const quickBarEl = document.getElementById('quick-log-section');
          if (quickBarEl) {
            quickBarEl.scrollIntoView({ behavior: 'smooth' });
            const amountInput = quickBarEl.querySelector('input[type="number"]') as HTMLInputElement;
            if (amountInput) amountInput.focus();
          }
        }}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenReceiptScanner={() => setIsReceiptModalOpen(true)}
        onOpenActivityFeed={() => setIsActivityModalOpen(true)}
        activityCount={cloudActivities.length}
      />

      {/* Database Mode Status Banner */}
      {databaseMode === 'sandbox' ? (
        <div className="bg-gradient-to-r from-[#FF9500]/12 via-[#FF9500]/6 to-white border-b border-[#FF9500]/25 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#FF9500]/20 text-[#FF9500] flex items-center justify-center shrink-0">
                <FlaskConical className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <span>Sandbox Environment (Table: <code className="font-mono text-[#FF9500] text-[11px] bg-white px-1.5 py-0.2 rounded border border-[#FF9500]/30">demo_expenses</code>)</span>
                  <span className="px-1.5 py-0.2 bg-[#FF9500]/15 text-[#FF9500] text-[9px] uppercase font-bold rounded">Testing</span>
                </span>
                <p className="text-[11px] text-[#86868B] hidden sm:block">
                  You are testing with dummy data. Real database is isolated and untouched.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-2.5 py-1 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] bg-white border border-[#E5E5EA] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                title="Reset mock dummy expenses"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Dummy Data</span>
              </button>

              <button
                type="button"
                onClick={() => setDatabaseMode('live')}
                className="px-3 py-1 bg-[#34C759] hover:bg-[#30B753] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1 active:scale-95"
              >
                <span>Switch to Live Database</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#34C759]/12 via-[#34C759]/6 to-white border-b border-[#34C759]/25 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#34C759]/20 text-[#34C759] flex items-center justify-center shrink-0">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <span>Live Production Database (Table: <code className="font-mono text-[#34C759] text-[11px] bg-white px-1.5 py-0.2 rounded border border-[#34C759]/30">expenses</code>)</span>
                  <span className="px-1.5 py-0.2 bg-[#34C759]/15 text-[#34C759] text-[9px] uppercase font-bold rounded">Production</span>
                </span>
                <p className="text-[11px] text-[#86868B] hidden sm:block">
                  Connected to your real Firestore database. All transactions logged here represent your actual financial records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {expenses.length === 0 && localSandboxExpenses.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopySandboxToLive}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/15 border border-[#0071E3]/25 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  title="Copy testing records over to live database"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Sandbox to Live</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDatabaseMode('sandbox')}
                className="px-3 py-1 bg-white hover:bg-[#F2F2F7] text-[#1D1D1F] border border-[#D1D1D6] text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1"
              >
                <span>Back to Sandbox</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccessToast && (
        <div className="bg-[#34C759] text-white text-xs font-semibold px-4 py-2 text-center animate-in fade-in duration-200">
          ✓ Sandbox data successfully copied to your live production database!
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
              userFilterName={userFilter === 'all' ? 'All Members' : userFilter === 'me' ? profile.meName : profile.friendName}
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
            <span>Shared Expense Tracker · {databaseMode === 'sandbox' ? '🧪 Sandbox Mode (demo_expenses)' : '🟢 Live Database (expenses)'}</span>
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
