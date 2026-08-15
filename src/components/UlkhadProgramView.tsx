// ============================================================================
// PROGRAMME ULKHAD — Expérience guidée (10 mois)
// Vue "Programme Ulkhad" : timeline des phases, séance du jour,
// fiches exercices avec démos Lottie, session live avec minuteur de repos.
// ============================================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'motion/react';
import {
  Calendar, Play, Check, ChevronRight, X, Trophy, BookOpen,
  Zap, Dumbbell, Info, RotateCcw, TrendingUp, Utensils, Sparkles, Moon,
} from 'lucide-react';
import { CompletedWorkoutSession, PersonalRecord, MuscleGroup, WorkoutExercise } from '../types';
import {
  ULKHAD_MESOCYCLES, ULKHAD_TOTAL_WEEKS, ULKHAD_GOALS, ULKHAD_PHILOSOPHY,
  ULKHAD_SESSION_RULES, ULKHAD_WEEKLY_STRUCTURE, ULKHAD_TIPS,
  ULKHAD_PROGRESSIVE_OVERLOAD, ULKHAD_INTENSIFICATION_TECHNIQUES,
  UlkhadDay, UlkhadMicrocycle, getProgramPosition, getDayForWeekday, ulkhadExerciseToWorkout,
} from '../data/ulkhadProgram';
import { animationForExercise, REST_ANIMATION, COMPLETE_ANIMATION } from '../lib/exerciseAnimations';

const START_KEY = 'ulkhad_start_date';

interface Props {
  onCompleteSession: (session: CompletedWorkoutSession, newPRs: PersonalRecord[]) => void;
  triggerVictoryConfetti: () => void;
}

const MUSCLE_BADGE: Record<MuscleGroup, string> = {
  pecs: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  dos: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  epaules: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  biceps: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  triceps: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  jambes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  abdos: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  cardio: 'bg-red-500/15 text-red-300 border-red-500/30',
};
const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecs: 'Pecs', dos: 'Dos', epaules: 'Épaules', biceps: 'Biceps', triceps: 'Triceps',
  jambes: 'Jambes', abdos: 'Abdos', cardio: 'Cardio',
};
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const MICRO_STYLE: Record<string, { ring: string; chip: string; emoji: string }> = {
  mecanique: { ring: 'from-cyan-500/60 to-blue-600/40', chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', emoji: '⚙️' },
  metabolique: { ring: 'from-emerald-500/60 to-teal-600/40', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', emoji: '🔥' },
  overreaching: { ring: 'from-red-500/60 to-orange-600/40', chip: 'bg-red-500/15 text-red-300 border-red-500/30', emoji: '⚡' },
  deload: { ring: 'from-slate-400/60 to-slate-600/40', chip: 'bg-slate-500/15 text-slate-300 border-slate-500/30', emoji: '🌙' },
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
export const UlkhadProgramView: React.FC<Props> = ({ onCompleteSession, triggerVictoryConfetti }) => {
  const [view, setView] = useState<'program' | 'session'>('program');
  const [guideOpen, setGuideOpen] = useState(false);
  const [startDate, setStartDate] = useState<number>(() => {
    const saved = localStorage.getItem(START_KEY);
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const pos = useMemo(() => getProgramPosition(startDate), [startDate]);
  const today = new Date();
  const todayDay = useMemo(() => getDayForWeekday(pos, today.getDay()), [pos, today]);
  const [selectedDay, setSelectedDay] = useState<UlkhadDay>(todayDay);

  // --- Session live ---------------------------------------------------------
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(60);
  const [finished, setFinished] = useState(false);
  const restRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (restLeft <= 0) return;
    restRef.current = window.setInterval(() => setRestLeft((r) => Math.max(0, r - 1)), 1000);
    return () => { if (restRef.current) window.clearInterval(restRef.current); };
  }, [restLeft > 0]);

  const startSession = (day: UlkhadDay, micro: UlkhadMicrocycle) => {
    setSessionExercises(day.exercises.map(ulkhadExerciseToWorkout));
    setSessionTitle(`${pos.mesocycle.name} · ${micro.shortName} — ${day.id} ${day.title}`);
    setElapsed(0); setFinished(false); setRestLeft(0);
    setRunning(true);
    setView('session');
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    setSessionExercises((prev) => {
      const next = prev.map((e, i) => i !== exIdx ? { ...e } : {
        ...e,
        sets: e.sets.map((s, j) => j !== setIdx ? s : { ...s, isCompleted: !s.isCompleted }),
      });
      const ex = next[exIdx]; const st = ex.sets[setIdx];
      if (!st.isCompleted && st.setNumber < ex.sets.length) {
        // série validée → minuteur de repos prescrit
        setRestTotal(Math.max(15, ex.restSeconds));
        setRestLeft(Math.max(15, ex.restSeconds));
      }
      return next;
    });
  };

  const allDone = sessionExercises.length > 0 && sessionExercises.every((e) => e.sets.every((s) => s.isCompleted));
  const totalSets = sessionExercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = sessionExercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).length, 0);

  const finishSession = () => {
    setRunning(false);
    const dur = Math.max(1, Math.round(elapsed / 60));
    const session: CompletedWorkoutSession = {
      id: `ulkhad_${Date.now()}`,
      routineId: 'ulkhad_program',
      routineName: sessionTitle,
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString(),
      durationMinutes: dur,
      totalVolumeKg: doneSets * 60, // estimation poids du corps
      totalSetsCompleted: doneSets,
      caloriesBurned: Math.round(dur * 7.5),
      exercisesLog: sessionExercises,
    };
    onCompleteSession(session, []);
    setFinished(true);
    triggerVictoryConfetti();
  };

  const resetProgram = () => {
    if (window.confirm('Recommencer le programme de 10 mois à zéro (semaine 1) ?')) {
      const now = Date.now();
      localStorage.setItem(START_KEY, String(now));
      setStartDate(now);
    }
  };

  // =========================================================================
  // VUE SESSION LIVE
  // =========================================================================
  if (view === 'session') {
    return (
      <div className="space-y-4">
        {/* En-tête session */}
        <div className="rounded-2xl border border-cyan-500/30 bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                <Dumbbell size={22} className="text-white" />
              </div>
              <div>
                <p className="font-display text-sm text-cyan-300">{sessionTitle}</p>
                <p className="text-xs text-slate-400">{doneSets}/{totalSets} séries · {fmtTime(elapsed)}</p>
              </div>
            </div>
            <button onClick={() => { setRunning(false); setView('program'); }}
              className="rounded-lg border border-soft p-2 text-slate-400 hover:text-white" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#051428]">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Minuteur de repos */}
        {restLeft > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <Lottie animationData={REST_ANIMATION} loop className="h-16 w-16" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Repos</p>
              <p className="font-mono text-3xl font-bold text-amber-200">{fmtTime(restLeft)}</p>
            </div>
            <button onClick={() => setRestLeft(0)} className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/20">
              Passer
            </button>
          </motion.div>
        )}

        {/* Fiches exercices */}
        <div className="space-y-3">
          {sessionExercises.map((ex, i) => {
            const info = selectedDay.exercises[i];
            const anim = animationForExercise(ex.name);
            return (
              <motion.div key={ex.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-soft bg-card">
                <div className="flex items-start gap-3 p-4">
                  <div className="shrink-0 overflow-hidden rounded-xl border border-cyan-500/20 bg-[#051428]">
                    <Lottie animationData={anim} loop className="h-20 w-30" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold text-white">{ex.name}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${MUSCLE_BADGE[ex.muscleGroup]}`}>
                        {MUSCLE_LABEL[ex.muscleGroup]}
                      </span>
                    </div>
                    {info && (
                      <p className="mt-1 text-xs text-slate-400">
                        <span className="text-cyan-300">{info.reps} reps</span> · repos {info.restLabel} · {info.intensification}
                      </p>
                    )}
                    {info?.technique && <p className="mt-1 text-xs italic text-slate-500">{info.technique}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  {ex.sets.map((s, j) => (
                    <button key={s.id} onClick={() => toggleSet(i, j)}
                      className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border px-3 font-mono text-sm transition-all ${
                        s.isCompleted
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-soft bg-[#051428] text-slate-300 hover:border-cyan-500/50'
                      }`}>
                      {s.isCompleted ? <Check size={14} /> : <span>{s.setNumber}</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminer */}
        <button onClick={finishSession} disabled={!allDone}
          className={`w-full rounded-2xl py-4 font-display font-semibold transition-all ${
            allDone
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
              : 'cursor-not-allowed border border-soft bg-[#051428] text-slate-500'
          }`}>
          {allDone ? '🏆 Terminer la séance (XP + Or)' : `Valider toutes les séries (${doneSets}/${totalSets})`}
        </button>

        {finished && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
            <Lottie animationData={COMPLETE_ANIMATION} loop={false} className="h-28 w-40" />
            <p className="font-display text-lg text-emerald-300">Séance terminée !</p>
            <p className="text-xs text-slate-400">{fmtTime(elapsed)} · {doneSets} séries · +XP, +Or, +1 Force</p>
            <button onClick={() => setView('program')} className="mt-2 rounded-xl border border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20">
              Retour au programme
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VUE PROGRAMME
  // =========================================================================
  const microStyle = MICRO_STYLE[pos.microcycle.id];
  const isDeloadDay = selectedDay.exercises.length === 0;

  return (
    <div className="space-y-5">
      {/* --- Carte phase actuelle --- */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-card p-5">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${microStyle.ring}`} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400">Programme Ulkhad · 10 mois</p>
            <h2 className="mt-1 font-display text-xl text-white">{pos.mesocycle.subtitle}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${microStyle.chip}`}>
                {microStyle.emoji} {pos.microcycle.name}
              </span>
              <span className="rounded-full border border-soft bg-[#051428] px-2.5 py-1 text-xs text-slate-300">
                Semaine {pos.weekInMicro}/{pos.microcycle.weeks}
              </span>
              <span className="rounded-full border border-soft bg-[#051428] px-2.5 py-1 text-xs text-slate-300">
                Semaine {pos.weekGlobal}/{ULKHAD_TOTAL_WEEKS} au total
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={resetProgram} title="Recommencer à la semaine 1"
              className="rounded-lg border border-soft p-2 text-slate-400 hover:text-white"><RotateCcw size={16} /></button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Repos : <span className="text-slate-200">{pos.microcycle.rest}</span> · Reps : <span className="text-slate-200">{pos.microcycle.reps}</span> · Charge : <span className="text-slate-200">{pos.microcycle.workload}</span>
        </p>
        {pos.microcycle.extras?.map((e) => (
          <p key={e} className="mt-1 text-xs font-medium text-amber-300">{e}</p>
        ))}
      </motion.div>

      {/* --- Timeline des 10 mois --- */}
      <div className="rounded-2xl border border-soft bg-card p-4">
        <p className="mb-3 flex items-center gap-2 font-display text-sm text-white"><TrendingUp size={16} className="text-cyan-400" /> Feuille de route</p>
        <div className="space-y-3">
          {ULKHAD_MESOCYCLES.map((meso) => (
            <div key={meso.id}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{meso.subtitle}</p>
              <div className="mt-1.5 flex gap-1.5">
                {meso.microcycles.map((mc) => {
                  const active = meso.id === pos.mesocycle.id && mc.id === pos.microcycle.id;
                  const past = ULKHAD_MESOCYCLES.findIndex((m) => m.id === meso.id) < ULKHAD_MESOCYCLES.findIndex((m) => m.id === pos.mesocycle.id);
                  return (
                    <button key={mc.id} onClick={() => { /* navigation informative via sélecteur de jour */ }}
                      title={`${mc.name} (${mc.weeks} sem)`}
                      className={`h-8 flex-1 rounded-lg border text-[10px] font-medium transition-all ${
                        active ? `${MICRO_STYLE[mc.id].chip} border-current ring-1 ring-cyan-400/50 animate-pulse`
                        : past ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400/70'
                        : 'border-soft bg-[#051428] text-slate-500'
                      }`}
                      style={{ flexGrow: mc.weeks }}>
                      {mc.weeks}sem
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> En cours</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500/60" /> Terminé</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-600" /> À venir</span>
        </div>
      </div>

      {/* --- Séance du jour --- */}
      <div className="rounded-2xl border border-cyan-500/30 bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-display text-sm text-white">
            <Calendar size={16} className="text-cyan-400" /> Aujourd'hui — {DAY_NAMES[new Date().getDay()]}
          </p>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${microStyle.chip}`}>
            {selectedDay.id} · {selectedDay.title}
          </span>
        </div>

        {!isDeloadDay ? (
          <>
            <p className="mt-1 text-xs text-slate-500">{ULKHAD_SESSION_RULES}</p>
            <div className="mt-4 space-y-3">
              {selectedDay.exercises.map((ex, i) => {
                const anim = animationForExercise(ex.name);
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 rounded-xl border border-soft bg-[#051428] p-3">
                    <div className="shrink-0 overflow-hidden rounded-lg border border-cyan-500/20">
                      <Lottie animationData={anim} loop className="h-16 w-24" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-white">{ex.name}</h4>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] ${MUSCLE_BADGE[ex.muscleGroup]}`}>{MUSCLE_LABEL[ex.muscleGroup]}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-cyan-300">
                        {ex.sets} × {ex.reps} <span className="text-slate-500">·</span> {ex.restLabel} repos
                      </p>
                      <p className="text-xs text-amber-300/90">{ex.intensification}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => startSession(selectedDay, pos.microcycle)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-display font-semibold text-white shadow-lg shadow-cyan-500/30 transition-transform active:scale-98">
              <Play size={18} /> Lancer la séance
            </button>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-soft bg-[#051428] p-8 text-center">
            <Moon size={36} className="text-slate-500" />
            <p className="font-display text-white">Repos complet</p>
            <p className="max-w-xs text-xs text-slate-400">
              La récupération fait partie du programme. Ton corps supercompense : force et muscle augmentent pendant le repos.
            </p>
          </div>
        )}
      </div>

      {/* --- Sélecteur de jour (explore les autres séances de la semaine) --- */}
      <div className="rounded-2xl border border-soft bg-card p-4">
        <p className="mb-3 font-display text-sm text-white">Structure hebdomadaire</p>
        <div className="grid grid-cols-2 gap-2">
          {pos.microcycle.days.filter((d) => d.weekdays.length > 0).map((d) => (
            <button key={d.id} onClick={() => setSelectedDay(d)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedDay.id === d.id ? 'border-cyan-500/60 bg-[#051428] text-white' : 'border-soft bg-[#051428]/50 text-slate-300 hover:border-cyan-500/30'
              }`}>
              <p className="text-xs font-semibold">{d.id} — {d.title}</p>
              <p className="text-[10px] text-slate-500">
                {d.weekdays.map((w) => DAY_NAMES[w].slice(0, 3)).join(' · ')} {d.exercises.length ? `· ${d.exercises.length} exos` : ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* --- Objectifs & guide --- */}
      <button onClick={() => setGuideOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#0a1628] to-[#051428] p-4 text-left hover:border-[#D4AF37]/60">
        <span className="flex items-center gap-3">
          <BookOpen size={20} className="text-[#D4AF37]" />
          <span>
            <span className="block font-display text-sm text-white">Guide complet du programme</span>
            <span className="block text-xs text-slate-400">Objectifs, techniques, nutrition, astuces</span>
          </span>
        </span>
        <ChevronRight size={18} className="text-slate-500" />
      </button>

      <p className="pb-2 text-center font-display text-sm italic text-[#D4AF37]">{ULKHAD_PHILOSOPHY}</p>

      {/* --- Modale guide --- */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center" onClick={() => setGuideOpen(false)}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-cyan-500/30 bg-[#0a1628] p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-white">Guide Ulkhad</h3>
              <button onClick={() => setGuideOpen(false)} className="rounded-lg border border-soft p-2 text-slate-400"><X size={16} /></button>
            </div>

            <section className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300"><Trophy size={14} /> Objectifs</h4>
              <ul className="space-y-1">{ULKHAD_GOALS.map((g) => (
                <li key={g} className="flex items-center gap-2 text-xs text-slate-300"><Sparkles size={12} className="text-[#D4AF37]" />{g}</li>
              ))}</ul>
            </section>

            <section className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300"><TrendingUp size={14} /> {ULKHAD_PROGRESSIVE_OVERLOAD.title}</h4>
              <ul className="space-y-1">{ULKHAD_PROGRESSIVE_OVERLOAD.rules.map((r) => (
                <li key={r} className="flex items-center gap-2 text-xs text-slate-300"><span className="h-1 w-1 rounded-full bg-cyan-400" />{r}</li>
              ))}</ul>
            </section>

            <section className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300"><Zap size={14} /> Techniques d'intensification</h4>
              <div className="grid grid-cols-1 gap-2">
                {ULKHAD_INTENSIFICATION_TECHNIQUES.map((t) => (
                  <div key={t.name} className="rounded-xl border border-soft bg-[#051428] p-3">
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300"><Calendar size={14} /> Structure hebdomadaire</h4>
              <div className="overflow-hidden rounded-xl border border-soft">
                {ULKHAD_WEEKLY_STRUCTURE.map((s, i) => (
                  <div key={s.day} className={`flex items-center justify-between p-2.5 text-xs ${i % 2 ? 'bg-[#051428]' : 'bg-transparent'}`}>
                    <span className="font-mono text-cyan-300">{s.day}</span>
                    <span className="text-slate-300">{s.group}</span>
                    <span className="text-slate-500">{s.freq}</span>
                  </div>
                ))}
              </div>
            </section>

            {ULKHAD_TIPS.map((tip) => (
              <section key={tip.title} className="mb-4">
                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-cyan-300">
                  {tip.title === 'Optimise ton alimentation' ? <Utensils size={14} /> : <Info size={14} />} {tip.title}
                </h4>
                <ul className="space-y-1">{tip.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-xs text-slate-400"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]" />{it}</li>
                ))}</ul>
              </section>
            ))}

            <p className="mt-4 text-center font-display text-sm italic text-[#D4AF37]">{ULKHAD_PHILOSOPHY}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};
