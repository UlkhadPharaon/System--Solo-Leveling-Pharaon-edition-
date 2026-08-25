/**
 * Safety-net snapshots for destructive operations.
 *
 * The two irreversible actions in the app — the full data reset and the
 * backup import — previously destroyed weeks/months of progress with only
 * a confirmation dialog between the tap and the loss. This module captures
 * a single ROLLING snapshot of every `aura_*` localStorage key immediately
 * before such an action runs, and offers a one-click point-in-time restore
 * from the Gestion des données modal.
 *
 * Design constraints:
 * - Local-first: everything stays in localStorage, no network involved.
 * - Rolling: exactly ONE snapshot is kept (the newest) to bound storage use;
 *   a destructive action always overwrites the previous snapshot.
 * - Self-carrying: the snapshot key uses the `aura_` prefix so manual
 *   exports automatically include it.
 */

const SNAPSHOT_KEY = 'aura_safety_snapshot';

/** Shape persisted under SNAPSHOT_KEY. */
interface SafetySnapshot {
  _meta: {
    app: 'pharaoh-system';
    schemaVersion: 1;
    kind: 'safety-snapshot';
    reason: string;
    capturedAt: string; // ISO timestamp
    keyCount: number;
  };
  data: Record<string, unknown>;
}

/** Lightweight view for UI display (no bulk payload). */
export interface SnapshotInfo {
  reason: string;
  capturedAt: string;
  keyCount: number;
}

/** Dynamically collect every aura_* entry — mirrors the export logic so a
 *  newly-added slice can never be silently dropped from the snapshot. */
function collectAuraData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('aura_')) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key) as string);
    } catch {
      data[key] = localStorage.getItem(key); // raw string fallback
    }
  }
  return data;
}

/**
 * Capture a snapshot tagged with the reason it was taken. Returns false when
 * storage refused the write (quota exceeded / private mode) so callers can
 * warn instead of letting the user believe they are protected.
 */
export function captureSafetySnapshot(reason: string): boolean {
  try {
    const data = collectAuraData();
    const snapshot: SafetySnapshot = {
      _meta: {
        app: 'pharaoh-system',
        schemaVersion: 1,
        kind: 'safety-snapshot',
        reason,
        capturedAt: new Date().toISOString(),
        keyCount: Object.keys(data).length,
      },
      data,
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/** Validated reader — returns null for absent/corrupt/foreign payloads. */
export function getSafetySnapshot(): SafetySnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed._meta?.kind === 'safety-snapshot' &&
      parsed._meta.app === 'pharaoh-system' &&
      parsed.data &&
      typeof parsed.data === 'object'
    ) {
      return parsed as SafetySnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

/** UI-facing summary, null when no snapshot exists. */
export function getSafetySnapshotInfo(): SnapshotInfo | null {
  const snap = getSafetySnapshot();
  if (!snap) return null;
  return {
    reason: snap._meta.reason,
    capturedAt: snap._meta.capturedAt,
    keyCount: snap._meta.keyCount,
  };
}

/**
 * Point-in-time restore: wipes every current aura_* key EXCEPT the snapshot
 * itself, then replays the snapshot contents. Removing stale keys matters —
 * a plain merge would leave slices created after the snapshot (e.g. by a bad
 * import) polluting the restored state. The caller reloads the page.
 * Returns false when there is nothing valid to restore or a write failed.
 */
export function restoreSafetySnapshot(): boolean {
  const snap = getSafetySnapshot();
  if (!snap) return false;

  // Phase 1 — remove everything current except the snapshot key itself.
  const staleKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('aura_') || key === SNAPSHOT_KEY) continue;
    staleKeys.push(key);
  }
  try {
    staleKeys.forEach((key) => localStorage.removeItem(key));
    // Phase 2 — replay the snapshot.
    Object.entries(snap.data).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort persistent-storage upgrade. Chromium may evict localStorage of
 * sites under storage pressure unless persistence is granted; for an app
 * whose entire value lives locally, losing that fight equals total data loss.
 * Fire-and-forget: unsupported browsers simply skip it.
 */
export function requestDurableStorage(): void {
  try {
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    /* noop */
  }
}
