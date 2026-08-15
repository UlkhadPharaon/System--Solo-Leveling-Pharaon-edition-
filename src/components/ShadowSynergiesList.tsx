import React from 'react';
import { Crown, Sparkles, Check, Lock, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-sl-gold/15 pb-3">
        <Crown className="w-5 h-5 text-sl-gold animate-pulse" />
        <h3 className="text-md font-bold text-white font-display tracking-widest uppercase">
          SYNERGIES DE L’ARMÉE DIVINE
        </h3>
      </div>
      <p className="text-xs text-slate-400 font-serif italic leading-relaxed">
        Votre armée d’ombres n’est pas qu’un rassemblement de serviteurs, c’est un temple vivant. En combinant les bons généraux de l’au-delà, vous activez d’immenses résonances magiques pour augmenter vos attributs et vos gains de combat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNERGIES.map(syn => {
          const active = syn.check(shadows);

          return (
            <div key={syn.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              active 
                ? 'bg-sl-lapis/30 border-sl-gold shadow-gold-sm' 
                : 'bg-sl-primary/40 border-sl-gold/10 opacity-70'
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-bold font-display text-sm tracking-wide ${active ? 'text-sl-gold-light' : 'text-slate-400'}`}>
                      {syn.name}
                    </h4>
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {active ? 'SYNCHRONISÉE' : 'VERROUILLÉE'}
                    </span>
                  </div>
                  {active ? (
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/30">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400 border border-red-500/30">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-serif italic leading-relaxed">{syn.description}</p>

                <div className="space-y-1.5 pt-2">
                  <div className="text-[9px] text-slate-500 font-display uppercase tracking-wider">Condition de résonance :</div>
                  <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
                    {syn.conditionDesc}
                  </div>
                </div>
              </div>

              {/* Bonus Display */}
              <div className="mt-4 pt-3 border-t border-sl-gold/10">
                <div className="text-[9px] text-sl-gold font-display uppercase tracking-wider mb-1">Bonus passif octroyé :</div>
                <div className={`text-xs font-bold font-display ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {syn.bonusDesc}
                </div>
              </div>

              {/* Background Glow */}
              {active && (
                <div className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
