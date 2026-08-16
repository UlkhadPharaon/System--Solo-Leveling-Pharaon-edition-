import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Sparkles, Gift, Coins, Zap, Crown } from './ui/PharaohIcons';
import { computeDailyBonus, claimDailyBonus } from '../lib/dailyEngine';

interface DailyBonusModalProps {
  streak: number;
  onClaim: (xp: number, gold: number) => void;
  onClose: () => void;
  personalMotto?: string;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ streak, onClaim, onClose, personalMotto }) => {
  const bonus = computeDailyBonus(Math.max(1, streak));
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    const result = claimDailyBonus();
    setClaimed(true);
    onClaim(result.xpReward, result.goldReward);
    setTimeout(onClose, 2200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className={`relative w-full max-w-sm rounded-2xl overflow-hidden border ${
          bonus.isMilestone ? 'border-sl-gold shadow-[0_0_50px_rgba(212,175,55,0.4)]' : 'border-gold/40 shadow-gold'
        } bg-obsidian-elevated text-center`}
      >
        {/* Glow header */}
        <div className={`px-6 pt-8 pb-6 ${bonus.isMilestone ? 'bg-gradient-to-b from-sl-gold/25 to-transparent anim-glow' : 'bg-gradient-to-b from-gold/15 to-transparent'}`}>
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', damping: 12 }}
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-obsidian/40 border border-gold/20"
          >
            {bonus.isMilestone ? <Crown className="w-8 h-8 text-sl-gold anim-float" /> : <Flame className="w-8 h-8 text-gold-bright anim-float" />}
          </motion.div>

          <h3 className={`mt-4 font-display text-xl tracking-wider ${bonus.isMilestone ? 'text-shimmer' : 'text-pharaoh'}`}>
            {bonus.isMilestone ? 'SEMAINE PARFAITE !' : 'CONNEXION QUOTIDIENNE'}
          </h3>
          <p className="mt-2 text-xs text-pharaoh-muted leading-relaxed px-2">{bonus.message}</p>
          {personalMotto && (
            <p className="mt-2 font-display italic text-[11px] text-gold-bright/80">« {personalMotto} »</p>
          )}

          {/* Streak counter */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/40">
            <Flame className="w-4 h-4 text-gold" />
            <span className="font-mono text-sm font-bold text-gold-bright">{streak} jour{streak > 1 ? 's' : ''} de suite</span>
          </div>
        </div>

        {/* 7-day reward track */}
        <div className="px-5 pb-2">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const day = i + 1;
              const isPast = day < bonus.bonusDay;
              const isCurrent = day === bonus.bonusDay;
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-center ${
                    isCurrent
                      ? 'bg-sl-gold/20 border-sl-gold anim-glow'
                      : isPast
                        ? 'bg-emerald/10 border-emerald/30'
                        : 'bg-lapis/30 border-lapis opacity-50'
                  }`}
                >
                  <span className="font-mono text-[9px] text-pharaoh-subtle">J{day}</span>
                  {day === 7 ? <Crown className="w-3.5 h-3.5 text-sl-gold" /> : <Gift className={`w-3.5 h-3.5 ${isPast ? 'text-emerald' : 'text-pharaoh-subtle'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards */}
        <div className="px-6 py-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-sapphire" />
            <span className="font-mono text-lg font-bold text-sapphire">+{bonus.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-sl-gold" />
            <span className="font-mono text-lg font-bold text-gold-bright">+{bonus.goldReward} Or</span>
          </div>
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          {claimed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-3 rounded-xl bg-emerald/20 border border-emerald/50 text-emerald font-mono text-sm font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> RÉCOMPENSE REÇUE
            </motion.div>
          ) : (
            <button
              onClick={handleClaim}
              className={`btn-press w-full py-3.5 rounded-xl font-mono text-sm font-bold tracking-wider ${
                bonus.isMilestone
                  ? 'bg-gradient-to-r from-sl-gold-dark to-sl-gold text-black'
                  : 'bg-gradient-to-r from-gold-dim via-gold to-gold-bright text-inverse'
              } shadow-gold`}
            >
              RÉCLAMER LA BÉNÉDICTION
            </button>
          )}
          <button onClick={onClose} className="mt-3 text-[11px] text-pharaoh-subtle hover:text-pharaoh-muted transition-colors font-mono uppercase tracking-wider">
            {claimed ? 'Fermer' : 'Plus tard'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
