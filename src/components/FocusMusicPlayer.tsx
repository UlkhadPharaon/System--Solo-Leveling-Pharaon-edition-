import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Plus, Trash2, Play, Pause, SkipForward, Volume2, ListMusic } from './ui/PharaohIcons';
import {
  StoredSong,
  addSong,
  listSongs,
  getSongBlob,
  deleteSong,
  getPreferredSongId,
  setPreferredSongId,
  formatSongDuration,
} from '../lib/musicLibrary';

interface MusicPlayerProps {
  /** Called when playback starts/stops (used to stop synth ambience). */
  onPlaybackChange?: (playing: boolean) => void;
  /** The player stops itself when this flips to false (session end). */
  sessionRunning?: boolean;
}

export const FocusMusicPlayer: React.FC<MusicPlayerProps> = ({ onPlaybackChange, sessionRunning }) => {
  const [songs, setSongs] = useState<StoredSong[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load library on mount
  useEffect(() => {
    listSongs().then((list) => {
      setSongs(list);
      const pref = getPreferredSongId();
      if (pref && list.some((s) => s.id === pref)) setCurrentId(pref);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const playSong = useCallback(
    async (id: string) => {
      if (currentId !== id || !audioRef.current) {
        audioRef.current?.pause();
        const blob = await getSongBlob(id);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
        setCurrentId(id);
        setPreferredSongId(id);
        // Free the object URL when this audio is replaced later
        audio.addEventListener('play', () => onPlaybackChange?.(true));
        audio.addEventListener('pause', () => onPlaybackChange?.(false));
      }
      try {
        await audioRef.current?.play();
        setPlaying(true);
        onPlaybackChange?.(true);
      } catch {
        setPlaying(false);
      }
    },
    [currentId, volume, onPlaybackChange]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    onPlaybackChange?.(false);
  }, [onPlaybackChange]);

  // Auto-stop when the focus session is no longer running
  useEffect(() => {
    if (sessionRunning === false && playing) pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRunning]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setLoading(true);
    try {
      const added: StoredSong[] = [];
      for (const file of Array.from(files)) {
        if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)) {
          added.push(await addSong(file));
        }
      }
      setSongs((prev) => [...prev, ...added]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentId) {
      pause();
      audioRef.current = null;
      setCurrentId(null);
      setPreferredSongId(null);
    }
    await deleteSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const skipNext = () => {
    if (!songs.length) return;
    const idx = songs.findIndex((s) => s.id === currentId);
    const next = songs[(idx + 1) % songs.length];
    audioRef.current = null; // force reload
    playSong(next.id);
  };

  const adjustVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const current = songs.find((s) => s.id === currentId);

  return (
    <div className="bg-panel border border-lapis-border rounded-2xl p-4 space-y-3 anim-in">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-pharaoh flex items-center gap-2 uppercase">
          <Music size={16} color="var(--color-gold)" />
          Mes Musiques de Focus
        </span>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="btn-press font-mono text-[10px] text-pharaoh-muted hover:text-gold transition-colors flex items-center gap-1"
        >
          <ListMusic size={14} />
          {expanded ? 'Réduire' : `${songs.length} morceau${songs.length !== 1 ? 'x' : ''}`}
        </button>
      </div>

      {/* Now playing + transport */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (current ? (playing ? pause() : playSong(current.id)) : songs[0] && playSong(songs[0].id))}
          className="btn-press w-11 h-11 rounded-xl bg-panel-gold text-gold-bright border border-gold/50 shadow-gold flex items-center justify-center shrink-0"
          title={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? <Pause size={20} color="var(--color-gold-bright)" /> : <Play size={20} color="var(--color-gold-bright)" style={{ marginLeft: 2 }} />}
        </button>
        <button
          onClick={skipNext}
          disabled={!songs.length}
          className="btn-press w-9 h-9 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted hover:text-gold hover:border-gold-dim flex items-center justify-center shrink-0 disabled:opacity-40"
          title="Morceau suivant"
        >
          <SkipForward size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-pharaoh truncate">
            {current ? (playing ? '▶ ' : '❚❚ ') + current.name : 'Aucun morceau sélectionné'}
          </div>
          <div className="font-mono text-[10px] text-pharaoh-subtle">
            {current ? formatSongDuration(current.durationSec) : '—'} • boucle automatique
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Volume2 size={16} className="text-pharaoh-muted" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => adjustVolume(Number(e.target.value))}
            className="w-16 accent-gold"
            title="Volume"
          />
        </div>
      </div>

      {/* Library */}
      {expanded && (
        <div className="space-y-2 anim-in">
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {songs.length === 0 && (
              <p className="font-mono text-[11px] text-pharaoh-subtle text-center py-3">
                Ajoutez vos musiques préférées (MP3, WAV, OGG…) — elles restent stockées sur votre appareil.
              </p>
            )}
            {songs.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  song.id === currentId ? 'bg-panel-gold border-gold/50' : 'bg-obsidian border-lapis-border hover:border-gold-dim'
                }`}
              >
                <button onClick={() => playSong(song.id)} className="btn-press text-gold shrink-0">
                  <Play size={14} />
                </button>
                <span className="flex-1 font-mono text-[11px] text-pharaoh truncate">{song.name}</span>
                <span className="font-mono text-[10px] text-pharaoh-subtle">{formatSongDuration(song.durationSec)}</span>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="btn-press text-pharaoh-subtle hover:text-blood shrink-0"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="btn-press w-full py-2 rounded-xl font-mono text-[11px] font-medium bg-gradient-to-r from-gold-dim to-gold text-text-inverse flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Import en cours…' : 'Ajouter des musiques'}
          </button>
        </div>
      )}
    </div>
  );
};
