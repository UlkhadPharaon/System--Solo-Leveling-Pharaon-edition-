import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Crown, Eye, Sun } from './ui/PharaohIcons';
import { motion, AnimatePresence } from 'motion/react';

interface DailyRitualProps {
  onInvokeBlessing: (xpAmount: number) => void;
}

const PROVERBS = [
  "Le secret de la sagesse est de savoir que le temps est un fleuve qui ne remonte jamais sa source.",
  "Comme le Nil nourrit la terre, que votre discipline nourrisse votre âme.",
  "Celui qui bâtit sa pyramide pierre par pierre ne craint pas la tempête de sable.",
  "Le vrai souverain ne commande pas aux hommes, il commande à ses propres doutes.",
  "Le soleil se lève pour ceux qui marchent, pas pour ceux qui attendent dans l'ombre.",
  "Votre volonté est l'obélisque qui pointe vers l'éternité.",
  "Même le plus petit scarabée peut déplacer une montagne s'il persévère.",
  "Le cœur est la balance de Maât ; gardez-le plus léger qu'une plume."
];

export const DailyRitual: React.FC<DailyRitualProps> = ({ onInvokeBlessing }) => {
  const [proverb, setProverb] = useState('');
  const [hasInvoked, setHasInvoked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PROVERBS.length;
    setProverb(PROVERBS[index]);

    const lastClaimed = localStorage.getItem('last_ritual_claim');
    if (lastClaimed === today) {
      setHasInvoked(true);
    }

    // Generate particle positions
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  const handleInvoke = () => {
    if (hasInvoked) return;

    setIsAnimating(true);
    setTimeout(() => {
      const xpReward = 25 + Math.floor(Math.random() * 25);
      onInvokeBlessing(xpReward);
      setHasInvoked(true);
      localStorage.setItem('last_ritual_claim', new Date().toDateString());
      setIsAnimating(false);
    }, 1500);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-6 md:p-8 shadow-card hover-lift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: 'var(--color-gold)',
              opacity: 0.3,
              filter: 'blur(1px)',
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.1, 0.4, 0.1],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + p.delay,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Decorative corner accents */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />
        <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-emerald) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="p-3 rounded-xl bg-panel-gold">
            <Sparkles size={22} color="var(--color-gold)" className="anim-float" />
          </div>
          <div>
            <h3 className="font-display text-sm md:text-base font-medium text-gold-bright tracking-widest uppercase">Rituel Quotidien</h3>
            <p className="text-pharaoh-subtle text-[10px] font-mono">Bénédiction matinale du Pharaon</p>
          </div>
        </motion.div>

        {/* Proverb Scroll */}
        <motion.div
          className="relative py-6 border-y border-lapis-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30">
            <Crown size={20} />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/30">
            <Crown size={20} className="rotate-180" />
          </div>
          <blockquote className="font-display text-base md:text-lg font-light italic text-pharaoh leading-relaxed text-center px-8 relative z-10">
            "{proverb}"
          </blockquote>
        </motion.div>

        {/* Invoke Button */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleInvoke}
            disabled={hasInvoked || isAnimating}
            className={`btn-press relative px-8 py-3.5 rounded-xl font-display text-xs tracking-widest flex items-center gap-3 overflow-hidden ${
              hasInvoked
                ? 'bg-panel text-pharaoh-subtle border-lapis-border'
                : 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
            } ${isAnimating ? 'animate-pulse' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
            whileHover={{ scale: hasInvoked ? 1 : 1.02 }}
          >
            {isAnimating ? (
              <>
                <motion.span
                  className="flex items-center gap-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Eye size={18} className="anim-rotate-slow" />
                  Invocation en cours...
                </motion.span>
              </>
            ) : hasInvoked ? (
              <>
                <CheckCircle size={18} />
                Bénédiction Reçue
              </>
            ) : (
              <>
                <motion.div
                  className="p-2 rounded-xl bg-obsidian/30"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame size={20} className="anim-float" />
                </motion.div>
                Invoquer la Bénédiction
              </>
            )}

            {!hasInvoked && !isAnimating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              />
            )}
          </motion.button>
        </motion.div>

        {/* XP Reward Display */}
        <AnimatePresence>
          {hasInvoked && !isAnimating && (
            <motion.div
              key="reward"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="text-center space-y-2 pt-2 border-t border-lapis-border/50"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle">
                Revenez à l'aube pour une nouvelle faveur des Dieux.
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="p-2 rounded-xl bg-panel-gold">
                  <Sparkles size={16} color="var(--color-gold)" className="anim-pop" />
                </div>
                <span className="font-display text-xl font-light text-gradient-gold">+25~50 XP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Import missing icon
import { CheckCircle } from './ui/PharaohIcons';