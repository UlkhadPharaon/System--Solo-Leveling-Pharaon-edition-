import React from 'react';
import { HunterRank } from '../../types';
import { RANK_BADGE_IMAGE } from '../../lib/uiAssets';

interface RankBadgeProps {
  rank: HunterRank;
  /** Rendered height in px (width auto — badge art is ~0.8:1 portrait). */
  size?: number;
  /** Subtle pulsing glow — for the player's CURRENT rank only. */
  active?: boolean;
  /** Dimmed/locked style for future ranks in the progression frieze. */
  locked?: boolean;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 28, active = false, locked = false, className = '' }) => (
  <img
    src={RANK_BADGE_IMAGE[rank]}
    alt={`Rang ${rank}`}
    title={`Rang ${rank}`}
    style={{ height: size }}
    className={`h-auto w-auto select-none ${active ? 'anim-glow rounded-lg' : ''} ${
      locked ? 'opacity-25 grayscale' : ''
    } ${className}`}
    draggable={false}
  />
);
