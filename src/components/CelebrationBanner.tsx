import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, Sparkles, X, PartyPopper } from 'lucide-react';
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
          className={`relative overflow-hidden rounded-md border p-4 md:p-5 shadow-2xl backdrop-blur-md transition-all ${
            isTasksComplete
              ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-amber-950/90 border-emerald-500/60 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-violet-950/90 via-slate-900/95 to-amber-950/90 border-cyan shadow-gold/20'
          }`}
        >
          {/* Animated top shimmer bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-gold to-violet-400 animate-pulse" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  isTasksComplete
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-500/20 border-cyan text-amber-300'
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
                    className={`mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-xl border ${
                      isTasksComplete
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {isTasksComplete ? 'Étape Franchie' : 'Victoire Débloquée'}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>

                <h3 className="serif text-lg font-normal italic text-white leading-snug">
                  {info.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {info.message}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/10">
                  <button
                    onClick={handleReTrigger}
                    className="mono text-[10px] tracking-wide font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                  >
                    <PartyPopper className="w-3.5 h-3.5" />
                    Relancer le Confetti
                  </button>
                  <span className="text-slate-600">•</span>
                  <span className="mono text-[10px] text-slate-400">
                    Fermeture automatique...
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-xl bg-black/40 hover:bg-black/70 border border-soft text-slate-400 hover:text-white transition-colors"
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
