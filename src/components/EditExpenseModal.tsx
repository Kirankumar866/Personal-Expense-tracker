import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta, ACTIVE_CATEGORIES } from '../constants/categories';
import { 
  X, 
  Check, 
  DollarSign, 
  Tag, 
  Calendar, 
  User, 
  Users, 
  Split, 
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  profile: UserProfile;
  onSaveExpense: (updatedExpense: Expense, diffSummary: string) => Promise<void> | void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  profile,
  onSaveExpense,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [paidBy, setPaidBy] = useState<'me' | 'friend'>('me');
  const [split, setSplit] = useState<'none' | 'equal' | 'me_full' | 'friend_full'>('none');
  const [splitWith, setSplitWith] = useState<string>('Alex');
  const [dateStr, setDateStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buddies = profile.buddies && profile.buddies.length > 0
    ? profile.buddies
    : [
        { id: 'buddy-alex', name: profile.friendName || 'Alex', email: profile.friendEmail || '', role: 'Roommate' },
        { id: 'buddy-gautam', name: 'Gautam', email: 'gautam@example.com', role: 'Friend' }
      ];

  useEffect(() => {
    if (expense) {
      setAmountStr(expense.amount.toString());
      setTitle(expense.title);
      setCategory(expense.category);
      setPaidBy(expense.paidBy);
      setSplit(expense.split);
      setSplitWith(expense.splitWithName || profile.friendName || 'Alex');
      setDateStr(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(expense.notes || '');
      setError(null);
    }
  }, [expense, profile]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseFloat(amountStr);
    if (!newAmount || newAmount <= 0) {
      setError('Please enter a valid amount greater than $0.00');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const oldAmount = expense.amount;
    const diff = newAmount - oldAmount;
    const oldSplit = expense.split;
    const newSplit = split;

    // Build diff summary description
    const diffParts: string[] = [];
    if (Math.abs(diff) >= 0.01) {
      diffParts.push(`Amount: $${oldAmount.toFixed(2)} → $${newAmount.toFixed(2)} (${diff >= 0 ? '+' : ''}$${diff.toFixed(2)})`);
      if (newSplit === 'equal') {
        const shareDiff = (newAmount / 2) - (oldSplit === 'equal' ? oldAmount / 2 : 0);
        diffParts.push(`Share: ${shareDiff >= 0 ? '+' : ''}$${shareDiff.toFixed(2)}`);
      }
    }
    if (title.trim() !== expense.title) {
      diffParts.push(`Title: "${expense.title}" → "${title.trim()}"`);
    }
    if (category !== expense.category) {
      diffParts.push(`Category: ${getCategoryMeta(expense.category).name} → ${getCategoryMeta(category).name}`);
    }
    if (oldSplit !== newSplit) {
      diffParts.push(`Split: ${oldSplit} → ${newSplit}`);
    }
    if (newSplit === 'equal' && splitWith !== expense.splitWithName) {
      diffParts.push(`Split buddy: ${expense.splitWithName || 'Alex'} → ${splitWith}`);
    }

    const diffSummary = diffParts.length > 0 ? diffParts.join(' · ') : 'Adjusted details';

    // If split or amount changed, reset verification so the other person re-verifies!
    const shouldResetVerification = Math.abs(diff) >= 0.01 || oldSplit !== newSplit || splitWith !== expense.splitWithName;

    const updatedExpense: Expense = {
      ...expense,
      title: title.trim() || expense.title,
      amount: newAmount,
      category,
      paidBy,
      split,
      splitWithName: split === 'equal' ? splitWith : undefined,
      notes: notes.trim(),
      date: dateStr ? new Date(`${dateStr}T12:00:00Z`).toISOString() : expense.date,
      verifiedByFriend: shouldResetVerification ? false : expense.verifiedByFriend,
      verifiedByNames: shouldResetVerification ? [] : expense.verifiedByNames,
      lastEditedAt: Date.now(),
      lastEditedSummary: diffSummary,
    };

    try {
      await onSaveExpense(updatedExpense, diffSummary);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes');
      setIsSubmitting(false);
    }
  };

  const currentCategoryMeta = getCategoryMeta(category);

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
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#1D1D1F]">
                Adjust & Edit Expense
              </h3>
              <p className="text-xs text-[#86868B]">
                Changes will automatically notify roommates with the difference
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

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">
                Total Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#86868B]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-base font-mono font-bold text-[#1D1D1F] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">
                Title / Merchant
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-sm font-semibold text-[#1D1D1F] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-sm font-medium text-[#1D1D1F] outline-none cursor-pointer"
              >
                {ACTIVE_CATEGORIES.map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {getCategoryMeta(catKey).name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-sm font-medium text-[#1D1D1F] outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Paid By & Split Configuration */}
          <div className="p-3.5 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#86868B]">Paid By:</span>
              <div className="inline-flex bg-white p-0.5 rounded-xl border border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setPaidBy('me')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    paidBy === 'me'
                      ? 'bg-[#0071E3] text-white shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  {profile.meName} (You)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('friend')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    paidBy === 'friend'
                      ? 'bg-[#5856D6] text-white shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  {split === 'equal' ? splitWith : profile.friendName}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
              <span className="text-xs font-semibold text-[#86868B]">Split Method:</span>
              <div className="inline-flex bg-white p-0.5 rounded-xl border border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setSplit('none')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    split === 'none'
                      ? 'bg-[#1D1D1F] text-white shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Personal (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setSplit('equal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    split === 'equal'
                      ? 'bg-[#0071E3] text-white shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Split 50/50
                </button>
              </div>
            </div>

            {split === 'equal' && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                <span className="text-xs font-semibold text-[#0071E3]">Split With Roommate:</span>
                <select
                  value={splitWith}
                  onChange={(e) => setSplitWith(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-[#0071E3]/30 rounded-lg text-xs font-bold text-[#0071E3] outline-none cursor-pointer"
                >
                  {buddies.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.role || 'Friend'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#86868B] mb-1">
              Notes / Reason for Adjustment
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Added parking fee, tipped server extra..."
              rows={2}
              className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] focus:border-[#0071E3] rounded-xl text-xs text-[#1D1D1F] outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              {isSubmitting ? 'Saving...' : 'Save & Auto-Notify Buddy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
