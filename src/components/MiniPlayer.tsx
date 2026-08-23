/**
 * MiniPlayer — floating pill shown on EVERY tab while focus audio plays.
 * This is what makes music survive navigation: the audio element lives in
 * lib/globalAudio (module scope), this is just a control surface.
 */
import React from 'react';
import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Play, X, Volume2 } from './ui/PharaohIcons';
import { globalAudio } from '../lib/globalAudio';

export const MiniPlayer: React.FC = () => {
  const state = useSyncExternalStore(globalAudio.subscribe, globalAudio.getSnapshot, globalAudio.getSnapshot);

  const visible = state.mode.kind !== 'none';
  const ambientId = state.mode.kind === 'ambient' ? state.mode.id : null;
  const label =
    state.mode.kind === 'ambient'
      ? globalAudio.AMBIENCE_TRACKS.find((t) => t.id === ambientId)?.label ?? 'Ambiance'
      : state.mode.kind === 'song'
      ? state.currentSongName || 'Musique'
      : '';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="fixed left-1/2 -translate-x-1/2 z-[60] bottom-[calc(4.6rem+env(safe-area-inset-bottom,0px))] lg:bottom-5"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-obsidian/95 border border-gold/40 shadow-card-hover backdrop-blur-md">
            <span className="relative flex h-2 w-2 shrink-0">
              {state.playing && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${state.playing ? 'bg-emerald' : 'bg-pharaoh-subtle'}`} />
            </span>

            <button
              onClick={() => (state.playing ? globalAudio.pause() : globalAudio.resume())}
              className="btn-press w-8 h-8 rounded-lg bg-panel-gold text-gold-bright border border-gold/50 flex items-center justify-center shrink-0"
              title={state.playing ? 'Pause' : 'Reprendre'}
              aria-label={state.playing ? 'Pause musique' : 'Reprendre la musique'}
            >
              {state.playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
            </button>

            <div className="min-w-0 max-w-[140px] sm:max-w-[220px]">
              <p className="font-mono text-[11px] text-gold-bright truncate leading-tight">{label}</p>
              <p className="font-mono text-[9px] text-pharaoh-subtle uppercase tracking-wider leading-tight">
                Focus Audio
              </p>
            </div>

            <Volume2 size={13} className="text-pharaoh-muted shrink-0 hidden sm:block" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.volume}
              onChange={(e) => globalAudio.setVolume(Number(e.target.value))}
              className="w-16 accent-gold hidden sm:block"
              aria-label="Volume"
            />

            <button
              onClick={() => globalAudio.stop()}
              className="btn-press w-7 h-7 rounded-lg text-pharaoh-muted hover:text-blood hover:bg-blood/10 flex items-center justify-center shrink-0"
              title="Arrêter l'audio"
              aria-label="Arrêter la musique"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
