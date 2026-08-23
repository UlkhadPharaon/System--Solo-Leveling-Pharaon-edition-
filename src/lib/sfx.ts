/**
 * UI Sound Engine — real Solo Leveling SFX, preloaded and pooled.
 *
 * All sounds derive from the user's "System - Pop Up" effect:
 *   system-popup  1.57s  the authentic System notification (popups, level-up window)
 *   levelup       1.20s  pitch-down variant for big moments
 *   ui-success     0.90s  pitch-up variant (quest complete, reward claimed)
 *   ui-tap         0.55s  short soft variant (+1 steps, toggles)
 *   ui-tick        0.40s  fastest chip (chips, small confirmations)
 *
 * Design rules:
 *  - WebAudio pool: zero latency on repeat taps, no GC hitches
 *  - respects the global mute + reduced-sfx preference
 *  - never blocks or throws: sounds are garnish, not critical path
 */

export type UISound = 'system-popup' | 'levelup' | 'ui-success' | 'ui-tap' | 'ui-tick';

const SRC: Record<UISound, string> = {
  'system-popup': '/sounds/system-popup.webm',
  'levelup': '/sounds/levelup.webm',
  'ui-success': '/sounds/ui-success.webm',
  'ui-tap': '/sounds/ui-tap.webm',
  'ui-tick': '/sounds/ui-tick.webm',
};

const MUTE_KEY = 'aura_sfx_muted';
const POOL_SIZE = 4;

const buffers = new Map<UISound, AudioBuffer[]>();
const cursors = new Map<UISound, number>();
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let decodeFailed = false;

function sfxMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setSfxMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, String(muted));
}

export function isSfxMuted(): boolean {
  return sfxMuted();
}

function ensureCtx(): AudioContext | null {
  if (decodeFailed) return null;
  try {
    if (!ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    decodeFailed = true;
    return null;
  }
}

/** Decode all SFX once (called lazily on first user gesture). */
async function prime(): Promise<void> {
  const c = ensureCtx();
  if (!c) return;
  const jobs = (Object.keys(SRC) as UISound[])
    .filter((k) => !buffers.has(k))
    .map(async (k) => {
      try {
        const res = await fetch(SRC[k]);
        if (!res.ok) throw new Error(String(res.status));
        const buf = await res.arrayBuffer();
        const decoded = await c.decodeAudioData(buf);
        // Small pool per sound → overlapping plays without restart latency.
        buffers.set(k, Array.from({ length: POOL_SIZE }, () => decoded));
      } catch {
        // A missing file just means that sound stays silent.
        buffers.set(k, []);
      }
    });
  await Promise.all(jobs);
}

let priming: Promise<void> | null = null;
export function primeSfx(): Promise<void> {
  priming ??= prime();
  return priming;
}

/**
 * Play a UI sound. Safe to call anywhere; no-ops when muted/unavailable.
 * `volume` scales this hit only (0..1).
 */
export function playSfx(sound: UISound, volume = 1): void {
  if (sfxMuted()) return;
  try {
    const c = ensureCtx();
    if (!c || !buffers.has(sound)) {
      // Not primed yet (first gesture) — prime now; next call will sound.
      void primeSfx();
      return;
    }
    const pool = buffers.get(sound)!;
    if (pool.length === 0) return;
    const idx = (cursors.get(sound) ?? 0) % pool.length;
    cursors.set(sound, idx + 1);

    const source = c.createBufferSource();
    source.buffer = pool[idx];
    const g = c.createGain();
    g.gain.value = Math.max(0, Math.min(1, volume)) * 0.85;
    source.connect(g).connect(masterGain!);
    source.start();
  } catch {
    /* audio must never break an action */
  }
}
