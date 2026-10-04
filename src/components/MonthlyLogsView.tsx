import React, { useState } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta } from '../constants/categories';
import { 
  getHistoricalMonthOptions, 
  getHistoricalMonthDetail, 
  getThreeMonthRollup, 
  MonthOption, 
  calculateWorkHours 
} from '../utils/analytics';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  BookOpen, 
  Home, 
  Tv, 
  Sparkles, 
  MoreHorizontal, 
  ChevronRight, 
  Search, 
  Clock, 
  BarChart3, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download 
} from 'lucide-react';
import { PaidByBadge } from './PaidByBadge';

interface MonthlyLogsViewProps {
  expenses: Expense[];
  userFilter: 'all' | 'me' | 'friend';
  profile: UserProfile;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
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

export const MonthlyLogsView: React.FC<MonthlyLogsViewProps> = ({
  expenses,
  userFilter,
  profile,
}) => {
  const monthOptions = getHistoricalMonthOptions(expenses, userFilter);

  // Default mode: either 'trend3' or key of a month (e.g. 3rd month or current month)
  // Let's allow selecting 'trend3' or specific month key (e.g. '2026-07' for 3rd month, etc.)
  const [selectedView, setSelectedView] = useState<string>('trend3');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');

  const isThreeMonthTrend = selectedView === 'trend3';
  const threeMonthData = getThreeMonthRollup(expenses, userFilter, 3);

  // Selected month detail if a single month is chosen
  const activeMonthOption = monthOptions.find((m) => m.key === selectedView) || monthOptions[0];
  const singleMonthDetail = getHistoricalMonthDetail(
    expenses,
    activeMonthOption?.year || new Date().getFullYear(),
    activeMonthOption?.month || new Date().getMonth(),
    userFilter
  );

  // Display expenses for active view
  const rawList = isThreeMonthTrend ? threeMonthData.allExpensesInWindow : singleMonthDetail.expenses;

  const filteredExpenses = rawList.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchCat = CATEGORIES[e.category]?.name.toLowerCase().includes(q);
      return matchTitle || matchCat;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Month Selector Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F2F2F7]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-[#0071E3]" />
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Monthly Logs & Historical Archive
              </h3>
            </div>
            <p className="text-xs text-[#86868B]">
              Inspect multi-month trends or jump directly to the last 3rd month (July 2026), 2nd month, or any past period.
            </p>
          </div>

          {/* Quick Month Switcher Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 3-Month Trend button */}
            <button
              onClick={() => setSelectedView('trend3')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isThreeMonthTrend
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'bg-[#F2F2F7] text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Last 3 Months Trend
            </button>

            {/* Individual Past Months */}
            {monthOptions.slice(0, 4).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedView(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                  selectedView === opt.key
                    ? 'bg-[#0071E3] text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {opt.label.split(' ')[0]} ({opt.relativeLabel})
              </button>
            ))}

            {/* More Months Dropdown if > 4 */}
            {monthOptions.length > 4 && (
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] text-[#1D1D1F] outline-none cursor-pointer"
              >
                <option value="trend3">Last 3 Months Trend</option>
                {monthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} — {opt.relativeLabel}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* View Header Summary */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1F] text-sm">
              {isThreeMonthTrend ? 'Quarterly 3-Month Trajectory' : singleMonthDetail.label}
            </span>
            <span className="text-[#86868B]">
              · {isThreeMonthTrend ? 'Last 3 Months Consolidated' : singleMonthDetail.relativeLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Transactions logged:{' '}
              <strong className="text-[#1D1D1F] font-mono">{filteredExpenses.length}</strong>
            </span>
            <span>·</span>
            <span>
              Total Spent:{' '}
              <strong className="text-[#1D1D1F] font-mono text-sm">
                ${isThreeMonthTrend ? threeMonthData.totalSpend.toFixed(2) : singleMonthDetail.totalSpent.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OPTION A: 3-MONTH ROLLING TREND VIEW                         */}
      {/* ============================================================ */}
      {isThreeMonthTrend ? (
        <div className="space-y-6">
          {/* 3-Month KPI Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">3-Month Total Outflow</span>
              <div className="text-2xl font-bold font-mono text-[#1D1D1F] tabular-nums">
                ${threeMonthData.totalSpend.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                Across {threeMonthData.months.length} calendar months
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">Average Monthly Burn</span>
              <div className="text-2xl font-bold font-mono text-[#0071E3] tabular-nums">
                ${threeMonthData.averageMonthlySpend.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                ~${(threeMonthData.averageMonthlySpend / 30).toFixed(1)}/day average pace
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">Highest Month</span>
              <div className="text-2xl font-bold font-mono text-[#FF3B30] tabular-nums">
                ${threeMonthData.highestMonth.amount.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block truncate">
                {threeMonthData.highestMonth.label}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">Uber Pacing Across 3 Mos</span>
              <div className="text-2xl font-bold font-mono text-[#FF9500] tabular-nums flex items-center gap-1">
                <ArrowUpRight className="w-5 h-5 text-[#FF9500]" />
                +{threeMonthData.uberGrowthRate}%
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                From oldest month to current
              </span>
            </div>
          </div>

          {/* Side-by-Side 3-Month Column Chart */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F]">
                  Month-by-Month Evolution (Last 3 Months)
                </h4>
                <span className="text-xs text-[#86868B]">
                  Click on any month column to drill directly into that month's itemized ledger.
                </span>
              </div>
              <span className="text-xs font-mono text-[#86868B]">
                Ordered chronologically
              </span>
            </div>

            {/* Column chart */}
            <div className="grid grid-cols-3 gap-4 pt-6 pb-2 border-b border-[#F2F2F7]">
              {threeMonthData.months.map((m) => {
                const maxAmount = Math.max(...threeMonthData.months.map((x) => x.total), 200);
                const heightPct = Math.max(12, (m.total / maxAmount) * 100);

                return (
                  <div
                    key={m.key}
                    onClick={() => setSelectedView(m.key)}
                    className="flex flex-col items-center justify-end group cursor-pointer p-3 rounded-xl hover:bg-[#F9F9FB] transition-all"
                  >
                    <div className="w-full h-40 flex items-end justify-center">
                      <div
                        className="w-12 sm:w-20 bg-gradient-to-t from-[#0071E3] to-[#47A1F7] group-hover:from-[#005BB5] group-hover:to-[#0071E3] rounded-t-xl transition-all shadow-xs flex flex-col justify-between p-2 text-center text-white"
                        style={{ height: `${heightPct}%` }}
                      >
                        <span className="text-[11px] font-mono font-semibold tabular-nums">
                          ${m.total.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <span className="text-xs font-semibold text-[#1D1D1F] block group-hover:text-[#0071E3] transition-colors">
                        {m.label}
                      </span>
                      <span className="text-[11px] text-[#86868B] block">
                        {m.relativeLabel}
                      </span>
                      <span className="text-[11px] text-[#0071E3] font-medium mt-1 inline-flex items-center gap-0.5">
                        Inspect Month &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category breakdown across the 3 months */}
            <div className="mt-5">
              <h5 className="text-xs font-semibold text-[#1D1D1F] mb-3">
                Key Category Shift Across the 3 Months
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {threeMonthData.months.map((m) => (
                  <div key={m.key} className="p-3.5 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#1D1D1F]">{m.shortLabel}</span>
                      <span className="text-xs font-mono font-semibold text-[#0071E3]">
                        ${m.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[#636366]">
                        <span>Uber / Rideshare:</span>
                        <span className="font-mono font-medium text-[#1D1D1F]">${m.uberTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#636366]">
                        <span>Dining Out:</span>
                        <span className="font-mono font-medium text-[#1D1D1F]">${m.diningTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#636366]">
                        <span>Groceries:</span>
                        <span className="font-mono font-medium text-[#1D1D1F]">${m.groceriesTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* OPTION B: SINGLE HISTORICAL MONTH DEEP DIVE (e.g. 3rd Month) */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Single Month Headline Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">
                {singleMonthDetail.label} Total Spent
              </span>
              <div className="text-2xl font-bold font-mono text-[#1D1D1F] tabular-nums">
                ${singleMonthDetail.totalSpent.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                {singleMonthDetail.relativeLabel}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">
                Compared to Prior Month
              </span>
              <div
                className={`text-2xl font-bold font-mono tabular-nums flex items-center gap-1 ${
                  singleMonthDetail.percentageChangeVsPrevious > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                }`}
              >
                {singleMonthDetail.percentageChangeVsPrevious > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    +{singleMonthDetail.percentageChangeVsPrevious}%
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5" />
                    {singleMonthDetail.percentageChangeVsPrevious}%
                  </>
                )}
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                vs ${singleMonthDetail.previousMonthTotal.toFixed(2)} in preceding month
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E5EA] shadow-xs">
              <span className="text-xs text-[#86868B] block mb-1">
                Average Daily Spending Rate
              </span>
              <div className="text-2xl font-bold font-mono text-[#5856D6] tabular-nums">
                ${(singleMonthDetail.totalSpent / 30).toFixed(2)}/day
              </div>
              <span className="text-[11px] text-[#86868B] mt-1 block">
                Normalized 30-day daily run rate
              </span>
            </div>
          </div>

          {/* Category Breakdown for This Specific Month */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
            <h4 className="text-sm font-semibold text-[#1D1D1F] mb-3">
              Category Distribution in {singleMonthDetail.label}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {singleMonthDetail.categories.map((c) => {
                const meta = getCategoryMeta(c.category);
                const Icon = (CATEGORY_ICONS as any)[c.category] || MoreHorizontal;
                const pctOfTotal =
                  singleMonthDetail.totalSpent > 0
                    ? ((c.currentAmount / singleMonthDetail.totalSpent) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={c.category}
                    className="p-3 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#1D1D1F] block">
                          {c.categoryName}
                        </span>
                        <span className="text-[11px] text-[#86868B]">
                          {pctOfTotal}% of monthly spend
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-[#1D1D1F] tabular-nums block">
                        ${c.currentAmount.toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          c.percentageChange > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                        }`}
                      >
                        {c.percentageChange > 0 ? `+${c.percentageChange}%` : `${c.percentageChange}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ITEMIZED EXPENSE LOG FOR THE SELECTED TIME PERIOD            */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Itemized Expenses for {isThreeMonthTrend ? 'Last 3 Months' : singleMonthDetail.label}
            </h4>
            <span className="text-xs text-[#86868B]">
              Showing {filteredExpenses.length} entries matching filters
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search this month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl text-xs text-[#1D1D1F] outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl text-xs text-[#1D1D1F] font-medium outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([k, cat]) => (
                <option key={k} value={k}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Rows */}
        <div className="divide-y divide-[#F2F2F7]">
          {filteredExpenses.length === 0 ? (
            <p className="text-xs text-[#86868B] py-6 text-center">
              No transactions recorded for this selection.
            </p>
          ) : (
            filteredExpenses.map((exp) => {
              const meta = getCategoryMeta(exp.category);
              const Icon = (CATEGORY_ICONS as any)[exp.category] || MoreHorizontal;
              const paidByName = exp.paidBy === 'me' ? profile.meName : profile.friendName;

              return (
                <div key={exp.id} className="py-2.5 flex items-center justify-between hover:bg-[#F9F9FB] px-2 rounded-lg transition-colors gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1 sm:pr-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-[#1D1D1F] block truncate">
                        {exp.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#86868B] mt-1">
                        <PaidByBadge paidBy={exp.paidBy} profile={profile} />
                        <span className="shrink-0">
                          {new Date(exp.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span className="shrink-0">{meta.name}</span>
                        {exp.split === 'equal' && <span className="text-[#0071E3] font-medium shrink-0">· Split 50/50</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-semibold text-[#1D1D1F] tabular-nums block">
                      ${exp.amount.toFixed(2)}
                    </span>
                    {exp.split === 'equal' && (
                      <span className="text-[10px] font-mono text-[#86868B] block">
                        (${(exp.amount / 2).toFixed(2)} each)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
