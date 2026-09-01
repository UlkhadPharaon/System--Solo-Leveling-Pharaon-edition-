import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Trash, CheckCircle2 } from './ui/PharaohIcons';
import { getNotificationCenter, markAllRead, clearNotificationCenter, unreadCount, type NotificationCenterEntry } from '../lib/pushNotifications';

export const NotificationCenterBell: React.FC<{ onOpenWidgets?: () => void }> = ({ onOpenWidgets }) => {
  const [entries, setEntries] = useState<NotificationCenterEntry[]>(() => getNotificationCenter());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => setEntries(getNotificationCenter());

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('aura:notifications-changed', h);
    window.addEventListener('aura:popup', h as EventListener);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener('aura:notifications-changed', h);
      window.removeEventListener('aura:popup', h as EventListener);
      window.removeEventListener('storage', h);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const unread = entries.filter(e => !e.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications — ${unread} non lues`}
        className="btn-press relative p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-panel border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-gold transition-all"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blood text-white font-mono text-[10px] font-bold flex items-center justify-center border border-obsidian">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[92vw] rounded-2xl border border-lapis-border bg-panel shadow-card-hover overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-lapis-border">
            <h3 className="font-display text-sm text-pharaoh">Notifications</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { markAllRead(); refresh(); }} className="btn-press p-1.5 rounded-lg text-pharaoh-muted hover:text-pharaoh" title="Tout marquer lu"><CheckCircle2 size={16} /></button>
              <button onClick={() => { clearNotificationCenter(); refresh(); }} className="btn-press p-1.5 rounded-lg text-pharaoh-muted hover:text-blood" title="Effacer"><Trash size={16} /></button>
              <button onClick={() => setOpen(false)} className="btn-press p-1 rounded-lg text-pharaoh-subtle"><X size={16} /></button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {entries.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-lapis/40 border border-lapis-border mx-auto flex items-center justify-center text-pharaoh-subtle"><Bell size={18} /></div>
                <p className="font-mono text-xs text-pharaoh-subtle mt-3">Aucune notification — le Système est silencieux.</p>
                {onOpenWidgets && (
                  <button onClick={() => { setOpen(false); onOpenWidgets(); }} className="btn-press mt-3 px-3 py-1.5 rounded-xl bg-panel-gold border border-gold/40 text-gold-bright font-mono text-xs">Configurer les popups</button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-lapis-border/50">
                {entries.slice(0, 30).map(e => (
                  <li key={e.id} className={`p-3 flex gap-3 hover:bg-lapis/20 transition-colors ${!e.read ? 'bg-gold/5' : ''}`}>
                    <div className={`shrink-0 w-1.5 self-stretch rounded-full ${!e.read ? 'bg-gold' : 'bg-lapis-border'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!e.read ? 'text-pharaoh font-medium' : 'text-pharaoh-muted'}`}>{e.title}</p>
                      {e.body && <p className="text-xs text-pharaoh-muted mt-1 line-clamp-2">{e.body}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-mono text-[10px] text-pharaoh-subtle">{new Date(e.at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })} • {e.category}</span>
                        {e.url && e.url !== '/' && (
                          <button onClick={() => { window.location.href = e.url; setOpen(false); }} className="font-mono text-[11px] text-gold hover:text-gold-bright ml-auto">Ouvrir →</button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-2 border-t border-lapis-border flex items-center justify-between">
            <span className="font-mono text-[11px] text-pharaoh-subtle">{entries.length} notification{entries.length!==1?'s':''} • {unread} non lue{unread!==1?'s':''}</span>
            {onOpenWidgets && (
              <button onClick={() => { setOpen(false); onOpenWidgets(); }} className="font-mono text-[11px] text-gold hover:text-gold-bright">Réglages popups →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
