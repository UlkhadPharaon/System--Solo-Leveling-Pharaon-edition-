/**
 * Focus Music Library — custom user songs stored in IndexedDB
 * so they survive page reloads (localStorage cannot hold large audio blobs).
 */

export interface StoredSong {
  id: string;
  name: string;
  durationSec: number | null;
  createdAt: number;
}

const DB_NAME = 'aura_system_db';
const STORE = 'focus_songs';
const META_KEY = 'aura_focus_playlist_meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

export interface SongWithBlob extends StoredSong {
  blob: Blob;
}

export async function addSong(file: File): Promise<StoredSong> {
  const id = 'song-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const record: SongWithBlob = {
    id,
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 80),
    durationSec: await probeDuration(file),
    createdAt: Date.now(),
    blob: file,
  };
  await tx('readwrite', (s) => s.put(record));
  bumpMeta();
  return { id: record.id, name: record.name, durationSec: record.durationSec, createdAt: record.createdAt };
}

export async function listSongs(): Promise<StoredSong[]> {
  try {
    const all = await tx<SongWithBlob[]>('readonly', (s) => s.getAll() as IDBRequest<SongWithBlob[]>);
    return all
      .map(({ blob: _blob, ...meta }) => meta)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function getSongBlob(id: string): Promise<Blob | null> {
  try {
    const rec = await tx<SongWithBlob | undefined>('readonly', (s) => s.get(id) as IDBRequest<SongWithBlob | undefined>);
    return rec ? rec.blob : null;
  } catch {
    return null;
  }
}

export async function deleteSong(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
  bumpMeta();
}

/** Last selected song id + volume, kept in localStorage for convenience. */
export function getPreferredSongId(): string | null {
  return localStorage.getItem(META_KEY);
}
export function setPreferredSongId(id: string | null) {
  if (id) localStorage.setItem(META_KEY, id);
  else localStorage.removeItem(META_KEY);
}

function bumpMeta() {
  // trigger any listeners via a storage-friendly timestamp
  localStorage.setItem(META_KEY + '_updated', String(Date.now()));
}

function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      const done = (v: number | null) => {
        URL.revokeObjectURL(url);
        resolve(v);
      };
      audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
      audio.onerror = () => done(null);
      audio.src = url;
      setTimeout(() => done(null), 5000);
    } catch {
      resolve(null);
    }
  });
}

export function formatSongDuration(sec: number | null): string {
  if (sec == null) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
