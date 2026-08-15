import { HunterRank } from '../types';

/*
 * Rank badge registry for the provided cyber-pharaon badge art.
 * File names are normalized here — the original exports (in
 * "UI element and references/") had typos and are never referenced directly.
 */

import badgeRankE from '../assets/ui/badge-rank-E.png';
import badgeRankD from '../assets/ui/badge-rank-D.png';
import badgeRankC from '../assets/ui/badge-rank-C.png';
import badgeRankB from '../assets/ui/badge-rank-B.png';
import badgeRankA from '../assets/ui/badge-rank-A.png';
import badgeRankS from '../assets/ui/badge-rank-S.png';
import badgeRankPharaon from '../assets/ui/badge-rank-pharaon.png';

/**
 * Logical rank progression — NOT alphabetical file order.
 * Must mirror getRankAndClassForLevel (lib/utils.ts): E → D → C → B → A → S → Pharaon.
 */
export const RANK_ORDER: HunterRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'Pharaon'];

export const RANK_BADGE_IMAGE: Record<HunterRank, string> = {
  E: badgeRankE,
  D: badgeRankD,
  C: badgeRankC,
  B: badgeRankB,
  A: badgeRankA,
  S: badgeRankS,
  Pharaon: badgeRankPharaon,
};
