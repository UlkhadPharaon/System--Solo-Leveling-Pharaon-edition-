import React from 'react';
import { motion } from 'motion/react';
import { Star, Sparkles, Crown, Skull, Dragon, Wolf, Medal, Shield, Target, Zap, Flame, type PharaohIcon } from './PharaohIcons';
import type { HunterRank } from '../../types';

// Superset of the profile-side HunterRank: saved profiles may carry the French
// 'Pharaon' spelling, while the XP ladder below uses 'Pharaoh'. Both must render.
export type Rank =
  | HunterRank
  | 'Pharaoh' | 'ShadowMonarch' | 'DragonKnight' | 'WolfPack';

export interface RankInfo {
  rank: Rank;
  label: string;
  color: string;
  glowColor: string;
  icon: PharaohIcon;
  badgeImage?: string;
  description: string;
  xpThreshold: number;
}

/** Rank definitions matching Solo Leveling progression */
export const RANK_DEFINITIONS: Record<Rank, RankInfo> = {
  E: {
    rank: 'E',
    label: 'E-Rank Hunter',
    color: '#6B7280',
    glowColor: 'rgba(107, 114, 128, 0.4)',
    icon: Medal,
    badgeImage: '/UI element and references/badge rang E.png',
    description: 'Awakening... The System has noticed you.',
    xpThreshold: 0,
  },
  D: {
    rank: 'D',
    label: 'D-Rank Hunter',
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.4)',
    icon: Shield,
    badgeImage: '/UI element and references/badge rand D.png',
    description: 'First steps into the dungeon.',
    xpThreshold: 500,
  },
  C: {
    rank: 'C',
    label: 'C-Rank Hunter',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: Target,
    badgeImage: '/UI element and references/badge ranc C.png',
    description: 'Gaining recognition. Quests grow harder.',
    xpThreshold: 2000,
  },
  B: {
    rank: 'B',
    label: 'B-Rank Hunter',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    icon: Zap,
    badgeImage: '/UI element and references/badge rang B.png',
    description: 'Elite territory. Shadows stir.',
    xpThreshold: 5000,
  },
  A: {
    rank: 'A',
    label: 'A-Rank Hunter',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    icon: Flame,
    badgeImage: '/UI element and references/badge rang A.png',
    description: 'National-level threat. Guilds court you.',
    xpThreshold: 12000,
  },
  S: {
    rank: 'S',
    label: 'S-Rank Hunter',
    color: '#D4A81E',
    glowColor: 'rgba(212, 168, 30, 0.6)',
    icon: Star,
    badgeImage: '/UI element and references/badge rang S.png',
    description: 'Walking calamity. Nations tremble.',
    xpThreshold: 25000,
  },
  Pharaoh: {
    rank: 'Pharaoh',
    label: 'Pharaoh',
    color: '#F0C42D',
    glowColor: 'rgba(240, 196, 45, 0.7)',
    icon: Crown,
    badgeImage: '/UI element and references/badge rang Pharaon.png',
    description: 'Ruler of the System. The throne is yours.',
    xpThreshold: 50000,
  },
  // French spelling stored in player profiles (getRankAndClassForLevel) —
  // same visuals as 'Pharaoh' so legacy saves render identically.
  Pharaon: {
    rank: 'Pharaon',
    label: 'Pharaon',
    color: '#F0C42D',
    glowColor: 'rgba(240, 196, 45, 0.7)',
    icon: Crown,
    badgeImage: '/UI element and references/badge rang Pharaon.png',
    description: 'Ruler of the System. The throne is yours.',
    xpThreshold: 50000,
  },
  ShadowMonarch: {
    rank: 'ShadowMonarch',
    label: 'Shadow Monarch',
    color: '#1F2937',
    glowColor: 'rgba(31, 41, 55, 0.6)',
    icon: Skull,
    badgeImage: '/UI element and references/special soldier assasin.png',
    description: 'Arise. Your army awaits.',
    xpThreshold: 100000,
  },
  DragonKnight: {
    rank: 'DragonKnight',
    label: 'Dragon Knight',
    color: '#C0392B',
    glowColor: 'rgba(192, 57, 43, 0.6)',
    icon: Dragon,
    badgeImage: '/UI element and references/special monture dragon.png',
    description: 'Mount the skies. Fire follows.',
    xpThreshold: 200000,
  },
  WolfPack: {
    rank: 'WolfPack',
    label: 'Wolf Pack Leader',
    color: '#4B5563',
    glowColor: 'rgba(75, 85, 99, 0.5)',
    icon: Wolf,
    badgeImage: '/UI element and references/special soldier Wolf.png',
    description: 'The pack hunts as one.',
    xpThreshold: 300000,
  },
};

const RANK_ORDER: Rank[] = [
  'E', 'D', 'C', 'B', 'A', 'S',
  'Pharaoh', 'ShadowMonarch', 'DragonKnight', 'WolfPack',
];

/** Calculate rank from total XP */
export function getRankFromXP(xp: number): Rank {
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    if (xp >= RANK_DEFINITIONS[RANK_ORDER[i]].xpThreshold) {
      return RANK_ORDER[i];
    }
  }
  return 'E';
}

/** Get next rank and progress */
export function getRankProgress(xp: number): { current: RankInfo; next: RankInfo | null; progress: number } {
  const currentRank = getRankFromXP(xp);
  const current = RANK_DEFINITIONS[currentRank];
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  const next = currentIndex < RANK_ORDER.length - 1 ? RANK_DEFINITIONS[RANK_ORDER[currentIndex + 1]] : null;

  if (!next) return { current, next: null, progress: 100 };

  const progress = ((xp - current.xpThreshold) / (next.xpThreshold - current.xpThreshold)) * 100;
  return { current, next, progress: Math.min(100, Math.max(0, progress)) };
}

/** Small inline badge — for lists, headers, compact spaces */
export interface RankBadgeInlineProps {
  rank: Rank;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function RankBadgeInline({
  rank,
  size = 'sm',
  showLabel = true,
  className = '',
}: RankBadgeInlineProps) {
  const info = RANK_DEFINITIONS[rank];
  const sizeMap = { xs: 16, sm: 20, md: 28 };
  const iconSize = sizeMap[size];
  const gap = size === 'xs' ? 1 : size === 'sm' ? 2 : 3;

  return (
    <span
      className={`inline-flex items-center gap-${gap} font-display font-medium ${className}`}
      style={{ color: info.color }}
    >
      <info.icon
        size={iconSize}
        className="flex-shrink-0"
        style={{
          filter: `drop-shadow(0 0 4px ${info.glowColor})`,
          animation: 'glowPulse 2.5s ease-in-out infinite',
        }}
      />
      {showLabel && (
        <span className="text-[10px] uppercase tracking-widest" style={{ fontSize: size === 'xs' ? '8px' : size === 'sm' ? '10px' : '12px' }}>
          {rank}
        </span>
      )}
    </span>
  );
}

/** Medium card badge — for profile, dashboards */
export interface RankBadgeCardProps {
  rank: Rank;
  xp?: number;
  showProgress?: boolean;
  className?: string;
}

export function RankBadgeCard({
  rank,
  xp = 0,
  showProgress = true,
  className = '',
}: RankBadgeCardProps) {
  const info = RANK_DEFINITIONS[rank];
  const { current, next, progress } = getRankProgress(xp);

  return (
    <div
      className={`bg-panel rounded-2xl p-5 relative overflow-hidden hover-lift ${className}`}
      style={{
        borderColor: info.color,
        boxShadow: `0 0 30px ${info.glowColor}, 0 4px 24px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${info.glowColor} 0%, transparent 70%)`,
          opacity: 0.15,
        }}
      />

      {/* Rank badge image if available */}
      {info.badgeImage && (
        <div className="absolute top-4 right-4 opacity-20 transition-opacity hover:opacity-40">
          <img
            src={info.badgeImage}
            alt={`${info.label} badge`}
            className="w-24 h-24 object-contain"
            style={{ filter: `drop-shadow(0 0 8px ${info.glowColor})` }}
          />
        </div>
      )}

      <div className="relative z-10 space-y-4">
        {/* Main rank display */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, ${info.color}22, ${info.color}00)`,
              border: `1px solid ${info.color}44`,
            }}
          >
            <info.icon
              size={28}
              style={{
                filter: `drop-shadow(0 0 8px ${info.glowColor})`,
                color: info.color,
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-light text-gold-bright tracking-wide">
              {info.label}
            </p>
            <p className="text-pharaoh-subtle text-sm mt-0.5 line-clamp-1">
              {info.description}
            </p>
          </div>
        </div>

        {/* XP Progress */}
        {showProgress && next && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-pharaoh-muted">
              <span>XP: {xp.toLocaleString()} / {next.xpThreshold.toLocaleString()}</span>
              <span>{Math.round(progress)}% to {next.label}</span>
            </div>
            <div className="h-2 bg-obsidian rounded-full overflow-hidden" style={{ borderColor: 'rgba(212,168,30,0.2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, progress)}%`,
                  background: `linear-gradient(90deg, ${info.color}, ${info.color}aa)`,
                  boxShadow: `0 0 8px ${info.glowColor}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${info.color} 0%, transparent 70%)` }} />
        <div className="deco-corner deco-corner--br" style={{ background: `radial-gradient(circle, ${info.color} 0%, transparent 70%)` }} />
      </div>
    </div>
  );
}

/** Large showcase badge — for rank-up ceremonies, profile hero */
export interface RankBadgeShowcaseProps {
  rank: Rank;
  xp?: number;
  animate?: boolean;
  className?: string;
}

export function RankBadgeShowcase({
  rank,
  xp = 0,
  animate = true,
  className = '',
}: RankBadgeShowcaseProps) {
  const info = RANK_DEFINITIONS[rank];
  const { current, next, progress } = getRankProgress(xp);

  return (
    <motion.div
      className={`relative rounded-3xl p-8 md:p-12 overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, ${info.color}11 0%, var(--color-obsidian-elevated) 100%)`,
        border: `1px solid ${info.color}44`,
        boxShadow: `0 0 60px ${info.glowColor}, 0 16px 64px rgba(0,0,0,0.6)`,
      }}
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-3xl"
            style={{
              border: `1px solid ${info.color}33`,
              opacity: 0.3 - i * 0.1,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3 - i * 0.1, 0, 0.3 - i * 0.1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Badge image centerpiece */}
      {info.badgeImage && (
        <motion.div
          className="relative flex justify-center mb-6"
          initial={animate ? { y: 30, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative" style={{ filter: `drop-shadow(0 0 24px ${info.glowColor})` }}>
            <img
              src={info.badgeImage}
              alt={`${info.label} badge`}
              className="w-40 h-40 md:w-56 md:h-56 object-contain"
            />
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${info.color}`,
                opacity: 0.4,
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}

      <div className="relative z-10 text-center space-y-4">
        {/* Rank letter */}
        <motion.div
          initial={animate ? { scale: 0, rotate: -180 } : false}
          animate={animate ? { scale: 1, rotate: 0 } : false}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="inline-block font-display text-5xl md:text-7xl font-light tracking-widest text-gradient-gold"
            style={{ textShadow: `0 0 30px ${info.glowColor}` }}
          >
            {rank}
          </span>
        </motion.div>

        {/* Label */}
        <motion.h2
          className="font-display text-2xl md:text-3xl font-light text-gold-bright tracking-wide"
          initial={animate ? { y: 20, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {info.label}
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-pharaoh-muted max-w-md mx-auto text-base leading-relaxed"
          initial={animate ? { y: 20, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : false}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {info.description}
        </motion.p>

        {/* XP Progress */}
        {next && (
          <motion.div
            className="w-full max-w-xs mx-auto"
            initial={animate ? { opacity: 0 } : false}
            animate={animate ? { opacity: 1 } : false}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="flex justify-between text-sm text-pharaoh-muted mb-2">
              <span>Current XP</span>
              <span>{xp.toLocaleString()} / {next.xpThreshold.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-obsidian rounded-full overflow-hidden relative" style={{ borderColor: 'rgba(212,168,30,0.2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, progress)}%`,
                  background: `linear-gradient(90deg, ${info.color}, ${info.color}aa)`,
                  boxShadow: `0 0 12px ${info.glowColor}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
            <p className="text-xs text-pharaoh-subtle mt-2 text-center">
              {Math.round(progress)}% toward <span className="text-gold">{next.label}</span>
            </p>
          </motion.div>
        )}

        {!next && (
          <motion.p
            className="text-gold-bright font-display text-lg mt-4"
            initial={animate ? { opacity: 0 } : false}
            animate={animate ? { opacity: 1 } : false}
            transition={{ delay: 0.7 }}
          >
            MAXIMUM RANK ACHIEVED
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

/** Rank progression ladder — shows all ranks with current highlighted */
export interface RankLadderProps {
  currentRank: Rank;
  xp: number;
  className?: string;
}

export function RankLadder({ currentRank, xp, className = '' }: RankLadderProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {RANK_ORDER.slice().reverse().map((rank, i) => {
        const info = RANK_DEFINITIONS[rank];
        const isCurrent = rank === currentRank;
        const isAchieved = xp >= info.xpThreshold;
        const isFuture = !isAchieved && !isCurrent;

        return (
          <motion.div
            key={rank}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isCurrent ? 'bg-panel-gold' : isAchieved ? 'bg-panel-hover' : 'bg-panel opacity-50'}`}
            style={{
              borderColor: isCurrent ? info.color : isAchieved ? `${info.color}44` : 'transparent',
              boxShadow: isCurrent ? `0 0 20px ${info.glowColor}` : undefined,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg" style={{ background: isFuture ? 'var(--color-obsidian)' : `${info.color}22` }}>
              <info.icon
                size={18}
                style={{
                  color: isFuture ? 'var(--color-text-muted)' : info.color,
                  opacity: isFuture ? 0.4 : 1,
                  filter: isCurrent ? `drop-shadow(0 0 6px ${info.glowColor})` : undefined,
                }}
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-display font-medium text-sm truncate" style={{ color: isFuture ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                {info.label}
              </p>
              <p className="text-xs text-pharaoh-subtle truncate">{info.xpThreshold.toLocaleString()} XP</p>
            </div>
            {isCurrent && (
              <motion.span className="px-2 py-0.5 rounded-full text-xs font-mono text-gold-bright" style={{ background: `${info.color}22`, border: `1px solid ${info.color}44` }}>
                CURRENT
              </motion.span>
            )}
            {isAchieved && !isCurrent && (
              <span className="w-5 h-5 flex-shrink-0">
                <CheckCircle size={18} style={{ color: info.color }} />
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// Re-export CheckCircle for RankLadder
import { CheckCircle } from './PharaohIcons';
/** Backwards-compatible compact badge — numeric size + active glow. */
export interface RankBadgeProps {
  rank: Rank;
  size?: number;
  active?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function RankBadge({ rank, size = 24, active = false, showLabel = false, className = '' }: RankBadgeProps) {
  const info = RANK_DEFINITIONS[rank];
  return (
    <span className={`inline-flex items-center gap-1.5 font-display ${className}`} style={{ color: info.color }}>
      <info.icon
        size={size}
        className="flex-shrink-0"
        style={{
          filter: active ? `drop-shadow(0 0 6px ${info.glowColor})` : undefined,
          animation: active ? 'glowPulse 2.5s ease-in-out infinite' : undefined,
        }}
      />
      {showLabel && (
        <span className="text-[10px] uppercase tracking-widest">{rank}</span>
      )}
    </span>
  );
}
