import React, { useState, useEffect } from 'react';
import { Expense, UserProfile, SettlementRecord, Buddy } from '../types/expense';
import { calculateBuddyBalance } from '../utils/analytics';
import { 
  Users, 
  ArrowRight, 
  Check, 
  Split, 
  Edit3, 
  CheckCircle2, 
  DollarSign, 
  Receipt, 
  Mail, 
  Share2, 
  Send, 
  ExternalLink, 
  Copy, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  X,
  UserPlus,
  Zap,
  Link2,
  Smartphone,
  Plus
} from 'lucide-react';
import { PaidByBadge } from './PaidByBadge';

interface BuddySettlementProps {
  expenses: Expense[];
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSettleDebt: (debtor: 'me' | 'friend', amount: number) => void;
}

const SETTLEMENTS_STORAGE_KEY = 'lumen_settlement_records_v1';

export const BuddySettlement: React.FC<BuddySettlementProps> = ({
  expenses,
  profile,
  onUpdateProfile,
  onSettleDebt,
}) => {
  const buddies: Buddy[] = profile.buddies && profile.buddies.length > 0 
    ? profile.buddies 
    : [
        { id: 'buddy-alex', name: profile.friendName || 'Alex', email: profile.friendEmail || 'alex.rivera@example.com', role: 'Roommate', defaultPaymentMethod: 'Apple Cash', avatarColor: '#5856D6' },
        { id: 'buddy-gautam', name: 'Gautam', email: 'gautam@example.com', role: 'Friend', defaultPaymentMethod: 'Zelle', avatarColor: '#FF9500' }
      ];

  const [selectedBuddyId, setSelectedBuddyId] = useState<string>(buddies[0].id);
  const [isAddBuddyOpen, setIsAddBuddyOpen] = useState<boolean>(false);
  const [newBuddyName, setNewBuddyName] = useState<string>('');
  const [newBuddyEmail, setNewBuddyEmail] = useState<string>('');
  const [newBuddyRole, setNewBuddyRole] = useState<string>('Friend');

  const activeBuddy = buddies.find((b) => b.id === selectedBuddyId) || buddies[0];

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [meName, setMeName] = useState(profile.meName);
  const [friendName, setFriendName] = useState(activeBuddy.name);
  const [meEmail, setMeEmail] = useState(profile.meEmail || 'kirankumar201018@gmail.com');
  const [friendEmail, setFriendEmail] = useState(activeBuddy.email || 'alex.rivera@example.com');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(activeBuddy.defaultPaymentMethod || profile.defaultPaymentMethod || 'Apple Cash');

  // Settlements list state
  const [settlementRecords, setSettlementRecords] = useState<SettlementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'settle-demo-1',
        sender: 'friend',
        recipient: 'me',
        senderName: 'Alex',
        recipientName: 'Kiran',
        recipientEmail: 'kirankumar201018@gmail.com',
        amount: 35.00,
        paymentMethod: 'Apple Cash',
        notes: 'September rideshare & supermarket split',
        createdAt: Date.now() - 86400000 * 14,
        acknowledged: true,
        acknowledgedAt: Date.now() - 86400000 * 13,
        notificationSentVia: 'email',
      },
    ];
  });

  // Settlement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(activeBuddy.defaultPaymentMethod || 'Apple Cash');
  const [customNote, setCustomNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate balance specifically with activeBuddy!
  const balance = calculateBuddyBalance(expenses, activeBuddy.name);

  useEffect(() => {
    try {
      localStorage.setItem(SETTLEMENTS_STORAGE_KEY, JSON.stringify(settlementRecords));
    } catch (e) {}
  }, [settlementRecords]);

  // Keep form inputs updated when activeBuddy changes
  useEffect(() => {
    setFriendName(activeBuddy.name);
    setFriendEmail(activeBuddy.email || '');
    setDefaultPaymentMethod(activeBuddy.defaultPaymentMethod || 'Apple Cash');
    setSelectedPaymentMethod(activeBuddy.defaultPaymentMethod || 'Apple Cash');
  }, [activeBuddy]);

  // Shared expenses list with this active buddy
  const sharedExpenses = expenses.filter(
    (e) => (e.split === 'equal' || e.split === 'me_full' || e.split === 'friend_full') &&
           ((e.splitWithName || 'Alex').toLowerCase() === activeBuddy.name.toLowerCase())
  );

  const debtor = balance.creditor === 'me' ? 'friend' : 'me';
  const creditor = balance.creditor === 'me' ? 'me' : 'friend';
  const debtorName = debtor === 'me' ? profile.meName : activeBuddy.name;
  const creditorName = creditor === 'me' ? profile.meName : activeBuddy.name;
  const recipientEmail = creditor === 'me' ? profile.meEmail : activeBuddy.email;
  const senderEmail = debtor === 'me' ? profile.meEmail : activeBuddy.email;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBuddies = buddies.map((b) =>
      b.id === activeBuddy.id
        ? {
            ...b,
            name: friendName.trim() || b.name,
            email: friendEmail.trim() || b.email,
            defaultPaymentMethod,
          }
        : b
    );
    onUpdateProfile({
      ...profile,
      meName: meName.trim() || 'Me',
      friendName: activeBuddy.id === 'buddy-alex' ? friendName.trim() : profile.friendName,
      meEmail: meEmail.trim() || 'me@example.com',
      buddies: updatedBuddies,
    });
    setIsEditingProfile(false);
    showToast(`Updated contact details for ${friendName}`);
  };

  const handleAddNewBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuddyName.trim()) return;
    const colors = ['#5856D6', '#FF9500', '#34C759', '#AF52DE', '#FF2D55', '#0071E3'];
    const randomColor = colors[buddies.length % colors.length];
    const newBuddy: Buddy = {
      id: `buddy-${Date.now()}`,
      name: newBuddyName.trim(),
      email: newBuddyEmail.trim() || `${newBuddyName.trim().toLowerCase()}@example.com`,
      role: newBuddyRole.trim() || 'Friend',
      defaultPaymentMethod: 'Apple Cash',
      avatarColor: randomColor,
    };
    const updated = [...buddies, newBuddy];
    onUpdateProfile({
      ...profile,
      buddies: updated,
    });
    setSelectedBuddyId(newBuddy.id);
    setIsAddBuddyOpen(false);
    setNewBuddyName('');
    setNewBuddyEmail('');
    showToast(`Added ${newBuddy.name} (${newBuddy.role}) as a split buddy!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generate Email Subject & Body
  const generateEmailContent = (receiptId: string, amount: number, note: string) => {
    const subject = encodeURIComponent(
      `[Lumen Receipt #${receiptId}] Expense Settlement of $${amount.toFixed(2)} from ${debtorName}`
    );
    const bodyText = `Hi ${creditorName},

${debtorName} has recorded a settlement payment of $${amount.toFixed(2)} via ${selectedPaymentMethod} on Lumen Expense Tracker.

Summary of Settlement:
----------------------------------------
Receipt ID: ${receiptId}
Date: ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
Amount Settled: $${amount.toFixed(2)}
Payment Method: ${selectedPaymentMethod}
Payer: ${debtorName} (${senderEmail})
Recipient: ${creditorName} (${recipientEmail})
${note ? `Notes: ${note}\n` : ''}----------------------------------------

Our shared expense balance is now settled up ($0.00).

Please keep this email for your financial records. You can acknowledge this settlement directly in the Lumen app.

Sent via Lumen — Daily Expense & Shared Budget Tracker`;

    return {
      subject,
      body: encodeURIComponent(bodyText),
      rawBody: bodyText,
    };
  };

  // Execute Settlement
  const handleExecuteSettlement = (dispatchType: 'email' | 'link' | 'in_app') => {
    if (balance.creditor === 'even') return;

    const receiptId = `LUM-${Math.floor(100000 + Math.random() * 900000)}`;
    const emailData = generateEmailContent(receiptId, balance.amount, customNote);

    const newRecord: SettlementRecord = {
      id: `settle-${Date.now()}`,
      sender: debtor,
      recipient: creditor,
      senderName: debtorName,
      recipientName: creditorName,
      recipientEmail: recipientEmail,
      amount: balance.amount,
      paymentMethod: selectedPaymentMethod,
      notes: customNote.trim() || `Settled shared expenses through ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      acknowledged: false,
      notificationSentVia: dispatchType,
    };

    setSettlementRecords((prev) => [newRecord, ...prev]);

    // Update expense ledger balance
    onSettleDebt(debtor, balance.amount);
    setIsModalOpen(false);
    setCustomNote('');

    if (dispatchType === 'email') {
      // Launch user's default email client pre-addressed to recipient with formatted receipt
      const mailtoUrl = `mailto:${recipientEmail}?subject=${emailData.subject}&body=${emailData.body}`;
      window.location.href = mailtoUrl;
      showToast(`Settlement recorded! Email draft opened for ${recipientEmail}`);
    } else if (dispatchType === 'link') {
      navigator.clipboard.writeText(emailData.rawBody);
      showToast(`Settlement recorded! Receipt summary copied to clipboard for ${creditorName}`);
    } else {
      showToast(`Settlement recorded and logged for in-app acknowledgment.`);
    }
  };

  const handleAcknowledge = (id: string) => {
    setSettlementRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              acknowledged: true,
              acknowledgedAt: Date.now(),
            }
          : rec
      )
    );
    showToast('Settlement acknowledged and verified!');
  };

  return (
    <div className="space-y-6">
      {/* Buddy & Group Switcher Bar (Splitwise-style multi-friend ledgers) */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-[#86868B] px-1 shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#0071E3]" />
            Split Friends:
          </span>
          {buddies.map((buddy) => {
            const buddyBal = calculateBuddyBalance(expenses, buddy.name);
            const isSelected = buddy.id === activeBuddy.id;
            return (
              <button
                key={buddy.id}
                type="button"
                onClick={() => setSelectedBuddyId(buddy.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-[#F9F9FB] hover:bg-[#F2F2F7] text-[#1D1D1F] border border-[#E5E5EA]'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                  style={{ backgroundColor: buddy.avatarColor || '#0071E3' }}
                >
                  {buddy.name[0]}
                </div>
                <span>{buddy.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#86868B]'
                }`}>
                  {buddyBal.creditor === 'even' 
                    ? '$0' 
                    : buddyBal.creditor === 'me' 
                    ? `+${buddyBal.amount.toFixed(0)}` 
                    : `-${buddyBal.amount.toFixed(0)}`}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsAddBuddyOpen(true)}
          className="px-3 py-1.5 bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Friend / Group</span>
        </button>
      </div>

      {/* Top Settlement Card */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2F2F7]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#0071E3]" />
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Buddy Balance & Settlement Notifications
              </h3>
            </div>
            <p className="text-xs text-[#86868B]">
              Track shared splits, settle balances, and notify each other via email or receipt link with acknowledgments.
            </p>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-1 font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditingProfile ? 'Close Settings' : 'Edit Emails & Contact'}
          </button>
        </div>

        {/* Profile and Email Editor */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="p-4 my-4 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] space-y-4">
            <h4 className="text-xs font-semibold text-[#1D1D1F]">
              Contact Details for Settlement Notifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#1D1D1F] block mb-1">
                  Your Name & Email
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={meName}
                    onChange={(e) => setMeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D6] rounded-lg text-xs font-semibold outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    value={meEmail}
                    onChange={(e) => setMeEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D6] rounded-lg text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#1D1D1F] block mb-1">
                  Friend's Name & Email ({profile.friendName})
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Friend's Name"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D6] rounded-lg text-xs font-semibold outline-none"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Friend's Email Address"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D6] rounded-lg text-xs outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#86868B]">Default payment method:</span>
                <select
                  value={defaultPaymentMethod}
                  onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#D1D1D6] rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="Apple Cash">Apple Cash</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-black text-white rounded-lg text-xs font-medium"
              >
                Save Contact Info
              </button>
            </div>
          </form>
        )}

        {/* Live Balance Display */}
        <div className="py-6 flex flex-col items-center justify-center text-center">
          {balance.creditor === 'even' ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold text-[#1D1D1F]">All Settled Up</h4>
              <p className="text-xs text-[#86868B] max-w-sm">
                Neither {profile.meName} nor {profile.friendName} owes anything right now. Shared balances are balanced at $0.00.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider block">
                Current Outstanding Balance
              </span>

              <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap sm:flex-nowrap">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#3A3A3C] text-white font-bold flex items-center justify-center mx-auto mb-1.5 text-lg shadow-sm border border-black/10">
                    {debtorName[0]}
                  </div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">{debtorName}</span>
                  <span className="text-[10px] text-[#86868B] block truncate max-w-[120px]">{senderEmail}</span>
                </div>

                <div className="flex flex-col items-center px-2 sm:px-6">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-[#0071E3] tabular-nums">
                    ${balance.amount.toFixed(2)}
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#0071E3] bg-[#0071E3]/10 px-2.5 py-0.5 rounded-full font-bold mt-1">
                    <span>owes</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#0077ED] text-white font-bold flex items-center justify-center mx-auto mb-1.5 text-lg shadow-sm border border-blue-400/20">
                    {creditorName[0]}
                  </div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">{creditorName}</span>
                  <span className="text-[10px] text-[#86868B] block truncate max-w-[120px]">{recipientEmail}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0066CC] hover:to-[#0071E3] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-98"
                >
                  <Mail className="w-4 h-4" />
                  <span>Settle Up & Send Receipt (${balance.amount.toFixed(2)})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subtotal metrics with directional icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#F2F2F7]">
          <div className="p-3.5 bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border border-blue-100 text-center shadow-2xs">
            <span className="text-xs text-[#86868B] block mb-1">
              {profile.meName} paid for {profile.friendName}
            </span>
            <span className="text-lg font-mono font-bold text-[#0071E3] tabular-nums">
              ${balance.mePaidForFriend.toFixed(2)}
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl border border-indigo-100 text-center shadow-2xs">
            <span className="text-xs text-[#86868B] block mb-1">
              {profile.friendName} paid for {profile.meName}
            </span>
            <span className="text-lg font-mono font-bold text-[#5856D6] tabular-nums">
              ${balance.friendPaidForMe.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Roommate Connection & Live Sync Card */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1D1D1F]">
                Roommate Connection & Live Sync
              </h4>
              <p className="text-xs text-[#86868B]">
                How you and {profile.friendName} connect as app friends to sync splits in real time
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span>Paired with {profile.friendName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Box 1: Friend Contact info */}
          <div className="p-3.5 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] space-y-1">
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider block">
              Configured Friend
            </span>
            <p className="text-sm font-bold text-[#1D1D1F] truncate">
              {profile.friendName}
            </p>
            <p className="text-xs text-[#86868B] truncate">
              {profile.friendEmail || 'No email set'}
            </p>
          </div>

          {/* Box 2: Instant Latency */}
          <div className="p-3.5 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] space-y-1">
            <span className="text-[11px] font-bold text-[#0071E3] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#0071E3]" />
              Sync Speed
            </span>
            <p className="text-sm font-bold text-[#1D1D1F]">
              Sub-second (under 200ms)
            </p>
            <p className="text-xs text-[#86868B]">
              Live WebSocket push via Firestore
            </p>
          </div>

          {/* Box 3: Preferred Settlement */}
          <div className="p-3.5 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] space-y-1">
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider block">
              Default Settlement
            </span>
            <p className="text-sm font-bold text-[#1D1D1F]">
              {profile.defaultPaymentMethod || 'Apple Cash'}
            </p>
            <p className="text-xs text-[#86868B]">
              Instant debt equalization
            </p>
          </div>
        </div>

        {/* Real-time sync explanation banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#0071E3]/8 via-[#0071E3]/4 to-transparent rounded-xl border border-[#0071E3]/15 text-xs text-[#1D1D1F] space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-[#0071E3]">
            <Zap className="w-3.5 h-3.5" />
            <span>How Real-Time Sync Works When You Add a Split:</span>
          </p>
          <p className="text-[#86868B] text-[11px] leading-relaxed">
            When you add an expense with a split (e.g. groceries 50/50, or rideshare owed), Firestore immediately broadcasts the updated document over an active WebSocket connection. Your roommate's app updates <strong>instantly in less than a quarter of a second</strong> without them needing to refresh the browser or restart the app.
          </p>
        </div>

        {/* Invite action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Share Invite Link & QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const appUrl = 'https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app';
                const subject = encodeURIComponent(`Join me on Lumen to track our apartment expenses & splits!`);
                const body = encodeURIComponent(
                  `Hi ${profile.friendName},\n\nI'm tracking our shared apartment expenses on Lumen. Tap the link below to open our shared dashboard and view live split balances in real time:\n\n${appUrl}\n\nAny split or expense we log updates instantly across both of our phones!`
                );
                window.open(`mailto:${profile.friendEmail}?subject=${subject}&body=${body}`, '_blank');
              }}
              className="px-3 py-1.5 bg-white hover:bg-[#F2F2F7] border border-[#D1D1D6] text-[#1D1D1F] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Send Email Invite</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="text-xs text-[#0071E3] hover:underline font-medium"
          >
            Change friend email or name &rarr;
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#34C759]" />
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Settlement Records & Acknowledgment Tracking
            </h4>
          </div>
          <span className="text-xs text-[#86868B]">
            {settlementRecords.length} records verified
          </span>
        </div>

        <div className="space-y-2.5">
          {settlementRecords.length === 0 ? (
            <p className="text-xs text-[#86868B] py-4 text-center">
              No settlements recorded yet. When you settle balances, verifiable receipts and notifications will appear here.
            </p>
          ) : (
            settlementRecords.map((record) => {
              const isPendingMyAck = !record.acknowledged && record.recipientName === profile.meName;
              const isPendingFriendAck = !record.acknowledged && record.recipientName !== profile.meName;

              return (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border transition-all ${
                    record.acknowledged
                      ? 'bg-[#F9F9FB] border-[#E5E5EA]'
                      : 'bg-[#0071E3]/5 border-[#0071E3]/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          {record.senderName} settled ${record.amount.toFixed(2)} with {record.recipientName}
                        </span>
                        <span className="text-[11px] font-mono text-[#86868B]">
                          · via {record.paymentMethod}
                        </span>
                        <span className="text-[11px] text-[#86868B]">
                          · Sent to {record.recipientEmail}
                        </span>
                      </div>

                      <p className="text-xs text-[#636366]">
                        {record.notes}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#86868B] mt-2">
                        <span>{new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        <span>·</span>
                        {record.acknowledged ? (
                          <span className="text-[#34C759] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                            Acknowledged by {record.recipientName}
                            {record.acknowledgedAt && ` on ${new Date(record.acknowledgedAt).toLocaleDateString()}`}
                          </span>
                        ) : (
                          <span className="text-[#FF9500] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Acknowledgment from {record.recipientName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acknowledgment Action Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {!record.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(record.id)}
                          className="px-3 py-1.5 bg-[#34C759] hover:bg-[#2FB34F] text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Acknowledge & Confirm Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Shared Expenses Audit Trail */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#86868B]" />
            <h4 className="text-sm font-semibold text-[#1D1D1F]">
              Underlying Shared Expenses History
            </h4>
          </div>
          <span className="text-xs text-[#86868B]">
            {sharedExpenses.length} shared transactions
          </span>
        </div>

        <div className="divide-y divide-[#F2F2F7]">
          {sharedExpenses.length === 0 ? (
            <p className="text-xs text-[#86868B] py-3 text-center">No shared expenses logged yet.</p>
          ) : (
            sharedExpenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-2 border-b border-[#F2F2F7] last:border-b-0">
                <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                  <span className="text-xs font-medium text-[#1D1D1F] block truncate">{exp.title}</span>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#86868B] mt-1">
                    <PaidByBadge paidBy={exp.paidBy} profile={profile} />
                    <span className="shrink-0">{new Date(exp.date).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="text-[#0071E3] font-medium shrink-0">Split 50/50</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-mono font-semibold text-[#1D1D1F] tabular-nums block">
                    ${exp.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#86868B] tabular-nums block">
                    (${(exp.amount / 2).toFixed(2)} each)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settlement Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#0071E3]" />
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Settlement & Notification Dispatch
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-[#F2F2F7] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#86868B]">Settlement Amount:</span>
                <span className="text-base font-bold font-mono text-[#0071E3]">
                  ${balance.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#86868B]">From:</span>
                <span className="font-semibold text-[#1D1D1F]">{debtorName} ({senderEmail})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#86868B]">To:</span>
                <span className="font-semibold text-[#1D1D1F]">{creditorName} ({recipientEmail})</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
                Payment Channel Used
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['Apple Cash', 'Zelle', 'Venmo', 'Bank Transfer', 'Cash'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-all ${
                      selectedPaymentMethod === method
                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                        : 'bg-[#F9F9FB] text-[#86868B] border-[#E5E5EA] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
                Settlement Memo / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Paid via Apple Cash for shared rides & groceries"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl text-xs outline-none"
              />
            </div>

            {/* Notification Actions */}
            <div className="pt-3 border-t border-[#F2F2F7] space-y-2">
              <button
                type="button"
                onClick={() => handleExecuteSettlement('email')}
                className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email Notification & Mark Settled</span>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteSettlement('link')}
                className="w-full py-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Shareable Text Receipt (for iMessage / WhatsApp) & Settle</span>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteSettlement('in_app')}
                className="w-full py-1.5 text-[#86868B] hover:text-[#1D1D1F] text-[11px] transition-colors"
              >
                Settle In-App Only (No Outbound Alert)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roommate Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Invite {profile.friendName}
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    Connect your roommate to share real-time splits
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#86868B] leading-relaxed">
                Send this link or show the QR code to <strong>{profile.friendName}</strong>. Once they open it on their phone or computer, you will both be connected to the same live shared ledger!
              </p>

              {/* QR Code */}
              <div className="p-4 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] flex flex-col items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    'https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app'
                  )}`}
                  alt="Scan to join Lumen"
                  className="w-36 h-36 rounded-xl border border-[#E5E5EA] bg-white p-2 shadow-2xs"
                />
                <span className="text-[10px] text-[#86868B] mt-2">
                  Have {profile.friendName} point their camera at this code
                </span>
              </div>

              {/* Direct Link Copy Box */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#86868B] block">
                  Shareable Link:
                </span>
                <div className="flex items-center gap-2 p-2 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA]">
                  <input
                    type="text"
                    readOnly
                    value="https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app"
                    className="bg-transparent text-xs text-[#1D1D1F] outline-none flex-1 font-mono truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app');
                      setCopiedInvite(true);
                      showToast('Invite link copied to clipboard!');
                      setTimeout(() => setCopiedInvite(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#E5E5EA] border border-[#D1D1D6] rounded-lg text-xs font-semibold text-[#1D1D1F] transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-3 h-3 text-[#34C759]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email Send Button */}
              <button
                type="button"
                onClick={() => {
                  const appUrl = 'https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app';
                  const subject = encodeURIComponent(`Join me on Lumen to track our apartment expenses & splits!`);
                  const body = encodeURIComponent(
                    `Hi ${profile.friendName},\n\nI'm tracking our shared apartment expenses on Lumen. Tap the link below to open our shared dashboard and view live split balances in real time:\n\n${appUrl}\n\nAny split or expense we log updates instantly across both of our phones!`
                  );
                  window.open(`mailto:${profile.friendEmail}?subject=${subject}&body=${body}`, '_blank');
                  setIsInviteModalOpen(false);
                }}
                className="w-full py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email Invitation to {profile.friendEmail || profile.friendName}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend / Group Modal */}
      {isAddBuddyOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Add Split Friend or Group
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    Track isolated splits with Gautam, trips, or other friends
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddBuddyOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewBuddy} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Friend's Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gautam or Lake Tahoe Group"
                  value={newBuddyName}
                  onChange={(e) => setNewBuddyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#D1D1D6] rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Friend's Email (optional):
                </label>
                <input
                  type="email"
                  placeholder="e.g. gautam@example.com"
                  value={newBuddyEmail}
                  onChange={(e) => setNewBuddyEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#D1D1D6] rounded-xl text-xs text-[#1D1D1F] outline-none focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Category / Relationship:
                </label>
                <select
                  value={newBuddyRole}
                  onChange={(e) => setNewBuddyRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F9FB] border border-[#D1D1D6] rounded-xl text-xs text-[#1D1D1F] outline-none cursor-pointer"
                >
                  <option value="Friend">Friend / Personal</option>
                  <option value="Apartment Roommate">Apartment Roommate</option>
                  <option value="Road Trip">Road Trip / Vacation</option>
                  <option value="Gym & Fitness">Gym & Fitness</option>
                  <option value="Office & Colleagues">Office & Colleagues</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBuddyOpen(false)}
                  className="flex-1 py-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Add Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-4 bg-[#1D1D1F] text-white text-xs font-medium rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
