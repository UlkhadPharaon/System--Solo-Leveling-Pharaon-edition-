import React, { useState, useEffect, useRef } from 'react';
import { playSfx } from '../lib/sfx';
import { Play, Square, Flame, Timer, ShieldAlert, Sparkles } from './ui/PharaohIcons';
import { motion } from 'motion/react';
import { DungeonBoss, PlayerProfile } from '../types';
import { calculateLevelProgression, getRankAndClassForLevel } from '../lib/utils';

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
    playSfx('ui-tick', 0.6);
    // Inflict penalty damage to the player
    onUpdatePlayer(prev => {
      const damage = 25;
      const currentHp = prev?.hp || 100;
      const newHp = Math.max(1, currentHp - damage);
      const log = {
        id: `flee-log-${Date.now()}`,
        text: `[FUITE] Vous avez abandonné le défi du Tombeau « ${dungeon.title} ». Vous subissez ${damage} dégâts physiques.`,
        type: 'penalty' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      return {
        ...prev,
        hp: newHp,
        logs: [log, ...(prev?.logs || [])]
      };
    });

    onClose();
  };

  const handleVictory = () => {
    setIsRunning(false);
    setHasFinished(true);
    onTriggerVictoryConfetti();
    playSfx('levelup');

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
      const updatedInv = [...(prev?.inventory || [])];
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

      const progression = calculateLevelProgression(prev?.xp, prev?.level, prev?.xpToNextLevel, xpBonus);
      const rankInfo = getRankAndClassForLevel(progression.level);

      return {
        ...prev,
        xp: progression.xp,
        level: progression.level,
        xpToNextLevel: progression.xpToNextLevel,
        attributePoints: (prev?.attributePoints || 0) + progression.attributePointsGained,
        rank: rankInfo.rank,
        hunterClass: rankInfo.hunterClass,
        inventory: updatedInv,
        logs: [log, ...(prev?.logs || [])]
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-lapis/95 border border-gold max-w-md w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-gold relative overflow-hidden anim-in">
        
        {/* Shimmer Effect */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold/0 via-gold to-gold/0 animate-pulse" />

        <div className="text-center space-y-2">
          <span className="font-mono text-[10px] text-gold tracking-widest uppercase">
            DÉFI DU CHRONOTOMBEAU
          </span>
          <h3 className="font-display text-xl font-bold text-pharaoh uppercase tracking-wide">
            {dungeon.title}
          </h3>
          <p className="font-mono text-xs text-blood italic flex items-center justify-center gap-1">
            Garder le focus pour vaincre : {dungeon.bossName}
          </p>
        </div>

        {hasFinished ? (
          <div className="space-y-4 text-center py-6">
            <Sparkles className="w-12 h-12 text-gold mx-auto animate-bounce" />
            <h4 className="font-display font-bold text-pharaoh text-base uppercase tracking-wide">VICTOIRE SUPRÊME !</h4>
            <p className="text-xs text-pharaoh-muted italic">
              Vous avez complété votre séance de focus de manière royale et banni le mal égyptien. Les récompenses doublées ont été ajoutées à vos coffres.
            </p>
            <button
              onClick={onClose}
              className="btn-press px-6 py-2 bg-gold text-obsidian rounded-xl font-display text-xs tracking-widest uppercase shadow-gold"
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
                  stroke="var(--color-obsidian-elevated)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="var(--color-gold)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="502"
                  strokeDashoffset={502 - (502 * (timeLeft / focusDuration))}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="text-center z-10">
                <div className="font-mono text-3xl font-bold text-gradient-gold tracking-widest tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="font-mono text-[9px] text-gold uppercase tracking-widest mt-1">
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
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFocusDuration(opt.value)}
                    className={`btn-press flex-1 py-1 px-2 font-mono text-[10px] rounded-lg border ${
                      focusDuration === opt.value
                        ? 'bg-gold text-obsidian border-gold font-bold'
                        : 'bg-obsidian-elevated border-gold-dim/30 text-pharaoh-muted hover:text-pharaoh'
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
                className="btn-press flex-1 py-3 bg-gradient-to-r from-gold to-gold-bright text-obsidian rounded-xl font-display text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-gold transition-all"
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
                className="btn-press flex-1 py-3 bg-blood/20 hover:bg-blood/40 text-blood border border-blood/40 rounded-xl font-display text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4" /> FUIR LE TOMBEAU
              </button>
            </div>

            <p className="text-[10px] text-center text-pharaoh-subtle italic max-w-xs leading-relaxed">
              Quitter le focus, minimiser l'application ou fuir prématurément le tombeau rompra l'incantation, vous infligeant de lourdes blessures physiques.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
