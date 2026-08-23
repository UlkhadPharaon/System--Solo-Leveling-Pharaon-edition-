import React, { useState, useEffect } from 'react';
import { Category, SchoolSubject, Domain } from '../types';
import { styleForDomain, DOMAIN_CATEGORY_STYLES } from '../lib/domains';
import {
  useActiveFocusSession,
  activeFocusRemainingMs,
  startActiveFocusSession,
  pauseActiveFocusSession,
  resumeActiveFocusSession,
  updateActiveFocusNotes,
  clearActiveFocusSession,
} from '../lib/activeFocusSession';
import { FocusMusicPlayer } from './FocusMusicPlayer';
import { globalAudio, AMBIENCE_TRACKS, type AmbientId } from '../lib/globalAudio';
import { useSyncExternalStore } from 'react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import {
  Clock, Play, Pause, RotateCcw, Volume2, VolumeX,
  Code, Film, GraduationCap, Briefcase, BookOpen,
  Target, Zap, Sparkles, Shield, Crown, Dumbbell, Wallet, Users, Flame,  type PharaohIcon,
} from './ui/PharaohIcons';
import { motion, AnimatePresence } from 'motion/react';

interface FocusTimerProps {
  initialCategory?: Category;
  /**
   * Completion is no longer driven by this component: the session lives in
   * `lib/activeFocusSession` and App.tsx's watcher grants XP when it expires —
   * even if the user has navigated away from the Focus tab (#1 UX audit).
   */
  onSessionComplete?: (session: unknown) => void;
  domains?: Domain[];
}

const DomainIconMap: Record<string, PharaohIcon> = {
  physical: Dumbbell,
  creative: Film,
  intellectual: GraduationCap,
  craft: Code,
  habit: Target,
  financial: Wallet,
  social: Users,
};

// Single source of truth: the Pharaoh palette per domain category (lib/domains).
const DomainColorMap: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_CATEGORY_STYLES).map(([key, style]) => [key, style.color])
);

const LEGACY_FOCUS_TABS = [
  { id: 'bangre_neo', label: 'Bangre Neo', icon: Code, color: '#7B3FE4' },
  { id: 'cinema', label: 'Cinéma & Films', icon: Film, color: '#D4A81E' },
  { id: 'school', label: 'Cours Scolaires', icon: GraduationCap, color: '#1D6FA5' },
  { id: 'must_do_work', label: 'Travail Incontournable', icon: Briefcase, color: '#F0C42D' },
  { id: 'learning', label: 'Lecture & Recherche', icon: BookOpen, color: '#C94277' },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialCategory = 'bangre_neo',
  domains = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [selectedSchoolSubject, setSelectedSchoolSubject] = useState<SchoolSubject>('math');
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const audioState = useSyncExternalStore(globalAudio.subscribe, globalAudio.getSnapshot, globalAudio.getSnapshot);
  const activeSound: AmbientId | 'none' = audioState.mode.kind === 'ambient' ? audioState.mode.id : 'none';
  const musicPlaying = audioState.mode.kind === 'song' && audioState.playing;

  // #1 UX audit: the running session lives in a module-level store (timestamp
  // based) — it survives tab switches and reloads. This component only renders
  // and mutates it; completion is driven by App's watcher, so XP is granted
  // even when this tab is unmounted.
  const activeSession = useActiveFocusSession();
  const isSessionActive = activeSession != null;
  const isRunning = activeSession != null && activeSession.pausedRemainingMs == null;

  // Per-second re-render while counting down (the store only notifies on
  // mutations, not on time passing).
  const [, setClockTick] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const secondsRemaining = activeSession
    ? Math.ceil(activeFocusRemainingMs(activeSession) / 1000)
    : targetMinutes * 60;

  // Adopt the live session's category when one exists (e.g. arriving from the
  // header pill); otherwise fall back to the domain-driven default.
  useEffect(() => {
    if (activeSession) return;
    if (domains.length > 0 && !domains.some((d) => `dom:${d.id}` === selectedCategory)) {
      setSelectedCategory(`dom:${domains[0].id}` as Category);
    } else if (domains.length === 0 && !LEGACY_FOCUS_TABS.some((t) => t.id === selectedCategory)) {
      setSelectedCategory('bangre_neo');
    }
  }, [initialCategory, domains, activeSession, selectedCategory]);

  // Mirror the live session's notes into the input (session may have been
  // started earlier from another mount), and clear them once it completes.
  useEffect(() => {
    if (activeSession) {
      if (activeSession.notes !== sessionNotes) setSessionNotes(activeSession.notes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);

  // NOTE (M1): audio intentionally KEEPS playing when this component
  // unmounts — globalAudio + the floating MiniPlayer handle playback and
  // controls from anywhere in the app.

  const displayCategory = activeSession ? activeSession.category : selectedCategory;
  const displaySubject = activeSession?.schoolSubject ?? selectedSchoolSubject;
  const displayTargetMinutes = activeSession?.targetMinutes ?? targetMinutes;

  const handleTogglePlay = () => {
    if (activeSession == null) {
      startActiveFocusSession({
        category: selectedCategory,
        schoolSubject: selectedCategory === 'school' ? selectedSchoolSubject : undefined,
        targetMinutes,
        notes: sessionNotes,
      });
      return;
    }
    if (activeSession.pausedRemainingMs == null) {
      pauseActiveFocusSession();
    } else {
      resumeActiveFocusSession();
    }
  };

  const requestReset = () => {
    // Trivial resets (fresh or barely started session) go through directly;
    // meaningful progress deserves one explicit confirmation (#3 UX audit).
    const elapsedMs = activeSession
      ? activeSession.targetMinutes * 60_000 - activeFocusRemainingMs(activeSession)
      : 0;
    if (elapsedMs > 60_000) {
      setShowResetConfirm(true);
    } else {
      confirmReset();
    }
  };

  const confirmReset = () => {
    clearActiveFocusSession();
    globalAudio.stop();
    setShowResetConfirm(false);
  };

  const handleSetDuration = (mins: number) => {
    setTargetMinutes(mins);
  };

  const handleNotesChange = (value: string) => {
    setSessionNotes(value);
    if (activeSession) updateActiveFocusNotes(value);
  };

  const handleToggleSound = (soundType: AmbientId) => {
    if (activeSound === soundType) {
      globalAudio.stop();
    } else {
      globalAudio.playAmbient(soundType);
    }
  };

  const formatTimerDisplay = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getCategoryLabel = (cat: Category): string => {
    if (cat.startsWith('dom:')) {
      const domain = domains.find((d) => `dom:${d.id}` === cat);
      return domain?.label || cat;
    }
    const tab = LEGACY_FOCUS_TABS.find((t) => t.id === cat);
    return tab?.label || cat;
  };

  const getCategoryIcon = (cat: Category) => {
    if (cat.startsWith('dom:')) {
      const domain = domains.find((d) => `dom:${d.id}` === cat);
      return domain ? DomainIconMap[domain.category] || Target : Target;
    }
    const tab = LEGACY_FOCUS_TABS.find((t) => t.id === cat);
    return tab?.icon || Target;
  };

  const getCategoryColor = (cat: Category) => {
    if (cat.startsWith('dom:')) {
      const domain = domains.find((d) => `dom:${d.id}` === cat);
      return domain ? DomainColorMap[domain.category] || DomainColorMap.intellectual : DomainColorMap.intellectual;
    }
    const tab = LEGACY_FOCUS_TABS.find((t) => t.id === cat);
    return tab?.color || DomainColorMap.intellectual;
  };

  const categoryItems = domains.length > 0
    ? domains.map((d) => ({ id: `dom:${d.id}` as string, label: d.label, domain: d }))
    : LEGACY_FOCUS_TABS;

  const progressPercent = displayTargetMinutes > 0
    ? Math.round(((displayTargetMinutes * 60 - secondsRemaining) / (displayTargetMinutes * 60)) * 100)
    : 0;

  const accentColor = getCategoryColor(displayCategory);
  const CategoryIcon = getCategoryIcon(displayCategory);

  return (
    <div className="max-w-3xl mx-auto space-y-8 anim-in">
      {/* Timer Container Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-8 md:p-10 text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }} />
          <div className="deco-corner deco-corner--br" style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-sapphire/10 text-sapphire border border-sapphire/40 flex items-center gap-1.5">
            <Clock size={14} style={{ color: 'var(--color-sapphire)' }} />
            Moteur de Concentration Interactif
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-light text-pharaoh tracking-tight">
            {getCategoryLabel(displayCategory)}
          </h2>
        </div>

        {/* Category Picker Tabs — Domain-driven when domains exist (onboarding v2).
            Locked while a session runs: switching mid-session used to silently
            discard the countdown (#1 UX audit). */}
        <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
          {categoryItems.map((cat, i) => {
            const isSel = displayCategory === cat.id;
            const Icon = 'domain' in cat ? DomainIconMap[cat.domain.category] || Target : cat.icon;
            const color = 'domain' in cat ? DomainColorMap[cat.domain.category] || DomainColorMap.intellectual : cat.color;

            return (
              <motion.button
                key={cat.id}
                onClick={() => { if (!isSessionActive) setSelectedCategory(cat.id as Category); }}
                disabled={isSessionActive}
                className={`btn-press relative flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase transition-all ${
                  isSessionActive ? 'opacity-40 cursor-not-allowed ' : ''
                }${
                  isSel
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <Icon size={16} className={`transition-all ${isSel ? 'anim-glow' : ''}`} style={{ color: isSel ? color : undefined }} />
                <span>{'domain' in cat ? cat.domain.label : cat.label}</span>
                {isSel && (
                  <motion.span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: color }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* If Category is School, show subject selector (locked while active) */}
        {displayCategory === 'school' && (
          <motion.div
            className="relative z-10 flex items-center justify-center gap-2 flex-wrap pt-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <span className="font-mono text-[10px] uppercase text-pharaoh-subtle">Matière :</span>
            {[
              { id: 'math', label: 'Mathématiques', color: '#1D6FA5' },
              { id: 'pc', label: 'Physique/Chimie', color: '#7B3FE4' },
              { id: 'svt', label: 'SVT (Biologie)', color: '#1E8A49' },
              { id: 'hist_geo', label: 'Hist & Géo', color: '#C94277' },
            ].map((sub) => (
              <motion.button
                key={sub.id}
                onClick={() => { if (!isSessionActive) setSelectedSchoolSubject(sub.id as SchoolSubject); }}
                disabled={isSessionActive}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase transition-all flex items-center gap-1.5 ${
                  isSessionActive ? 'opacity-40 cursor-not-allowed ' : ''
                }${
                  displaySubject === sub.id
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                }`}
                style={{ borderColor: displaySubject === sub.id ? 'var(--color-gold)' : sub.color + '44' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span style={{ color: sub.color }}>●</span>
                {sub.label}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Big Countdown Timer Display */}
        <div className="relative z-10 py-6 flex flex-col items-center justify-center">
          <motion.div
            className="relative"
            animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
          >
            <div className="font-mono text-7xl md:text-8xl lg:text-9xl font-light tabular-nums text-gradient-gold" style={{ textShadow: `0 0 40px ${accentColor}88` }}>
              {formatTimerDisplay(secondsRemaining)}
            </div>

            {/* Circular progress ring */}
            <svg className="absolute inset-0 -z-10" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="140" cy="140" r="120"
                fill="none" stroke="rgba(212,168,30,0.1)" strokeWidth="8"
              />
              <motion.circle
                cx="140" cy="140" r="120"
                fill="none" strokeWidth="8" strokeLinecap="round"
                style={{
                  stroke: `url(#timer-gradient-${displayCategory})`,
                  strokeDasharray: 754,
                  strokeDashoffset: 754 * (1 - progressPercent / 100),
                }}
                initial={{ strokeDashoffset: 754 }}
                animate={{ strokeDashoffset: 754 * (1 - progressPercent / 100) }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id={`timer-gradient-${displayCategory}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={accentColor} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <div className="w-64 max-w-full bg-obsidian rounded-full h-1.5 mt-6 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
                boxShadow: `0 0 8px ${accentColor}88`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="font-mono text-[10px] uppercase text-pharaoh-subtle mt-2">
            {isSessionActive && activeSession?.pausedRemainingMs != null
              ? 'Session en pause — reprenez quand vous voulez'
              : `${progressPercent}% de la session réalisé`}
          </span>
          {isRunning && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-gold/70 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
              Le minuteur continue même si vous changez d'onglet
            </span>
          )}
        </div>

        {/* Preset Durations — locked while a session is active (#1 UX audit) */}
        <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
          {[15, 25, 45, 60, 90].map((mins) => (
            <motion.button
              key={mins}
              onClick={() => handleSetDuration(mins)}
              disabled={isSessionActive}
              className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs font-medium transition-all ${
                isSessionActive ? 'opacity-40 cursor-not-allowed ' : ''
              }${
                targetMinutes === mins && !isSessionActive
                  ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                  : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mins}m
            </motion.button>
          ))}
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="relative z-10 flex items-center justify-center gap-4 pt-2">
          <motion.button
            onClick={handleTogglePlay}
            className={`btn-press w-16 h-16 rounded-xl flex items-center justify-center font-bold shadow-card transition-all ${
              isRunning
                ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                : 'bg-panel text-sapphire border-sapphire/30 hover:bg-panel-hover hover:border-sapphire/50 hover:shadow-glow-sapphire'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isRunning ? 360 : 0 }}
            transition={{ duration: 20, ease: 'linear', repeat: isRunning ? Infinity : 0 }}
            title={isSessionActive ? (isRunning ? 'Mettre en pause' : 'Reprendre la session') : 'Démarrer la session'}
          >
            {isRunning ? <Pause size={28} color="var(--color-gold-bright)" /> : <Play size={28} color="var(--color-sapphire)" style={{ marginLeft: 2 }} />}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ border: `2px solid ${isRunning ? 'var(--color-gold)' : 'var(--color-sapphire)'}`, opacity: 0.3 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: isRunning ? Infinity : 0, ease: 'easeOut' }}
            />
          </motion.button>

          <motion.button
            onClick={requestReset}
            className="btn-press w-12 h-12 rounded-xl bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-blood border-lapis-border flex items-center justify-center transition-all"
            whileHover={{ rotate: -90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Réinitialiser le Minuteur"
          >
            <RotateCcw size={22} />
          </motion.button>
        </div>

        {/* Ambient Soundscape Synthesizer Controls */}
        <motion.div
          className="relative z-10 bg-panel border border-lapis-border rounded-2xl p-4 text-left space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-pharaoh flex items-center gap-2 uppercase">
              <Volume2 size={16} style={{ color: 'var(--color-gold)' }} />
              Ambiance Sonore de Concentration
            </span>
            {(activeSound !== 'none' || musicPlaying) && (
              <span className="font-mono text-[10px] text-gold-bright tracking-wide font-medium animate-pulse">
                {musicPlaying ? 'Musique Active' : 'Audio Actif'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {AMBIENCE_TRACKS.map((track) => {
              const isAct = activeSound === track.id;
              return (
                <motion.button
                  key={track.id}
                  onClick={() => handleToggleSound(track.id)}
                  className={`btn-press relative px-3 py-2.5 rounded-xl font-mono text-[11px] border transition-all flex flex-col items-start gap-1 ${
                    isAct
                      ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                      : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  title={`Boucle réelle ${track.durationSec}s — continue même si vous changez de section`}
                >
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={14} color={isAct ? 'var(--color-gold)' : 'var(--color-sapphire)'} />
                    <span>{track.label}</span>
                  </div>
                  <span className="text-[9px] opacity-60">
                    {isAct && audioState.playing ? 'en lecture • ∞ boucle' : `boucle ${Math.round(track.durationSec / 60)} min`}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Custom Focus Music Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FocusMusicPlayer />
        </motion.div>

        {/* Session Reflection Notes Input */}
        <motion.div
          className="relative z-10 text-left space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block font-mono text-[10px] tracking-wide font-medium text-pharaoh-subtle">
            Résultat / Notes de la Session (Enregistré à la fin)
          </label>
          <input
            type="text"
            placeholder="ex. Résolu la série d'exercices de calcul / Rédigé les dialogues de la Scène 3..."
            value={sessionNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="w-full bg-obsidian border border-lapis-border rounded-xl px-4 py-3 text-sm text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
          />
        </motion.div>
      </motion.div>

      {/* Reset confirmation — only shown when meaningful progress would be lost */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Abandonner la session ?"
        message={`Cette session de ${activeSession?.targetMinutes ?? 0} min est en cours — la réinitialiser effacera le temps déjà investi (aucun XP ne sera attribué).`}
        confirmLabel="Abandonner"
        cancelLabel="Continuer la session"
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};