/**
 * Central player-progression reducer (B3).
 *
 * "Complete a quest → gain XP/gold → maybe level up" existed in ~10 copies
 * across App.tsx, SystemSoloLeveling, DomainQuestBoard, DungeonTimer and
 * NarrativeQuestsView. Drift between copies already shipped one silent bug:
 * questsCompleted was incremented NOWHERE, permanently locking the narrative
 * campaign whose chapters gate on it.
 *
 * This pure function is the single implementation. Callers spread their own
 * extra fields on top; side effects (confetti/SFX) stay with the callers.
 */

import { PlayerProfile } from '../types';
import { calculateLevelProgression, getRankAndClassForLevel } from './utils';

export interface QuestCompletionResult {
  next: PlayerProfile;
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
}

/**
 * Apply a quest reward to the player profile:
 * XP through the level engine, gold added, rank/class resynced,
 * questsCompleted +1 (the counter the narrative campaign gates on),
 * totalXP accumulated (lifetime XP gate), and a system log entry prepended.
 */
export function applyQuestCompletion(
  prev: PlayerProfile | undefined | null,
  xp: number,
  gold: number,
  sourceName: string,
): QuestCompletionResult {
  const base: PlayerProfile = prev ?? ({ logs: [] } as unknown as PlayerProfile);
  const progression = calculateLevelProgression(base.xp, base.level, base.xpToNextLevel, xp);
  const rankInfo = getRankAndClassForLevel(progression.level);

  const next: PlayerProfile = {
    ...base,
    xp: progression.xp,
    level: progression.level,
    xpToNextLevel: progression.xpToNextLevel,
    attributePoints: (base.attributePoints || 0) + progression.attributePointsGained,
    rank: rankInfo.rank,
    hunterClass: rankInfo.hunterClass,
    gold: (base.gold || 0) + gold,
    questsCompleted: (base.questsCompleted || 0) + 1,
    totalXP: (base.totalXP || 0) + xp,
    logs: [
      {
        id: `log-quest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: `[QUÊTE] « ${sourceName} » accomplie : +${xp} XP, +${gold} Or.`,
        type: 'quest',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
      ...(base.logs || []),
    ],
  };

  return {
    next,
    leveledUp: progression.leveledUp,
    levelsGained: progression.levelsGained,
    newLevel: progression.level,
  };
}

/**
 * Sync profile mirror fields from their engines' source of truth.
 *
 * The narrative campaign gates on p.streakDays, but the REAL streak lives in
 * the daily engine (aura_daily_streak) and was never written back to the
 * profile — chapter gates on streak were unreachable. Called once at boot
 * (and cheap enough to call after any streak change).
 */
export function syncProfileMirrors(
  prev: PlayerProfile | undefined | null,
  mirrors: { currentStreak: number; totalXPFromRewards?: number },
): PlayerProfile {
  const base: PlayerProfile = prev ?? ({ logs: [] } as unknown as PlayerProfile);
  return {
    ...base,
    streakDays: Math.max(base.streakDays || 0, mirrors.currentStreak || 0),
  };
}
