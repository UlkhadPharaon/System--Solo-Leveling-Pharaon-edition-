import React, { useState, useEffect } from 'react';
import { Sparkles, ScrollText, Flame } from 'lucide-react';
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

  useEffect(() => {
    // Select a random proverb based on the day to keep it consistent for 24h
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PROVERBS.length;
    setProverb(PROVERBS[index]);

    // Check localStorage if blessing was already claimed today
    const lastClaimed = localStorage.getItem('last_ritual_claim');
    if (lastClaimed === today) {
      setHasInvoked(true);
    }
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
    <div className="bg-sl-lapis/30 border border-sl-gold/20 rounded-3xl p-6 relative overflow-hidden group shadow-gold-sm">
      {/* Decorative Background Icon */}
      <ScrollText className="absolute -right-4 -bottom-4 w-32 h-32 text-sl-gold/5 rotate-12 pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sl-gold/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-sl-gold" />
          </div>
          <h3 className="text-sm font-bold text-white font-display tracking-widest uppercase">Rituel Quotidien</h3>
        </div>

        <div className="py-4 border-y border-sl-gold/10">
          <p className="text-sm text-sl-gold-light italic font-serif leading-relaxed text-center px-4">
            "{proverb}"
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleInvoke}
            disabled={hasInvoked || isAnimating}
            className={`
              relative px-6 py-2.5 rounded-xl font-display text-xs tracking-widest flex items-center gap-2 transition-all overflow-hidden
              ${hasInvoked 
                ? 'bg-sl-primary/40 border border-sl-gold/10 text-sl-gold/40' 
                : 'bg-sl-gold text-sl-primary hover:scale-105 shadow-gold active:scale-95'}
              ${isAnimating ? 'animate-pulse' : ''}
            `}
          >
            {isAnimating ? (
              <>Invocation en cours...</>
            ) : hasInvoked ? (
              <>Bénédiction Reçue</>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-current" />
                Invoquer la Bénédiction
              </>
            )}
            
            {!hasInvoked && !isAnimating && (
              <motion.div 
                className="absolute inset-0 bg-white/20 -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            )}
          </button>
        </div>
        
        {hasInvoked && !isAnimating && (
          <p className="text-[10px] text-center text-sl-gold-light/40 font-display">
            Revenez à l'aube pour une nouvelle faveur des Dieux.
          </p>
        )}
      </div>
    </div>
  );
};
