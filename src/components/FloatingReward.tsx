/**
 * FloatingReward — transient "+XP / +Or ×COMBO" burst at the tap point.
 * The dopamine layer: every quest action gets immediate spatial feedback.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RewardBurst {
  id: number;
  x: number;
  y: number;
  lines: string[];
  combo: number;
}

let burstId = 0;

/** Global event bus so any component can fire a reward burst. */
type Listener = (b: RewardBurst) => void;
const listeners = new Set<Listener>();

export function fireReward(lines: string[], e?: { clientX: number; clientY: number }, combo = 1) {
  const burst: RewardBurst = {
    id: ++burstId,
    x: e?.clientX ?? window.innerWidth / 2,
    y: e?.clientY ?? window.innerHeight / 3,
    lines,
    combo,
  };
  listeners.forEach((l) => l(burst));
}

export const FloatingRewardLayer: React.FC = () => {
  const [bursts, setBursts] = useState<RewardBurst[]>([]);

  useEffect(() => {
    const l: Listener = (b) => {
      setBursts((prev) => [...prev.slice(-4), b]);
      setTimeout(() => setBursts((prev) => prev.filter((x) => x.id !== b.id)), 1400);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -46, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute px-3 py-1.5 rounded-xl bg-obsidian/95 border border-gold/60 shadow-gold text-center"
            style={{ left: Math.min(b.x, window.innerWidth - 150), top: Math.max(60, b.y - 30) }}
          >
            {b.lines.map((line, i) => (
              <p key={i} className={`font-mono font-bold leading-tight ${i === 0 ? 'text-gold-bright text-sm' : 'text-emerald text-xs'}`}>
                {line}
              </p>
            ))}
            {b.combo >= 3 && (
              <p className="font-display text-[10px] tracking-widest text-amethyst mt-0.5">
                COMBO ×{b.combo >= 6 ? '2' : '1.5'} 🔥
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
