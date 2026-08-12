import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Flame, Timer, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { DungeonBoss, PlayerProfile } from '../types';

interface DungeonTimerProps {
  dungeon: DungeonBoss;
  player: PlayerProfile;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onUpdateDungeons: React.Dispatch<React.SetStateAction<DungeonBoss[]>>;
  onTriggerVictoryConfetti: () => void;
  onClose: () => void;
}

export const DungeonTimer: React.FC<DungeonTimerProps> = ({
  dungeon,
  player,
  onUpdatePlayer,
  onUpdateDungeons,
  onTriggerVictoryConfetti,
  onClose
}) => {
  const [focusDuration, setFocusDuration] = useState<number>(25 * 60); // 25 mins base
  const [timeLeft, setTimeLeft] = useState<number>(focusDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(focusDuration);
  }, [focusDuration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleVictory();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleFlee = () => {
    setIsRunning(false);
    // Inflict penalty damage to the player
    onUpdatePlayer(prev => {
      const damage = 25;
      const newHp = Math.max(1, prev.hp - damage);
      const log = {
        id: `flee-log-${Date.now()}`,
        text: `[FUITE] Vous avez abandonné le défi du Tombeau « ${dungeon.title} ». Vous subissez ${damage} dégâts physiques.`,
        type: 'expense' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      return {
        ...prev,
        hp: newHp,
        logs: [log, ...prev.logs]
      };
    });
    alert(`Vous fuyez le tombeau ! La colère du gardien s'est abattue sur vous (-25 HP).`);
    onClose();
  };

  const handleVictory = () => {
    setIsRunning(false);
    setHasFinished(true);
    onTriggerVictoryConfetti();

    // Double/multiplied rewards
    const xpBonus = Math.floor(dungeon.xpReward * 1.5);
    const goldBonus = Math.floor(dungeon.goldReward * 1.5);

    // Pick a random crafting material to drop
    const materials = [
      { id: 'm_lapis', name: 'Lapis Pur Divin' },
      { id: 'm_gold', name: 'Éclat d’Or Royal' },
      { id: 'm_linen', name: 'Tissu Sacré d’Osiris' },
      { id: 'm_rune', name: 'Rune sacrée runique' }
    ];
    const drop = materials[Math.floor(Math.random() * materials.length)];

    onUpdateDungeons(prev => prev.map(d => d.id === dungeon.id ? { ...d, isDefeated: true } : d));

    onUpdatePlayer(prev => {
      // Add drop to inventory
      const updatedInv = [...prev.inventory];
      const existing = updatedInv.find(item => item.id === drop.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        updatedInv.push({
          id: drop.id,
          name: drop.name,
          type: 'material',
          rarity: 'S',
          description: 'Matériau sacré pour forger des reliques égyptiennes.',
          goldValue: 100,
          iconName: 'Package',
          quantity: 1
        });
      }

      const log = {
        id: `vic-chron-${Date.now()}`,
        text: `[CHRONO NETTOYÉ] FOCUS SUPRÊME ! Vaincu le Boss ${dungeon.bossName}. +${xpBonus} XP, +${goldBonus} Or, Obtenu : 1x ${drop.name}.`,
        type: 'loot' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      let newXp = prev.xp + xpBonus;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let leveledUp = false;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        leveledUp = true;
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: leveledUp ? prev.attributePoints + 5 : prev.attributePoints,
        inventory: updatedInv,
        logs: [log, ...prev.logs]
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020914]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-sl-primary/95 border border-sl-gold max-w-md w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-gold relative overflow-hidden">
        
        {/* Shimmer Effect */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sl-gold/0 via-sl-gold to-sl-gold/0 animate-pulse" />

        <div className="text-center space-y-2">
          <span className="text-[10px] text-sl-gold font-display tracking-widest uppercase">
            DÉFI DU CHRONOTOMBEAU
          </span>
          <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide">
            {dungeon.title}
          </h3>
          <p className="text-xs text-red-400 font-serif italic flex items-center justify-center gap-1">
            Garder le focus pour vaincre : {dungeon.bossName}
          </p>
        </div>

        {hasFinished ? (
          <div className="space-y-4 text-center py-6">
            <Sparkles className="w-12 h-12 text-sl-gold mx-auto animate-bounce" />
            <h4 className="font-bold text-white font-display text-md uppercase">VICTOIRE SUPRÊME !</h4>
            <p className="text-xs text-slate-400 font-serif italic">
              Vous avez complété votre séance de focus de manière royale et banni le mal égyptien. Les récompenses doublées ont été ajoutées à vos coffres.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-sl-gold text-sl-primary rounded-xl font-display text-xs tracking-widest uppercase shadow-gold-sm"
            >
              RÉCLAMER ET RETOURNER
            </button>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            {/* Countdown circular display */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer SVG circle */}
              <svg className="absolute w-full h-full rotate-270">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#051428"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#D4AF37"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="502"
                  strokeDashoffset={502 - (502 * (timeLeft / focusDuration))}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-3xl font-bold font-mono text-white tracking-widest">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[9px] text-sl-gold font-display uppercase tracking-widest mt-1">
                  {isRunning ? 'FOCUS ACTIF' : 'PRÊT'}
                </div>
              </div>
            </div>

            {/* Quick selectors (only before starting) */}
            {!isRunning && (
              <div className="flex justify-center gap-2 w-full max-w-xs">
                {[
                  { label: '25 min', value: 25 * 60 },
                  { label: '45 min', value: 45 * 60 },
                  { label: '10 sec (Test)', value: 10 }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFocusDuration(opt.value)}
                    className={`flex-1 py-1 px-2 text-[10px] rounded-lg border font-mono ${
                      focusDuration === opt.value
                        ? 'bg-sl-gold text-sl-primary border-sl-gold font-bold'
                        : 'bg-sl-primary/60 border-sl-gold/15 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Core control buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={handleStartStop}
                className="flex-1 py-3 bg-sl-gold text-sl-primary rounded-xl font-display text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-gold transition-all"
              >
                {isRunning ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> PAUSE
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> COMMENCER
                  </>
                )}
              </button>

              <button
                onClick={handleFlee}
                className="flex-1 py-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 rounded-xl font-display text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4" /> FUIR LE TOMBEAU
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500 font-serif italic max-w-xs leading-relaxed">
              Quitter le focus, minimiser l'application ou fuir prématurément le tombeau rompra l'incantation, vous infligeant de lourdes blessures physiques.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
