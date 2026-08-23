import { HunterRank } from '../types';

/*
 * Rank badge registry for the provided cyber-pharaon badge art.
 * File names are normalized here — the original exports (in
 * "UI element and references/") had typos and are never referenced directly.
 * These imports are the ONLY correct way to reference badge art: the source
 * folder is outside Vite's publicDir, so absolute /UI element…/ URLs 404.
 */

// WebP versions (~10-20x smaller than the original PNGs; visually
// identical at badge display sizes). The .png originals stay in the repo
// only as source masters — Vite bundles just these imports.
import badgeRankE from '../assets/ui/badge-rank-E.webp';
import badgeRankD from '../assets/ui/badge-rank-D.webp';
import badgeRankC from '../assets/ui/badge-rank-C.webp';
import badgeRankB from '../assets/ui/badge-rank-B.webp';
import badgeRankA from '../assets/ui/badge-rank-A.webp';
import badgeRankS from '../assets/ui/badge-rank-S.webp';
import badgeRankPharaon from '../assets/ui/badge-rank-pharaon.webp';
import badgeShadowAssassin from '../assets/ui/badge-special-shadow-assassin.webp';
import badgeDragon from '../assets/ui/badge-special-dragon.webp';
import badgeWolf from '../assets/ui/badge-special-wolf.webp';

/**
 * Logical rank progression — NOT alphabetical file order.
 * Must mirror getRankAndClassForLevel (lib/utils.ts): E → D → C → B → A → S → Pharaon.
 */
export const RANK_ORDER: HunterRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'Pharaon'];

export const RANK_BADGE_IMAGE: Record<'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Pharaoh' | 'Pharaon', string> = {
  E: badgeRankE,
  D: badgeRankD,
  C: badgeRankC,
  B: badgeRankB,
  A: badgeRankA,
  S: badgeRankS,
  Pharaoh: badgeRankPharaon,
  Pharaon: badgeRankPharaon,
};

/** Art for the post-Pharaon special ranks (RankBadge.tsx extended ladder). */
export const SPECIAL_BADGE_IMAGE: Record<'ShadowMonarch' | 'DragonKnight' | 'WolfPack', string> = {
  ShadowMonarch: badgeShadowAssassin,
  DragonKnight: badgeDragon,
  WolfPack: badgeWolf,
};
