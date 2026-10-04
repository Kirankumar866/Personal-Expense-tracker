export type ExpenseCategory = 
  | 'uber'
  | 'dining'
  | 'groceries'
  | 'housing'
  | 'coffee'
  | 'shopping'
  | 'subscriptions'
  | 'entertainment'
  | 'other';

export interface CategoryMeta {
  id: ExpenseCategory;
  name: string;
  iconName: string;
  color: string;
  defaultMonthlyBudget: number;
  description: string;
}

export interface Expense {
  id: string;
  amount: number;
  title: string;
  category: ExpenseCategory;
  date: string; // ISO 8601 string
  paidBy: 'me' | 'friend';
  split: 'none' | 'equal' | 'me_full' | 'friend_full';
  notes?: string;
  createdAt: number;
}

export interface BudgetConfig {
  totalMonthlyBudget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  currency: string;
  alertThresholdPercent: number; // e.g. 80%
}

export interface UserProfile {
  meName: string;
  friendName: string;
  meEmail: string;
  friendEmail: string;
  defaultPaymentMethod: string;
}

export interface SettlementRecord {
  id: string;
  sender: 'me' | 'friend';
  recipient: 'me' | 'friend';
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
  notificationSentVia: 'email' | 'link' | 'in_app';
}

export interface SpendingComparison {
  category: ExpenseCategory;
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  diffAmount: number;
  isIncrease: boolean;
}

export interface PeriodComparison {
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  diffAmount: number;
  categories: SpendingComparison[];
}

export interface BuddyBalance {
  mePaidForFriend: number;
  friendPaidForMe: number;
  netOwed: number; // positive: friend owes me, negative: me owes friend
  creditor: 'me' | 'friend' | 'even';
  amount: number;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: 'logged_expense' | 'scanned_receipt' | 'settled' | 'updated_budget' | 'signed_in';
  description: string;
  amount?: number;
  timestamp: string;
}

