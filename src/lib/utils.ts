import { Category, SchoolSubject, Domain } from '../types';
import { loadDomains, styleForDomain } from './domains';

export interface CategoryStyleToken {
  label: string;
  badgeBg: string;
  dotColor: string;
  barColor: string;
  cardBg: string;
  borderLeft: string;
  textColor: string;
  iconBg: string;
  accentTagBg: string;
  glowBorder: string;
  activeFilterBg: string;
}

// ── Category accent tokens (Pharaoh palette) ────────────────────────────────
// NOTE: Tailwind only compiles classes it can see literally — keep these as
// full literal strings, never build them dynamically.
const ACCENT = {
  blood: {
    badgeBg: 'bg-blood/20 text-blood border-blood/40',
    dotColor: 'bg-blood',
    barColor: '#C0392B',
    cardBg: 'bg-blood/10 border-blood/30 hover:border-blood/60',
    borderLeft: 'border-l-4 border-l-blood',
    textColor: 'text-blood',
    iconBg: 'bg-blood/20 border-blood/40 text-blood',
    accentTagBg: 'bg-blood/15 text-blood border-blood/30',
    glowBorder: 'border-blood/50',
    activeFilterBg: 'bg-blood/20 text-blood border-blood',
  },
  amethyst: {
    badgeBg: 'bg-amethyst/20 text-amethyst border-amethyst/40',
    dotColor: 'bg-amethyst',
    barColor: '#7B3FE4',
    cardBg: 'bg-amethyst/10 border-amethyst/30 hover:border-amethyst/60',
    borderLeft: 'border-l-4 border-l-amethyst',
    textColor: 'text-amethyst',
    iconBg: 'bg-amethyst/20 border-amethyst/40 text-amethyst',
    accentTagBg: 'bg-amethyst/15 text-amethyst border-amethyst/30',
    glowBorder: 'border-amethyst/50',
    activeFilterBg: 'bg-amethyst/20 text-amethyst border-amethyst',
  },
  gold: {
    badgeBg: 'bg-gold/20 text-gold-bright border-gold/40',
    dotColor: 'bg-gold',
    barColor: '#D4A81E',
    cardBg: 'bg-gold/10 border-gold/30 hover:border-gold/60',
    borderLeft: 'border-l-4 border-l-gold',
    textColor: 'text-gold-bright',
    iconBg: 'bg-gold/20 border-gold/40 text-gold-bright',
    accentTagBg: 'bg-gold/15 text-gold-bright border-gold/30',
    glowBorder: 'border-gold/50',
    activeFilterBg: 'bg-gold/20 text-gold-bright border-gold',
  },
  sapphire: {
    badgeBg: 'bg-sapphire/20 text-sapphire border-sapphire/40',
    dotColor: 'bg-sapphire',
    barColor: '#1D6FA5',
    cardBg: 'bg-sapphire/10 border-sapphire/30 hover:border-sapphire/60',
    borderLeft: 'border-l-4 border-l-sapphire',
    textColor: 'text-sapphire',
    iconBg: 'bg-sapphire/20 border-sapphire/40 text-sapphire',
    accentTagBg: 'bg-sapphire/15 text-sapphire border-sapphire/30',
    glowBorder: 'border-sapphire/50',
    activeFilterBg: 'bg-sapphire/20 text-sapphire border-sapphire',
  },
  emerald: {
    badgeBg: 'bg-emerald/20 text-emerald border-emerald/40',
    dotColor: 'bg-emerald',
    barColor: '#1E8A49',
    cardBg: 'bg-emerald/10 border-emerald/30 hover:border-emerald/60',
    borderLeft: 'border-l-4 border-l-emerald',
    textColor: 'text-emerald',
    iconBg: 'bg-emerald/20 border-emerald/40 text-emerald',
    accentTagBg: 'bg-emerald/15 text-emerald border-emerald/30',
    glowBorder: 'border-emerald/50',
    activeFilterBg: 'bg-emerald/20 text-emerald border-emerald',
  },
  jade: {
    badgeBg: 'bg-jade/20 text-jade border-jade/40',
    dotColor: 'bg-jade',
    barColor: '#2FA57A',
    cardBg: 'bg-jade/10 border-jade/30 hover:border-jade/60',
    borderLeft: 'border-l-4 border-l-jade',
    textColor: 'text-jade',
    iconBg: 'bg-jade/20 border-jade/40 text-jade',
    accentTagBg: 'bg-jade/15 text-jade border-jade/30',
    glowBorder: 'border-jade/50',
    activeFilterBg: 'bg-jade/20 text-jade border-jade',
  },
  lotus: {
    badgeBg: 'bg-lotus/20 text-lotus border-lotus/40',
    dotColor: 'bg-lotus',
    barColor: '#C94277',
    cardBg: 'bg-lotus/10 border-lotus/30 hover:border-lotus/60',
    borderLeft: 'border-l-4 border-l-lotus',
    textColor: 'text-lotus',
    iconBg: 'bg-lotus/20 border-lotus/40 text-lotus',
    accentTagBg: 'bg-lotus/15 text-lotus border-lotus/30',
    glowBorder: 'border-lotus/50',
    activeFilterBg: 'bg-lotus/20 text-lotus border-lotus',
  },
  neutral: {
    badgeBg: 'bg-lapis-light/40 text-pharaoh-muted border-lapis-border',
    dotColor: 'bg-lapis-light',
    barColor: '#1E3A5F',
    cardBg: 'bg-obsidian-elevated/60 border-lapis-border hover:border-gold-dim',
    borderLeft: 'border-l-4 border-l-lapis-light',
    textColor: 'text-pharaoh-muted',
    iconBg: 'bg-lapis-light/40 border-lapis-border text-pharaoh-muted',
    accentTagBg: 'bg-lapis-light/30 text-pharaoh-muted border-lapis-border',
    glowBorder: 'border-lapis-border',
    activeFilterBg: 'bg-lapis-light/40 text-pharaoh border-lapis-border',
  },
} as const;

function withLabel(accent: (typeof ACCENT)[keyof typeof ACCENT], label: string): CategoryStyleToken {
  return { label, ...accent };
}

export function getCategoryStyle(category: Category, schoolSubject?: SchoolSubject): CategoryStyleToken {
  // Dynamic domain categories (`dom:<domainId>`) resolve from the Domain store
  // first; legacy fixed categories fall through to the original map below.
  if (typeof category === 'string' && category.startsWith('dom:')) {
    const domain: Domain | undefined = loadDomains().find((d) => d.id === category.slice(4));
    if (domain) return domainStyleToken(domain);
  }
  switch (category) {
    case 'bangre_neo':
      return withLabel(ACCENT.amethyst, 'Bangre Neo Lab');
    case 'cinema':
      return withLabel(ACCENT.gold, 'Cinéma & Films');
    case 'school':
      if (schoolSubject === 'math') return withLabel(ACCENT.sapphire, 'Études - Maths');
      if (schoolSubject === 'pc') return withLabel(ACCENT.amethyst, 'Études - Phys/Chimie');
      if (schoolSubject === 'svt') return withLabel(ACCENT.emerald, 'Études - SVT');
      if (schoolSubject === 'hist_geo') return withLabel(ACCENT.lotus, 'Études - Hist & Géo');
      return withLabel(ACCENT.sapphire, 'Études Scolaires');
    case 'must_do_work':
      return withLabel(ACCENT.gold, 'Travail Incontournable');
    case 'morning_routine':
      return withLabel(ACCENT.emerald, 'Routine Matinale');
    case 'learning':
      return withLabel(ACCENT.lotus, 'Lecture & Podcasts');
    case 'sleep':
      return withLabel(ACCENT.amethyst, 'Sommeil & Récupération');
    default:
      return withLabel(ACCENT.neutral, 'Temps Personnel');
  }
}

/** Generic style token for a user-defined Domain (onboarding v2). */
export function domainStyleToken(domain: Domain): CategoryStyleToken {
  const style = styleForDomain(domain);
  const accentByCategory: Record<string, (typeof ACCENT)[keyof typeof ACCENT]> = {
    physical: ACCENT.blood,
    creative: ACCENT.gold,
    intellectual: ACCENT.sapphire,
    craft: ACCENT.amethyst,
    habit: ACCENT.jade,
    financial: ACCENT.emerald,
    social: ACCENT.lotus,
  };
  const accent = accentByCategory[domain.category] ?? ACCENT.neutral;
  return { ...accent, label: domain.label, barColor: style.color };
}

export function getCategoryBadge(category: Category, schoolSubject?: SchoolSubject) {
  const style = getCategoryStyle(category, schoolSubject);
  return {
    label: style.label,
    badgeBg: style.badgeBg,
    dotColor: style.dotColor,
    barColor: style.barColor,
  };
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(1) + 'h';
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function calculateLevelProgression(
  currentXp: number | undefined,
  currentLevel: number | undefined,
  currentXpToNext: number | undefined,
  xpGained: number
) {
  const safeBaseXp = Number.isFinite(currentXp) && (currentXp ?? 0) >= 0 ? Number(currentXp) : 0;
  const safeXpGained = Number.isFinite(xpGained) && xpGained >= 0 ? Number(xpGained) : 0;
  let xp = safeBaseXp + safeXpGained;
  let level = Math.max(1, Number.isFinite(currentLevel) && (currentLevel ?? 0) > 0 ? Number(currentLevel) : 1);
  let xpToNext = Math.max(50, Number.isFinite(currentXpToNext) && (currentXpToNext ?? 0) > 0 ? Number(currentXpToNext) : 100);
  let levelsGained = 0;

  let iterations = 0;
  while (xp >= xpToNext && iterations < 500) {
    iterations++;
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.max(50, Math.floor(xpToNext * 1.5));
    levelsGained++;
  }

  if (xp >= xpToNext) {
    xp = 0;
  }

  return {
    xp,
    level,
    xpToNextLevel: xpToNext,
    attributePointsGained: levelsGained * 5,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

export function getRankAndClassForLevel(level: number) {
  if (level >= 25) {
    return { rank: 'Pharaon' as const, hunterClass: 'Pharaon des Dieux' as const };
  } else if (level >= 20) {
    return { rank: 'S' as const, hunterClass: 'Commandant des Ombres' as const };
  } else if (level >= 15) {
    return { rank: 'A' as const, hunterClass: 'Assassin Vorace' as const };
  } else if (level >= 10) {
    return { rank: 'B' as const, hunterClass: 'Mage des Éléments' as const };
  } else if (level >= 7) {
    return { rank: 'C' as const, hunterClass: 'Guerrier Éprouvé' as const };
  } else if (level >= 5) {
    return { rank: 'D' as const, hunterClass: 'Guerrier Agile' as const };
  }
  return { rank: 'E' as const, hunterClass: 'Chasseur de Rang E (Débutant)' as const };
}

/* ============================================================
   CENTRALIZED REWARD TABLE — keeps XP/gold consistent app-wide
   (#15 audit: features previously used wildly different rates)
   ============================================================ */
export const XP_RATES = {
  /** Per focused minute of routine-block work */
  perMinuteXp: 2,
  perMinuteGold: 1,
  /** Multiplier applied on top of the per-minute rate */
  workoutBonusXp: 150,
  workoutBonusGold: 40,
  /** Focus sessions are deep work: 2x the per-minute rate */
  focusMultiplier: 2,
  /** Fixed rewards */
  victoryLogXp: 100,
  victoryLogGold: 50,
  bodyMetricXp: 50,
  bodyMetricGold: 20,
  personalRecordXp: 100,
  personalRecordGold: 40,
  fullDayBonusXp: 200,
  fullDayBonusGold: 100,
  /** Daily habit checklist check (habit_checklist domains, onboarding v2) */
  habitCheckXp: 30,
  habitCheckGold: 15,
};

export function blockReward(durationMinutes: number) {
  const xp = Math.max(20, Math.floor(durationMinutes * XP_RATES.perMinuteXp));
  const gold = Math.max(10, Math.floor(durationMinutes * XP_RATES.perMinuteGold));
  return { xp, gold };
}

export function focusSessionReward(durationMinutes: number) {
  const xp = Math.max(30, Math.floor(durationMinutes * XP_RATES.perMinuteXp * XP_RATES.focusMultiplier));
  const gold = Math.max(15, Math.floor(durationMinutes * XP_RATES.perMinuteGold * XP_RATES.focusMultiplier));
  return { xp, gold };
}

export function workoutReward(durationMinutes: number) {
  const xp = XP_RATES.workoutBonusXp + Math.floor(durationMinutes * XP_RATES.perMinuteXp);
  const gold = XP_RATES.workoutBonusGold + Math.floor(durationMinutes * XP_RATES.perMinuteGold);
  return { xp, gold };
}

