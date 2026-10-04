import React from 'react';
import { PeriodComparison, BudgetConfig } from '../types/expense';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Target, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface MetricCardsProps {
  monthComp: PeriodComparison;
  weekComp: PeriodComparison;
  budget: BudgetConfig;
  safeDaily: number;
  daysLeft: number;
  projectedMonthTotal: number;
  userFilterName: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  monthComp,
  weekComp,
  budget,
  safeDaily,
  daysLeft,
  projectedMonthTotal,
  userFilterName,
}) => {
  const budgetRatio = Math.min(100, (monthComp.currentTotal / budget.totalMonthlyBudget) * 100);
  const isBudgetWarning = budgetRatio >= budget.alertThresholdPercent;
  const isBudgetExceeded = monthComp.currentTotal > budget.totalMonthlyBudget;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Monthly Total & MoM Pace */}
      <div className="bg-gradient-to-br from-white via-white to-blue-50/60 rounded-2xl border border-blue-100/80 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1D1D1F]">This Month Total</span>
            </div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full">
              MoM
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold tracking-tight text-[#1D1D1F] font-mono tabular-nums">
              ${monthComp.currentTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {monthComp.percentageChange > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-md font-mono tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{monthComp.percentageChange}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-md font-mono tabular-nums">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {monthComp.percentageChange}%
              </span>
            )}
            <span className="text-[#86868B] text-[11px]">vs ${monthComp.previousTotal.toFixed(2)} prev</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-between text-xs text-[#86868B]">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-[#0071E3]" />
            <span>Net variance</span>
          </span>
          <span className="font-mono tabular-nums font-bold text-[#1D1D1F]">
            {monthComp.diffAmount >= 0 ? `+$${monthComp.diffAmount.toFixed(2)}` : `-$${Math.abs(monthComp.diffAmount).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Card 2: Weekly Spending & WoW Pace */}
      <div className="bg-gradient-to-br from-white via-white to-purple-50/60 rounded-2xl border border-purple-100/80 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5856D6]/12 text-[#5856D6] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1D1D1F]">This Week Total</span>
            </div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#5856D6] bg-[#5856D6]/10 px-2 py-0.5 rounded-full">
              7-Day WoW
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold tracking-tight text-[#1D1D1F] font-mono tabular-nums">
              ${weekComp.currentTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {weekComp.percentageChange > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-md font-mono tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{weekComp.percentageChange}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-md font-mono tabular-nums">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {weekComp.percentageChange}%
              </span>
            )}
            <span className="text-[#86868B] text-[11px]">vs ${weekComp.previousTotal.toFixed(2)} prev wk</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-between text-xs text-[#86868B]">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#5856D6]" />
            <span>Daily run rate</span>
          </span>
          <span className="font-mono tabular-nums font-bold text-[#1D1D1F]">
            ${(weekComp.currentTotal / 7).toFixed(1)}/day
          </span>
        </div>
      </div>

      {/* Card 3: Safe-to-Spend Daily Allowance (Student Essential) */}
      <div className="bg-gradient-to-br from-white via-white to-emerald-50/60 rounded-2xl border border-emerald-100/80 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#34C759]/12 text-[#34C759] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1D1D1F]">Safe Daily Spend</span>
            </div>
            <span className="text-[10px] font-bold font-mono text-[#34C759] bg-[#34C759]/12 px-2 py-0.5 rounded-full">
              {daysLeft} days left
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold tracking-tight text-[#34C759] font-mono tabular-nums">
              ${safeDaily.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-[#86868B]">/ day</span>
          </div>

          <p className="text-xs text-[#636366] leading-relaxed">
            Spend at or under this rate to stay safely within your ${budget.totalMonthlyBudget.toLocaleString()} ceiling.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs text-[#86868B]">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3 text-[#34C759]" />
            <span>Projected Month End</span>
          </span>
          <span className="font-mono tabular-nums font-bold text-[#1D1D1F]">
            ${projectedMonthTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Card 4: Monthly Budget Goal & Limit Alert Gauge */}
      <div className="bg-gradient-to-br from-white via-white to-amber-50/60 rounded-2xl border border-amber-100/80 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1D1D1F]">Budget Progress</span>
            </div>
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isBudgetExceeded 
                ? 'bg-[#FF3B30]/15 text-[#FF3B30]' 
                : isBudgetWarning 
                ? 'bg-[#FF9500]/15 text-[#FF9500]' 
                : 'bg-[#34C759]/15 text-[#34C759]'
            }`}>
              {budgetRatio.toFixed(0)}% used
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold tracking-tight text-[#1D1D1F] font-mono tabular-nums">
              ${monthComp.currentTotal.toFixed(0)}
            </span>
            <span className="text-sm font-semibold text-[#86868B] font-mono">/ ${budget.totalMonthlyBudget.toFixed(0)}</span>
          </div>

          {/* Progress Bar with glowing tip */}
          <div className="w-full bg-[#E5E5EA] h-2 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetExceeded 
                  ? 'bg-gradient-to-r from-red-500 to-[#FF3B30]' 
                  : isBudgetWarning 
                  ? 'bg-gradient-to-r from-amber-400 to-[#FF9500]' 
                  : 'bg-gradient-to-r from-emerald-400 to-[#34C759]'
              }`}
              style={{ width: `${Math.min(100, budgetRatio)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-100/60 flex items-center justify-between text-xs text-[#86868B]">
          <span className="flex items-center gap-1">
            <CheckCircle2 className={`w-3 h-3 ${isBudgetExceeded ? 'text-[#FF3B30]' : isBudgetWarning ? 'text-[#FF9500]' : 'text-[#34C759]'}`} />
            <span>Health Status</span>
          </span>
          <span className={`font-bold ${
            isBudgetExceeded 
              ? 'text-[#FF3B30]' 
              : isBudgetWarning 
              ? 'text-[#FF9500]' 
              : 'text-[#34C759]'
          }`}>
            {isBudgetExceeded ? 'Exceeded Limit' : isBudgetWarning ? 'Approaching Limit' : 'On Track'}
          </span>
        </div>
      </div>
    </div>
  );
};
