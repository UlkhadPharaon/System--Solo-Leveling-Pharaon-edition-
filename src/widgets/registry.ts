/**
 * Widget framework — registry + types.
 *
 * A widget is a *declaration* (metadata) plus a *renderer* (React component)
 * plus an optional *snapshot selector* (how to derive its props from the app
 * state snapshot). Adding a new widget = adding one entry here + one component;
 * the gallery, the host grid, persistence and the desktop PiP window pick it
 * up automatically. Nothing else in the system hard-codes widget ids.
 *
 * Platform support honesty matrix (see docs/WIDGETS.md):
 *  - 'in-app'  : every browser, rendered in the Widgets tab host grid.
 *  - 'desktop' : Chromium Document Picture-in-Picture always-on-top mini window
 *                (Chrome/Edge 116+). NOT a real OS-desktop widget — browsers
 *                expose no such API; this is the closest reliable surface.
 *  - 'android' : served through /api/widgets/snapshot for a native companion
 *                (Kotlin Glance) or used via the installed PWA's home-screen
 *                shortcut; the web platform alone cannot create real Android
 *                home-screen widgets.
 */

import { ComponentType } from 'react';

export type WidgetCategory =
  | 'productivity'
  | 'notifications'
  | 'analytics'
  | 'ai'
  | 'projects'
  | 'system'
  | 'quick-actions'
  | 'information';

export type WidgetPlatform = 'in-app' | 'desktop' | 'android';

/** Shape handed to every widget renderer — derived from the live app state. */
export interface WidgetContext {
  /** Per-instance widget config (from WidgetInstance.config, optional). */
  config?: Record<string, string | boolean>;
  /** Live in-app data (only present inside the PWA). */
  app: {
    level: number;
    rank: string;
    xp: number;
    xpToNextLevel: number;
    gold: number;
    streakDays: number;
    todaySessions: { title: string; start: string; end: string; done: boolean }[];
    questsDone: number;
    questsTotal: number;
    weeklyTargets: { label: string; hours: number; target: number }[];
    focusMinutesToday: number;
    notesCount: number;
    unreadNotifications: number;
  };
  /** Remote snapshot from /api/widgets/snapshot (desktop PiP / companions). */
  remote: WidgetSnapshotData | null;
  /** Navigate the PWA to a deep link (no-op inside the PiP window → postMessage). */
  navigate: (tab: string) => void;
  isRemote: boolean;
}

/** Minimal mirror of server/widgetApi.ts response — kept structural on purpose. */
export interface WidgetSnapshotData {
  generatedAt: string;
  player: { level: number; rank: string; xp: number; xpToNextLevel: number; gold: number };
  streakDays: number;
  today: {
    date: string;
    sessions: { title: string; start: string; end: string; done: boolean }[];
    completedSessions: number;
    totalSessions: number;
  };
  quests: { done: number; total: number };
  weeklyTargets: { label: string; hours: number; target: number }[];
  focus: { minutesToday: number; sessionsTotal: number };
  notes: number;
  deepLinks: Record<string, string>;
}

export interface WidgetConfigField {
  key: string;
  label: string;
  type: 'select' | 'toggle';
  options?: { value: string; label: string }[];
  default: string | boolean;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji — zero bundle cost, consistent with the app's tone
  category: WidgetCategory;
  /** Grid span units (host grid = 4 columns on desktop, 2 on mobile). */
  size: 'small' | 'medium' | 'large';
  platforms: WidgetPlatform[];
  configFields?: WidgetConfigField[];
  refresh: 'live' | '30s' | 'manual';
  component: ComponentType<{ ctx: WidgetContext; config: Record<string, string | boolean> }>;
}

export type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  enabled: boolean;
  config: Record<string, string | boolean>;
};

export const WIDGET_STORAGE_KEY = 'aura_widgets_v1';

// ─────────────────────────────────────────────────────────────────────────────
// Persistence helpers (pure, unit-testable)
// ─────────────────────────────────────────────────────────────────────────────

export function loadInstances(raw: string | null): WidgetInstance[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is WidgetInstance =>
        i && typeof i.instanceId === 'string' && typeof i.widgetId === 'string'
    );
  } catch {
    return [];
  }
}

export function saveInstances(instances: WidgetInstance[]): string {
  return JSON.stringify(instances.slice(0, 24));
}

export function makeInstanceId(widgetId: string): string {
  return `w_${widgetId}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Default config for a widget definition. */
export function defaultConfig(def: WidgetDefinition): Record<string, string | boolean> {
  const cfg: Record<string, string | boolean> = {};
  def.configFields?.forEach((f) => { cfg[f.key] = f.default; });
  return cfg;
}
