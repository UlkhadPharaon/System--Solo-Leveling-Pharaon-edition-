import React from 'react';
import { motion } from 'motion/react';
import { ActiveTab } from '../types';
import {
  Crown, Calendar, Clock, Target, Trophy, Wallet, Sword,
  Sparkles, Zap, ChevronRight, Dumbbell, FileText, type PharaohIcon,
} from './ui/PharaohIcons';

interface SystemIntroOverlayProps {
  onDismiss: () => void;
  /** Optional: jump straight to a module's tab when its row is tapped. */
  onNavigate?: (tab: ActiveTab) => void;
}

const TOUR_ITEMS: { icon: PharaohIcon; label: string; desc: string; color: string; tab: ActiveTab }[] = [
  {
    icon: Crown,
    label: 'SYSTÈME',
    desc: 'Ton profil de Chasseur : niveau, XP, rang, attributs et quêtes quotidiennes.',
    color: '#D4A81E',
    tab: 'system_solo',
  },
  {
    icon: Calendar,
    label: 'QUÊTES',
    desc: 'Ta journée en blocs horaires. Coche une tâche terminée pour gagner XP et Or.',
    color: '#1D6FA5',
    tab: 'dashboard',
  },
  {
    icon: Dumbbell,
    label: 'ENTRAÎNEMENT',
    desc: 'Routines de musculation, records personnels et suivi de ta forme physique.',
    color: '#C0392B',
    tab: 'workout',
  },
  {
    icon: Clock,
    label: 'FOCUS',
    desc: "Minuteur de concentration par domaine. Il continue même si tu changes d'onglet.",
    color: '#7B3FE4',
    tab: 'focus_timer',
  },
  {
    icon: Target,
    label: 'BILAN',
    desc: 'Tes objectifs hebdomadaires par domaine et ta série de jours disciplinés.',
    color: '#D4A81E',
    tab: 'weekly_targets',
  },
  {
    icon: Trophy,
    label: 'HAUTS FAITS',
    desc: 'Note tes victoires du jour : chaque entrée rapporte +100 XP.',
    color: '#F0C42D',
    tab: 'victory_journal',
  },
  {
    icon: FileText,
    label: 'NOTES',
    desc: 'Carnet de notes et plan de projet organisé en phases.',
    color: '#C94277',
    tab: 'notepad',
  },
  {
    icon: Wallet,
    label: 'TRÉSORERIE',
    desc: "Enveloppes budgétaires, transactions et objectifs d'épargne.",
    color: '#1E8A49',
    tab: 'budget',
  },
];

/**
 * First-visit orientation (#5 UX audit). The `showSystemIntro` state existed in
 * App but was never rendered — new users landed on the System tab with zero
 * explanation of XP, ranks or where each module lives. This overlay is shown
 * right after onboarding closes (and once at boot for users who completed
 * onboarding before this shipped). Rows are tappable: they navigate to the
 * module in question, so it doubles as a hands-on tour.
 */
export const SystemIntroOverlay: React.FC<SystemIntroOverlayProps> = ({ onDismiss, onNavigate }) => {
  const go = (tab: ActiveTab) => {
    onNavigate?.(tab);
    onDismiss();
  };

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
              Tu es désormais un <strong className="text-gold">Chasseur</strong>. Chaque tâche
              accomplie, chaque session de concentration et chaque victoire enregistrée te fait
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

          {/* Tab tour — tappable, navigates to each module */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pharaoh-subtle text-center">
              Tes modules — touche une ligne pour l'ouvrir
            </p>
            {TOUR_ITEMS.map((item, i) => (
              <motion.button
                key={item.label}
                onClick={() => go(item.tab)}
                className="btn-press w-full flex items-center gap-3.5 p-3 rounded-xl bg-obsidian border border-lapis-border hover:border-gold/40 hover:bg-panel-hover transition-colors text-left group"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <div
                  className="p-2 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}1a`, border: `1px solid ${item.color}44` }}
                >
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm tracking-wide text-pharaoh">{item.label}</p>
                  <p className="text-xs text-pharaoh-muted leading-snug">{item.desc}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-pharaoh-muted shrink-0 group-hover:text-gold group-hover:translate-x-0.5 transition-all"
                />
              </motion.button>
            ))}
          </div>

          {/* First-step tip */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-panel-gold/15 border border-gold/30">
            <Sparkles size={16} color="var(--color-gold)" className="mt-0.5 shrink-0" />
            <p className="text-xs text-pharaoh-muted leading-relaxed">
              <strong className="text-gold">1ère étape conseillée :</strong> ouvre{' '}
              <strong className="text-gold">QUÊTES</strong> et coche tes premières tâches — tes
              premiers XP t'attendent.
            </p>
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
