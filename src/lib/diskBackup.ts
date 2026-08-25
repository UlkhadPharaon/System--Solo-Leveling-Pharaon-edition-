/**
 * Disk auto-backup (F5b) — durable history beyond the single rolling
 * localStorage snapshot. Uses the File System Access API to silently write a
 * JSON backup into a user-chosen folder every N days (and on demand).
 *
 * Browser support: Chromium only. Everywhere else the feature simply hides.
 * The directory handle is persisted in IndexedDB — localStorage cannot store
 * FileSystemHandle objects.
 */

const DB_NAME = 'ka-rise-backup';
const STORE = 'handles';
const HANDLE_KEY = 'backup-dir';
/** Re-ask permission at most once per day, not on every boot. */
const LAST_PROMPT_KEY = 'aura_backup_last_prompt';
const AUTO_BACKUP_INTERVAL_DAYS = 3;

interface MinimalFileHandle {
  name: string;
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

function idbOpen(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await idbOpen();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
  } catch {
    /* non-fatal */
  }
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await idbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function isDiskBackupSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window && typeof indexedDB !== 'undefined';
}

/**
 * Collect every aura_* key — mirrors the export/snapshot logic so new slices
 * are never silently missing from backups.
 */
function collectAuraData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('aura_')) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key) as string);
    } catch {
      data[key] = localStorage.getItem(key); // raw fallback
    }
  }
  return data;
}

/**
 * Prompt for a backup folder. MUST be called from a user gesture (click).
 * Returns false when unsupported or the user cancelled.
 */
export async function chooseBackupDirectory(): Promise<boolean> {
  if (!isDiskBackupSupported()) return false;
  try {
    // @ts-expect-error — showDirectoryPicker is not yet in TS DOM lib.
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'karise-backup' });
    await idbPut(HANDLE_KEY, handle);
    await writeBackupNow(handle as MinimalFileHandle, 'setup');
    return true;
  } catch {
    return false; // user dismissed the picker
  }
}

/** Write one dated JSON backup file into the stored folder. */
export async function writeBackupNow(
  dirHandle?: MinimalFileHandle,
  tag = 'auto',
): Promise<{ ok: boolean; fileName?: string }> {
  let handle = dirHandle;
  if (!handle) {
    handle = (await idbGet<MinimalFileHandle>(HANDLE_KEY)) ?? undefined;
    if (!handle) return { ok: false };
  }
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const fileName = `ka-rise-backup-${tag}-${stamp}.json`;
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify({ _meta: { app: 'pharaoh-system', kind: 'disk-backup', exportedAt: new Date().toISOString() }, ...collectAuraData() }, null, 2));
    await writable.close();
    return { ok: true, fileName };
  } catch {
    return { ok: false };
  }
}

/**
 * Boot-time entry point: if a folder is configured and the last auto-backup is
 * older than the interval, write one. Never prompts and never throws — a
 * background maintenance task must stay invisible when it has nothing to do.
 */
export async function runAutoBackupIfDue(): Promise<boolean> {
  if (!isDiskBackupSupported()) return false;
  const lastStr = (() => {
    try {
      return localStorage.getItem(LAST_PROMPT_KEY);
    } catch {
      return null;
    }
  })();
  if (lastStr && Date.now() - Number(lastStr) < AUTO_BACKUP_INTERVAL_DAYS * 86400000) return false;

  const res = await writeBackupNow(undefined, 'auto');
  if (res.ok) {
    try {
      localStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    } catch {
      /* non-fatal */
    }
  }
  return res.ok;
}
