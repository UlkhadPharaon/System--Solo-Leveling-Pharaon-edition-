/**
 * First-generation widget collection — every widget is wired to REAL app state
 * (no fake data): the live snapshot comes from App.tsx, the remote one from
 * /api/widgets/snapshot. Add new widgets by appending to WIDGETS here.
 */

import React from 'react';
import {
  WidgetContext,
  WidgetDefinition,
  WidgetSnapshotData,
} from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent }) => (
  <div
    className="rounded-2xl border border-gold/25 bg-gradient-to-br from-obsidian/90 to-panel/80 p-3 h-full flex flex-col gap-2 overflow-hidden"
    style={accent ? { boxShadow: `inset 0 0 0 1px ${accent}22` } : undefined}
  >
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-[11px]">
    <span className="text-pharaoh-muted truncate">{label}</span>
    <span className="text-pharaoh font-mono">{value}</span>
  </div>
);

function pick(ctx: WidgetContext): { s: WidgetSnapshotData | null; app: WidgetContext['app'] } {
  // Inside the PWA prefer live state; in remote surfaces only `remote` exists.
  return { s: ctx.remote, app: ctx.app };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dashboard overview
// ─────────────────────────────────────────────────────────────────────────────

const DashboardWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => {
  const { s, app } = pick(ctx);
  const level = s?.player.level ?? app.level;
  const rank = s?.player.rank ?? app.rank;
  const xp = s?.player.xp ?? app.xp;
  const toNext = s?.player.xpToNextLevel ?? app.xpToNextLevel;
  const streak = s?.streakDays ?? app.streakDays;
  const pct = Math.min(100, Math.round((xp / Math.max(1, toNext)) * 100));
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="font-display text-xs tracking-widest text-gold-bright">STATUT CHASSEUR</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-gold/40 text-gold">{rank}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl text-pharaoh">NIV {level}</span>
        <span className="text-[10px] text-pharaoh-muted">🔥 série {streak} j</span>
      </div>
      <div className="h-1.5 rounded-full bg-lapis/50 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright" style={{ width: `${pct}%` }} />
      </div>
      <Row label="XP" value={`${xp} / ${toNext}`} />
      <Row label="Or" value={s?.player.gold ?? app.gold} />
      {ctx.navigate && (
        <button
          onClick={() => ctx.navigate('system_solo')}
          className="btn-press mt-auto text-[10px] font-mono uppercase tracking-wide text-gold-bright/80 hover:text-gold-bright text-left"
        >
          Ouvrir le Système →
        </button>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Today's schedule
// ─────────────────────────────────────────────────────────────────────────────

const TodayWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => {
  const { s, app } = pick(ctx);
  const sessions = (s?.today.sessions ?? app.todaySessions).slice(0, 4);
  const done = s?.today.completedSessions ?? app.todaySessions.filter((x) => x.done).length;
  const total = s?.today.totalSessions ?? app.todaySessions.length;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="font-display text-xs tracking-widest text-gold-bright">AUJOURD'HUI</span>
        <span className="font-mono text-[10px] text-pharaoh-muted">{done}/{total}</span>
      </div>
      {sessions.length === 0 ? (
        <p className="text-[11px] text-pharaoh-muted italic">Aucune session planifiée.</p>
      ) : (
        <ul className="space-y-1">
          {sessions.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.done ? 'bg-emerald' : 'bg-gold/60'}`} />
              <span className={`font-mono text-[10px] ${b.done ? 'text-pharaoh-subtle line-through' : 'text-pharaoh'}`}>{b.start}</span>
              <span className={`truncate ${b.done ? 'text-pharaoh-subtle line-through' : 'text-pharaoh'}`}>{b.title}</span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => ctx.navigate('dashboard')} className="btn-press mt-auto text-[10px] font-mono uppercase tracking-wide text-gold-bright/80 hover:text-gold-bright text-left">
        Emploi du temps →
      </button>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Quick actions
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'focus_timer', icon: '⏱️', label: 'Focus' },
  { id: 'dashboard', icon: '📜', label: 'Quêtes' },
  { id: 'notepad', icon: '📝', label: 'Notes' },
  { id: 'budget', icon: '💰', label: 'Trésorerie' },
];

const QuickActionsWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => (
  <Card>
    <span className="font-display text-xs tracking-widest text-gold-bright">ACTIONS RAPIDES</span>
    <div className="grid grid-cols-2 gap-2 mt-1">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.id}
          onClick={() => ctx.navigate(a.id)}
          className="btn-press flex flex-col items-center gap-1 rounded-xl border border-lapis-border bg-obsidian/60 py-2 hover:border-gold/50 transition-colors"
        >
          <span className="text-lg leading-none">{a.icon}</span>
          <span className="text-[9px] font-mono uppercase tracking-wide text-pharaoh-muted">{a.label}</span>
        </button>
      ))}
    </div>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. AI Mentor launcher (compact entry into the existing /api/ai-coach modal)
// ─────────────────────────────────────────────────────────────────────────────

const AiWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => (
  <Card accent="#7B3FE4">
    <span className="font-display text-xs tracking-widest text-gold-bright">MENTOR IA</span>
    <p className="text-[11px] text-pharaoh-muted leading-snug">
      Conseil instantané du Système, ancré dans vos domaines de vie.
    </p>
    <button
      onClick={() => ctx.navigate('__ai__')}
      className="btn-press mt-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/70 to-purple-700/60 border border-purple-500/40 text-white text-[11px] font-mono"
    >
      Invoquer le Mentor ✨
    </button>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Weekly targets progress
// ─────────────────────────────────────────────────────────────────────────────

const WeeklyTargetsWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => {
  const { s, app } = pick(ctx);
  const mode = String(ctx.config?.mode || 'bars');
  const targets = (s?.weeklyTargets ?? app.weeklyTargets).slice(0, 5);
  return (
    <Card>
      <span className="font-display text-xs tracking-widest text-gold-bright">OBJECTIFS HEBDO</span>
      {targets.length === 0 ? (
        <p className="text-[11px] text-pharaoh-muted italic">Aucun objectif — terminez l'Éveil.</p>
      ) : mode === 'list' ? (
        <div className="space-y-0.5">
          {targets.map((t, i) => (
            <Row key={i} label={t.label} value={`${t.hours}/${t.target} h`} />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {targets.map((t, i) => {
            const pct = Math.min(100, Math.round(((t.hours || 0) / Math.max(0.5, t.target || 0)) * 100));
            return (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-pharaoh-muted">
                  <span className="truncate max-w-[70%]">{t.label}</span>
                  <span>{t.hours}/{t.target} h</span>
                </div>
                <div className="h-1 rounded-full bg-lapis/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald' : 'bg-gold'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Notifications summary (real unread count from the notification center)
// ─────────────────────────────────────────────────────────────────────────────

const NotificationsWidget: React.FC<{ ctx: WidgetContext }> = ({ ctx }) => {
  const unread = ctx.app.unreadNotifications;
  return (
    <Card>
      <span className="font-display text-xs tracking-widest text-gold-bright">ALERTES SYSTÈME</span>
      <div className="flex items-center gap-3 mt-1">
        <span className={`font-display text-3xl ${unread > 0 ? 'text-gold-bright' : 'text-pharaoh-subtle'}`}>{unread}</span>
        <span className="text-[11px] text-pharaoh-muted">alerte(s) non lue(s)<br />dans le journal.</span>
      </div>
      <button onClick={() => ctx.navigate('system_solo')} className="btn-press mt-auto text-[10px] font-mono uppercase tracking-wide text-gold-bright/80 hover:text-gold-bright text-left">
        Ouvrir le journal →
      </button>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry — append new widgets HERE; everything else adapts automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const WIDGETS: WidgetDefinition[] = [
  {
    id: 'dashboard',
    name: 'Vue d’ensemble',
    description: 'Niveau, rang, XP, or et série en un coup d’œil.',
    icon: '👑',
    category: 'analytics',
    size: 'small',
    platforms: ['in-app', 'desktop', 'android'],
    refresh: '30s',
    component: DashboardWidget,
  },
  {
    id: 'today',
    name: 'Aujourd’hui',
    description: 'Vos sessions du jour avec avancement temps réel.',
    icon: '📅',
    category: 'productivity',
    size: 'medium',
    platforms: ['in-app', 'desktop', 'android'],
    refresh: '30s',
    component: TodayWidget,
  },
  {
    id: 'quick-actions',
    name: 'Actions rapides',
    description: 'Lancez Focus, Quêtes, Notes ou Trésorerie instantanément.',
    icon: '⚡',
    category: 'quick-actions',
    size: 'medium',
    platforms: ['in-app', 'desktop'],
    refresh: 'live',
    component: QuickActionsWidget,
  },
  {
    id: 'ai-mentor',
    name: 'Mentor IA',
    description: 'Invoque le Mentor du Système en un clic.',
    icon: '🧠',
    category: 'ai',
    size: 'small',
    platforms: ['in-app'],
    refresh: 'live',
    component: AiWidget,
  },
  {
    id: 'weekly-targets',
    name: 'Objectifs hebdo',
    description: 'Heures réalisées vs budget par domaine de vie.',
    icon: '🎯',
    category: 'analytics',
    size: 'large',
    platforms: ['in-app', 'desktop', 'android'],
    refresh: '30s',
    configFields: [
      {
        key: 'mode',
        label: 'Affichage',
        type: 'select',
        options: [
          { value: 'bars', label: 'Barres de progression' },
          { value: 'list', label: 'Liste compacte' },
        ],
        default: 'bars',
      },
    ],
    component: WeeklyTargetsWidget,
  },
  {
    id: 'notifications',
    name: 'Alertes système',
    description: 'Compteur d’alertes non lues du journal du Système.',
    icon: '🔔',
    category: 'notifications',
    size: 'small',
    platforms: ['in-app'],
    refresh: 'live',
    component: NotificationsWidget,
  },
];

export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((w) => w.id === id);
}
