/**
 * Utilities for reliable local calendar date formatting and parsing
 * without UTC timezone shifting issues.
 */

export function toLocalDateString(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr || dateStr === 'all') return 'All Dates';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const todayStr = toLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  if (dateStr === todayStr) {
    return `Today, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  if (dateStr === yesterdayStr) {
    return `Yesterday, ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFullFriendlyDate(dateStr: string): string {
  if (!dateStr || dateStr === 'all') return 'All Dates';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const todayStr = toLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const prefix = dateStr === todayStr ? 'Today · ' : dateStr === yesterdayStr ? 'Yesterday · ' : '';

  return `${prefix}${d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export function shiftDateString(dateStr: string, daysOffset: number): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + daysOffset);
  return toLocalDateString(d);
}
