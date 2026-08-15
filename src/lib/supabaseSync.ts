/**
 * Cloud Sync Engine — Supabase (anonymous auth) with graceful degradation to
 * local-only mode when unavailable/offline/unconfigured. Local-first:
 * localStorage remains the primary store; the cloud is a backup/multi-device
 * mirror, exactly like the previous Firebase engine it replaces.
 *
 * Strategy:
 * - On init: sign in anonymously against Supabase. If it fails (no keys in
 *   .env.local, network, disabled provider), stay in "local" mode — the app
 *   remains fully functional.
 * - Push: debounced (5s after last change) upsert of all `aura_*` localStorage
 *   keys as a single JSON blob in `user_state(uid, data, client_updated_ms)`.
 *   Also flushes when the tab hides/closes.
 * - Pull: on startup and when back online. Last-write-wins using
 *   client_updated_ms; pull only overwrites local data if remote is strictly
 *   newer than the last synced snapshot.
 *
 * Requires (scripts/supabase-migration.sql):
 *   create table user_state (
 *     uid uuid primary key references auth.users(id) on delete cascade,
 *     data jsonb not null default '{}'::jsonb,
 *     client_updated_ms bigint not null default 0
 *   );
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  userId: string | null;
  lastSyncAt: number | null;
  message: string;
}

const SYNCED_KEYS = [
  'aura_personalization',
  'aura_day_schedules',
  'aura_category_targets',
  'aura_subject_goals',
  'aura_victory_logs',
  'aura_notes',
  'aura_focus_sessions',
  'aura_transactions',
  'aura_budget_buckets',
  'aura_savings_goals',
  'aura_streak_records',
  'aura_project_phases',
  'aura_player_profile',
  'aura_dungeons',
  'aura_workout_routines',
  'aura_completed_workout_sessions',
  'aura_personal_records',
  'aura_body_metrics',
  'aura_daily_streak',
  'aura_domains',
  'aura_habit_checks',
];

const LOCAL_SYNC_META = 'aura_cloud_sync_meta';

/** Lazily-created singleton client — null when env vars are missing (local-only). */
let client: SupabaseClient | null = null;
let clientInitTried = false;

export function getSupabase(): SupabaseClient | null {
  if (clientInitTried) return client;
  clientInitTried = true;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    console.info('[sync] Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY absents) — mode local.');
    return null;
  }
  try {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (err) {
    console.warn('[sync] Supabase client init failed:', err);
    client = null;
  }
  return client;
}

type Listener = (state: SyncState) => void;

class CloudSyncEngine {
  private state: SyncState = { status: 'local', userId: null, lastSyncAt: null, message: 'Mode local' };
  private listeners = new Set<Listener>();
  private uid: string | null = null;
  private enabled = true;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedSnapshot: string | null = null;
  private initPromise: Promise<void> | null = null;

  init() {
    this.enabled = localStorage.getItem('aura_cloud_sync_enabled') !== 'false';
    if (!this.enabled) {
      this.setState({ status: 'local', message: 'Synchronisation désactivée' });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setState({ status: 'offline', message: 'Hors ligne — données locales' });
    }
    const supabase = getSupabase();
    if (!supabase) {
      this.setState({ status: 'local', message: 'Cloud non configuré — mode local' });
      return;
    }
    this.setState({ status: 'connecting', message: 'Connexion au nuage…' });
    this.initPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data?.user) {
          this.setState({ status: 'local', message: 'Cloud indisponible — mode local' });
          console.warn('[sync] anonymous sign-in failed:', error?.message);
          return;
        }
        this.uid = data.user.id;
        const pulled = await this.pull(true);
        if (!pulled) this.schedulePush(); // first device -> upload local
        this.setState({ status: 'synced', userId: this.uid, message: 'Synchronisé' });
      } catch (err: any) {
        this.setState({ status: 'local', message: 'Cloud indisponible — mode local' });
        console.warn('[sync] init failed:', err?.message);
      }
    })();

    // Flush pending changes when the tab is hidden or closed.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('beforeunload', () => this.flush());
    window.addEventListener('online', () => {
      if (this.uid) this.pull(true);
    });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    localStorage.setItem('aura_cloud_sync_enabled', on ? 'true' : 'false');
    if (!on) {
      this.setState({ status: 'local', userId: null, message: 'Synchronisation désactivée' });
    } else {
      this.init();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getState() {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private setState(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  /** Collect all synced keys as one serializable payload. */
  private snapshotLocal(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const key of SYNCED_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }
    return data;
  }

  /** Called by the app whenever any synced state changes. */
  schedulePush() {
    if (!this.enabled || !this.uid) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.flush(), 5000);
  }

  async flush() {
    const supabase = getSupabase();
    if (!this.enabled || !this.uid || !supabase) return;
    await this.initPromise;
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    const data = this.snapshotLocal();
    const serialized = JSON.stringify(data);
    if (serialized === this.lastSyncedSnapshot) return; // nothing new
    this.setState({ status: 'syncing', message: 'Sauvegarde…' });
    try {
      const { error } = await supabase.from('user_state').upsert(
        { uid: this.uid, data, client_updated_ms: Date.now() },
        { onConflict: 'uid' }
      );
      if (error) throw error;
      this.lastSyncedSnapshot = serialized;
      const meta = JSON.parse(localStorage.getItem(LOCAL_SYNC_META) || '{}');
      localStorage.setItem(LOCAL_SYNC_META, JSON.stringify({ ...meta, lastSyncAt: Date.now() }));
      this.setState({ status: 'synced', lastSyncAt: Date.now(), message: 'Synchronisé' });
    } catch (err: any) {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      this.setState({
        status: offline ? 'offline' : 'error',
        message: offline ? 'Hors ligne — reprise automatique' : 'Échec de sauvegarde',
      });
      if (!offline) console.warn('[sync] push failed:', err?.message);
    }
  }

  /** Download the remote row and restore it locally if newer. */
  async pull(showToast = false): Promise<boolean> {
    const supabase = getSupabase();
    if (!this.uid || !supabase) return false;
    try {
      const { data: remote, error } = await supabase
        .from('user_state')
        .select('data, client_updated_ms')
        .eq('uid', this.uid)
        .maybeSingle();
      if (error) throw error;
      if (!remote) return false;
      const meta = JSON.parse(localStorage.getItem(LOCAL_SYNC_META) || '{}');
      const localMs = Number(meta.lastSyncAt || 0);
      const remoteMs = Number(remote.client_updated_ms || 0);
      if (remoteMs <= localMs) return false; // local is authoritative

      const payload = (remote.data || {}) as Record<string, unknown>;
      for (const [key, value] of Object.entries(payload)) {
        if (SYNCED_KEYS.includes(key)) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }
      localStorage.setItem(LOCAL_SYNC_META, JSON.stringify({ lastSyncAt: remoteMs }));
      this.lastSyncedSnapshot = JSON.stringify(payload);
      if (showToast) this.setState({ message: 'Données restaurées du nuage' });
      window.dispatchEvent(new CustomEvent('aura:cloud-restored'));
      return true;
    } catch (err: any) {
      this.setState({ status: 'error', message: 'Échec de récupération' });
      console.warn('[sync] pull failed:', err?.message);
      return false;
    }
  }
}

export const cloudSync = new CloudSyncEngine();
