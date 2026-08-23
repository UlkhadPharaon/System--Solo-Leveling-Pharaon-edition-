/**
 * Global Audio Engine (M1+M2) — module-singleton audio playback that SURVIVES
 * tab switches. The old player kept its <audio> element inside FocusTimer's
 * component tree; navigating away unmounted it and killed the music.
 *
 * Everything lives here at module scope:
 *  - one HTMLAudioElement per source (never destroyed on navigation)
 *  - user songs from IndexedDB (musicLibrary)
 *  - built-in real ambient loops (public/ambience/*.webm, CC0, seamless loop)
 *
 * UI components (FocusMusicPlayer, MiniPlayer) are thin views over this store.
 */

export type AmbientId = 'rain' | 'waves' | 'brown_noise' | 'night_owl' | 'cafe';

export interface AmbientTrack {
  id: AmbientId;
  label: string;
  src: string;
  /** Approximate loop length in seconds — for the UI subtitle. */
  durationSec: number;
}

/**
 * Real recorded ambience, seamlessly looping.
 * Files live in public/ambience/ (CC0, see public/ambience/CREDITS.md).
 */
export const AMBIENCE_TRACKS: AmbientTrack[] = [
  { id: 'rain',         label: 'Pluie',              src: '/ambience/rain.webm',         durationSec: 240 },
  { id: 'waves',        label: 'Vagues',             src: '/ambience/waves.webm',        durationSec: 300 },
  { id: 'brown_noise',  label: 'Bruit Brun',         src: '/ambience/brown-noise.webm',  durationSec: 120 },
  { id: 'night_owl',    label: 'Nuit Calme',         src: '/ambience/night-owl.webm',    durationSec: 360 },
  { id: 'cafe',         label: 'Café Feutré',        src: '/ambience/cafe.webm',         durationSec: 300 },
];

type Mode = { kind: 'none' } | { kind: 'ambient'; id: AmbientId } | { kind: 'song'; songId: string };

interface AudioState {
  mode: Mode;
  playing: boolean;
  volume: number;
  currentSongName: string | null;
}

let audioEl: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

const state: AudioState = {
  mode: { kind: 'none' },
  playing: false,
  volume: Number(localStorage.getItem('aura_music_volume') ?? 0.7),
  currentSongName: null,
};

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): AudioState {
  return state;
}

/** React hook (useSyncExternalStore wrapper lives in useGlobalAudio). */
function ensureElement(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.volume = state.volume;
    audioEl.addEventListener('play', () => { state.playing = true; emit(); });
    audioEl.addEventListener('pause', () => { state.playing = false; emit(); });
    audioEl.addEventListener('ended', () => { state.playing = false; emit(); });
  }
  return audioEl;
}

async function loadAndPlay(src: string): Promise<boolean> {
  const el = ensureElement();
  if (el.src !== new URL(src, window.location.href).href) {
    el.src = src;
  }
  try {
    await el.play();
    return true;
  } catch {
    // Autoplay policy / missing file
    state.playing = false;
    emit();
    return false;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

async function playAmbient(id: AmbientId): Promise<void> {
  const track = AMBIENCE_TRACKS.find((t) => t.id === id);
  if (!track) return;
  state.mode = { kind: 'ambient', id };
  state.currentSongName = track.label;
  await loadAndPlay(track.src);
}

async function playSong(songId: string, name: string, blobLoader: () => Promise<Blob | null>): Promise<void> {
  const blob = await blobLoader();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const el = ensureElement();
  if (el.src.startsWith('blob:')) URL.revokeObjectURL(el.src);
  state.mode = { kind: 'song', songId };
  state.currentSongName = name;
  el.src = url;
  try {
    await el.play();
  } catch {
    state.playing = false;
    emit();
  }
}

function pause(): void {
  ensureElement().pause();
}

async function resume(): Promise<void> {
  if (state.mode.kind === 'none') return;
  await loadAndPlay(audioEl!.src);
}

function stop(): void {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.removeAttribute('src');
  audioEl.load();
  state.mode = { kind: 'none' };
  state.playing = false;
  state.currentSongName = null;
  emit();
}

function setVolume(v: number): void {
  state.volume = v;
  if (audioEl) audioEl.volume = v;
  localStorage.setItem('aura_music_volume', String(v));
  emit();
}

/** True when a focus session should keep the music alive. */
function isActive(): boolean {
  return state.mode.kind !== 'none';
}

export const globalAudio = {
  playAmbient,
  playSong,
  pause,
  resume,
  stop,
  setVolume,
  isActive,
  // store plumbing
  subscribe,
  getSnapshot,
  AMBIENCE_TRACKS,
};

export type { AudioState };

import { useSyncExternalStore } from 'react';

export function useGlobalAudio(): AudioState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
