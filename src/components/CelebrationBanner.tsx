import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, Sparkles, X, PartyPopper } from './ui/PharaohIcons';
import { triggerVictoryConfetti, triggerAllTasksCompletedConfetti } from '../lib/confetti';

export interface CelebrationInfo {
  show: boolean;
  title: string;
  message: string;
  type: 'tasks_complete' | 'victory';
}

interface CelebrationBannerProps {
  info: CelebrationInfo | null;
  onClose: () => void;
}

export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({ info, onClose }) => {
  useEffect(() => {
    if (info?.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [info, onClose]);

  if (!info || !info.show) return null;

  const isTasksComplete = info.type === 'tasks_complete';

  const handleReTrigger = () => {
    if (isTasksComplete) {
      triggerAllTasksCompletedConfetti();
    } else {
      triggerVictoryConfetti();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-xl"
      >
        <div
          className={`relative overflow-hidden rounded-xl border p-4 md:p-5 shadow-card-hover backdrop-blur-md transition-all ${
            isTasksComplete
              ? 'bg-gradient-to-r from-emerald/30 via-obsidian-elevated to-gold/15 border-emerald/60'
              : 'bg-gradient-to-r from-amethyst/30 via-obsidian-elevated to-gold/15 border-gold'
          }`}
        >
          {/* Animated top shimmer bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald via-gold to-amethyst animate-pulse" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  isTasksComplete
                    ? 'bg-emerald/20 border-emerald/50 text-emerald'
                    : 'bg-gold/20 border-gold text-gold-bright'
                }`}
              >
                {isTasksComplete ? (
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                ) : (
                  <Trophy className="w-6 h-6 animate-pulse" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-xl border ${
                      isTasksComplete
                        ? 'bg-emerald/20 border-emerald/40 text-emerald'
                        : 'bg-gold/20 border-gold/40 text-gold-bright'
                    }`}
                  >
                    {isTasksComplete ? 'Étape Franchie' : 'Victoire Débloquée'}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-gold-bright" />
                </div>

                <h3 className="font-display text-lg font-normal tracking-wide text-shimmer leading-snug">
                  {info.title}
                </h3>
                <p className="text-xs text-pharaoh-muted mt-1 leading-relaxed">
                  {info.message}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-lapis">
                  <button
                    onClick={handleReTrigger}
                    className="font-mono text-[10px] tracking-wide font-medium text-gold hover:text-gold-bright flex items-center gap-1.5 transition-colors"
                  >
                    <PartyPopper className="w-3.5 h-3.5" />
                    Relancer le Confetti
                  </button>
                  <span className="text-pharaoh-subtle">•</span>
                  <span className="font-mono text-[10px] text-pharaoh-muted">
                    Fermeture automatique...
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-press p-1 rounded-xl bg-obsidian/40 hover:bg-obsidian/70 border border-lapis text-pharaoh-muted hover:text-pharaoh transition-colors"
              title="Fermer la bannière"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
