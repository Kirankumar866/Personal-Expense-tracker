import React, { useState } from 'react';
import { BudgetConfig, ExpenseCategory, SpendingComparison } from '../types/expense';
import { ACTIVE_CATEGORIES, getCategoryMeta } from '../constants/categories';
import { 
  Sliders, 
  CheckCircle2, 
  DollarSign, 
  Check,
  Car,
  Utensils,
  ShoppingBag,
  Coffee,
  Home,
  Tv,
  Sparkles,
  MoreHorizontal,
  Target,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface BudgetManagerProps {
  budget: BudgetConfig;
  onUpdateBudget: (newBudget: BudgetConfig) => void;
  categoryComparisons: SpendingComparison[];
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

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budget,
  onUpdateBudget,
  categoryComparisons,
}) => {
  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState<number>(budget.totalMonthlyBudget);
  const [alertThresholdPercent, setAlertThresholdPercent] = useState<number>(budget.alertThresholdPercent);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<ExpenseCategory, number>>({
    ...budget.categoryBudgets,
  });
  const [savedToast, setSavedToast] = useState(false);

  const handleCategoryBudgetChange = (cat: ExpenseCategory, value: number) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [cat]: Math.max(0, value),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BudgetConfig = {
      ...budget,
      totalMonthlyBudget,
      alertThresholdPercent,
      categoryBudgets,
    };
    onUpdateBudget(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const spendingMap = new Map<ExpenseCategory, number>();
  categoryComparisons.forEach((c) => {
    spendingMap.set(c.category, c.currentAmount);
  });

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Overview Setting Card */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2F2F7]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Monthly Spending Goals & Limit Alerts
              </h3>
            </div>
            <p className="text-xs text-[#86868B]">
              Configure overall monthly allowance, category limits, and notification thresholds.
            </p>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1D1D1F] hover:bg-black text-white transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Save Budgets
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
          {/* Monthly Total Goal */}
          <div className="p-4 bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border border-blue-100/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <label className="text-xs font-bold text-[#1D1D1F]">
                Overall Monthly Budget ($)
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono font-bold text-[#86868B]">
                $
              </span>
              <input
                type="number"
                min="50"
                step="25"
                value={totalMonthlyBudget}
                onChange={(e) => setTotalMonthlyBudget(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-white border border-[#D1D1D6] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 rounded-xl text-sm font-mono font-bold text-[#1D1D1F] outline-none"
              />
            </div>
            <span className="text-[11px] text-[#86868B] mt-1.5 block">
              Benchmark cap for total monthly household/personal outflow
            </span>
          </div>

          {/* Alert Threshold Slider */}
          <div className="p-4 bg-gradient-to-br from-white to-amber-50/40 rounded-2xl border border-amber-100/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <label className="text-xs font-bold text-[#1D1D1F]">
                  Warning Alert Threshold
                </label>
              </div>
              <span className="text-xs font-mono font-bold text-[#FF9500] bg-[#FF9500]/15 px-2 py-0.5 rounded-full">
                {alertThresholdPercent}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThresholdPercent}
              onChange={(e) => setAlertThresholdPercent(Number(e.target.value))}
              className="w-full accent-[#FF9500] cursor-pointer mt-1"
            />
            <span className="text-[11px] text-[#86868B] mt-1.5 block">
              Triggers proactive visual alert banners when spending reaches this ratio
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-[#1D1D1F]">
              Category Budget Targets & Live Utilization
            </h4>
            <span className="text-xs text-[#86868B]">
              Set individual limits to prevent rideshare and dining surges.
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#0071E3] bg-[#0071E3]/8 px-2.5 py-1 rounded-xl border border-[#0071E3]/20 self-start sm:self-auto">
            Sum of categories: ${Object.values(categoryBudgets).reduce((a, b) => a + b, 0).toFixed(0)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ACTIVE_CATEGORIES.map((key) => {
            const meta = getCategoryMeta(key);
            const Icon = CATEGORY_ICONS[key] || MoreHorizontal;
            const target = categoryBudgets[key] || meta.defaultMonthlyBudget;
            const current = spendingMap.get(key) || 0;
            const ratio = target > 0 ? (current / target) * 100 : 0;
            const isExceeded = current > target;
            const isWarning = ratio >= alertThresholdPercent;

            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border transition-all ${
                  isExceeded
                    ? 'bg-gradient-to-br from-white via-white to-red-50/50 border-red-200 shadow-2xs'
                    : isWarning
                    ? 'bg-gradient-to-br from-white via-white to-amber-50/50 border-amber-200 shadow-2xs'
                    : 'bg-gradient-to-br from-white via-white to-slate-50/50 border-[#E5E5EA] shadow-2xs hover:border-[#D1D1D6]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1D1D1F] block">
                        {meta.name}
                      </span>
                      <span className="text-[10px] text-[#86868B] block">
                        {meta.description}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isExceeded
                        ? 'bg-red-100 text-[#FF3B30]'
                        : isWarning
                        ? 'bg-amber-100 text-[#FF9500]'
                        : 'bg-emerald-100 text-[#34C759]'
                    }`}
                  >
                    {ratio.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E5E5EA] h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? 'bg-gradient-to-r from-red-500 to-[#FF3B30]'
                        : isWarning
                        ? 'bg-gradient-to-r from-amber-400 to-[#FF9500]'
                        : 'bg-gradient-to-r from-emerald-400 to-[#34C759]'
                    }`}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-[#F2F2F7]">
                  <span className="text-[#86868B] font-mono font-medium tabular-nums">
                    Spent: <strong className="text-[#1D1D1F]">${current.toFixed(0)}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#86868B] font-medium">Limit: $</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={target}
                      onChange={(e) => handleCategoryBudgetChange(key, Number(e.target.value))}
                      className="w-16 px-2 py-0.5 bg-white border border-[#D1D1D6] focus:border-[#0071E3] rounded-lg text-right font-mono font-bold text-[#1D1D1F] text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {savedToast && (
        <div className="py-2.5 px-4 bg-[#34C759]/15 border border-[#34C759]/30 rounded-xl flex items-center gap-2 text-xs text-[#1D1D1F] animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
          <span className="font-semibold">Budget ceilings and warning thresholds updated successfully!</span>
        </div>
      )}
    </form>
  );
};
