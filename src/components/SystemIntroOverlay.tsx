import React from 'react';
import { motion } from 'motion/react';
import {
  Crown, Calendar, Clock, Target, Trophy, Wallet, Sword,
  Sparkles, Zap, ChevronRight,
} from './ui/PharaohIcons';

interface SystemIntroOverlayProps {
  onDismiss: () => void;
}

const TOUR_ITEMS = [
  {
    icon: Crown,
    label: 'SYSTÈME',
    desc: 'Votre profil de Chasseur : XP, rang, attributs, quêtes quotidiennes et donjons.',
    color: '#D4A81E',
  },
  {
    icon: Calendar,
    label: 'QUÊTES',
    desc: 'Votre journée en blocs horaires — cochez une tâche pour gagner XP et Or.',
    color: '#1D6FA5',
  },
  {
    icon: Clock,
    label: 'FOCUS',
    desc: "Minuteur de concentration par domaine. Il continue même si vous changez d'onglet.",
    color: '#7B3FE4',
  },
  {
    icon: Target,
    label: 'BILAN',
    desc: 'Vos objectifs hebdomadaires par domaine et votre série de discipline.',
    color: '#D4A81E',
  },
  {
    icon: Trophy,
    label: 'HAUTS FAITS',
    desc: 'Consignez vos victoires quotidiennes : chaque entrée rapporte +100 XP.',
    color: '#F0C42D',
  },
  {
    icon: Wallet,
    label: 'TRÉSORERIE',
    desc: "Enveloppes budgétaires, transactions et objectifs d'épargne.",
    color: '#1E8A49',
  },
];

/**
 * First-visit orientation (#5 UX audit). The `showSystemIntro` state existed in
 * App but was never rendered — new users landed on the System tab with zero
 * explanation of XP, ranks or where each module lives. This overlay is shown
 * once (guarded by `aura_system_initialized`), right after onboarding closes.
 */
export const SystemIntroOverlay: React.FC<SystemIntroOverlayProps> = ({ onDismiss }) => {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-obsidian/95 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Introduction au Système"
    >
      <motion.div
        className="relative max-w-2xl w-full my-8 bg-panel border border-gold/40 rounded-3xl shadow-gold-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Scanline deco */}
        <div className="absolute inset-0 pointer-events-none deco-scanline" />

        <div className="relative p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              className="mx-auto w-14 h-14 rounded-2xl bg-panel-gold border border-gold/50 flex items-center justify-center shadow-gold"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <Crown size={28} color="var(--color-gold-bright)" />
            </motion.div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-pharaoh-subtle">
                Notification du Système
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-light text-gradient-gold tracking-wide mt-1">
                SYSTÈME ÉVEILLÉ
              </h2>
            </div>
            <p className="text-sm text-pharaoh-muted leading-relaxed max-w-md mx-auto">
              Vous êtes désormais un <strong className="text-gold">Chasseur</strong>. Chaque tâche
              accomplie, chaque session de concentration et chaque victoire enregistrée vous fait
              monter en puissance.
            </p>
          </div>

          {/* XP explainer strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: 'Tâche cochée', value: '+XP & Or' },
              { icon: Sparkles, label: 'Session Focus', value: '+XP & Or' },
              { icon: Sword, label: 'Niveau supérieur', value: '+Statuts' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-obsidian border border-lapis-border text-center"
              >
                <item.icon size={18} color="var(--color-gold)" />
                <span className="font-mono text-[9px] uppercase tracking-wide text-pharaoh-subtle">{item.label}</span>
                <span className="font-mono text-[10px] font-semibold text-gold-bright">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Tab tour */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pharaoh-subtle text-center">
              Vos modules
            </p>
            {TOUR_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-obsidian border border-lapis-border hover:border-gold/30 transition-colors"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
              >
                <div
                  className="p-2 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}1a`, border: `1px solid ${item.color}44` }}
                >
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm tracking-wide text-pharaoh">{item.label}</p>
                  <p className="text-xs text-pharaoh-muted leading-snug">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={onDismiss}
            className="btn-press w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-panel-gold border border-gold/50 text-gold-bright font-display text-base tracking-widest hover:shadow-gold-lg transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            COMMENCER L'ASCENSION
            <ChevronRight size={18} />
          </motion.button>
          <p className="text-center font-mono text-[9px] uppercase tracking-wide text-pharaoh-subtle">
            « Les plus grands Chasseurs ont commencé au rang E. »
          </p>
        </div>
      </motion.div>
    </div>
  );
};
