import React, { useState } from 'react';
import { PeriodComparison, Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta } from '../constants/categories';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  BookOpen, 
  Home, 
  Tv, 
  Sparkles, 
  MoreHorizontal,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  History,
  Wallet,
  Activity
} from 'lucide-react';
import { calculateWorkHours } from '../utils/analytics';

interface ComparisonDashboardProps {
  monthComp: PeriodComparison;
  weekComp: PeriodComparison & { dailyBreakdown: any[] };
  allExpenses: Expense[];
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

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
  monthComp,
  weekComp,
  allExpenses,
  userFilter,
  profile,
}) => {
  const [periodType, setPeriodType] = useState<'month' | 'week'>('month');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  const activeComp = periodType === 'month' ? monthComp : weekComp;
  const periodLabel = periodType === 'month' ? 'This Month vs Previous Month' : 'This Week vs Previous Week';
  const currentLabel = periodType === 'month' ? 'Current Month' : 'Current Week';
  const previousLabel = periodType === 'month' ? 'Previous Month' : 'Previous Week';

  // Find max amount across categories to scale progress bars cleanly
  const maxCategoryAmount = Math.max(
    ...activeComp.categories.map((c) => Math.max(c.currentAmount, c.previousAmount)),
    100
  );

  // Filtered expense entries for selected category drilldown
  const drilldownExpenses = allExpenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  }).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Controls: Period Selector & Quick Summary */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F2F7]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Comparative Spending Insights
              </h3>
              <span className="text-xs text-[#86868B]">· Detailed breakdown</span>
            </div>
            <p className="text-xs text-[#86868B]">
              Track category variances, surge alerts, and pace changes over time.
            </p>
          </div>

          {/* Segmented Period Switcher */}
          <div className="inline-flex bg-[#F2F2F7] p-1 rounded-xl border border-[#E5E5EA]">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                periodType === 'month'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Month-over-Month
            </button>
            <button
              onClick={() => setPeriodType('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                periodType === 'week'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Week-over-Week
            </button>
          </div>
        </div>

        {/* Aggregate Headline Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 bg-gradient-to-br from-white via-white to-blue-50/60 rounded-2xl border border-blue-100/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#1D1D1F]">{currentLabel} Total</span>
            </div>
            <div className="text-2xl font-bold text-[#1D1D1F] font-mono tabular-nums">
              ${activeComp.currentTotal.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-white via-white to-slate-50/70 rounded-2xl border border-[#E5E5EA] shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-slate-200 text-[#86868B] flex items-center justify-center shrink-0">
                <History className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#86868B]">{previousLabel} Total</span>
            </div>
            <div className="text-2xl font-bold text-[#86868B] font-mono tabular-nums">
              ${activeComp.previousTotal.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-white via-white to-emerald-50/60 rounded-2xl border border-emerald-100/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${activeComp.percentageChange > 0 ? 'bg-red-100 text-[#FF3B30]' : 'bg-emerald-100 text-[#34C759]'}`}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#1D1D1F]">Pacing Variance</span>
              </div>
              <div
                className={`text-xl font-bold font-mono tabular-nums flex items-center gap-1 ${
                  activeComp.percentageChange > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'
                }`}
              >
                {activeComp.percentageChange > 0 ? (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    +{activeComp.percentageChange}%
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-5 h-5" />
                    {activeComp.percentageChange}%
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#86868B] block mb-0.5">Net Shift</span>
              <span className="text-sm font-mono font-bold text-[#1D1D1F] tabular-nums">
                {activeComp.diffAmount >= 0 ? `+$${activeComp.diffAmount.toFixed(2)}` : `-$${Math.abs(activeComp.diffAmount).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Week-over-Week Daily Distribution (Shown in Week View) */}
      {periodType === 'week' && weekComp.dailyBreakdown && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-[#1D1D1F]">
                7-Day Daily Spending Pace
              </h4>
              <span className="text-xs text-[#86868B]">
                Current 7 days (solid blue) vs Previous 7 days (light gray)
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" />
                <span className="text-[#1D1D1F]">This Week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E5EA]" />
                <span className="text-[#86868B]">Last Week</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-6 pb-2 border-b border-[#F2F2F7]">
            {weekComp.dailyBreakdown.map((day, idx) => {
              const maxDayAmount = Math.max(
                ...weekComp.dailyBreakdown.map((d: any) => Math.max(d.currentWeekAmount, d.previousWeekAmount)),
                50
              );
              const curHeight = Math.max(4, (day.currentWeekAmount / maxDayAmount) * 100);
              const prevHeight = Math.max(4, (day.previousWeekAmount / maxDayAmount) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end gap-1 w-full justify-center h-32">
                    {/* Previous week bar */}
                    <div
                      className="w-3 sm:w-4 bg-[#E5E5EA] rounded-t-sm transition-all group-hover:bg-[#D1D1D6]"
                      style={{ height: `${prevHeight}%` }}
                      title={`Last week: $${day.previousWeekAmount.toFixed(2)}`}
                    />
                    {/* Current week bar */}
                    <div
                      className="w-3 sm:w-4 bg-[#0071E3] rounded-t-sm transition-all group-hover:bg-[#0077ED]"
                      style={{ height: `${curHeight}%` }}
                      title={`This week: $${day.currentWeekAmount.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#86868B] mt-2 block">
                    {day.dayName}
                  </span>
                  <span className="text-[10px] font-mono text-[#1D1D1F] tabular-nums">
                    ${day.currentWeekAmount.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category-by-Category Variances */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Category Variances & Run Rates
            </h4>
            <span className="text-xs text-[#86868B]">
              Ordered by highest current spend · Click any category to view underlying expenses
            </span>
          </div>

          {/* Quick Category Filter Reset */}
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-[#0071E3] hover:underline flex items-center gap-1 font-medium"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="divide-y divide-[#F2F2F7]">
          {activeComp.categories.map((comp) => {
            const meta = getCategoryMeta(comp.category);
            const Icon = (CATEGORY_ICONS as any)[comp.category] || MoreHorizontal;
            const isSelected = selectedCategory === comp.category;
            const curWidthPct = Math.max(2, (comp.currentAmount / maxCategoryAmount) * 100);
            const prevWidthPct = Math.max(2, (comp.previousAmount / maxCategoryAmount) * 100);

            // Highlight Uber explicitly if user is looking at Uber surge
            const isUberSurge = comp.category === 'uber' && comp.percentageChange >= 15;

            return (
              <div
                key={comp.category}
                onClick={() => setSelectedCategory(isSelected ? 'all' : comp.category)}
                className={`py-3.5 px-3 rounded-xl transition-all cursor-pointer ${
                  isSelected ? 'bg-[#F2F2F7]' : 'hover:bg-[#F9F9FB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1 sm:pr-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-[#1D1D1F] truncate">
                          {comp.categoryName}
                        </span>
                        {isUberSurge && (
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-1.5 py-0.5 rounded-md shrink-0">
                            ⚠️ +{comp.percentageChange}% Surge
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs text-[#86868B] block truncate">
                        {comp.diffAmount >= 0 ? `+$${comp.diffAmount.toFixed(2)} variance` : `-$${Math.abs(comp.diffAmount).toFixed(2)} savings`}
                      </span>
                    </div>
                  </div>

                  {/* Amounts & Percentage Change */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-[#1D1D1F]">
                        ${comp.currentAmount.toFixed(2)}
                      </span>
                      <span
                        className={`inline-flex items-center text-[10px] sm:text-xs font-mono font-medium tabular-nums px-1.5 py-0.5 rounded ${
                          comp.percentageChange > 0
                            ? 'text-[#FF3B30] bg-[#FF3B30]/10'
                            : 'text-[#34C759] bg-[#34C759]/10'
                        }`}
                      >
                        {comp.percentageChange > 0 ? `+${comp.percentageChange}%` : `${comp.percentageChange}%`}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-[#86868B] font-mono tabular-nums block">
                      vs ${comp.previousAmount.toFixed(2)} prev
                    </span>
                  </div>
                </div>

                {/* Comparative Double Bar */}
                <div className="space-y-1.5 mt-2.5">
                  {/* Current period bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-[10px] font-bold text-[#1D1D1F] shrink-0 uppercase tracking-wider">Current</span>
                    <div className="flex-1 bg-[#F2F2F7] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-2xs"
                        style={{
                          width: `${curWidthPct}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Previous period bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-[10px] font-bold text-[#86868B] shrink-0 uppercase tracking-wider">Previous</span>
                    <div className="flex-1 bg-[#F2F2F7] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-300 rounded-full transition-all duration-300"
                        style={{ width: `${prevWidthPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drilldown Section when a category is selected */}
      {selectedCategory !== 'all' && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Recent Entries for {getCategoryMeta(selectedCategory).name}
            </h4>
            <span className="text-xs text-[#86868B]">
              {drilldownExpenses.length} entries recorded
            </span>
          </div>

          <div className="divide-y divide-[#F2F2F7]">
            {drilldownExpenses.length === 0 ? (
              <p className="text-xs text-[#86868B] py-3">No expenses recorded for this category yet.</p>
            ) : (
              drilldownExpenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[#1D1D1F] block">{exp.title}</span>
                    <span className="text-[#86868B]">
                      {new Date(exp.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · Paid by {exp.paidBy === 'me' ? profile.meName : profile.friendName}
                      {exp.split === 'equal' ? ' (Split 50/50)' : ''}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#1D1D1F] tabular-nums">
                    ${exp.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
