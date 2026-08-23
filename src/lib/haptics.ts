/**
 * Haptic feedback (Android Chrome; silently ignored elsewhere).
 * Patterns stay SHORT — a buzz on every tap is worse than none.
 *
 *  tap    [8]          light confirmation (checkbox, +1 quest step)
 *  success[10,40,18]  double-pulse (quest completed, reward claimed)
 *  levelup [30,50,30,50,60] heavy pattern (level-up, rank-up)
 */
export type HapticPattern = 'tap' | 'success' | 'levelup';

const PATTERNS: Record<HapticPattern, number[]> = {
  tap: [8],
  success: [10, 40, 18],
  levelup: [30, 50, 30, 50, 60],
};

export function haptic(pattern: HapticPattern = 'tap'): void {
  try {
    // Only fire when the document has user-activation context (a real gesture
    // triggered the call) and the device supports vibration.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    /* never let haptics break an action */
  }
}
