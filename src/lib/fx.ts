/**
 * FX — Real-time currency conversion engine for the Trésorerie module.
 *
 * Architecture:
 *  - Canonical ledger currency = XOF (FCFA). Every stored transaction amount
 *    lives in XOF; display conversion happens at render time.
 *  - Rates come from open.er-api.com (keyless, daily-updated ECB feed),
 *    cached in localStorage for 12h so the app stays usable offline.
 *  - A conservative hardcoded fallback table keeps conversions working when
 *    the network is unavailable (UI clearly flags it as "secours local").
 *
 * This is a module-singleton store (same pattern as lib/globalAudio):
 * components subscribe via useFx() → useSyncExternalStore.
 */

import { useSyncExternalStore } from 'react';

export interface CurrencyDef {
  code: string;
  label: string;
  symbol: string;
  /** Decimals used by this currency in everyday amounts (XOF has none). */
  decimals: number;
}

/** Currencies selectable in the Trésorerie UI. */
export const CURRENCIES: Record<string, CurrencyDef> = {
  XOF: { code: 'XOF', label: 'Franc CFA', symbol: 'FCFA', decimals: 0 },
  USD: { code: 'USD', label: 'Dollar US', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', label: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', label: 'Livre Sterling', symbol: '£', decimals: 2 },
};

export type CurrencyCode = keyof typeof CURRENCIES;

/** Ledger base — every persisted amount is denominated in this. */
export const BASE_CURRENCY: CurrencyCode = 'XOF';

const API_URL = 'https://open.er-api.com/v6/latest/XOF';
const CACHE_KEY = 'aura_fx_rates_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

/** Offline fallback — units of currency per 1 XOF (conservative approximations). */
const FALLBACK_RATES: Record<string, number> = {
  XOF: 1,
  USD: 0.00165,
  EUR: 0.00152,
  GBP: 0.0013,
};

export type FxStatus =
  | 'loading'   // fetching fresh rates
  | 'live'      // fresh fetch succeeded this session
  | 'cache'     // served from localStorage cache (fresh enough)
  | 'fallback'; // network failed — hardcoded approximation in use

export interface FxSnapshot {
  /** Units of currency X per 1 XOF. */
  rates: Record<string, number>;
  status: FxStatus;
  /** Epoch ms of the underlying rate data (fetch time), null for pure fallback. */
  updatedAt: number | null;
}

interface CacheShape {
  rates: Record<string, number>;
  fetchedAt: number;
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates: Record<string, number>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() } satisfies CacheShape));
  } catch {
    // storage full/private mode — non-fatal, session-only rates
  }
}

const cache = readCache();
let snapshot: FxSnapshot = cache
  ? {
      rates: { ...FALLBACK_RATES, ...cache.rates },
      status: Date.now() - cache.fetchedAt <= CACHE_TTL_MS ? 'cache' : 'fallback',
      updatedAt: cache.fetchedAt,
    }
  : { rates: { ...FALLBACK_RATES }, status: 'loading', updatedAt: null };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function getSnapshot(): FxSnapshot {
  return snapshot;
}

let inflight: Promise<void> | null = null;

async function fetchRates(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    snapshot = { ...snapshot, status: 'loading' };
    emit();
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
      const json = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
      if (json.result !== 'success' || !json.rates?.USD || !json.rates.EUR) throw new Error('FX payload invalide');
      const rates = { ...FALLBACK_RATES, ...json.rates };
      snapshot = { rates, status: 'live', updatedAt: Date.now() };
      writeCache(json.rates);
    } catch {
      // Network failure — keep whatever we had; mark degraded unless cached data exists.
      snapshot = {
        ...snapshot,
        status: snapshot.updatedAt ? 'fallback' : 'fallback',
      };
    } finally {
      inflight = null;
      emit();
    }
  })();
  return inflight;
}

/** Refresh if the cache is older than TTL (auto-called once at module load). */
function ensureFresh(): void {
  const stale = !snapshot.updatedAt || Date.now() - snapshot.updatedAt > CACHE_TTL_MS;
  if (stale && snapshot.status !== 'loading') void fetchRates();
}
ensureFresh();

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert an amount between currencies using the current rate table.
 * Unknown codes fall back to the hardcoded table so it never throws.
 */
export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number> = snapshot.rates): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  const fromRate = rates[from] ?? FALLBACK_RATES[from];
  const toRate = rates[to] ?? FALLBACK_RATES[to];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

/** Format an amount ALREADY expressed in `code` for display. */
export function formatInCurrency(amount: number, code: string): string {
  const def = CURRENCIES[code] ?? CURRENCIES.XOF;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  }).format(amount);
  return `${formatted} ${def.symbol}`;
}

/** Compact axis-friendly formatter (12,4 k / 1,2 M). */
export function formatCompact(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}

/** Human age of the rate data ("il y a 5 min"). */
export function formatRateAge(updatedAt: number | null): string {
  if (!updatedAt) return 'secours local';
  const mins = Math.max(1, Math.round((Date.now() - updatedAt) / 60000));
  if (mins < 60) return `maj il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  return `maj il y a ${hours} h`;
}

export interface FxApi {
  snapshot: FxSnapshot;
  /** Convert canonical-ledger (or any) amount into the given display currency. */
  convert: (amount: number, from: string, to: string) => number;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

function apiFromSnapshot(snap: FxSnapshot): FxApi {
  return {
    snapshot: snap,
    convert: (amount, from, to) => convertAmount(amount, from, to, snap.rates),
    refresh: () => fetchRates(),
    isLoading: snap.status === 'loading',
  };
}

/** Memoized API wrapper — stable identity while the underlying snapshot is unchanged. */
let cachedApi: FxApi | null = null;
let cachedApiFor: FxSnapshot | null = null;

/** Subscribe a component to the FX store. Triggers a background refresh when stale. */
export function useFx(): FxApi {
  // Side-effect-free refresh nudge: ensureFresh() already ran at module load;
  // long-lived tabs get a refresh attempt on each mount.
  ensureFresh();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (cachedApi === null || cachedApiFor !== snap) {
    cachedApi = apiFromSnapshot(snap);
    cachedApiFor = snap;
  }
  return cachedApi;
}
