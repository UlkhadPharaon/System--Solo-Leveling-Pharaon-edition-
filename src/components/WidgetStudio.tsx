import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WIDGETS } from '../widgets/widgets';
import { WidgetDefinition, loadInstances, saveInstances, makeInstanceId, defaultConfig, WIDGET_STORAGE_KEY } from '../widgets/registry';
import { isInstallable, isInstalled, triggerInstall, detectPlatform, getPlatformInstructions, onInstallAvailabilityChange, InstallOutcome } from '../lib/homescreenWidget';
import { loadPopupPrefs, savePopupPrefs, CATEGORY_LABELS, type PopupCategory } from '../lib/popupManager';
import { X, Download, Smartphone, Monitor, Bell, CheckCircle2, AlertTriangle, Sparkles, Grid, Zap, Crown, Calendar, Target } from './ui/PharaohIcons';
import { enablePush, getSubscriptionStatus } from '../lib/pushNotifications';

type Tab = 'install' | 'gallery' | 'popups';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Live app context for previews — caller passes minimal snapshot
  previewCtx?: any;
}

export const WidgetStudio: React.FC<Props> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('install');
  const [installable, setInstallable] = useState(isInstallable());
  const [installed, setInstalled] = useState(isInstalled());
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [platform] = useState(detectPlatform());
  const instructions = useMemo(() => getPlatformInstructions(platform), [platform]);

  // Widget instances
  const [instances, setInstances] = useState(() => loadInstances(typeof window !== 'undefined' ? localStorage.getItem(WIDGET_STORAGE_KEY) : null));
  const [popupPrefs, setPopupPrefs] = useState(() => loadPopupPrefs());
  const [pushStatus, setPushStatus] = useState<'checking'|'yes'|'no'>('checking');

  useEffect(() => {
    if (!isOpen) return;
    const off = onInstallAvailabilityChange(() => {
      setInstallable(isInstallable());
      setInstalled(isInstalled());
    });
    // poll installed (Safari has no beforeinstallprompt)
    const iv = window.setInterval(() => setInstalled(isInstalled()), 2000);
    // push status check
    getSubscriptionStatus().then(s => setPushStatus(s.subscribed ? 'yes' : 'no')).catch(() => setPushStatus('no'));
    return () => { off(); window.clearInterval(iv); };
  }, [isOpen]);

  const toggleWidget = (def: WidgetDefinition) => {
    setInstances(prev => {
      const exists = prev.find(i => i.widgetId === def.id && i.enabled);
      let next: typeof prev;
      if (exists) {
        next = prev.map(i => i.instanceId === exists.instanceId ? { ...i, enabled: false } : i);
      } else {
        const already = prev.find(i => i.widgetId === def.id);
        if (already) {
          next = prev.map(i => i.instanceId === already.instanceId ? { ...i, enabled: true } : i);
        } else {
          next = [...prev, { instanceId: makeInstanceId(def.id), widgetId: def.id, enabled: true, config: defaultConfig(def) }];
        }
      }
      localStorage.setItem(WIDGET_STORAGE_KEY, saveInstances(next));
      window.dispatchEvent(new CustomEvent('aura:widgets-changed'));
      return next;
    });
  };

  const isEnabled = (id: string) => instances.find(i => i.widgetId === id)?.enabled ?? false;

  const handleInstall = async () => {
    setInstallFeedback(null);
    const outcome: InstallOutcome = await triggerInstall();
    if (outcome === 'accepted') setInstallFeedback('✅ Installation lancée — cherchez l’icône Ka Rise sur votre écran d’accueil.');
    else if (outcome === 'dismissed') setInstallFeedback('Installation annulée. Vous pouvez réessayer à tout moment.');
    else if (outcome === 'already-installed') setInstallFeedback('Déjà installée — vous êtes en mode application (standalone).');
    else setInstallFeedback('Votre navigateur ne propose pas le bouton automatique — suivez les étapes ci-dessous.');
  };

  const handleEnablePushForPopups = async () => {
    const r = await enablePush();
    if (r.ok) setPushStatus('yes');
  };

  const setPopupCategory = (cat: PopupCategory, v: boolean) => {
    const next = { ...popupPrefs, categories: { ...popupPrefs.categories, [cat]: v } };
    setPopupPrefs(next);
    savePopupPrefs(next);
  };

  if (!isOpen) return null;

  const enabledCount = instances.filter(i => i.enabled).length || WIDGETS.length; // default show all

  return (
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true">
      <motion.div
        className="bg-panel border border-gold/40 rounded-2xl w-full max-w-5xl max-h-[96dvh] overflow-hidden flex flex-col shadow-card-hover"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-lapis-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-panel-gold border border-gold/40 text-gold-bright shrink-0"><Grid size={18} /></div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl text-pharaoh tracking-wide">Widgets & Popups</h2>
              <p className="font-mono text-[11px] text-pharaoh-muted hidden sm:block">Ajoutez Ka Rise à l’écran d’accueil • Choisissez vos widgets • Réglez vos popups</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-press p-2 rounded-xl bg-obsidian hover:bg-panel-hover border border-lapis-border text-pharaoh-muted"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 py-3 border-b border-lapis-border overflow-x-auto no-scrollbar shrink-0">
          {([
            { id: 'install' as Tab, label: 'Écran d’accueil', icon: Smartphone },
            { id: 'gallery' as Tab, label: `Galerie (${enabledCount})`, icon: Grid },
            { id: 'popups' as Tab, label: 'Popups & alertes', icon: Bell },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs whitespace-nowrap border ${tab===t.id ? 'bg-panel-gold border-gold/50 text-gold-bright shadow-gold' : 'bg-obsidian border-lapis-border text-pharaoh-muted hover:text-pharaoh'}`}>
              <t.icon size={16} /><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5">
          {/* INSTALL TAB */}
          {tab === 'install' && (
            <div className="space-y-5">
              {/* Status banner */}
              <div className={`rounded-2xl border p-4 flex items-start gap-3 ${installed ? 'bg-emerald/10 border-emerald/30' : installable ? 'bg-gold/10 border-gold/30' : 'bg-lapis/30 border-lapis-border'}`}>
                <div className={`p-2 rounded-xl border shrink-0 ${installed ? 'bg-emerald/20 border-emerald/40 text-emerald' : 'bg-panel-gold border-gold/40 text-gold-bright'}`}>
                  {installed ? <CheckCircle2 size={18} /> : <Download size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm text-pharaoh">{installed ? 'Mode application actif — déjà installée' : installable ? 'Prête à installer' : platform==='ios' ? 'Installation manuelle (iOS)' : 'Installation disponible'}</p>
                  <p className="font-mono text-[11px] text-pharaoh-muted mt-1">
                    {installed
                      ? 'Ka Rise tourne en mode standalone. Vos widgets PWA sont épinglables : appui long sur l’icône → Widgets.'
                      : installable
                      ? 'Votre navigateur propose l’installation en un clic. Ajoutez Ka Rise à l’écran d’accueil pour le widget et les notifications même app fermée.'
                      : 'Suivez les étapes manuelles ci-dessous — même résultat, juste un geste de plus.'}
                  </p>
                  {!installed && (
                    <button onClick={handleInstall} className="btn-press mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-bright text-inverse font-mono text-xs font-bold inline-flex items-center gap-2">
                      <Download size={16} /> Installer sur l’écran d’accueil
                    </button>
                  )}
                  {installFeedback && <p className="font-mono text-[11px] text-gold-bright mt-2">{installFeedback}</p>}
                </div>
              </div>

              {/* Platform steps */}
              <div className="rounded-2xl border border-lapis-border bg-obsidian/40 p-4">
                <h3 className="font-display text-sm text-pharaoh flex items-center gap-2">
                  {platform==='desktop' ? <Monitor size={16} /> : <Smartphone size={16} />} {instructions.title}
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-lapis-border text-pharaoh-muted ml-auto uppercase">{platform}</span>
                </h3>
                <ol className="mt-3 space-y-2">
                  {instructions.steps.map((s,i)=>(
                    <li key={i} className="flex gap-3 text-sm text-pharaoh-muted leading-relaxed">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-panel-gold border border-gold/40 text-gold-bright font-mono text-xs flex items-center justify-center">{i+1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {instructions.note && (
                  <div className="mt-3 p-3 rounded-xl bg-gold/10 border border-gold/20 text-[11px] text-pharaoh-muted flex gap-2">
                    <Sparkles size={14} className="shrink-0 text-gold" /><span>{instructions.note}</span>
                  </div>
                )}
              </div>

              {/* What you'll get as widget */}
              <div className="rounded-2xl border border-lapis-border bg-lapis/20 p-4">
                <h4 className="font-mono text-xs uppercase tracking-wide text-gold-bright">Ce que deviennent vos widgets sur l’accueil</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  {[
                    { tag:'ka-rise-status', name:'Statut Chasseur', desc:'Niveau, rang, XP, or, série. Se met à jour toutes les 15 min même app fermée.', icon: Crown },
                    { tag:'ka-rise-today', name:'Aujourd’hui', desc:'Vos 4 prochaines sessions + progression du jour. Tap → Emploi du temps.', icon: Calendar },
                    { tag:'ka-rise-weekly', name:'Objectifs Hebdo', desc:'Heures réalisées vs cibles par domaine. Tap → Bilan.', icon: Target },
                  ].map(w=>(
                    <div key={w.tag} className="rounded-xl border border-gold/20 bg-obsidian/50 p-3">
                      <div className="flex items-center gap-2 text-gold-bright font-display text-xs"><w.icon size={14} />{w.name}</div>
                      <p className="text-[11px] text-pharaoh-muted mt-1.5 leading-relaxed">{w.desc}</p>
                      <span className="font-mono text-[9px] text-pharaoh-subtle mt-2 inline-block">widget tag: {w.tag}</span>
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[10px] text-pharaoh-subtle mt-3">Honest note — les widgets PWA sont natifs sur Android (Chrome/Edge 113+) et Edge Desktop. Sur iOS la PWA garde ses raccourcis d’écran d’accueil (Quêtes, Focus, Notes) — le widget iOS natif nécessite une app compagnon.</p>
              </div>
            </div>
          )}

          {/* GALLERY TAB */}
          {tab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-pharaoh-muted">Activez les widgets que vous voulez voir dans l’Atelier. Les 3 premiers alimentent aussi le homescreen.</p>
                <span className="font-mono text-[10px] px-2 py-1 rounded-full bg-panel-gold border border-gold/40 text-gold-bright shrink-0">{enabledCount} / {WIDGETS.length} actifs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WIDGETS.map(def => {
                  const enabled = isEnabled(def.id);
                  const isHomescreenCapable = ['dashboard','today','weekly-targets'].includes(def.id);
                  return (
                    <div key={def.id} className={`rounded-2xl border p-3 flex flex-col gap-3 ${enabled ? 'bg-panel-gold/20 border-gold/40' : 'bg-obsidian/40 border-lapis-border opacity-80'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-obsidian border border-lapis-border flex items-center justify-center text-lg shrink-0">{def.icon}</span>
                          <div className="min-w-0">
                            <div className="font-display text-xs text-pharaoh truncate">{def.name}</div>
                            <div className="font-mono text-[10px] text-pharaoh-subtle truncate">{def.category} • {def.size}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleWidget(def)}
                          className={`btn-press relative inline-flex h-6 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors ${enabled ? 'bg-gold' : 'bg-lapis-light'}`}
                          aria-label={enabled ? 'Désactiver' : 'Activer'}
                        >
                          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      <p className="text-[11px] text-pharaoh-muted leading-relaxed line-clamp-2">{def.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {def.platforms.map(p=> (
                          <span key={p} className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full border ${p==='in-app'?'border-emerald/30 text-emerald bg-emerald/10':p==='android'?'border-gold/30 text-gold bg-gold/10':'border-lapis-border text-pharaoh-subtle'}`}>{p}</span>
                        ))}
                        {isHomescreenCapable && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-gold/40 text-gold-bright bg-gold/20">homescreen</span>}
                      </div>
                      {enabled && def.configFields && def.configFields.length>0 && (
                        <div className="pt-2 border-t border-lapis-border/50 space-y-1">
                          {def.configFields.map(f=>(
                            <div key={f.key} className="text-[11px] text-pharaoh-muted flex items-center justify-between">
                              <span className="font-mono text-[10px]">{f.label}</span>
                              <span className="font-mono text-[10px] text-gold">{String(f.default)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl bg-lapis/20 border border-lapis-border p-3 flex gap-2.5 text-[11px] text-pharaoh-muted">
                <Zap size={16} className="shrink-0 text-gold" />
                <span>Les widgets in-app s’affichent dans le futur Dock. Le homescreen (3 slots) reflète toujours Statut / Aujourd’hui / Objectifs Hebdo — même quand l’app est fermée, grâce au Service Worker.</span>
              </div>
            </div>
          )}

          {/* POPUPS TAB */}
          {tab === 'popups' && (
            <div className="space-y-5">
              {/* System push status */}
              <div className={`rounded-2xl border p-4 flex gap-3 ${pushStatus==='yes'?'bg-emerald/10 border-emerald/30':'bg-blood/10 border-blood/30'}`}>
                <div className={`p-2 rounded-xl border shrink-0 ${pushStatus==='yes'?'bg-emerald/20 border-emerald/40 text-emerald':'bg-blood/20 border-blood/40 text-blood'}`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-pharaoh">{pushStatus==='yes'?'Notifications système actives':pushStatus==='checking'?'Vérification…':'Notifications système inactives'}</p>
                  <p className="font-mono text-[11px] text-pharaoh-muted mt-1">
                    {pushStatus==='yes'
                      ? 'Votre téléphone recevra les popups même app fermée / écran verrouillé (via le serveur push).'
                      : 'Activez les notifications système pour recevoir les popups quand Ka Rise n’est pas au premier plan. Sinon vous aurez quand même les popups in-app (bannière dorée dans l’app).'}
                  </p>
                  {pushStatus!=='yes' && pushStatus!=='checking' && (
                    <button onClick={handleEnablePushForPopups} className="btn-press mt-3 px-4 py-2 rounded-xl bg-panel-gold border border-gold/50 text-gold-bright font-mono text-xs">Activer les notifications système</button>
                  )}
                </div>
              </div>

              {/* Master toggles */}
              <div className="rounded-2xl border border-lapis-border bg-obsidian/40 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-sm text-pharaoh">Popups activés</p>
                    <p className="font-mono text-[11px] text-pharaoh-muted">Interrupteur général — coupe tout (in-app + système).</p>
                  </div>
                  <button onClick={()=>{ const n={...popupPrefs, enabled: !popupPrefs.enabled}; setPopupPrefs(n); savePopupPrefs(n); }} className={`btn-press relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${popupPrefs.enabled?'bg-gold':'bg-lapis-light'}`}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${popupPrefs.enabled?'translate-x-5':'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lapis-border bg-lapis/20">
                    <span className="text-sm text-pharaoh">Bannière in-app</span>
                    <input type="checkbox" checked={popupPrefs.inAppEnabled} onChange={e=>{const n={...popupPrefs, inAppEnabled:e.target.checked}; setPopupPrefs(n); savePopupPrefs(n);}} className="accent-gold" />
                  </label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lapis-border bg-lapis/20">
                    <span className="text-sm text-pharaoh">Popup système (OS)</span>
                    <input type="checkbox" checked={popupPrefs.systemEnabled} onChange={e=>{const n={...popupPrefs, systemEnabled:e.target.checked}; setPopupPrefs(n); savePopupPrefs(n);}} className="accent-gold" />
                  </label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lapis-border bg-lapis/20">
                    <span className="text-sm text-pharaoh">Son</span>
                    <input type="checkbox" checked={popupPrefs.soundEnabled} onChange={e=>{const n={...popupPrefs, soundEnabled:e.target.checked}; setPopupPrefs(n); savePopupPrefs(n);}} className="accent-gold" />
                  </label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lapis-border bg-lapis/20">
                    <span className="text-sm text-pharaoh">Vibration</span>
                    <input type="checkbox" checked={popupPrefs.hapticsEnabled} onChange={e=>{const n={...popupPrefs, hapticsEnabled:e.target.checked}; setPopupPrefs(n); savePopupPrefs(n);}} className="accent-gold" />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="font-mono text-xs text-pharaoh-muted">Anti-spam (min entre 2 popups du même tag)</label>
                  <select value={popupPrefs.frequencyCapMinutes} onChange={e=>{const n={...popupPrefs, frequencyCapMinutes: Number(e.target.value)}; setPopupPrefs(n); savePopupPrefs(n);}} className="bg-obsidian border border-lapis-border rounded-xl px-2 py-1.5 font-mono text-xs text-white">
                    <option value={0}>Aucun</option>
                    <option value={2}>2 min</option>
                    <option value={5}>5 min</option>
                    <option value={15}>15 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>

              {/* Per-category */}
              <div className="rounded-2xl border border-lapis-border bg-obsidian/40 p-4">
                <h4 className="font-mono text-xs uppercase tracking-wide text-gold-bright">Par catégorie</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {(Object.keys(CATEGORY_LABELS) as PopupCategory[]).map(cat=>(
                    <label key={cat} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${popupPrefs.categories[cat]?'bg-panel-gold/20 border-gold/30':'bg-lapis/20 border-lapis-border opacity-70'}`}>
                      <span className="text-sm text-pharaoh">{CATEGORY_LABELS[cat]}</span>
                      <input type="checkbox" checked={!!popupPrefs.categories[cat]} onChange={e=>setPopupCategory(cat, e.target.checked)} className="accent-gold" />
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet hours */}
              <div className="rounded-2xl border border-lapis-border bg-obsidian/40 p-4 space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={popupPrefs.quietHours.enabled} onChange={e=>{const n={...popupPrefs, quietHours:{...popupPrefs.quietHours, enabled:e.target.checked}}; setPopupPrefs(n); savePopupPrefs(n);}} className="accent-gold" />
                  <span className="font-display text-sm text-pharaoh">Heures silencieuses</span>
                  <span className="font-mono text-[11px] text-pharaoh-muted">aucun popup pendant cette plage</span>
                </label>
                {popupPrefs.quietHours.enabled && (
                  <div className="flex items-center gap-3">
                    <input type="time" value={popupPrefs.quietHours.start} onChange={e=>{const n={...popupPrefs, quietHours:{...popupPrefs.quietHours, start:e.target.value}}; setPopupPrefs(n); savePopupPrefs(n);}} className="bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-xs text-white" />
                    <span className="text-pharaoh-muted">→</span>
                    <input type="time" value={popupPrefs.quietHours.end} onChange={e=>{const n={...popupPrefs, quietHours:{...popupPrefs.quietHours, end:e.target.value}}; setPopupPrefs(n); savePopupPrefs(n);}} className="bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-xs text-white" />
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-gold/10 border border-gold/20 p-3 flex gap-2 text-[11px] text-pharaoh-muted">
                <AlertTriangle size={14} className="shrink-0 text-gold" />
                <span>Les popups « session » utilisent aussi le délai d’alerte de Personnaliser (2–15 min avant chaque bloc). Heures silencieuses = les deux couches sont coupées.</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-lapis-border flex justify-end shrink-0">
          <button onClick={onClose} className="btn-press px-5 py-2 rounded-xl bg-panel-gold border border-gold/50 text-gold-bright font-mono text-xs uppercase">Fermer</button>
        </div>
      </motion.div>
    </div>
  );
};
