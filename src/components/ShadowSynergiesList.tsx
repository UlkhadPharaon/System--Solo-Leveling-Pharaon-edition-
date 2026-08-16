import React from 'react';
import { Crown, Sparkles, Check, Lock, ShieldAlert } from './ui/PharaohIcons';
import { PlayerProfile, ShadowSoldier } from '../types';

interface ShadowSynergiesListProps {
  player: PlayerProfile;
}

interface SynergyTemplate {
  id: string;
  name: string;
  description: string;
  conditionDesc: string;
  check: (shadows: ShadowSoldier[]) => boolean;
  bonusDesc: string;
}

const SYNERGIES: SynergyTemplate[] = [
  {
    id: 'syn_founders',
    name: 'Trio Fondateur de Thèbes',
    description: 'Les trois ombres pionnières unissent leurs forces pour solidifier le trône du Souverain.',
    conditionDesc: 'Posséder au moins 3 soldats ombres dans votre armée.',
    check: (shadows) => shadows.length >= 3,
    bonusDesc: '+10% d’Or et d’XP bonus lors des expéditions.'
  },
  {
    id: 'syn_elite',
    name: 'Double Dynastie de Lapis',
    description: 'Une alliance d’élite de deux gardes d’exception régnant sur la nuit.',
    conditionDesc: 'Posséder au moins 2 ombres de Rang A ou supérieur.',
    check: (shadows) => shadows.filter(s => s.rank === 'A' || s.rank === 'S' || s.rank === 'Pharaon').length >= 2,
    bonusDesc: '+15 Force et +15 Vitalité passives.'
  },
  {
    id: 'syn_s_rank',
    name: 'Le Fléau d’Anubis',
    description: 'La puissance absolue de la Faucheuse d’Âmes canalisée dans votre armée divine.',
    conditionDesc: 'Posséder au moins une ombre de Rang S.',
    check: (shadows) => shadows.some(s => s.rank === 'S' || s.rank === 'Pharaon'),
    bonusDesc: '+20 Intelligence pour alimenter vos incantations.'
  },
  {
    id: 'syn_monarch',
    name: 'Le Souffle d’Osiris',
    description: 'Une régénération mystique insufflée directement par le seigneur de l’au-delà.',
    conditionDesc: 'Posséder 5 ombres ou plus de n’importe quel rang.',
    check: (shadows) => shadows.length >= 5,
    bonusDesc: 'Restaure 5 HP et 5 MP automatiquement après chaque mission.'
  }
];

export const ShadowSynergiesList: React.FC<ShadowSynergiesListProps> = ({ player }) => {
  if (!player) return null;

  const shadows = player.shadows || [];

  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center gap-2 border-b border-gold-dim pb-3">
        <Crown className="w-5 h-5 text-gold animate-pulse" />
        <h3 className="font-display text-md font-bold text-pharaoh tracking-widest uppercase">
          SYNERGIES DE L’ARMÉE DIVINE
        </h3>
      </div>
      <p className="text-xs text-pharaoh-muted italic leading-relaxed">
        Votre armée d’ombres n’est pas qu’un rassemblement de serviteurs, c’est un temple vivant. En combinant les bons généraux de l’au-delà, vous activez d’immenses résonances magiques pour augmenter vos attributs et vos gains de combat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {SYNERGIES.map(syn => {
          const active = syn.check(shadows);

          return (
            <div key={syn.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden hover-lift ${
              active 
                ? 'bg-lapis/40 border-gold shadow-gold' 
                : 'bg-obsidian-elevated border-gold-dim/40 opacity-70'
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-display font-bold text-sm tracking-wide ${active ? 'text-gold-bright' : 'text-pharaoh-muted'}`}>
                      {syn.name}
                    </h4>
                    <span className={`font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      active ? 'bg-emerald/10 text-emerald border border-emerald/20' : 'bg-blood/10 text-blood border border-blood/20'
                    }`}>
                      {active ? 'SYNCHRONISÉE' : 'VERROUILLÉE'}
                    </span>
                  </div>
                  {active ? (
                    <div className="p-1.5 bg-emerald/10 rounded-lg text-emerald border border-emerald/30">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-blood/10 rounded-lg text-blood border border-blood/30">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-pharaoh-muted italic leading-relaxed">{syn.description}</p>

                <div className="space-y-1.5 pt-2">
                  <div className="font-mono text-[9px] text-pharaoh-subtle font-display uppercase tracking-wider">Condition de résonance :</div>
                  <div className="font-mono text-[10px] text-pharaoh-muted flex items-center gap-1">
                    {syn.conditionDesc}
                  </div>
                </div>
              </div>

              {/* Bonus Display */}
              <div className="mt-4 pt-3 border-t border-gold-dim/40">
                <div className="font-mono text-[9px] text-gold font-display uppercase tracking-wider mb-1">Bonus passif octroyé :</div>
                <div className={`font-display text-xs font-bold ${active ? 'text-emerald' : 'text-pharaoh-subtle'}`}>
                  {syn.bonusDesc}
                </div>
              </div>

              {/* Background Glow */}
              {active && (
                <div className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full bg-emerald/5 blur-xl pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
