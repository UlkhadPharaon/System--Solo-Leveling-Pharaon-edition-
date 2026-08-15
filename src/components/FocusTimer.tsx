import React, { useState, useEffect, useRef } from 'react';
import { Category, SchoolSubject, FocusSession, Domain } from '../types';
import { styleForDomain } from '../lib/domains';
import { audioSynth } from '../lib/audioSynthesizer';
import { FocusMusicPlayer } from './FocusMusicPlayer';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Code, 
  Film, 
  GraduationCap, 
  Briefcase, 
  BookOpen
} from 'lucide-react';

interface FocusTimerProps {
  initialCategory?: Category;
  onSessionComplete: (session: FocusSession) => void;
  /** User-defined domains (onboarding v2) — when present, the category picker
   *  lists domains instead of the fixed legacy list. */
  domains?: Domain[];
}

const LEGACY_FOCUS_TABS = [
  { id: 'bangre_neo', label: 'Bangre Neo', icon: Code },
  { id: 'cinema', label: 'Cinéma & Films', icon: Film },
  { id: 'school', label: 'Cours Scolaires', icon: GraduationCap },
  { id: 'must_do_work', label: 'Travail Incontournable', icon: Briefcase },
  { id: 'learning', label: 'Lecture & Recherche', icon: BookOpen },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialCategory = 'bangre_neo',
  onSessionComplete,
  domains = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [selectedSchoolSubject, setSelectedSchoolSubject] = useState<SchoolSubject>('math');
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  
  // Ambient Audio State
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'focus_noise' | 'waves' | 'binaural'>('none');
  const [musicPlaying, setMusicPlaying] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Domain-driven profiles: if the legacy initial category isn't among the
    // domain tabs, fall back to the first domain instead of a stale label.
    if (domains.length > 0 && (typeof initialCategory !== 'string' || !initialCategory.startsWith('dom:'))) {
      setSelectedCategory(`dom:${domains[0].id}` as Category);
    } else {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, domains]);

  // Tick only decrements; completion is handled by a dedicated effect so
  // side effects never run inside a state updater (StrictMode-safe).
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const completionFiredRef = useRef<string>('');
  useEffect(() => {
    if (isRunning && secondsRemaining === 0) {
      const stamp = `${targetMinutes}-${sessionNotes}`;
      if (completionFiredRef.current !== stamp) {
        completionFiredRef.current = stamp;
        handleTimerComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    audioSynth.stopSound();
    setActiveSound('none');
    audioSynth.playGongChime();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Save session — record the time actually elapsed, not just the preset (#21)
    const completedMins = Math.max(1, Math.round((targetMinutes * 60 - secondsRemaining) / 60)) || targetMinutes;
    const session: FocusSession = {
      id: 'fs-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      title: `Session ${getCategoryLabel(selectedCategory)}`,
      category: selectedCategory,
      domainId: typeof selectedCategory === 'string' && selectedCategory.startsWith('dom:')
        ? selectedCategory.slice(4)
        : undefined,
      schoolSubject: selectedCategory === 'school' ? selectedSchoolSubject : undefined,
      durationMinutes: completedMins,
      notes: sessionNotes || 'Session de travail profond accomplie.',
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSessionComplete(session);
    setSessionNotes('');
  };

  const handleSetDuration = (mins: number) => {
    setIsRunning(false);
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleToggleSound = (soundType: 'rain' | 'focus_noise' | 'waves' | 'binaural') => {
    if (activeSound === soundType) {
      audioSynth.stopSound();
      setActiveSound('none');
    } else {
      audioSynth.playSound(soundType);
      setActiveSound(soundType);
    }
  };

  // Custom music takes priority: starting a song mutes the synth ambience.
  const handleMusicPlaybackChange = (playing: boolean) => {
    setMusicPlaying(playing);
    if (playing && activeSound !== 'none') {
      audioSynth.stopSound();
      setActiveSound('none');
    }
  };

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCategoryLabel = (cat: Category) => {
    if (typeof cat === 'string' && cat.startsWith('dom:')) {
      const dom = domains.find((d) => d.id === cat.slice(4));
      return dom ? dom.label : 'Mode Focus';
    }
    switch (cat) {
      case 'bangre_neo': return 'Bangre Neo Lab';
      case 'cinema': return 'Cinéma & Scénario';
      case 'school': return 'Leçons Académiques';
      case 'must_do_work': return 'Travail Incontournable';
      case 'learning': return 'Lecture / Podcasts';
      default: return 'Mode Focus';
    }
  };

  const progressPercent = Math.round(((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Timer Container Card */}
      <div className="relative overflow-hidden bg-card border border-soft rounded-xl p-8 md:p-10 text-center space-y-8">
        <div className="flex flex-col items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 accent-cyan" />
            Moteur de Concentration Interactif
          </span>
          <h2 className="serif text-3xl font-light italic text-white tracking-tight">
            {getCategoryLabel(selectedCategory)}
          </h2>
        </div>

        {/* Category Picker Tabs — Domain-driven when domains exist (onboarding v2) */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(domains.length > 0
            ? domains.map((d) => ({
                id: `dom:${d.id}` as string,
                label: d.label,
                icon: Clock,
                domain: d,
              }))
            : LEGACY_FOCUS_TABS
          ).map((cat: any) => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as Category);
                  setIsRunning(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl mono text-xs uppercase transition-all ${
                  isSel
                    ? 'bg-[#051428] text-cyan-400 border border-cyan font-medium'
                    : 'bg-cyan-950/40 text-slate-400 hover:text-slate-200 border border-soft'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? 'accent-cyan' : 'text-slate-400'}`} />
                <span>{cat.domain ? cat.domain.label : cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* If Category is School, show subject selector */}
        {selectedCategory === 'school' && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <span className="mono text-[10px] uppercase opacity-60">Matière :</span>
            {[
              { id: 'math', label: 'Mathématiques' },
              { id: 'pc', label: 'Physique/Chimie' },
              { id: 'svt', label: 'SVT (Biologie)' },
              { id: 'hist_geo', label: 'Hist & Géo' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSchoolSubject(sub.id as SchoolSubject)}
                className={`px-3 py-1 rounded-xl mono text-[11px] uppercase ${
                  selectedSchoolSubject === sub.id
                    ? 'bg-cyan-400 text-black font-semibold'
                    : 'bg-cyan-950/40 text-slate-400 border border-soft'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Big Countdown Timer Display */}
        <div className="relative py-6 flex flex-col items-center justify-center">
          <div className="mono text-7xl md:text-8xl font-light accent-cyan tracking-tight">
            {formatTimerDisplay(secondsRemaining)}
          </div>

          <div className="w-64 max-w-full bg-white/5 rounded-none h-1.5 mt-6 overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="mono text-[10px] uppercase opacity-60 mt-2">{progressPercent}% de la session réalisé</span>
        </div>

        {/* Preset Durations */}
        <div className="flex items-center justify-center gap-2">
          {[15, 25, 45, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSetDuration(mins)}
              className={`px-3 py-1 rounded-xl mono text-xs font-medium transition-all ${
                targetMinutes === mins && !isRunning
                  ? 'bg-card text-cyan-400 border border-cyan'
                  : 'bg-cyan-950/40 text-slate-400 hover:text-slate-200 border border-soft'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-black font-bold shadow-md transition-all active:scale-95 ${
              isRunning
                ? 'bg-cyan-400 text-black'
                : 'bg-card text-cyan-400 border border-cyan hover:bg-card-hover'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current text-black" /> : <Play className="w-6 h-6 fill-current text-cyan-400 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsRemaining(targetMinutes * 60);
              audioSynth.stopSound();
              setActiveSound('none');
            }}
            className="w-11 h-11 rounded-xl bg-cyan-950/40 hover:bg-[#222630] border border-soft text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all"
            title="Réinitialiser le Minuteur"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient Soundscape Synthesizer Controls */}
        <div className="bg-cyan-950/40 border border-soft rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="mono text-xs font-semibold text-white flex items-center gap-2 uppercase">
              <Volume2 className="w-4 h-4 accent-cyan" />
              Ambiance Sonore de Concentration
            </span>
            {(activeSound !== 'none' || musicPlaying) && (
              <span className="mono text-[10px] accent-cyan tracking-wide font-medium animate-pulse">
                {musicPlaying ? 'Musique Active' : 'Audio Actif'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'rain', label: 'Pluie Douce' },
              { id: 'focus_noise', label: 'Bruit Brun' },
              { id: 'waves', label: 'Vagues d’Océan' },
              { id: 'binaural', label: 'Ondes Alpha (432Hz)' },
            ].map((sound) => {
              const isAct = activeSound === sound.id;
              return (
                <button
                  key={sound.id}
                  onClick={() => handleToggleSound(sound.id as any)}
                  className={`px-3 py-2 rounded-xl mono text-[11px] border transition-all flex items-center justify-between ${
                    isAct
                      ? 'bg-card text-cyan-400 border-cyan'
                      : 'bg-black/30 text-slate-400 hover:text-slate-200 border-soft'
                  }`}
                >
                  <span>{sound.label}</span>
                  {isAct ? <Volume2 className="w-3.5 h-3.5 accent-cyan" /> : <VolumeX className="w-3.5 h-3.5 opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Focus Music Player (user songs, stored locally) */}
        <FocusMusicPlayer onPlaybackChange={handleMusicPlaybackChange} sessionRunning={isRunning} />

        {/* Session Reflection Notes Input */}
        <div className="text-left space-y-2">
          <label className="block mono text-[10px] tracking-wide font-medium opacity-70">
            Résultat / Notes de la Session (Enregistré à la fin)
          </label>
          <input
            type="text"
            placeholder="ex. Résolu la série d’exercices de calcul / Rédigé les dialogues de la Scène 3..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className="w-full bg-cyan-950/40 border border-soft rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan"
          />
        </div>
      </div>
    </div>
  );
};
