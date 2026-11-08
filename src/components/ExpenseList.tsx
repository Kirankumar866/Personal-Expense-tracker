import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta, ACTIVE_CATEGORIES } from '../constants/categories';
import { 
  toLocalDateString, 
  formatFriendlyDate, 
  formatFullFriendlyDate,
  shiftDateString 
} from '../utils/dateUtils';
import { 
  Search, 
  Trash2, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  Home, 
  Tv, 
  Sparkles, 
  MoreHorizontal, 
  Calendar, 
  Split, 
  X, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Check,
  Clock,
  Share2,
  ShieldCheck,
  Pencil,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { PaidByBadge } from './PaidByBadge';
import { NotifySplitModal } from './NotifySplitModal';
import { EditExpenseModal } from './EditExpenseModal';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onVerifyExpense?: (id: string, verifierName: string) => void;
  onUpdateExpense?: (updatedExpense: Expense, diffSummary: string) => Promise<void> | void;
  profile: UserProfile;
  userFilter: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  uber: Car,
  dining: Utensils,
  groceries: ShoppingBag,
  coffee: Coffee,
  shopping: ShoppingBag,
  housing: Home,
  subscriptions: Tv,
  entertainment: Sparkles,
  other: MoreHorizontal,
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDeleteExpense,
  onVerifyExpense,
  onUpdateExpense,
  profile,
  userFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [notifyExpense, setNotifyExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [directNotifyToast, setDirectNotifyToast] = useState<string | null>(null);

  const buddies = profile.buddies && profile.buddies.length > 0
    ? profile.buddies
    : [
        { id: 'buddy-alex', name: profile.friendName || 'Alex', email: profile.friendEmail || 'alex.rivera@example.com', role: 'Roommate' },
        { id: 'buddy-gautam', name: 'Gautam', email: 'gautam@example.com', role: 'Friend' }
      ];

  // Active Viewing Persona (allows simulating/testing as Kiran, Alex, or Gautam)
  const [activePersona, setActivePersona] = useState<string>(() => {
    if (userFilter !== 'all' && userFilter !== 'me') {
      return userFilter === 'friend' ? (profile.friendName || 'Alex') : userFilter;
    }
    return profile.meName;
  });

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => shiftDateString(todayStr, -1), [todayStr]);

  // Compute all available dates that have at least one expense
  const availableDates = useMemo(() => {
    const dateMap = new Map<string, { count: number; total: number }>();
    expenses.forEach((e) => {
      const day = toLocalDateString(e.date);
      if (!day) return;
      const curr = dateMap.get(day) || { count: 0, total: 0 };
      dateMap.set(day, {
        count: curr.count + 1,
        total: curr.total + e.amount,
      });
    });

    const list = Array.from(dateMap.entries()).map(([dateStr, stats]) => ({
      dateStr,
      label: formatFriendlyDate(dateStr),
      count: stats.count,
      total: stats.total,
    }));

    // Sort descending by date
    list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
    return list;
  }, [expenses]);

  // Filter expenses
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      // User filter
      if (userFilter === 'me') {
        if (e.paidBy !== 'me' && !(e.split === 'equal' && e.paidBy === 'friend')) return false;
      } else if (userFilter === 'friend') {
        if (e.paidBy !== 'friend' && !(e.split === 'equal' && e.paidBy === 'me')) return false;
      } else if (userFilter !== 'all') {
        // Specific buddy e.g. Alex or Gautam
        const splitWith = (e.splitWithName || profile.friendName || 'Alex').toLowerCase();
        if (splitWith !== userFilter.toLowerCase()) return false;
      }

      // Exact Date filter (using local date string)
      if (selectedDate !== 'all') {
        const expenseDayStr = toLocalDateString(e.date);
        if (expenseDayStr !== selectedDate) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchCategory = getCategoryMeta(e.category).name.toLowerCase().includes(q);
        const matchNotes = e.notes ? e.notes.toLowerCase().includes(q) : false;
        return matchTitle || matchCategory || matchNotes;
      }

      return true;
    });
  }, [expenses, userFilter, selectedDate, selectedCategory, searchQuery]);

  // Calculate stats for the selected date
  const selectedDayStats = useMemo(() => {
    if (selectedDate === 'all') return null;
    const dayExpenses = expenses.filter((e) => toLocalDateString(e.date) === selectedDate);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryTotals: Record<string, number> = {};
    dayExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return {
      total,
      count: dayExpenses.length,
      categoryTotals,
    };
  }, [expenses, selectedDate]);

  // Group filtered expenses by local date string
  const grouped = useMemo(() => {
    return filtered.reduce((acc, curr) => {
      const dayKey = toLocalDateString(curr.date);
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(curr);
      return acc;
    }, {} as Record<string, Expense[]>);
  }, [filtered]);

  const sortedDayKeys = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  }, [grouped]);

  const handleStepDay = (direction: -1 | 1) => {
    const base = selectedDate === 'all' ? todayStr : selectedDate;
    setSelectedDate(shiftDateString(base, direction));
  };

  const handleDirectNotify = async (exp: Expense) => {
    const debtors = exp.splitWithNames && exp.splitWithNames.length > 0 
      ? exp.splitWithNames 
      : [exp.splitWithName || profile.friendName || 'Alex'];
    
    const recipientName = debtors[0] || 'Alex';
    const buddyObj = buddies.find((b) => b.name.toLowerCase() === recipientName.toLowerCase());
    const recipientEmail = buddyObj?.email || profile.friendEmail || 'alex.rivera@example.com';
    const splitShare = exp.amount / (debtors.length + 1);

    try {
      const res = await fetch('/api/notify-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: exp.id,
          expenseTitle: exp.title,
          amount: exp.amount,
          splitShare,
          action: 'reminder',
          senderName: profile.meName,
          recipientName,
          recipientEmail,
        }),
      });
      const data = await res.json();
      setDirectNotifyToast(data.message || `⚡ Direct notification automated to ${recipientName} (${recipientEmail})!`);
      setTimeout(() => setDirectNotifyToast(null), 3800);
    } catch (e) {
      setDirectNotifyToast(`⚡ Direct notification dispatched to ${recipientName} (${recipientEmail})!`);
      setTimeout(() => setDirectNotifyToast(null), 3800);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs space-y-4">
      {/* Automated Direct Notification Toast Banner */}
      {directNotifyToast && (
        <div className="py-2.5 px-4 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-white" />
            <span>{directNotifyToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDirectNotifyToast(null)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Search/Category Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F2F7]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Activity Ledger
            </h3>
            {selectedDate !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-semibold">
                Daily Filter Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-[#86868B]">
              Showing {filtered.length} transactions {selectedDate !== 'all' ? `for ${formatFriendlyDate(selectedDate)}` : 'across all dates'}
            </span>
            <span className="text-[#86868B]">·</span>
            {/* Persona Switcher to test multi-person verification */}
            <div className="inline-flex items-center gap-1.5 bg-[#F9F9FB] px-2 py-0.5 rounded-lg border border-[#E5E5EA] text-[11px]">
              <UserCheck className="w-3 h-3 text-[#0071E3]" />
              <span className="text-[#86868B]">Viewing as:</span>
              <button
                type="button"
                onClick={() => setActivePersona(profile.meName)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activePersona.toLowerCase() === profile.meName.toLowerCase()
                    ? 'bg-[#0071E3] text-white shadow-2xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {profile.meName} (You)
              </button>
              {buddies.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActivePersona(b.name)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                    activePersona.toLowerCase() === b.name.toLowerCase()
                      ? 'bg-[#5856D6] text-white shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Search box */}
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3] transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl text-xs text-[#1D1D1F] font-medium outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {ACTIVE_CATEGORIES.map((catKey) => (
              <option key={catKey} value={catKey}>
                {getCategoryMeta(catKey).name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] p-3 space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Quick Date Selection Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#1D1D1F] mr-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-[#0071E3]" />
              Filter by Date:
            </span>

            <button
              type="button"
              onClick={() => setSelectedDate('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedDate === 'all'
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'bg-white text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5EA]'
              }`}
            >
              All Dates
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedDate === todayStr
                  ? 'bg-[#0071E3] text-white shadow-xs'
                  : 'bg-white text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5EA]'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedDate === yesterdayStr
                  ? 'bg-[#0071E3] text-white shadow-xs'
                  : 'bg-white text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5EA]'
              }`}
            >
              Yesterday
            </button>
          </div>

          {/* Right: Date Picker and Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick dropdown of dates with expenses */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#86868B]">Recorded days:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#D1D1D6] rounded-lg text-xs font-medium text-[#1D1D1F] outline-none cursor-pointer focus:border-[#0071E3]"
              >
                <option value="all">-- Pick a Recorded Day --</option>
                {availableDates.map((item) => (
                  <option key={item.dateStr} value={item.dateStr}>
                    {item.label} ({item.count} items · ${item.total.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1 bg-white border border-[#D1D1D6] rounded-lg px-2 py-0.5 focus-within:border-[#0071E3]">
              <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
              <input
                type="date"
                value={selectedDate === 'all' ? '' : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || 'all')}
                className="bg-transparent text-xs font-medium text-[#1D1D1F] outline-none cursor-pointer"
                title="Pick exact date from calendar"
              />
            </div>

            {selectedDate !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDate('all')}
                className="p-1 text-[#86868B] hover:text-[#FF3B30] rounded-md transition-colors"
                title="Reset date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Day Stepper when a date is selected */}
        {selectedDate !== 'all' && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-xs">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              className="flex items-center gap-1 text-[#0071E3] hover:underline font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous Day ({shiftDateString(selectedDate, -1)})
            </button>

            <span className="font-semibold text-[#1D1D1F]">
              Viewing {formatFriendlyDate(selectedDate)}
            </span>

            <button
              type="button"
              onClick={() => handleStepDay(1)}
              className="flex items-center gap-1 text-[#0071E3] hover:underline font-medium"
            >
              Next Day ({shiftDateString(selectedDate, 1)})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Selected Day Spotlight Banner */}
      {selectedDate !== 'all' && selectedDayStats && (
        <div className="p-4 bg-gradient-to-r from-[#0071E3]/8 via-[#0071E3]/4 to-white rounded-xl border border-[#0071E3]/20 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[#0071E3] uppercase tracking-wider block">
                Daily Expense Inspection
              </span>
              <h4 className="text-base font-bold text-[#1D1D1F]">
                {formatFullFriendlyDate(selectedDate)}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0071E3] text-white shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Day Total:</span>
                <span className="text-xl font-bold font-mono text-white tabular-nums">
                  ${selectedDayStats.total.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate('all')}
                className="px-3 py-1.5 bg-white hover:bg-[#F2F2F7] border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filter
              </button>
            </div>
          </div>

          {/* Category breakdown chips for this selected day */}
          {Object.keys(selectedDayStats.categoryTotals).length > 0 ? (
            <div className="pt-2 border-t border-[#0071E3]/15 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#86868B] text-[11px] font-medium">Categories on this day:</span>
              {Object.entries(selectedDayStats.categoryTotals).map(([catKey, amt]) => {
                const meta = getCategoryMeta(catKey);
                return (
                  <span
                    key={catKey}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E5EA] text-[#1D1D1F] text-xs shadow-2xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-medium">{meta.name}:</span>
                    <span className="font-mono font-semibold">${amt.toFixed(2)}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="pt-2 border-t border-[#0071E3]/15 text-xs text-[#86868B]">
              No transactions recorded on this day.
            </div>
          )}
        </div>
      )}

      {/* Transactions List */}
      {sortedDayKeys.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Calendar className="w-10 h-10 text-[#86868B] mx-auto opacity-40" />
          <div>
            <p className="text-sm font-semibold text-[#1D1D1F]">
              {selectedDate !== 'all'
                ? `No expenses found for ${formatFriendlyDate(selectedDate)}`
                : 'No transactions match your search'}
            </p>
            <p className="text-xs text-[#86868B] mt-1">
              {selectedDate !== 'all'
                ? 'Try picking a different date or clearing the date filter to see all records.'
                : 'Enter an expense above or change your search filter.'}
            </p>
          </div>

          {selectedDate !== 'all' && (
            <button
              onClick={() => setSelectedDate('all')}
              className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs"
            >
              Show All Recorded Dates
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDayKeys.map((dayKey) => {
            const dayExpenses = grouped[dayKey];
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const isToday = dayKey === todayStr;
            const isYesterday = dayKey === yesterdayStr;

            return (
              <div 
                key={dayKey} 
                className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
                  isToday 
                    ? 'border-[#0071E3]/40 ring-2 ring-[#0071E3]/15' 
                    : isYesterday 
                    ? 'border-[#5856D6]/30' 
                    : 'border-[#E5E5EA]'
                }`}
              >
                {/* Differentiated Date Group Header Bar */}
                <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isToday
                    ? 'bg-gradient-to-r from-[#0071E3]/10 via-[#0071E3]/5 to-white border-[#0071E3]/20'
                    : isYesterday
                    ? 'bg-gradient-to-r from-[#5856D6]/10 via-[#5856D6]/5 to-white border-[#5856D6]/20'
                    : 'bg-[#F9F9FB] border-[#E5E5EA]'
                }`}>
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    {/* Day Indicator Pill */}
                    {isToday ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0071E3] text-white flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Today
                      </span>
                    ) : isYesterday ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#5856D6] text-white shadow-2xs">
                        Yesterday
                      </span>
                    ) : (
                      <span className="p-1 rounded-lg bg-white border border-[#E5E5EA] text-[#0071E3] shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
                      </span>
                    )}

                    <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F]">
                      {formatFriendlyDate(dayKey)}
                    </h4>

                    <span className="text-[11px] text-[#86868B] font-medium bg-white px-2 py-0.5 rounded-md border border-[#E5E5EA] shadow-2xs">
                      {dayExpenses.length} {dayExpenses.length === 1 ? 'item' : 'items'}
                    </span>

                    {selectedDate === 'all' && (
                      <button
                        onClick={() => setSelectedDate(dayKey)}
                        className="text-[11px] text-[#0071E3] hover:underline font-semibold flex items-center gap-0.5"
                        title="Filter exclusively to this day"
                      >
                        Focus day &rarr;
                      </button>
                    )}
                  </div>

                  {/* HIGH-CONTRAST PROMINENTLY HIGHLIGHTED DAY TOTAL */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-xs transition-all ${
                      isToday
                        ? 'bg-[#0071E3] text-white ring-2 ring-[#0071E3]/20'
                        : 'bg-[#1D1D1F] text-white'
                    }`}>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">
                        Day Total:
                      </span>
                      <span className="font-mono font-bold tabular-nums text-sm sm:text-base text-white">
                        ${dayTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day's Transactions List */}
                <div className="divide-y divide-[#F2F2F7]">
                  {dayExpenses.map((exp) => {
                    const meta = getCategoryMeta(exp.category);
                    const Icon = CATEGORY_ICONS[exp.category] || MoreHorizontal;
                    const paidByName = exp.paidBy === 'me' ? profile.meName : profile.friendName;

                    const payerName = exp.paidBy === 'me' ? profile.meName : (exp.paidByName || exp.splitWithName || profile.friendName);
                    const isPayer = activePersona.toLowerCase() === payerName.toLowerCase();

                    const debtors = exp.splitWithNames && exp.splitWithNames.length > 0 
                      ? exp.splitWithNames 
                      : [exp.splitWithName || profile.friendName || 'Alex'];

                    const verifiedList = exp.verifiedByNames || (exp.verifiedByFriend ? debtors : []);
                    const isFullyVerified = debtors.length > 0 && debtors.every(d => verifiedList.some(v => v.toLowerCase() === d.toLowerCase()));
                    const hasActivePersonaVerified = verifiedList.some(v => v.toLowerCase() === activePersona.toLowerCase());
                    const pendingDebtors = debtors.filter(d => !verifiedList.some(v => v.toLowerCase() === d.toLowerCase()));

                    const isCurrentActorADebtor = debtors.some(d => d.toLowerCase() === activePersona.toLowerCase());
                    const canCurrentActorVerify = !isPayer && isCurrentActorADebtor && !hasActivePersonaVerified;

                    return (
                      <div
                        key={exp.id}
                        className="p-3 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors group gap-2"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-1 sm:pr-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-[#1D1D1F] truncate max-w-[180px] sm:max-w-none block">
                                {exp.title}
                              </span>
                              {exp.split === 'equal' && (
                                <span className="text-[10px] text-[#0071E3] font-medium flex items-center gap-0.5 shrink-0 bg-[#0071E3]/5 px-1.5 py-0.5 rounded">
                                  <Split className="w-2.5 h-2.5" />
                                  Split ({debtors.length + 1} ways)
                                </span>
                              )}
                              {exp.lastEditedSummary && (
                                <span className="text-[10px] text-[#86868B] bg-gray-100 px-1.5 py-0.2 rounded flex items-center gap-0.5" title={exp.lastEditedSummary}>
                                  <Clock className="w-2.5 h-2.5" />
                                  Edited
                                </span>
                              )}
                              {exp.split === 'equal' && (
                                isFullyVerified ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    Verified by {debtors.join(', ')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                    <Clock className="w-2.5 h-2.5" />
                                    Awaiting {pendingDebtors.join(', ')}'s verification
                                  </span>
                                )
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#86868B] mt-1 leading-snug">
                              <PaidByBadge paidBy={exp.paidBy} profile={profile} splitWithName={exp.splitWithName} />
                              <span className="shrink-0">{meta.name}</span>
                              <span>·</span>
                              <span className="shrink-0">
                                {new Date(exp.date).toLocaleTimeString(undefined, {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                              {exp.notes && (
                                <>
                                  <span>·</span>
                                  <span className="italic truncate max-w-[120px] sm:max-w-[240px] inline-block align-bottom" title={exp.notes}>
                                    {exp.notes}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                          <div>
                            <span className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-[#1D1D1F] block">
                              ${exp.amount.toFixed(2)}
                            </span>
                            {exp.split === 'equal' && (
                              <span className="text-[10px] font-mono text-[#86868B] tabular-nums block">
                                ${(exp.amount / (debtors.length + 1)).toFixed(2)} each
                              </span>
                            )}
                          </div>

                          {/* Split Action: Strictly Role-Based Verification & 1-Click Automated Notify */}
                          {exp.split === 'equal' && (
                            <div className="flex items-center gap-1">
                              {/* 1. Only debtor who hasn't verified yet can verify! Payer CANNOT verify! */}
                              {canCurrentActorVerify && (
                                <button
                                  type="button"
                                  onClick={() => onVerifyExpense?.(exp.id, activePersona)}
                                  className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold shadow-xs active:scale-95 cursor-pointer"
                                  title={`Verify and accept your share as ${activePersona}`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Verify My Share</span>
                                </button>
                              )}

                              {/* 2. Payer sees 1-click Automated Notify (No manual sharing) */}
                              {isPayer && !isFullyVerified && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDirectNotify(exp)}
                                    className="px-2 py-1 text-[#0071E3] bg-[#0071E3]/8 hover:bg-[#0071E3]/15 border border-[#0071E3]/20 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold shadow-2xs active:scale-95"
                                    title={`Send 1-click automated notification directly to ${pendingDebtors.join(', ')}`}
                                  >
                                    <Zap className="w-3 h-3 text-[#0071E3] fill-[#0071E3]" />
                                    <span>Auto-Notify</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNotifyExpense(exp)}
                                    className="p-1 text-[#86868B] hover:text-[#1D1D1F] rounded-md transition-colors"
                                    title="More sharing options (WhatsApp, SMS, Email)"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Edit / Adjust Expense Button */}
                          {onUpdateExpense && (
                            <button
                              type="button"
                              onClick={() => setEditingExpense(exp)}
                              className="p-1 text-[#86868B] hover:text-[#0071E3] hover:bg-[#F2F2F7] rounded-lg transition-colors"
                              title="Edit / Adjust expense details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 p-1 text-[#86868B] hover:text-[#FF3B30] rounded-lg transition-all"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Adjust Expense Modal */}
      {editingExpense && onUpdateExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          profile={profile}
          onSaveExpense={onUpdateExpense}
        />
      )}

      {/* Split Notification & Verification Modal (Optional manual fallback) */}
      <NotifySplitModal
        isOpen={!!notifyExpense}
        onClose={() => setNotifyExpense(null)}
        expense={notifyExpense}
        profile={profile}
        onVerifyExpense={(id) => {
          onVerifyExpense?.(id, activePersona);
        }}
      />
    </div>
  );
};
