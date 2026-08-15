import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Plus, Trash2, Play, Pause, SkipForward, Volume2, ListMusic } from 'lucide-react';
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
    <div className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3 anim-in">
      <div className="flex items-center justify-between">
        <span className="mono text-xs font-semibold text-white flex items-center gap-2 uppercase">
          <Music className="w-4 h-4 accent-cyan" />
          Mes Musiques de Focus
        </span>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mono text-[10px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <ListMusic className="w-3.5 h-3.5" />
          {expanded ? 'Réduire' : `${songs.length} morceau${songs.length !== 1 ? 'x' : ''}`}
        </button>
      </div>

      {/* Now playing + transport */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (current ? (playing ? pause() : playSong(current.id)) : songs[0] && playSong(songs[0].id))}
          className="btn-press w-11 h-11 rounded-xl bg-card text-cyan-400 border border-cyan flex items-center justify-center shrink-0"
          title={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <button
          onClick={skipNext}
          disabled={!songs.length}
          className="btn-press w-9 h-9 rounded-xl bg-black/30 border border-soft text-slate-400 hover:text-slate-200 flex items-center justify-center shrink-0 disabled:opacity-40"
          title="Morceau suivant"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="mono text-xs text-white truncate">
            {current ? (playing ? '▶ ' : '❚❚ ') + current.name : 'Aucun morceau sélectionné'}
          </div>
          <div className="mono text-[10px] text-slate-500">
            {current ? formatSongDuration(current.durationSec) : '—'} • boucle automatique
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => adjustVolume(Number(e.target.value))}
            className="w-16 accent-cyan-400"
            title="Volume"
          />
        </div>
      </div>

      {/* Library */}
      {expanded && (
        <div className="space-y-2 anim-in">
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {songs.length === 0 && (
              <p className="mono text-[11px] text-slate-500 text-center py-3">
                Ajoutez vos musiques préférées (MP3, WAV, OGG…) — elles restent stockées sur votre appareil.
              </p>
            )}
            {songs.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  song.id === currentId ? 'bg-card border-cyan' : 'bg-black/30 border-soft hover:border-slate-600'
                }`}
              >
                <button onClick={() => playSong(song.id)} className="btn-press text-cyan-400 shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <span className="flex-1 mono text-[11px] text-slate-200 truncate">{song.name}</span>
                <span className="mono text-[10px] text-slate-500">{formatSongDuration(song.durationSec)}</span>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="btn-press text-slate-500 hover:text-red-400 shrink-0"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
            className="btn-press w-full py-2 rounded-xl mono text-[11px] font-medium bg-gradient-to-r from-cyan-600 to-cyan-400 text-black flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Import en cours…' : 'Ajouter des musiques'}
          </button>
        </div>
      )}
    </div>
  );
};
