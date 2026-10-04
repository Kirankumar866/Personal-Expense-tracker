import { Expense, BudgetConfig, UserProfile } from '../types/expense';
import { DEFAULT_BUDGET_CONFIG, DEFAULT_USER_PROFILE } from '../constants/categories';
import { generateInitialExpenses } from './seedData';

const EXPENSES_KEY = 'lumen_expenses_v2';
const LIVE_EXPENSES_KEY = 'lumen_live_expenses_v1';
const BUDGET_KEY = 'lumen_budget_config_v2';
const PROFILE_KEY = 'lumen_user_profile_v2';

export function loadStoredLiveExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(LIVE_EXPENSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredLiveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(LIVE_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save live expenses to localStorage', e);
  }
}

export function loadStoredExpenses(): Expense[] {
  try {
    let raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) {
      raw = localStorage.getItem('lumen_expenses_v1');
    }
    if (!raw) {
      const initial = generateInitialExpenses();
      saveStoredExpenses(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateInitialExpenses();
    }
    return parsed.map((e: any) => {
      let cat = e.category;
      if (cat === 'books') cat = 'shopping';
      if (!cat) cat = 'other';
      return {
        ...e,
        category: cat,
      };
    });
  } catch (e) {
    console.error('Failed to load expenses from localStorage', e);
    return generateInitialExpenses();
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses to localStorage', e);
  }
}

export function loadStoredBudgetConfig(): BudgetConfig {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return DEFAULT_BUDGET_CONFIG;
    return { ...DEFAULT_BUDGET_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_BUDGET_CONFIG;
  }
}

export function saveStoredBudgetConfig(config: BudgetConfig): void {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save budget config', e);
  }
}

export function loadStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function resetToDemoData(): { expenses: Expense[]; budget: BudgetConfig; profile: UserProfile } {
  const initial = generateInitialExpenses();
  saveStoredExpenses(initial);
  saveStoredBudgetConfig(DEFAULT_BUDGET_CONFIG);
  saveStoredUserProfile(DEFAULT_USER_PROFILE);
  return {
    expenses: initial,
    budget: DEFAULT_BUDGET_CONFIG,
    profile: DEFAULT_USER_PROFILE,
  };
}

export function clearAllData(): { expenses: Expense[] } {
  const empty: Expense[] = [];
  saveStoredExpenses(empty);
  return { expenses: empty };
}

export function exportAppDataJson(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses: loadStoredExpenses(),
    budget: loadStoredBudgetConfig(),
    profile: loadStoredUserProfile(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAppDataJson(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.expenses)) {
      return { success: false, error: 'Invalid file format: missing expenses array' };
    }
    saveStoredExpenses(parsed.expenses);
    if (parsed.budget) saveStoredBudgetConfig(parsed.budget);
    if (parsed.profile) saveStoredUserProfile(parsed.profile);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'JSON parsing failed' };
  }
}
