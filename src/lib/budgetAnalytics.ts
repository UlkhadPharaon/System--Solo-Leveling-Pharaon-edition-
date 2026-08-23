/**
 * budgetAnalytics — pure aggregation helpers for the Trésorerie module.
 * All inputs/outputs are in the canonical ledger currency (XOF); conversion
 * to the display currency happens at render time via lib/fx.
 */

import type { Transaction, MoneyFlowBucket } from '../types';

export interface MonthlyPoint {
  /** Short month label, fr-FR ("janv.", "févr."…). */
  month: string;
  /** ISO year-month key (YYYY-MM). */
  key: string;
  income: number;
  expense: number;
}

/** Last `count` months (oldest first), zero-filled even without transactions. */
export function buildMonthlySeries(transactions: Transaction[], count = 6): MonthlyPoint[] {
  const now = new Date();
  const months: MonthlyPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      income: 0,
      expense: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const t of transactions) {
    // date is YYYY-MM-DD — slice avoids timezone drift from new Date(ISO).
    const point = byKey.get(t.date.slice(0, 7));
    if (!point) continue;
    if (t.type === 'income') point.income += t.amount;
    else point.expense += t.amount;
  }
  return months;
}

export interface BucketHealth {
  bucket: MoneyFlowBucket;
  label: string;
  color: string;
  allocated: number;
  spent: number;
  remaining: number;
  usedPct: number;
}

/** Per-envelope spend health, sorted by pressure (most consumed first). */
export function buildBucketHealth(
  buckets: Array<{ bucket: MoneyFlowBucket; label: string; color: string; monthlyAllocation: number }>,
  transactions: Transaction[]
): BucketHealth[] {
  return buckets
    .map((b) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.bucket === b.bucket)
        .reduce((acc, t) => acc + t.amount, 0);
      const allocated = b.monthlyAllocation;
      return {
        bucket: b.bucket,
        label: b.label,
        color: b.color,
        allocated,
        spent,
        remaining: allocated - spent,
        usedPct: allocated > 0 ? Math.min(999, Math.round((spent / allocated) * 100)) : spent > 0 ? 100 : 0,
      };
    })
    .sort((a, b) => b.usedPct - a.usedPct);
}

/** Current calendar-month flows. */
export function currentMonthFlows(transactions: Transaction[]): { income: number; expense: number } {
  const key = new Date().toISOString().slice(0, 7);
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.date.slice(0, 7) !== key) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

/**
 * Month-over-month delta of net flow (canonical units).
 * Returns null when there is no previous-month baseline yet.
 */
export function netFlowDelta(transactions: Transaction[]): number | null {
  const now = new Date();
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  let cur = 0;
  let before = 0;
  let sawPrev = false;
  for (const t of transactions) {
    const k = t.date.slice(0, 7);
    if (k === thisKey) cur += t.type === 'income' ? t.amount : -t.amount;
    else if (k === prevKey) {
      sawPrev = true;
      before += t.type === 'income' ? t.amount : -t.amount;
    }
  }
  return sawPrev ? cur - before : null;
}
