import { Expense, ExpenseCategory, BudgetConfig, PeriodComparison, SpendingComparison, BuddyBalance } from '../types/expense';
import { CATEGORIES, ACTIVE_CATEGORIES, getCategoryMeta } from '../constants/categories';

export interface DailySpendPoint {
  dateStr: string;
  dayName: string;
  currentWeekAmount: number;
  previousWeekAmount: number;
}

export function filterExpensesByUser(
  expenses: Expense[], 
  userFilter: 'all' | 'me' | 'friend'
): Expense[] {
  if (userFilter === 'all') return expenses;
  return expenses.filter(e => {
    if (userFilter === 'me') {
      return e.paidBy === 'me' || (e.split === 'equal' && e.paidBy === 'friend');
    }
    if (userFilter === 'friend') {
      return e.paidBy === 'friend' || (e.split === 'equal' && e.paidBy === 'me');
    }
    return true;
  });
}

export function calculateEffectiveAmount(expense: Expense, viewUser: 'all' | 'me' | 'friend'): number {
  if (viewUser === 'all') return expense.amount;
  if (expense.split === 'equal') {
    return expense.amount / 2;
  }
  if (viewUser === 'me') {
    return expense.paidBy === 'me' ? expense.amount : 0;
  }
  if (viewUser === 'friend') {
    return expense.paidBy === 'friend' ? expense.amount : 0;
  }
  return expense.amount;
}

export function getMonthComparison(
  expenses: Expense[],
  viewUser: 'all' | 'me' | 'friend' = 'all',
  targetDate: Date = new Date()
): PeriodComparison {
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth();

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const prevMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const currentCategoryTotals: Record<ExpenseCategory, number> = {} as any;
  const prevCategoryTotals: Record<ExpenseCategory, number> = {} as any;

  ACTIVE_CATEGORIES.forEach(cat => {
    currentCategoryTotals[cat] = 0;
    prevCategoryTotals[cat] = 0;
  });

  let currentTotal = 0;
  currentMonthExpenses.forEach(e => {
    const eff = calculateEffectiveAmount(e, viewUser);
    const cat = e.category === ('books' as any) ? 'shopping' : e.category;
    currentCategoryTotals[cat] = (currentCategoryTotals[cat] || 0) + eff;
    currentTotal += eff;
  });

  let previousTotal = 0;
  prevMonthExpenses.forEach(e => {
    const eff = calculateEffectiveAmount(e, viewUser);
    const cat = e.category === ('books' as any) ? 'shopping' : e.category;
    prevCategoryTotals[cat] = (prevCategoryTotals[cat] || 0) + eff;
    previousTotal += eff;
  });

  const categories: SpendingComparison[] = ACTIVE_CATEGORIES.map(cat => {
    const cur = currentCategoryTotals[cat] || 0;
    const prev = prevCategoryTotals[cat] || 0;
    const diff = cur - prev;
    let pct = 0;
    if (prev > 0) {
      pct = ((cur - prev) / prev) * 100;
    } else if (cur > 0) {
      pct = 100;
    }
    return {
      category: cat,
      categoryName: getCategoryMeta(cat).name,
      currentAmount: cur,
      previousAmount: prev,
      percentageChange: Number(pct.toFixed(1)),
      diffAmount: diff,
      isIncrease: diff > 0,
    };
  }).filter(c => c.currentAmount > 0 || c.previousAmount > 0);

  // Sort by highest current amount
  categories.sort((a, b) => b.currentAmount - a.currentAmount);

  let totalPct = 0;
  if (previousTotal > 0) {
    totalPct = ((currentTotal - previousTotal) / previousTotal) * 100;
  } else if (currentTotal > 0) {
    totalPct = 100;
  }

  return {
    currentTotal,
    previousTotal,
    percentageChange: Number(totalPct.toFixed(1)),
    diffAmount: currentTotal - previousTotal,
    categories,
  };
}

export function getWeekComparison(
  expenses: Expense[],
  viewUser: 'all' | 'me' | 'friend' = 'all',
  targetDate: Date = new Date()
): PeriodComparison & { dailyBreakdown: DailySpendPoint[] } {
  // Current 7 days vs previous 7 days (or current calendar week Mon-Sun)
  // Let's calculate standard 7-day windows ending today
  const endOfCurrent = new Date(targetDate);
  endOfCurrent.setHours(23, 59, 59, 999);
  
  const startOfCurrent = new Date(endOfCurrent);
  startOfCurrent.setDate(endOfCurrent.getDate() - 6);
  startOfCurrent.setHours(0, 0, 0, 0);

  const endOfPrev = new Date(startOfCurrent);
  endOfPrev.setDate(startOfCurrent.getDate() - 1);
  endOfPrev.setHours(23, 59, 59, 999);

  const startOfPrev = new Date(endOfPrev);
  startOfPrev.setDate(endOfPrev.getDate() - 6);
  startOfPrev.setHours(0, 0, 0, 0);

  const currentCategoryTotals: Record<ExpenseCategory, number> = {} as any;
  const prevCategoryTotals: Record<ExpenseCategory, number> = {} as any;

  ACTIVE_CATEGORIES.forEach(cat => {
    currentCategoryTotals[cat] = 0;
    prevCategoryTotals[cat] = 0;
  });

  let currentTotal = 0;
  let previousTotal = 0;

  expenses.forEach(e => {
    const d = new Date(e.date).getTime();
    const eff = calculateEffectiveAmount(e, viewUser);
    const cat = e.category === ('books' as any) ? 'shopping' : e.category;

    if (d >= startOfCurrent.getTime() && d <= endOfCurrent.getTime()) {
      currentCategoryTotals[cat] = (currentCategoryTotals[cat] || 0) + eff;
      currentTotal += eff;
    } else if (d >= startOfPrev.getTime() && d <= endOfPrev.getTime()) {
      prevCategoryTotals[cat] = (prevCategoryTotals[cat] || 0) + eff;
      previousTotal += eff;
    }
  });

  const categories: SpendingComparison[] = ACTIVE_CATEGORIES.map(cat => {
    const cur = currentCategoryTotals[cat] || 0;
    const prev = prevCategoryTotals[cat] || 0;
    const diff = cur - prev;
    let pct = 0;
    if (prev > 0) {
      pct = ((cur - prev) / prev) * 100;
    } else if (cur > 0) {
      pct = 100;
    }
    return {
      category: cat,
      categoryName: getCategoryMeta(cat).name,
      currentAmount: cur,
      previousAmount: prev,
      percentageChange: Number(pct.toFixed(1)),
      diffAmount: diff,
      isIncrease: diff > 0,
    };
  }).filter(c => c.currentAmount > 0 || c.previousAmount > 0);

  categories.sort((a, b) => b.currentAmount - a.currentAmount);

  let totalPct = 0;
  if (previousTotal > 0) {
    totalPct = ((currentTotal - previousTotal) / previousTotal) * 100;
  } else if (currentTotal > 0) {
    totalPct = 100;
  }

  // Generate 7-day comparison point for bar charts
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyBreakdown: DailySpendPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const curDay = new Date(startOfCurrent);
    curDay.setDate(startOfCurrent.getDate() + i);
    const prevDay = new Date(startOfPrev);
    prevDay.setDate(startOfPrev.getDate() + i);

    const curDayStr = curDay.toISOString().split('T')[0];
    const prevDayStr = prevDay.toISOString().split('T')[0];

    let curSum = 0;
    let prevSum = 0;

    expenses.forEach(e => {
      const eStr = e.date.split('T')[0];
      const eff = calculateEffectiveAmount(e, viewUser);
      if (eStr === curDayStr) curSum += eff;
      if (eStr === prevDayStr) prevSum += eff;
    });

    dailyBreakdown.push({
      dateStr: curDayStr,
      dayName: dayNames[curDay.getDay()],
      currentWeekAmount: curSum,
      previousWeekAmount: prevSum,
    });
  }

  return {
    currentTotal,
    previousTotal,
    percentageChange: Number(totalPct.toFixed(1)),
    diffAmount: currentTotal - previousTotal,
    categories,
    dailyBreakdown,
  };
}

export function calculateBuddyBalance(expenses: Expense[]): BuddyBalance {
  let mePaidForFriend = 0;
  let friendPaidForMe = 0;

  expenses.forEach(e => {
    if (e.split === 'equal') {
      const half = e.amount / 2;
      if (e.paidBy === 'me') {
        mePaidForFriend += half;
      } else {
        friendPaidForMe += half;
      }
    } else if (e.split === 'me_full' && e.paidBy === 'friend') {
      friendPaidForMe += e.amount;
    } else if (e.split === 'friend_full' && e.paidBy === 'me') {
      mePaidForFriend += e.amount;
    }
  });

  const net = mePaidForFriend - friendPaidForMe;
  if (Math.abs(net) < 0.01) {
    return {
      mePaidForFriend,
      friendPaidForMe,
      netOwed: 0,
      creditor: 'even',
      amount: 0,
    };
  }

  return {
    mePaidForFriend,
    friendPaidForMe,
    netOwed: net,
    creditor: net > 0 ? 'me' : 'friend',
    amount: Math.abs(net),
  };
}

export function calculateSafeDailySpend(
  budget: BudgetConfig, 
  currentMonthSpent: number, 
  targetDate: Date = new Date()
): { safeDaily: number; daysLeft: number; totalDays: number; projectedMonthTotal: number } {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = targetDate.getDate();
  const daysLeft = Math.max(1, totalDays - currentDay + 1);

  const remainingBudget = Math.max(0, budget.totalMonthlyBudget - currentMonthSpent);
  const safeDaily = remainingBudget / daysLeft;

  // Projected run rate: (spent / currentDay) * totalDays
  const dailyAverageSoFar = currentDay > 0 ? currentMonthSpent / currentDay : 0;
  const projectedMonthTotal = dailyAverageSoFar * totalDays;

  return {
    safeDaily: Number(safeDaily.toFixed(2)),
    daysLeft,
    totalDays,
    projectedMonthTotal: Number(projectedMonthTotal.toFixed(2)),
  };
}

export function calculateWorkHours(amount: number, hourlyWage: number): number {
  if (hourlyWage <= 0) return 0;
  return Number((amount / hourlyWage).toFixed(1));
}

export interface SmartInsight {
  id: string;
  type: 'surge' | 'warning' | 'positive' | 'tip';
  title: string;
  description: string;
  metric?: string;
  badge?: string;
  actionText?: string;
}

export function generateSmartInsights(
  monthComp: PeriodComparison,
  weekComp: PeriodComparison,
  budget: BudgetConfig,
  currentMonthTotal: number
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // Check Uber specifically as requested: "this month I have been using Uber 20% more than the previous month"
  const uberComp = monthComp.categories.find(c => c.category === 'uber');
  if (uberComp && uberComp.previousAmount > 0) {
    const pct = uberComp.percentageChange;
    if (pct > 0) {
      insights.push({
        id: 'uber-pace-insight',
        type: pct >= 15 ? 'surge' : 'warning',
        title: `Uber & Rideshare is +${pct}% vs last month`,
        description: `You've spent $${uberComp.currentAmount.toFixed(2)} on Uber this month ($${uberComp.previousAmount.toFixed(2)} in previous month, +$${uberComp.diffAmount.toFixed(2)} net difference).`,
        metric: `+${pct}% Surge`,
        badge: pct >= 20 ? 'High Priority' : 'Pacing Alert',
      });
    } else {
      insights.push({
        id: 'uber-pace-positive',
        type: 'positive',
        title: `Uber spending is down ${Math.abs(pct)}%`,
        description: `Great pacing! You spent $${uberComp.currentAmount.toFixed(2)} vs $${uberComp.previousAmount.toFixed(2)} in the prior month.`,
        metric: `${pct}%`,
      });
    }
  }

  // Budget overall threshold check
  const budgetRatio = (currentMonthTotal / budget.totalMonthlyBudget) * 100;
  if (budgetRatio >= 100) {
    insights.push({
      id: 'budget-exceeded',
      type: 'surge',
      title: 'Monthly budget limit reached',
      description: `Total spend ($${currentMonthTotal.toFixed(2)}) has reached your $${budget.totalMonthlyBudget.toFixed(2)} goal. Daily safe-to-spend is $0.00 until next month.`,
      metric: `${budgetRatio.toFixed(0)}% Used`,
      badge: 'Critical Limit',
    });
  } else if (budgetRatio >= budget.alertThresholdPercent) {
    insights.push({
      id: 'budget-warning',
      type: 'warning',
      title: `Approaching monthly budget threshold (${budgetRatio.toFixed(0)}%)`,
      description: `You have used $${currentMonthTotal.toFixed(2)} of your $${budget.totalMonthlyBudget.toFixed(2)} budget. Keep non-essential spending paused.`,
      metric: `${budgetRatio.toFixed(0)}% Used`,
      badge: 'Approaching Limit',
    });
  }

  // Week pace check
  if (weekComp.percentageChange > 15) {
    insights.push({
      id: 'week-spike',
      type: 'warning',
      title: `Weekly spending is up ${weekComp.percentageChange}%`,
      description: `This week ($${weekComp.currentTotal.toFixed(2)}) is outpacing last week ($${weekComp.previousTotal.toFixed(2)}).`,
      metric: `+$${weekComp.diffAmount.toFixed(2)}`,
    });
  } else if (weekComp.percentageChange < -10 && weekComp.previousTotal > 0) {
    insights.push({
      id: 'week-thrift',
      type: 'positive',
      title: `Disciplined week: Saved ${Math.abs(weekComp.percentageChange)}%`,
      description: `You've kept spending lower than last week by $${Math.abs(weekComp.diffAmount).toFixed(2)}.`,
      metric: `${weekComp.percentageChange}%`,
    });
  }

  return insights;
}

export interface MonthOption {
  year: number;
  month: number; // 0 to 11
  key: string; // YYYY-MM
  label: string; // e.g. "October 2026"
  relativeLabel: string; // e.g. "Current Month", "Last Month", "Last 3rd Month"
  totalSpent: number;
  count: number;
}

export function getHistoricalMonthOptions(
  expenses: Expense[],
  viewUser: 'all' | 'me' | 'friend' = 'all'
): MonthOption[] {
  const monthMap = new Map<string, { year: number; month: number; total: number; count: number }>();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  expenses.forEach((e) => {
    const d = new Date(e.date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const eff = calculateEffectiveAmount(e, viewUser);

    if (!monthMap.has(key)) {
      monthMap.set(key, { year: y, month: m, total: 0, count: 0 });
    }
    const curr = monthMap.get(key)!;
    curr.total += eff;
    curr.count += 1;
  });

  // Ensure current month and past 3 months exist even if 0 expenses
  for (let offset = 0; offset <= 3; offset++) {
    const target = new Date(curYear, curMonth - offset, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { year: y, month: m, total: 0, count: 0 });
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    const data = monthMap.get(key)!;
    const dateDiffMonths = (curYear - data.year) * 12 + (curMonth - data.month);

    let relativeLabel = '';
    if (dateDiffMonths === 0) relativeLabel = 'Current Month';
    else if (dateDiffMonths === 1) relativeLabel = 'Previous Month';
    else if (dateDiffMonths === 2) relativeLabel = '2 Months Ago';
    else if (dateDiffMonths === 3) relativeLabel = 'Last 3rd Month';
    else relativeLabel = `${dateDiffMonths} Months Ago`;

    return {
      year: data.year,
      month: data.month,
      key,
      label: `${monthNames[data.month]} ${data.year}`,
      relativeLabel,
      totalSpent: Number(data.total.toFixed(2)),
      count: data.count,
    };
  });
}

export interface HistoricalMonthDetail {
  monthKey: string;
  label: string;
  relativeLabel: string;
  year: number;
  month: number;
  totalSpent: number;
  previousMonthTotal: number;
  percentageChangeVsPrevious: number;
  diffAmountVsPrevious: number;
  categories: SpendingComparison[];
  expenses: Expense[];
}

export function getHistoricalMonthDetail(
  expenses: Expense[],
  year: number,
  month: number,
  viewUser: 'all' | 'me' | 'friend' = 'all'
): HistoricalMonthDetail {
  const targetDate = new Date(year, month, 15);
  const comparison = getMonthComparison(expenses, viewUser, targetDate);

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const now = new Date();
  const diffMonths = (now.getFullYear() - year) * 12 + (now.getMonth() - month);
  let relativeLabel = '';
  if (diffMonths === 0) relativeLabel = 'Current Month';
  else if (diffMonths === 1) relativeLabel = 'Previous Month';
  else if (diffMonths === 2) relativeLabel = '2 Months Ago';
  else if (diffMonths === 3) relativeLabel = 'Last 3rd Month';
  else relativeLabel = `${diffMonths} Months Ago`;

  return {
    monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: `${monthNames[month]} ${year}`,
    relativeLabel,
    year,
    month,
    totalSpent: comparison.currentTotal,
    previousMonthTotal: comparison.previousTotal,
    percentageChangeVsPrevious: comparison.percentageChange,
    diffAmountVsPrevious: comparison.diffAmount,
    categories: comparison.categories,
    expenses: monthExpenses,
  };
}

export interface MultiMonthRollup {
  months: {
    key: string;
    label: string;
    shortLabel: string;
    relativeLabel: string;
    total: number;
    uberTotal: number;
    diningTotal: number;
    groceriesTotal: number;
    topCategory: string;
    count: number;
  }[];
  totalSpend: number;
  averageMonthlySpend: number;
  highestMonth: { label: string; amount: number };
  lowestMonth: { label: string; amount: number };
  uberGrowthRate: number; // Growth from oldest month to newest
  allExpensesInWindow: Expense[];
}

export function getThreeMonthRollup(
  expenses: Expense[],
  viewUser: 'all' | 'me' | 'friend' = 'all',
  numberOfMonths = 3
): MultiMonthRollup {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const monthsData: MultiMonthRollup['months'] = [];
  let totalSpend = 0;
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // From oldest to newest (e.g. Month -2, Month -1, Month 0)
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const target = new Date(curYear, curMonth - i, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    let mTotal = 0;
    let uberTotal = 0;
    let diningTotal = 0;
    let groceriesTotal = 0;
    const catMap: Record<string, number> = {};

    monthExpenses.forEach((e) => {
      const eff = calculateEffectiveAmount(e, viewUser);
      mTotal += eff;
      catMap[e.category] = (catMap[e.category] || 0) + eff;
      if (e.category === 'uber') uberTotal += eff;
      if (e.category === 'dining') diningTotal += eff;
      if (e.category === 'groceries') groceriesTotal += eff;
    });

    let topCategory = 'None';
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCategory = CATEGORIES[cat as ExpenseCategory]?.name || cat;
      }
    });

    let relativeLabel = '';
    if (i === 0) relativeLabel = 'Current Month';
    else if (i === 1) relativeLabel = '1 Month Ago';
    else if (i === 2) relativeLabel = '2 Months Ago';
    else if (i === 3) relativeLabel = 'Last 3rd Month';
    else relativeLabel = `${i} Months Ago`;

    monthsData.push({
      key,
      label: `${monthNamesLong[m]} ${y}`,
      shortLabel: `${monthNamesShort[m]} ${y}`,
      relativeLabel,
      total: Number(mTotal.toFixed(2)),
      uberTotal: Number(uberTotal.toFixed(2)),
      diningTotal: Number(diningTotal.toFixed(2)),
      groceriesTotal: Number(groceriesTotal.toFixed(2)),
      topCategory,
      count: monthExpenses.length,
    });

    totalSpend += mTotal;
  }

  const averageMonthlySpend = monthsData.length > 0 ? totalSpend / monthsData.length : 0;

  let highestMonth = { label: monthsData[0]?.label || '', amount: monthsData[0]?.total || 0 };
  let lowestMonth = { label: monthsData[0]?.label || '', amount: monthsData[0]?.total || 0 };

  monthsData.forEach((m) => {
    if (m.total > highestMonth.amount) {
      highestMonth = { label: m.label, amount: m.total };
    }
    if (m.total < lowestMonth.amount) {
      lowestMonth = { label: m.label, amount: m.total };
    }
  });

  // Uber growth across window
  const oldestUber = monthsData[0]?.uberTotal || 0;
  const latestUber = monthsData[monthsData.length - 1]?.uberTotal || 0;
  let uberGrowthRate = 0;
  if (oldestUber > 0) {
    uberGrowthRate = Number((((latestUber - oldestUber) / oldestUber) * 100).toFixed(1));
  }

  // All expenses in window
  const windowStart = new Date(curYear, curMonth - (numberOfMonths - 1), 1).getTime();
  const windowEnd = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999).getTime();

  const allExpensesInWindow = expenses.filter((e) => {
    const t = new Date(e.date).getTime();
    return t >= windowStart && t <= windowEnd;
  });

  return {
    months: monthsData,
    totalSpend: Number(totalSpend.toFixed(2)),
    averageMonthlySpend: Number(averageMonthlySpend.toFixed(2)),
    highestMonth,
    lowestMonth,
    uberGrowthRate,
    allExpensesInWindow,
  };
}

