import React, { useState } from 'react';
import { Expense, UserProfile } from '../types/expense';
import { 
  X, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink,
  ShieldCheck,
  Split,
  Smartphone
} from 'lucide-react';

interface NotifySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  profile: UserProfile;
  onVerifyExpense?: (expenseId: string) => void;
}

export const NotifySplitModal: React.FC<NotifySplitModalProps> = ({
  isOpen,
  onClose,
  expense,
  profile,
  onVerifyExpense,
}) => {
  const [copied, setCopied] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  if (!isOpen || !expense) return null;

  const buddyName = expense.splitWithName || profile.friendName || 'Alex';
  const buddy = profile.buddies?.find(b => b.name.toLowerCase() === buddyName.toLowerCase());
  const buddyEmail = buddy?.email || profile.friendEmail || 'alex.rivera@example.com';
  const myShare = (expense.amount / 2).toFixed(2);
  const appUrl = window.location.origin;

  const shareText = `Hey ${buddyName}! I just logged a shared split on Lumen: "${expense.title}" for $${expense.amount.toFixed(2)}. Your 50% share is $${myShare}. Check, verify, or settle up here: ${appUrl}`;
  const encodedShareText = encodeURIComponent(shareText);
  const emailSubject = encodeURIComponent(`[Lumen Split] ${expense.title} - $${myShare} share`);
  const emailBody = encodeURIComponent(`Hi ${buddyName},\n\nI recorded a new shared expense on Lumen:\n\n• Item: ${expense.title}\n• Total Amount: $${expense.amount.toFixed(2)}\n• Your 50% Share: $${myShare}\n• Date: ${new Date(expense.date).toLocaleDateString()}\n• Paid By: ${expense.paidBy === 'me' ? profile.meName : buddyName}\n\nPlease verify and acknowledge your split balance in the Lumen app:\n${appUrl}\n\nThanks!\n${profile.meName}`);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = () => {
    if (onVerifyExpense) {
      onVerifyExpense(expense.id);
      setJustVerified(true);
      setTimeout(() => {
        setJustVerified(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#F2F2F7] flex items-center justify-between bg-gradient-to-r from-[#F9F9FB] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/12 text-[#0071E3] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#1D1D1F]">
                Notify & Verify Split
              </h3>
              <p className="text-xs text-[#86868B]">
                Alert {buddyName} so this expense is verified by both of you
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

        {/* Expense Summary Box */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#86868B]">Expense:</span>
              <span className="text-xs font-bold text-[#1D1D1F] truncate max-w-[200px]">{expense.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#86868B]">Total Bill:</span>
              <span className="text-sm font-bold font-mono text-[#1D1D1F]">${expense.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#E5E5EA]/80">
              <span className="text-xs font-bold text-[#0071E3]">{buddyName}'s 50% Share:</span>
              <span className="text-base font-extrabold font-mono text-[#0071E3]">${myShare}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#86868B] pt-0.5">
              <span>Status:</span>
              {expense.verifiedByFriend || justVerified ? (
                <span className="text-[#34C759] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Verified by {buddyName}
                </span>
              ) : (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Awaiting {buddyName}'s Verification
                </span>
              )}
            </div>
          </div>

          {/* Quick Notification Channels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-2.5">
              Instant Notification Options
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodedShareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/8 hover:bg-[#25D366]/15 text-[#128C7E] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-[#1D1D1F]">Send WhatsApp Message</span>
                    <span className="text-[11px] text-[#86868B]">Pre-formatted with amount & link</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              {/* SMS / iMessage */}
              <a
                href={`sms:?&body=${encodedShareText}`}
                className="p-3 rounded-2xl border border-[#0071E3]/30 bg-[#0071E3]/8 hover:bg-[#0071E3]/15 text-[#0071E3] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0071E3] text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-[#1D1D1F]">Send Mobile SMS / iMessage</span>
                    <span className="text-[11px] text-[#86868B]">Open native Messages app</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              {/* Email */}
              <a
                href={`mailto:${buddyEmail}?subject=${emailSubject}&body=${emailBody}`}
                className="p-3 rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] hover:bg-[#F2F2F7] flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-[#1D1D1F]">Send Email Notification</span>
                    <span className="text-[11px] text-[#86868B]">To {buddyEmail}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-3 rounded-2xl border border-[#E5E5EA] bg-[#F9F9FB] hover:bg-[#F2F2F7] flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-200 text-[#1D1D1F] flex items-center justify-center">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[#1D1D1F]">
                      {copied ? 'Copied to Clipboard!' : 'Copy Summary & Link'}
                    </span>
                    <span className="text-[11px] text-[#86868B]">Paste anywhere (Slack, Discord, Notes)</span>
                  </div>
                </div>
                {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5 text-[#86868B]" />}
              </button>
            </div>
          </div>

          {/* Verification Action */}
          <div className="pt-2 border-t border-[#F2F2F7]">
            {expense.verifiedByFriend || justVerified ? (
              <div className="py-2.5 px-4 bg-[#34C759]/12 border border-[#34C759]/30 rounded-2xl text-center text-xs font-bold text-[#34C759] flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Split verified and locked in ledger!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleVerify}
                className="w-full py-2.5 px-4 bg-[#1D1D1F] hover:bg-black text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                <span>Mark as Verified by {buddyName}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
