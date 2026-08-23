/**
 * SystemWindow — the iconic Solo Leveling notification frame.
 * Cyan-bordered glass panel that "types" its text like the System speaking,
 * with an optional UI sound. Use it for level-ups, quest completions,
 * daily briefings — any moment the "System" addresses the player.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSfx } from '../lib/sfx';

export interface SystemMessage {
  id: number;
  title: string;          // ex. "NOTIFICATION"
  lines: string[];        // ex. ["Vous avez complété la quête quotidienne.", "+100 XP  +50 Or"]
  tone?: 'info' | 'reward' | 'warning';
}

let msgId = 0;
type Listener = (m: SystemMessage) => void;
const listeners = new Set<Listener>();

/** Fire a System window from anywhere. */
export function announceSystem(lines: string[], title = 'NOTIFICATION', tone: SystemMessage['tone'] = 'info') {
  const m: SystemMessage = { id: ++msgId, title, lines, tone };
  listeners.forEach((l) => l(m));
}

/**
 * The authentic Solo Leveling "System pop-up" sound (user-provided MP3,
 * served as /sounds/system-popup.webm). Reward moments get the levelup cut.
 */
function playSystemPing(tone: SystemMessage['tone']) {
  playSfx(tone === 'reward' ? 'levelup' : 'system-popup', 1);
}

export const SystemWindowLayer: React.FC = () => {
  const [current, setCurrent] = useState<SystemMessage | null>(null);
  const [typedLines, setTypedLines] = useState<string[]>([]);

  useEffect(() => {
    const l: Listener = (m) => {
      setCurrent(m);
      setTypedLines([]);
      playSystemPing(m.tone);
      // Typewriter reveal, line by line (fast: 14ms/char).
      let li = 0;
      m.lines.forEach((line) => {
        for (let c = 1; c <= line.length; c++) {
          const snapshot = line.slice(0, c);
          setTimeout(() => {
            setTypedLines((prev) => {
              const next = [...prev];
              next[li] = snapshot;
              return next;
            });
          }, (li * line.length + c) * 14);
        }
        li += 1;
      });
      setTimeout(() => setCurrent(null), 4200);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[80] flex justify-center px-3">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scaleX: 0.7, y: -12 }}
            animate={{ opacity: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.05, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm relative"
          >
            {/* SL-style cyan glass frame */}
            <div
              className="relative rounded-lg border-2 shadow-[0_0_30px_rgba(56,189,248,0.35)] overflow-hidden backdrop-blur-md"
              style={{
                borderColor: current.tone === 'reward' ? '#F0C42D' : current.tone === 'warning' ? '#C0392B' : '#38BDF8',
                background: 'linear-gradient(160deg, rgba(8,25,45,0.96), rgba(4,12,24,0.98))',
              }}
            >
              {/* Corner accents — the System's signature brackets */}
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos) => (
                <span key={pos} className={`absolute w-3 h-3 ${pos}`}
                  style={{ borderColor: current.tone === 'reward' ? '#F0C42D' : '#38BDF8' }} />
              ))}

              <div className="px-4 pt-3 pb-3.5">
                <p className={`font-mono text-[10px] tracking-[0.35em] text-center mb-2 ${
                  current.tone === 'reward' ? 'text-gold-bright' : current.tone === 'warning' ? 'text-blood' : 'text-sky-400'
                }`}>
                  [ {current.title} ]
                </p>
                {current.lines.map((line, i) => (
                  <p key={i} className="font-mono text-xs text-pharaoh leading-relaxed min-h-[1.2em]">
                    {typedLines[i] ?? ''}
                  </p>
                ))}
              </div>

              {/* Scanline sweep */}
              <motion.div
                className="absolute inset-x-0 h-px bg-sky-400/40"
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 0.9, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
