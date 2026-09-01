import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onPopup, type InAppPopup } from '../lib/popupManager';
import { X, Sparkles, Zap, Flame, Crown } from './ui/PharaohIcons';

function iconFor(cat: InAppPopup['category']) {
  if (cat === 'reward') return Crown;
  if (cat === 'streak') return Flame;
  if (cat === 'session') return Zap;
  return Sparkles;
}

/**
 * In-app popup toast stack — pharaoh-styled overlays that appear when
 * popupManager fires, even if system permission is denied. Auto-dismiss
 * after 6s, tap to navigate, X to dismiss.
 */
export const PopupStack: React.FC = () => {
  const [popups, setPopups] = useState<InAppPopup[]>([]);

  useEffect(() => {
    const off = onPopup((p) => {
      setPopups(prev => [p, ...prev].slice(0, 3));
      window.setTimeout(() => {
        setPopups(prev => prev.filter(x => x.id !== p.id));
      }, 6000);
    });
    // Also listen to raw custom event from non-React call sites
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as InAppPopup | undefined;
      if (detail && detail.title) {
        setPopups(prev => [detail, ...prev].slice(0, 3));
        window.setTimeout(() => setPopups(prev => prev.filter(x => x.id !== detail.id)), 6000);
      }
    };
    window.addEventListener('aura:popup', onCustom as EventListener);
    return () => { off(); window.removeEventListener('aura:popup', onCustom as EventListener); };
  }, []);

  if (popups.length === 0) return null;

  return (
    <div className="fixed top-3 inset-x-3 sm:left-auto sm:right-4 sm:w-[380px] z-[130] pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {popups.map(p => {
          const Icon = iconFor(p.category);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-panel via-panel to-obsidian shadow-card-hover backdrop-blur-xl"
              role="alert"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative p-3 flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-panel-gold border border-gold/40 text-gold-bright flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-sm text-pharaoh leading-tight">{p.title}</p>
                    <button
                      onClick={() => setPopups(prev => prev.filter(x => x.id !== p.id))}
                      className="btn-press p-1 rounded-lg text-pharaoh-subtle hover:text-pharaoh -mt-0.5 -mr-1"
                      aria-label="Fermer"
                    ><X size={14} /></button>
                  </div>
                  {p.body && <p className="text-xs text-pharaoh-muted mt-1 leading-relaxed line-clamp-2">{p.body}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (p.url) window.location.href = p.url;
                        setPopups(prev => prev.filter(x => x.id !== p.id));
                      }}
                      className="btn-press px-3 py-1.5 rounded-xl bg-panel-gold border border-gold/40 text-gold-bright font-mono text-[11px]"
                    >
                      Ouvrir
                    </button>
                    <span className="font-mono text-[10px] text-pharaoh-subtle uppercase tracking-wide">{p.category}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
