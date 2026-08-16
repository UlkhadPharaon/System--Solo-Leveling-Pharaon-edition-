import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X } from './PharaohIcons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Extra context line (e.g. item name) shown muted under the message. */
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight destructive-action guard (#3 UX audit): single-tap deletes on
 * XP-bearing records (victory logs, transactions, running focus session) are
 * irreversible — this dialog makes the cost explicit before the tap lands.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      // Enter no longer auto-confirms: keyboard users tab to the action explicitly
      // (a stray Enter on the wrong focus target must not delete data).
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
              <AlertTriangle size={20} color="var(--color-blood)" />
            </div>
            <h3 className="font-display text-xl font-light text-pharaoh tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="btn-press p-1.5 rounded-lg text-pharaoh-subtle hover:text-pharaoh transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-pharaoh-muted leading-relaxed">{message}</p>
        {details && (
          <p className="font-mono text-xs text-pharaoh-subtle bg-obsidian border border-lapis-border rounded-xl px-3 py-2">
            {details}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="btn-press px-4 py-2 rounded-xl bg-obsidian text-pharaoh-muted border border-lapis-border font-mono text-xs uppercase tracking-wide hover:text-pharaoh transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-press px-4 py-2 rounded-xl bg-blood/15 text-blood border border-blood/40 font-mono text-xs uppercase tracking-wide hover:bg-blood/25 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
