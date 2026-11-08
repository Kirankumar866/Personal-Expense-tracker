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
  X, 
  Plus, 
  Check, 
  Calendar, 
  User, 
  Users, 
  Split, 
  Camera, 
  Tag, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  profile,
  onOpenReceiptScanner,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('uber');
  const [paidBy, setPaidBy] = useState<'me' | 'friend'>('me');
  const [split, setSplit] = useState<'none' | 'equal'>('none');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buddies = profile.buddies && profile.buddies.length > 0 
    ? profile.buddies 
    : [
        { id: 'buddy-alex', name: profile.friendName || 'Alex', email: profile.friendEmail || '', role: 'Roommate' },
        { id: 'buddy-gautam', name: 'Gautam', email: 'gautam@example.com', role: 'Friend' }
      ];

  const [splitWith, setSplitWith] = useState<string>(buddies[0]?.name || 'Alex');
  const [expenseDateStr, setExpenseDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amountStr) || 0;
  const currentCategoryMeta = getCategoryMeta(category);
  const CurrentIcon = CATEGORY_ICONS[category] || MoreHorizontal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setErrorMessage('Please enter an amount greater than $0.00');
      return;
    }

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
      splitWithName: split === 'equal' ? splitWith : undefined,
      notes: notes.trim(),
    });

    // Reset form
    setAmountStr('');
    setTitle('');
    setNotes('');
    setErrorMessage(null);
    onClose();
  };

  const handlePreset = (amt: number, cat: ExpenseCategory, presetTitle: string) => {
    setAmountStr(amt.toString());
    setCategory(cat);
    setTitle(presetTitle);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#F2F2F7] flex items-center justify-between bg-gradient-to-r from-[#F9F9FB] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#1D1D1F]">
                Log New Expense
              </h3>
              <p className="text-xs text-[#86868B]">
                Record a personal outflow or split with a roommate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pt-3 flex items-center gap-1.5 overflow-x-auto text-xs pb-1 border-b border-[#F2F2F7]/80">
          <span className="text-[#86868B] text-[11px] font-medium shrink-0">Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset(12, 'uber', 'Uber Ride')}
            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-[11px] whitespace-nowrap transition-colors"
          >
            $12 Uber
          </button>
          <button
            type="button"
            onClick={() => handlePreset(15, 'dining', 'Lunch Bowl')}
            className="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-[11px] whitespace-nowrap transition-colors"
          >
            $15 Dining
          </button>
          <button
            type="button"
            onClick={() => handlePreset(6, 'coffee', 'Cold Brew')}
            className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-[11px] whitespace-nowrap transition-colors"
          >
            $6 Coffee
          </button>
          <button
            type="button"
            onClick={() => handlePreset(35, 'groceries', 'Groceries')}
            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-[11px] whitespace-nowrap transition-colors"
          >
            $35 Groceries
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
              Amount ($) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-2xl font-bold text-[#86868B] font-mono">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                autoFocus
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full pl-9 pr-4 py-3 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 rounded-2xl text-2xl font-bold text-[#1D1D1F] font-mono tabular-nums transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
                Description / Merchant
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868B]">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Uber, Trader Joe's..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-xs sm:text-sm font-medium text-[#1D1D1F] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
                Category
              </label>
              <div className="relative flex items-center">
                <div 
                  className="absolute left-2.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 pointer-events-none"
                  style={{ backgroundColor: `${currentCategoryMeta.color}18`, color: currentCategoryMeta.color }}
                >
                  <CurrentIcon className="w-3 h-3" />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-xs sm:text-sm font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                >
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Paid By & Split Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Paid By */}
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
                Paid by
              </label>
              <div className="grid grid-cols-2 bg-[#F2F2F7] p-1 rounded-xl border border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setPaidBy('me')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    paidBy === 'me'
                      ? 'bg-white text-[#0071E3] shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{profile.meName || 'You'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('friend')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    paidBy === 'friend'
                      ? 'bg-white text-[#5856D6] shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{split === 'equal' ? splitWith : profile.friendName || 'Friend'}</span>
                </button>
              </div>
            </div>

            {/* Split */}
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
                Split Distribution
              </label>
              <div className="grid grid-cols-2 bg-[#F2F2F7] p-1 rounded-xl border border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setSplit('none')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    split === 'none'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>Solo (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSplit('equal')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    split === 'equal'
                      ? 'bg-white text-[#0071E3] shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Split className="w-3 h-3" />
                  <span>Split 50/50</span>
                </button>
              </div>
            </div>
          </div>

          {/* If Split 50/50, select buddy */}
          {split === 'equal' && (
            <div className="p-3 bg-[#0071E3]/8 rounded-xl border border-[#0071E3]/20 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0071E3]" />
                <span className="text-xs font-semibold text-[#0071E3]">Split with Roommate/Friend:</span>
              </div>
              <select
                value={splitWith}
                onChange={(e) => setSplitWith(e.target.value)}
                className="bg-white border border-[#0071E3]/30 text-xs font-bold text-[#0071E3] rounded-lg px-2.5 py-1 outline-none cursor-pointer"
              >
                {buddies.map((b) => (
                  <option key={b.id} value={b.name} className="text-[#1D1D1F]">
                    {b.name} ({b.role || 'Friend'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
              Date Incurred
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868B]">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <input
                type="date"
                value={expenseDateStr}
                onChange={(e) => setExpenseDateStr(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-xs sm:text-sm font-semibold text-[#1D1D1F] outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#86868B] mb-1.5">
              Notes / Receipt Memo (Optional)
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-[#86868B]">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="e.g. Split with Alex for groceries, paid via Apple Cash"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F9F9FB] focus:bg-white border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-xs sm:text-sm font-medium text-[#1D1D1F] outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E5EA] text-sm font-semibold text-[#86868B] hover:bg-[#F2F2F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0066CC] hover:to-[#0071E3] text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Log Expense</span>
            </button>
          </div>

          {/* Alternative: Scan Receipt with AI */}
          {onOpenReceiptScanner && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceiptScanner();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] hover:underline cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Or scan a paper receipt with Voice + AI</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
