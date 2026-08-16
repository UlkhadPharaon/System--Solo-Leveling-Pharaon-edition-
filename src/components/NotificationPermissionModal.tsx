import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, AlertTriangle, CheckCircle, X, Hourglass, ArrowRight, Globe } from './ui/PharaohIcons';

/**
 * Permission-request modal that shows the first time (or on-demand) when the
 * user needs to grant push notification consent. Modeled after the ConfirmDialog
 * styling but with more instructional body text and a Pharaoh-themed flair.
 */
interface NotificationPermissionModalProps {
  isOpen: boolean;
  /** Called when the user clicks 'Enable' or 'Later'. */
  onSelect: (choice: 'enable' | 'later') => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onSelect,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect('later');
      // Enter/Space intentionally NOT bound: the grant-permission action must be
      // an explicit click, never an accidental keypress.
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onSelect]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => onSelect('later')}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-panel border border-blood/40 rounded-2xl max-w-md w-full p-6 shadow-card-hover space-y-4 anim-pop"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blood/10 border border-blood/30 text-blood">
              <Bell size={20} color="var(--color-blood)" />
            </div>
            <h3 className="font-display text-xl font-light text-pharaoh tracking-wide">
              Le Système peut vous alerter
            </h3>
          </div>
          <button
            onClick={() => onSelect('later')}
            className="btn-press p-1.5 rounded-lg text-pharaoh-subtle hover:text-pharaoh transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-pharaoh-muted leading-relaxed mb-4">
          Pour que Le Système puisse vous envoyer des notifications (même quand l'appli
          est en arrière-plan ou fermée), merci d'autoriser les notifications dans votre
          navigateur.
        </p>

        {/* What you'll be notified about */}
        <div className="bg-obsidian border border-lapis-border rounded-xl p-3 mb-4">
          <p className="font-mono text-xs text-pharaoh-muted uppercase tracking-wide mb-1">
            Voici les types d'alertes que vous recevrez :
          </p>
          <ul className="text-pharaoh text-sm leading-relaxed space-y-1">
            <li>⏰ Session commençant dans N minutes (horaire)</li>
            <li>✅ Session de concentration terminée</li>
            <li>🔥 Série de jours en danger (soir)</li>
            <li>🎁 Bénédiction quotidienne disponible</li>
            <li>⬆️ Montée de niveau / Promotion de rang</li>
            <li>☀️ Rappel d'invoquer la bénédiction du matin</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => onSelect('later')}
            className="btn-press px-4 py-2 rounded-xl bg-obsidian text-pharaoh-muted border border-lapis-border font-mono text-xs uppercase tracking-wide hover:text-pharaoh transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={() => onSelect('enable')}
            className="btn-press px-4 py-2 rounded-xl bg-panel-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase tracking-wide hover:shadow-gold transition-colors"
          >
            Activer les Alertes
          </button>
        </div>
      </motion.div>
    </div>
  );
};