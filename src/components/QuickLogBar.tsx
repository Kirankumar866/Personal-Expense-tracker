import React, { useState } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta } from '../constants/categories';
import { 
  Car, 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  Home, 
  Tv, 
  Sparkles, 
  MoreHorizontal, 
  Check, 
  Plus,
  Calendar,
  Camera,
  User,
  Users,
  Split,
  Tag
} from 'lucide-react';

interface QuickLogBarProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  profile: UserProfile;
  onOpenReceiptScanner?: () => void;
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

export const QuickLogBar: React.FC<QuickLogBarProps> = ({
  onAddExpense,
  profile,
  onOpenReceiptScanner,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('uber');
  const [paidBy, setPaidBy] = useState<'me' | 'friend'>('me');
  const [split, setSplit] = useState<'none' | 'equal'>('none');
  const [expenseDateStr, setExpenseDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [lastLoggedTitle, setLastLoggedTitle] = useState<string>('');

  const parsedAmount = parseFloat(amountStr) || 0;
  const currentCategoryMeta = getCategoryMeta(category);
  const CurrentIcon = CATEGORY_ICONS[category] || MoreHorizontal;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedAmount <= 0) return;

    const finalTitle = title.trim() || `${CATEGORIES[category]?.name || 'General'} Expense`;

    const d = new Date();
    if (expenseDateStr) {
      const [y, m, day] = expenseDateStr.split('-').map(Number);
      d.setFullYear(y, m - 1, day);
    }

    onAddExpense({
      amount: parsedAmount,
      title: finalTitle,
      category,
      date: d.toISOString(),
      paidBy,
      split,
    });

    setLastLoggedTitle(`${finalTitle} ($${parsedAmount.toFixed(2)})`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2800);

    setAmountStr('');
    setTitle('');
  };

  const handleQuickPreset = (val: number, cat?: ExpenseCategory, defaultTitle?: string) => {
    setAmountStr(val.toString());
    if (cat) setCategory(cat);
    if (defaultTitle) setTitle(defaultTitle);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E5E5EA] shadow-xs p-4 sm:p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-xl bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">
            Quick Expense Entry
          </h2>
          {onOpenReceiptScanner && (
            <button
              type="button"
              onClick={onOpenReceiptScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#0071E3]/10 to-[#5856D6]/10 hover:from-[#0071E3]/15 hover:to-[#5856D6]/15 text-[#0071E3] border border-[#0071E3]/20 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Scan Receipt with AI</span>
            </button>
          )}
        </div>

        {/* Quick shortcut chips with domain icons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
          <span className="text-[#86868B] text-[11px] whitespace-nowrap font-medium">Quick presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset(10, 'uber', 'Uber Ride')}
            className="px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/60 font-semibold transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Car className="w-3 h-3 text-blue-600" />
            <span>$10 Uber</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(15, 'dining', 'Lunch Bowl')}
            className="px-2.5 py-1 rounded-lg bg-orange-50/80 hover:bg-orange-100 text-orange-700 border border-orange-200/60 font-semibold transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Utensils className="w-3 h-3 text-orange-600" />
            <span>$15 Dining</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(6, 'coffee', 'Cold Brew')}
            className="px-2.5 py-1 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-semibold transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Coffee className="w-3 h-3 text-amber-700" />
            <span>$6 Coffee</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(25, 'groceries', 'Grocery Essentials')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 font-semibold transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
          >
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
            <span>$25 Groceries</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Row: Amount + Description + Category + Submit */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          {/* Amount input with currency symbol */}
          <div className="sm:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-lg font-bold text-[#86868B] font-mono">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 rounded-xl text-lg font-bold text-[#1D1D1F] font-mono tabular-nums transition-all outline-none"
              required
            />
          </div>

          {/* Description input with tag icon */}
          <div className="sm:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868B]">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="e.g. Uber to Office, Supermarket, Coffee..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 rounded-xl text-sm font-medium text-[#1D1D1F] transition-all outline-none"
            />
          </div>

          {/* Category Dropdown with dynamic color icon */}
          <div className="sm:col-span-3 relative flex items-center">
            <div 
              className="absolute left-3 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 pointer-events-none shadow-2xs"
              style={{ backgroundColor: `${currentCategoryMeta.color}18`, color: currentCategoryMeta.color }}
            >
              <CurrentIcon className="w-3.5 h-3.5" />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full pl-11 pr-3 py-2.5 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 rounded-xl text-sm font-semibold text-[#1D1D1F] transition-all outline-none cursor-pointer"
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Log Button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={parsedAmount <= 0}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-98 ${
                parsedAmount > 0
                  ? 'bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0066CC] hover:to-[#0071E3] text-white shadow-xs'
                  : 'bg-[#F2F2F7] text-[#86868B] cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Log Now
            </button>
          </div>
        </div>

        {/* Secondary Options Strip: Paid By & Split & Date with icons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 text-xs border-t border-[#F2F2F7]">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {/* Paid By */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#86868B] font-medium">Paid by:</span>
              <div className="inline-flex bg-[#F2F2F7] p-0.5 rounded-xl border border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setPaidBy('me')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    paidBy === 'me' 
                      ? 'bg-white text-[#0071E3] shadow-2xs' 
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{profile.meName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('friend')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    paidBy === 'friend' 
                      ? 'bg-white text-[#5856D6] shadow-2xs' 
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{profile.friendName}</span>
                </button>
              </div>
            </div>

            {/* Split */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#86868B] font-medium">Split:</span>
              <button
                type="button"
                onClick={() => setSplit(split === 'none' ? 'equal' : 'none')}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  split === 'equal'
                    ? 'bg-[#0071E3]/12 border-[#0071E3]/30 text-[#0071E3] shadow-2xs'
                    : 'bg-[#F9F9FB] border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{split === 'equal' ? 'Split 50/50' : 'Solo (100%)'}</span>
              </button>
            </div>

            {/* Date incurred picker with icon */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#86868B] font-medium">Date:</span>
              <div className="inline-flex items-center gap-1.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl px-2.5 py-1 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
                <input
                  type="date"
                  value={expenseDateStr}
                  onChange={(e) => setExpenseDateStr(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <span className="text-[11px] text-[#86868B] font-medium hidden lg:block">
            Recorded instantly to balance
          </span>
        </div>
      </form>

      {/* Instant Success Feedback Toast */}
      {showSuccessToast && (
        <div className="mt-3 py-2 px-3.5 bg-[#34C759]/12 border border-[#34C759]/30 rounded-xl flex items-center justify-between text-xs text-[#1D1D1F] animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#34C759] text-white flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="font-semibold">
              Logged {lastLoggedTitle}!
            </span>
          </div>
          <span className="text-[11px] text-[#34C759] font-bold">
            Updated live in ledger
          </span>
        </div>
      )}
    </div>
  );
};
