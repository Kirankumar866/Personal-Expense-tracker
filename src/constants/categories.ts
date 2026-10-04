import { CategoryMeta, ExpenseCategory, BudgetConfig, UserProfile } from '../types/expense';

export const ACTIVE_CATEGORIES: ExpenseCategory[] = [
  'uber',
  'dining',
  'groceries',
  'coffee',
  'shopping',
  'housing',
  'subscriptions',
  'entertainment',
  'other',
];

export const CATEGORIES: Record<string, CategoryMeta> = {
  uber: {
    id: 'uber',
    name: 'Uber & Rideshare',
    iconName: 'Car',
    color: '#0071E3', // Apple Blue
    defaultMonthlyBudget: 120,
    description: 'Rideshare, taxis, and city transit',
  },
  dining: {
    id: 'dining',
    name: 'Food & Dining Out',
    iconName: 'Utensils',
    color: '#FF9500', // Apple Orange
    defaultMonthlyBudget: 220,
    description: 'Restaurants, takeout, delivery, and cafes',
  },
  groceries: {
    id: 'groceries',
    name: 'Groceries & Pantry',
    iconName: 'ShoppingBag',
    color: '#34C759', // Apple Green
    defaultMonthlyBudget: 250,
    description: 'Supermarkets, farm produce, and bulk items',
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee & Drinks',
    iconName: 'Coffee',
    color: '#9C5824', // Warm Roasted Mocha
    defaultMonthlyBudget: 50,
    description: 'Specialty coffee, tea, and quick bites',
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping & Essentials',
    iconName: 'ShoppingBag',
    color: '#AF52DE', // Apple Purple
    defaultMonthlyBudget: 100,
    description: 'Household goods, electronics, and wardrobe',
  },
  // Legacy backward compatibility alias for 'books'
  books: {
    id: 'shopping',
    name: 'Shopping & Essentials',
    iconName: 'ShoppingBag',
    color: '#AF52DE',
    defaultMonthlyBudget: 100,
    description: 'Household goods, electronics, and wardrobe',
  },
  housing: {
    id: 'housing',
    name: 'Housing & Utilities',
    iconName: 'Home',
    color: '#0284C7', // Sky Blue
    defaultMonthlyBudget: 350,
    description: 'Shared rent, Wi-Fi, electricity, water',
  },
  subscriptions: {
    id: 'subscriptions',
    name: 'Subscriptions & Software',
    iconName: 'Tv',
    color: '#FF2D55', // Apple Rose / Red
    defaultMonthlyBudget: 45,
    description: 'Cloud storage, streaming, productivity apps',
  },
  entertainment: {
    id: 'entertainment',
    name: 'Social & Leisure',
    iconName: 'Sparkles',
    color: '#5856D6', // Apple Indigo
    defaultMonthlyBudget: 90,
    description: 'Concerts, events, movies, and outings',
  },
  other: {
    id: 'other',
    name: 'General & Miscellaneous',
    iconName: 'MoreHorizontal',
    color: '#8E8E93', // Apple Neutral Gray
    defaultMonthlyBudget: 50,
    description: 'Uncategorized and unexpected expenses',
  },
};

export function getCategoryMeta(category: string | undefined): CategoryMeta {
  if (category && CATEGORIES[category]) {
    return CATEGORIES[category];
  }
  if (category === 'books') {
    return CATEGORIES.shopping;
  }
  return CATEGORIES.other;
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  totalMonthlyBudget: 1250,
  categoryBudgets: {
    uber: 120,
    dining: 220,
    groceries: 250,
    coffee: 50,
    shopping: 100,
    housing: 350,
    subscriptions: 45,
    entertainment: 90,
    other: 50,
  },
  currency: '$',
  alertThresholdPercent: 80,
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  meName: 'Kiran',
  friendName: 'Alex',
  meEmail: 'kirankumar201018@gmail.com',
  friendEmail: 'alex.rivera@example.com',
  defaultPaymentMethod: 'Apple Cash',
};
