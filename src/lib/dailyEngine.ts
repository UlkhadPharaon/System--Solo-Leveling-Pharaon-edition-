/**
 * Daily Streak & Connection Bonus Engine
 * Tracks consecutive active days, awards escalating daily rewards,
 * and exposes an engagement state used across the app.
 */

export interface DailyStreakState {
  lastActiveDate: string | null; // YYYY-MM-DD
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  lastBonusClaimedDate: string | null;
}

export interface DailyBonusResult {
  streak: number;
  xpReward: number;
  goldReward: number;
  bonusDay: number; // 1-7 cycle position
  isMilestone: boolean;
  message: string;
}

const STORAGE_KEY = 'aura_daily_streak';

const DEFAULT_STATE: DailyStreakState = {
  lastActiveDate: null,
  currentStreak: 0,
  bestStreak: 0,
  totalActiveDays: 0,
  lastBonusClaimedDate: null,
};

export function getTodayLocal(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function getDaysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function loadStreakState(): DailyStreakState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(saved);
    return {
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : null,
      currentStreak: Number.isFinite(parsed.currentStreak) && parsed.currentStreak >= 0 ? parsed.currentStreak : 0,
      bestStreak: Number.isFinite(parsed.bestStreak) && parsed.bestStreak >= 0 ? parsed.bestStreak : 0,
      totalActiveDays: Number.isFinite(parsed.totalActiveDays) && parsed.totalActiveDays >= 0 ? parsed.totalActiveDays : 0,
      lastBonusClaimedDate: typeof parsed.lastBonusClaimedDate === 'string' ? parsed.lastBonusClaimedDate : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveStreakState(state: DailyStreakState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full / unavailable — streak continues in memory
  }
}

/**
 * Called once on app load. Registers today's activity:
 * - consecutive day -> streak + 1
 * - missed exactly one day -> streak resets to 1
 * Returns the updated state and whether a bonus is claimable today.
 */
export function registerTodayActivity(): { state: DailyStreakState; bonusAvailable: boolean } {
  const state = loadStreakState();
  const today = getTodayLocal();

  if (state.lastActiveDate === today) {
    // Already registered today; bonus claimable only once per day.
    return { state, bonusAvailable: state.lastBonusClaimedDate !== today };
  }

  let next: DailyStreakState;
  const gapDays = state.lastActiveDate ? getDaysBetween(state.lastActiveDate, today) : 0;
  if (state.lastActiveDate && gapDays === 1) {
    next = {
      ...state,
      lastActiveDate: today,
      currentStreak: state.currentStreak + 1,
      bestStreak: Math.max(state.bestStreak, state.currentStreak + 1),
      totalActiveDays: state.totalActiveDays + 1,
    };
  } else if (gapDays > 1 && consumeStreakProtectionStone()) {
    // Streak broken BUT the player holds a Pierre de Protection du Streak:
    // consume one and bridge the gap as if they had trained yesterday.
    next = {
      ...state,
      lastActiveDate: today,
      currentStreak: state.currentStreak + 2, // yesterday + today
      totalActiveDays: state.totalActiveDays + 1,
    };
    try { localStorage.setItem('aura_streak_protected_at', today); } catch {}
  } else {
    // First ever day, or streak broken without protection
    next = {
      ...state,
      lastActiveDate: today,
      currentStreak: 1,
      bestStreak: Math.max(state.bestStreak, 1),
      totalActiveDays: state.totalActiveDays + 1,
    };
  }

  saveStreakState(next);
  return { state: next, bonusAvailable: true };
}

/**
 * F3 — Streak Protection Stone. Consumes one stone from the player's
 * localStorage inventory. Returns false when none is held (caller then
 * resets the streak normally).
 */
function consumeStreakProtectionStone(): boolean {
  try {
    const raw = localStorage.getItem('aura_player_profile');
    if (!raw) return false;
    const profile = JSON.parse(raw);
    const inv: any[] = Array.isArray(profile?.inventory) ? profile.inventory : [];
    const idx = inv.findIndex((i) => i?.id === 'item-streak-stone' || i?.name === 'Pierre de Protection du Streak');
    if (idx === -1) return false;

    const item = inv[idx];
    const qty = Number(item.quantity ?? 1);
    if (qty <= 1) {
      profile.inventory = inv.filter((_, i) => i !== idx);
    } else {
      inv[idx] = { ...item, quantity: qty - 1 };
      profile.inventory = inv;
    }
    localStorage.setItem('aura_player_profile', JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

/**
 * Computes (but does not claim) the reward for the current streak day.
 */
export function computeDailyBonus(streak: number): DailyBonusResult {
  const bonusDay = ((streak - 1) % 7) + 1;
  const baseXp = 30 + (bonusDay - 1) * 15;
  const baseGold = 15 + (bonusDay - 1) * 10;
  const milestone = bonusDay === 7;
  const multiplier = milestone ? 2 : 1;

  const messages: Record<number, string> = {
    1: "Le Système vous attendait, Chasseur. Commencez la journée en force.",
    2: "Deux jours consécutifs. La discipline prend racine.",
    3: "Trois jours. Vos ombres commencent à vous suivre.",
    4: "Quatre jours. Le Système note votre constance.",
    5: "Cinq jours. Les anciens Rois observaient ainsi.",
    6: "Six jours. Un pas de plus vers la transcendance.",
    7: "SEMAINE PARFAITE ! Bénédiction Divine doublée accordée.",
  };

  return {
    streak,
    xpReward: baseXp * multiplier,
    goldReward: baseGold * multiplier,
    bonusDay,
    isMilestone: milestone,
    message: messages[bonusDay] || messages[1],
  };
}

/** Marks today's bonus as claimed. Returns the claimed reward. */
export function claimDailyBonus(): DailyBonusResult {
  const state = loadStreakState();
  const today = getTodayLocal();
  const streak = state.lastActiveDate === today ? state.currentStreak : 1;
  const bonus = computeDailyBonus(streak);
  saveStreakState({ ...state, lastBonusClaimedDate: today });
  return bonus;
}

/** True if the bonus popup should be shown on load. */
export function shouldShowDailyPopup(): boolean {
  const state = loadStreakState();
  return state.lastBonusClaimedDate !== getTodayLocal();
}
