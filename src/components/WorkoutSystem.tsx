import React, { useState, useEffect, useRef } from 'react';
import { 
  WorkoutRoutine, 
  WorkoutExercise, 
  ExerciseSet, 
  CompletedWorkoutSession, 
  PersonalRecord, 
  BodyMetricLog, 
  MuscleGroup 
, Domain } from '../types';
import { 
  Dumbbell, 
  Play, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Flame, 
  Trophy, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Award, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Scale, 
  Layers, 
  Pause, 
  Check, 
  ArrowRight,
  Info
} from 'lucide-react';
import { UlkhadProgramView } from './UlkhadProgramView';

interface WorkoutSystemProps {
  routines: WorkoutRoutine[];
  completedSessions: CompletedWorkoutSession[];
  personalRecords: PersonalRecord[];
  bodyMetrics: BodyMetricLog[];
  onSaveRoutine: (routine: WorkoutRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onCompleteSession: (session: CompletedWorkoutSession, newPRs: PersonalRecord[]) => void;
  onAddBodyMetric: (metric: BodyMetricLog) => void;
  onAddPR: (pr: PersonalRecord) => void;
  triggerVictoryConfetti: () => void;
  /** workout_log Domain (onboarding v2) — drives the screen title/labels. */
  domain?: Domain;
  /** When false (no physical domain declared), the screen shows an empty state. */
  hasPhysicalDomain?: boolean;
}

export const WorkoutSystem: React.FC<WorkoutSystemProps> = ({
  routines,
  completedSessions,
  personalRecords,
  bodyMetrics,
  onSaveRoutine,
  onDeleteRoutine,
  onCompleteSession,
  onAddBodyMetric,
  onAddPR,
  triggerVictoryConfetti,
  domain,
  hasPhysicalDomain = true,
}) => {
  const domainLabel = domain?.label || 'Musculation';
  const [activeTab, setActiveTab] = useState<'ulkhad' | 'programs' | 'active_session' | 'progress' | 'history'>('ulkhad');
  
  // Active Live Workout Session State
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [activeExercises, setActiveExercises] = useState<WorkoutExercise[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionRating, setSessionRating] = useState<number>(5);

  // Between-set Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(60);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);

  // Custom Program Creator Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newRoutineName, setNewRoutineName] = useState<string>('');
  const [newRoutineCategory, setNewRoutineCategory] = useState<'hypertrophy' | 'strength' | 'calisthenics' | 'cardio_hiit' | 'custom'>('hypertrophy');
  const [newRoutineDesc, setNewRoutineDesc] = useState<string>('');
  const [newRoutineEstMin, setNewRoutineEstMin] = useState<number>(45);
  const [newExercises, setNewExercises] = useState<{
    name: string;
    muscleGroup: MuscleGroup;
    setsCount: number;
    targetReps: number;
    weightKg: number;
    restSeconds: number;
  }[]>([
    { name: 'Développé Couché', muscleGroup: 'pecs', setsCount: 4, targetReps: 10, weightKg: 70, restSeconds: 90 },
    { name: 'Élévations Latérales', muscleGroup: 'epaules', setsCount: 3, targetReps: 12, weightKg: 12, restSeconds: 60 }
  ]);

  // Body Metric Form Modal State
  const [isMetricModalOpen, setIsMetricModalOpen] = useState<boolean>(false);
  const [metricWeight, setMetricWeight] = useState<number>(76.5);
  const [metricBodyFat, setMetricBodyFat] = useState<number>(14.0);
  const [metricMuscleMass, setMetricMuscleMass] = useState<number>(45.0);
  const [metricChest, setMetricChest] = useState<number>(104);
  const [metricWaist, setMetricWaist] = useState<number>(79);
  const [metricBiceps, setMetricBiceps] = useState<number>(38.5);
  const [metricNotes, setMetricNotes] = useState<string>('');

  // PR Form Modal State
  const [isPRModalOpen, setIsPRModalOpen] = useState<boolean>(false);
  const [prExerciseName, setPrExerciseName] = useState<string>('');
  const [prMuscleGroup, setPrMuscleGroup] = useState<MuscleGroup>('pecs');
  const [prWeightKg, setPrWeightKg] = useState<number>(80);
  const [prReps, setPrReps] = useState<number>(5);

  // Timer Ref
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Workout Session Elapsed Time Clock
  useEffect(() => {
    if (isTimerRunning) {
      workoutTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (workoutTimerRef.current) {
      clearInterval(workoutTimerRef.current);
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isTimerRunning]);

  // Rest Timer Clock
  useEffect(() => {
    if (isRestActive && restSecondsLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRestActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restSecondsLeft === 0) {
      setIsRestActive(false);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestActive, restSecondsLeft]);

  // Start a Live Workout Session
  const handleStartSession = (routine: WorkoutRoutine) => {
    // Clone routine exercises to avoid mutating original
    const clonedExercises: WorkoutExercise[] = routine.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, isCompleted: false }))
    }));

    setActiveRoutine(routine);
    setActiveExercises(clonedExercises);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setSessionNotes('');
    setActiveTab('active_session');
  };

  // Toggle set completion in live session
  const handleToggleSet = (exerciseId: string, setId: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id !== setId) return set;
            const newCompleted = !set.isCompleted;
            
            // If completed, trigger rest timer
            if (newCompleted) {
              triggerRestTimer(ex.restSeconds || 60);
            }
            return { ...set, isCompleted: newCompleted };
          })
        };
      })
    );
  };

  // Update set details (reps, weight)
  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weightKg' | 'actualReps' | 'targetReps', val: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id !== setId) return set;
            return { ...set, [field]: val };
          })
        };
      })
    );
  };

  // Trigger Rest Timer
  const triggerRestTimer = (seconds: number) => {
    setRestTotalSeconds(seconds);
    setRestSecondsLeft(seconds);
    setIsRestActive(true);
  };

  // Add extra time to rest timer
  const addRestTime = (seconds: number) => {
    setRestSecondsLeft((prev) => prev + seconds);
    setRestTotalSeconds((prev) => prev + seconds);
    if (!isRestActive) setIsRestActive(true);
  };

  // Calculate live session totals
  const totalSetsCount = (activeExercises || []).reduce((acc, ex) => acc + (ex.sets || []).length, 0);
  const completedSetsCount = (activeExercises || []).reduce(
    (acc, ex) => acc + (ex.sets || []).filter((s) => s.isCompleted).length,
    0
  );
  const totalVolumeKg = activeExercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, set) => {
        if (!set.isCompleted) return sAcc;
        const reps = set.actualReps || set.targetReps;
        return sAcc + reps * set.weightKg;
      }, 0)
    );
  }, 0);

  // Finish and Save Live Workout Session
  const handleFinishSession = () => {
    if (!activeRoutine) return;

    setIsTimerRunning(false);
    setIsRestActive(false);

    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    const calories = Math.round(durationMin * 7.5);

    const completedSession: CompletedWorkoutSession = {
      id: `cws-${Date.now()}`,
      routineId: activeRoutine.id,
      routineName: activeRoutine.name,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: durationMin,
      totalVolumeKg,
      totalSetsCompleted: completedSetsCount,
      caloriesBurned: calories,
      exercisesLog: activeExercises,
      notes: sessionNotes,
      rating: sessionRating,
    };

    // Check if any Personal Records were broken during session
    const newlyBrokenPRs: PersonalRecord[] = [];
    activeExercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.isCompleted && set.weightKg > 0) {
          const reps = set.actualReps || set.targetReps;
          const e1rm = Math.round(set.weightKg * (1 + reps / 30));
          const existingPR = personalRecords.find(
            (p) => p.exerciseName.toLowerCase() === ex.name.toLowerCase()
          );

          if (!existingPR || set.weightKg > existingPR.maxWeightKg || e1rm > existingPR.estimated1RM) {
            newlyBrokenPRs.push({
              id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              exerciseName: ex.name,
              muscleGroup: ex.muscleGroup,
              maxWeightKg: set.weightKg,
              maxReps: reps,
              estimated1RM: e1rm,
              date: new Date().toISOString().split('T')[0],
            });
          }
        }
      });
    });

    onCompleteSession(completedSession, newlyBrokenPRs);
    triggerVictoryConfetti();

    // Reset live state & transition to history
    setActiveRoutine(null);
    setActiveExercises([]);
    setElapsedSeconds(0);
    setActiveTab('history');
  };

  // Custom Program Creator Handler
  const handleAddCustomExerciseRow = () => {
    setNewExercises((prev) => [
      ...prev,
      { name: 'Nouvel Exercice', muscleGroup: 'pecs', setsCount: 3, targetReps: 10, weightKg: 20, restSeconds: 60 }
    ]);
  };

  const handleSaveCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const formattedExercises: WorkoutExercise[] = newExercises.map((ne, idx) => {
      const sets: ExerciseSet[] = Array.from({ length: ne.setsCount }).map((_, sIdx) => ({
        id: `set-${Date.now()}-${idx}-${sIdx}`,
        setNumber: sIdx + 1,
        targetReps: ne.targetReps,
        weightKg: ne.weightKg,
        isCompleted: false,
      }));

      return {
        id: `ex-${Date.now()}-${idx}`,
        name: ne.name,
        muscleGroup: ne.muscleGroup,
        sets,
        restSeconds: ne.restSeconds,
      };
    });

    const newRoutine: WorkoutRoutine = {
      id: `rt-custom-${Date.now()}`,
      name: newRoutineName,
      category: newRoutineCategory,
      description: newRoutineDesc || 'Programme personnalisé sur mesure.',
      estimatedDurationMin: newRoutineEstMin,
      exercises: formattedExercises,
      isCustom: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveRoutine(newRoutine);
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
  };

  // Add Body Metric Handler
  const handleSaveBodyMetric = (e: React.FormEvent) => {
    e.preventDefault();
    const newMetric: BodyMetricLog = {
      id: `bm-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: metricWeight,
      bodyFatPercentage: metricBodyFat,
      muscleMassPercentage: metricMuscleMass,
      chestCm: metricChest,
      waistCm: metricWaist,
      bicepsCm: metricBiceps,
      notes: metricNotes,
    };
    onAddBodyMetric(newMetric);
    setIsMetricModalOpen(false);
  };

  // Add PR Handler
  const handleSavePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prExerciseName.trim()) return;
    const e1rm = Math.round(prWeightKg * (1 + prReps / 30));
    const newPr: PersonalRecord = {
      id: `pr-${Date.now()}`,
      exerciseName: prExerciseName,
      muscleGroup: prMuscleGroup,
      maxWeightKg: prWeightKg,
      maxReps: prReps,
      estimated1RM: e1rm,
      date: new Date().toISOString().split('T')[0],
    };
    onAddPR(newPr);
    setIsPRModalOpen(false);
    setPrExerciseName('');
  };

  // Muscle group badge color
  const getMuscleBadgeColor = (group: MuscleGroup) => {
    switch (group) {
      case 'pecs': return 'bg-rose-950/50 text-rose-300 border-rose-500/40';
      case 'dos': return 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40';
      case 'epaules': return 'bg-amber-950/50 text-amber-300 border-amber-500/40';
      case 'biceps': return 'bg-purple-950/50 text-purple-300 border-purple-500/40';
      case 'triceps': return 'bg-indigo-950/50 text-indigo-300 border-indigo-500/40';
      case 'jambes': return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40';
      case 'abdos': return 'bg-orange-950/50 text-orange-300 border-orange-500/40';
      case 'cardio': return 'bg-red-950/50 text-red-300 border-red-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasPhysicalDomain) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-soft rounded-xl p-10 text-center space-y-3">
        <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
        <h2 className="serif text-2xl italic text-white">Aucun domaine physique déclaré</h2>
        <p className="text-sm text-slate-400">
          Le Système n'a généré aucun contenu d'entraînement car tu n'as déclaré aucun domaine
          physique lors de l'éveil. Tu peux en ajouter un à tout moment depuis tes domaines de vie.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] text-slate-200 pb-24">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-soft p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Dumbbell className="w-64 h-64 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan/30 text-cyan-400 mono text-[11px] font-semibold tracking-wider uppercase">
                ATHLETIC TRAINING HUB
              </span>
              {isTimerRunning && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 mono text-[11px] font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  SÉANCE EN COURS ({formatTime(elapsedSeconds)})
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-slate-100 font-display">
              Centre de <span className="text-cyan-400 font-medium">{domainLabel} & Condition Physique</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 max-w-2xl mt-1">
              Programmes de musculation sur-mesure, suivi interactif des séries en temps réel, calcul du 1RM et synchronisation des récompenses XP avec le Système Solo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#051428] hover:bg-card text-cyan-400 border border-cyan text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Programme</span>
            </button>
            <button
              onClick={() => setIsMetricModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            >
              <Scale className="w-4 h-4 accent-cyan" />
              <span>Saisir Mensurations</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-soft/60 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ulkhad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'ulkhad'
                ? 'bg-[#051428] text-[#D4AF37] border border-[#D4AF37]/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-card border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Programme Ulkhad — 10 Mois</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'programs'
                ? 'bg-[#051428] text-cyan-400 border border-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-card border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Programmes & Routines ({(routines || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active_session')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'active_session'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-card border border-transparent'
            }`}
          >
            <Play className="w-4 h-4 text-rose-400" />
            <span>Séance Active {isTimerRunning && `(${formatTime(elapsedSeconds)})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'progress'
                ? 'bg-[#051428] text-cyan-400 border border-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-card border border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Records & Biométrie ({(personalRecords || []).length} PRs)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'history'
                ? 'bg-[#051428] text-cyan-400 border border-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-card border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Historique ({(completedSessions || []).length} Séances)</span>
          </button>
        </div>
      </div>

      {/* TAB 0: PROGRAMME ULKHAD (10 mois, guidé) */}
      {activeTab === 'ulkhad' && (
        <UlkhadProgramView
          onCompleteSession={onCompleteSession}
          triggerVictoryConfetti={triggerVictoryConfetti}
        />
      )}

      {/* TAB 1: PROGRAMS & ROUTINES */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(routines || []).map((routine) => (
              <div
                key={routine.id}
                className="bg-card border border-soft rounded-xl p-5 hover:border-cyan/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-xl bg-card border border-soft text-slate-300 mono text-[10px] uppercase">
                          {routine.category}
                        </span>
                        {routine.isCustom && (
                          <span className="px-2 py-0.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 mono text-[10px]">
                            Sur Mesure
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {routine.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#051428] border border-soft text-slate-300 mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>~{routine.estimatedDurationMin} min</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {routine.description}
                  </p>

                  {/* Exercises List Preview */}
                  <div className="space-y-2 mb-5">
                    <span className="text-[11px] mono uppercase text-slate-500 tracking-wider font-semibold">
                      EXERCICES INCLUS ({(routine.exercises || []).length})
                    </span>
                    <div className="space-y-1.5">
                      {((routine?.exercises) || []).map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#051428]/60 border border-soft/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(ex.muscleGroup)}`}>
                              {ex.muscleGroup}
                            </span>
                            <span className="text-slate-200 font-medium">{ex.name}</span>
                          </div>
                          <span className="mono text-slate-400 text-[11px]">
                            {ex.sets.length} séries × {ex.sets[0]?.targetReps || 10} reps ({ex.sets[0]?.weightKg || 0} kg)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-soft/60">
                  <button
                    onClick={() => handleStartSession(routine)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs hover:brightness-110 transition-all shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>DÉMARRER LA SÉANCE</span>
                  </button>

                  {routine.isCustom && (
                    <button
                      onClick={() => onDeleteRoutine(routine.id)}
                      className="p-2.5 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-500/30 hover:bg-rose-900/50 transition-all"
                      title="Supprimer la routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE LIVE WORKOUT SESSION */}
      {activeTab === 'active_session' && (
        <div className="space-y-6">
          {!activeRoutine ? (
            <div className="bg-card border border-soft rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
              <Dumbbell className="w-16 h-16 text-slate-600 mx-auto" />
              <h3 className="text-lg font-medium text-slate-200">Aucune Séance Active</h3>
              <p className="text-xs text-slate-400">
                Sélectionnez un programme dans l'onglet « Programmes & Routines » pour démarrer votre entraînement en temps réel.
              </p>
              <button
                onClick={() => setActiveTab('programs')}
                className="px-4 py-2 rounded-xl bg-[#051428] text-cyan-400 border border-cyan text-xs font-medium"
              >
                Parcourir les Programmes
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Session Control Bar */}
              <div className="bg-[#051428] border border-rose-500/50 rounded-xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="mono text-xs text-rose-400 uppercase font-semibold">
                      MODE ENTRAÎNEMENT INTENSIF
                    </span>
                  </div>
                  <h2 className="text-xl font-medium text-slate-100">{activeRoutine.name}</h2>
                </div>

                {/* Session Live Counters */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-3.5 py-2 rounded-xl bg-card border border-soft text-center min-w-[100px]">
                    <div className="text-[10px] mono text-slate-500 uppercase">CHRONO</div>
                    <div className="text-lg font-bold mono text-cyan-400">{formatTime(elapsedSeconds)}</div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-card border border-soft text-center min-w-[100px]">
                    <div className="text-[10px] mono text-slate-500 uppercase">VOLUME</div>
                    <div className="text-lg font-bold mono text-cyan-400">{totalVolumeKg} kg</div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-card border border-soft text-center min-w-[100px]">
                    <div className="text-[10px] mono text-slate-500 uppercase">SÉRIES</div>
                    <div className="text-lg font-bold mono text-emerald-400">
                      {completedSetsCount} / {totalSetsCount}
                    </div>
                  </div>

                  <button
                    onClick={handleFinishSession}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>TERMINER & VALIDER</span>
                  </button>
                </div>
              </div>

              {/* Rest Timer Banner if Active */}
              {isRestActive && (
                <div className="bg-amber-950/80 border border-amber-500/60 rounded-xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-amber-300 uppercase mono">TEMPS DE REPOS ENTRE SÉRIES</div>
                      <div className="text-2xl font-black mono text-amber-100">{formatTime(restSecondsLeft)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addRestTime(30)}
                      className="px-3 py-1.5 rounded-xl bg-amber-900/60 text-amber-200 border border-amber-500/40 text-xs font-mono hover:bg-amber-800"
                    >
                      +30s
                    </button>
                    <button
                      onClick={() => setIsRestActive(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 text-xs"
                    >
                      Passer
                    </button>
                  </div>
                </div>
              )}

              {/* Active Exercises Set-by-Set Logging Cards */}
              <div className="space-y-6">
                {activeExercises.map((ex, exIdx) => (
                  <div key={ex.id} className="bg-card border border-soft rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-soft pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#051428] border border-cyan text-cyan-400 mono text-xs flex items-center justify-center font-bold">
                          {exIdx + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-medium text-slate-100">{ex.name}</h3>
                          <span className={`px-2 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(ex.muscleGroup)}`}>
                            {ex.muscleGroup} • Repos recommandé : {ex.restSeconds}s
                          </span>
                        </div>
                      </div>

                      {ex.notes && (
                        <p className="text-xs text-slate-400 italic hidden md:block">
                          💡 {ex.notes}
                        </p>
                      )}
                    </div>

                    {/* Sets Grid / Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-soft/50 text-slate-500 font-mono text-[11px] uppercase">
                            <th className="py-2 px-3">Série</th>
                            <th className="py-2 px-3">Charge (kg)</th>
                            <th className="py-2 px-3">Répétitions</th>
                            <th className="py-2 px-3">Valider</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-soft/30">
                          {((ex?.sets) || []).map((set) => (
                            <tr
                              key={set.id}
                              className={`transition-colors ${
                                set.isCompleted ? 'bg-emerald-950/20' : 'hover:bg-[#051428]/40'
                              }`}
                            >
                              <td className="py-3 px-3 font-mono font-bold text-slate-300">
                                #{set.setNumber}
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={set.weightKg}
                                    onChange={(e) =>
                                      handleUpdateSet(ex.id, set.id, 'weightKg', parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 px-2 py-1 rounded-xl bg-[#051428] border border-soft text-slate-100 mono text-xs font-semibold focus:border-cyan outline-none"
                                  />
                                  <span className="text-slate-500 font-mono">kg</span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={set.actualReps !== undefined ? set.actualReps : set.targetReps}
                                    onChange={(e) =>
                                      handleUpdateSet(ex.id, set.id, 'actualReps', parseInt(e.target.value) || 0)
                                    }
                                    className="w-20 px-2 py-1 rounded-xl bg-[#051428] border border-soft text-slate-100 mono text-xs font-semibold focus:border-cyan outline-none"
                                  />
                                  <span className="text-slate-500 font-mono">reps</span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleToggleSet(ex.id, set.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                                    set.isCompleted
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-[#051428] text-slate-400 border border-soft hover:border-cyan hover:text-slate-200'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{set.isCompleted ? 'Validée' : 'Valider'}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes & Rating Footer */}
              <div className="bg-card border border-soft rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-slate-200">Bilan & Remarques de la Séance</h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Ex: Excellentes sensations sur le développé couché. Bonne congestion des épaules..."
                  className="w-full h-20 p-3 rounded-xl bg-[#051428] border border-soft text-slate-200 text-xs outline-none focus:border-cyan"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECORDS PERSONNELS & BIOMÉTRIE */}
      {activeTab === 'progress' && (
        <div className="space-y-8">
          {/* Section 1: Personal Records (PRs) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-100">Records Personnels (PRs & 1RM Estimé)</h2>
                <p className="text-xs text-slate-400">Performances maximales enregistrées par exercice.</p>
              </div>
              <button
                onClick={() => setIsPRModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#051428] text-cyan-400 border border-cyan text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Record</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(personalRecords || []).map((pr) => (
                <div key={pr.id} className="bg-card border border-soft rounded-xl p-4 hover:border-cyan/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(pr.muscleGroup)}`}>
                      {pr.muscleGroup}
                    </span>
                    <span className="mono text-[10px] text-slate-500">{pr.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mb-3">{pr.exerciseName}</h3>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#051428] border border-soft text-center">
                    <div>
                      <div className="text-[10px] mono text-slate-500 uppercase">CHARGE MAX</div>
                      <div className="text-base font-black mono text-cyan-400">
                        {pr.maxWeightKg} kg <span className="text-xs text-slate-400 font-normal">×{pr.maxReps}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] mono text-slate-500 uppercase">1RM ESTIMÉ</div>
                      <div className="text-base font-black mono text-cyan-400">{pr.estimated1RM} kg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Biometrics Tracker */}
          <div className="space-y-4 border-t border-soft/60 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-100">Suivi Biométrique & Mensurations</h2>
                <p className="text-xs text-slate-400">Évolution du poids corporel et des mensurations musculaires.</p>
              </div>
              <button
                onClick={() => setIsMetricModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enregistrer Pesée</span>
              </button>
            </div>

            <div className="space-y-4">
              {(bodyMetrics || []).map((metric) => (
                <div key={metric.id} className="bg-card border border-soft rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-soft pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="mono text-xs font-bold text-slate-200">{metric.date}</span>
                    </div>
                    <span className="mono text-sm font-black text-cyan-400">{metric.weightKg} kg</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
                    <div className="p-2 rounded-xl bg-[#051428] border border-soft">
                      <div className="text-[10px] mono text-slate-500">GRASSE (%)</div>
                      <div className="text-xs font-bold mono text-rose-400">{metric.bodyFatPercentage || '-'}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#051428] border border-soft">
                      <div className="text-[10px] mono text-slate-500">MUSCLE (%)</div>
                      <div className="text-xs font-bold mono text-emerald-400">{metric.muscleMassPercentage || '-'}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#051428] border border-soft">
                      <div className="text-[10px] mono text-slate-500">POITRINE</div>
                      <div className="text-xs font-bold mono text-slate-200">{metric.chestCm || '-'} cm</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#051428] border border-soft">
                      <div className="text-[10px] mono text-slate-500">TAILLE</div>
                      <div className="text-xs font-bold mono text-slate-200">{metric.waistCm || '-'} cm</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#051428] border border-soft">
                      <div className="text-[10px] mono text-slate-500">BICEPS</div>
                      <div className="text-xs font-bold mono text-slate-200">{metric.bicepsCm || '-'} cm</div>
                    </div>
                  </div>

                  {metric.notes && (
                    <p className="text-xs text-slate-400 italic bg-[#051428]/50 p-2 rounded-xl">
                      "{metric.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETED SESSIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-100">Historique des Séances Validées</h2>

          {(completedSessions || []).length === 0 ? (
            <div className="bg-card border border-soft rounded-xl p-8 text-center text-slate-400 text-xs">
              Aucune séance enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {(completedSessions || []).map((session) => (
                <div key={session.id} className="bg-card border border-soft rounded-xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-soft pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-xs font-bold text-cyan-400">{session.date}</span>
                        <span className="text-slate-500">•</span>
                        <span className="mono text-xs text-slate-400">{session.startTime}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100">{session.routineName}</h3>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="px-2.5 py-1 rounded-xl bg-[#051428] border border-soft text-slate-300">
                        ⏱️ {session.durationMinutes} min
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-[#051428] border border-soft text-cyan-400 font-bold">
                        🏋️ {session.totalVolumeKg} kg
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-[#051428] border border-soft text-emerald-400 font-bold">
                        🔥 {session.caloriesBurned} kcal
                      </div>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-slate-300 italic bg-[#051428] p-3 rounded-xl border border-soft/50">
                      💬 {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE CUSTOM PROGRAM */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#051428] border border-cyan/60 rounded-xl w-full max-w-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-soft pb-3">
              <h3 className="text-lg font-bold text-cyan-400 font-display">Créer un Programme Sur Mesure</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nom du Programme</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Upper Body Hypertrophie, Core & Cardio..."
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-card border border-soft text-slate-100 text-xs focus:border-cyan outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Catégorie</label>
                  <select
                    value={newRoutineCategory}
                    onChange={(e: any) => setNewRoutineCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-card border border-soft text-slate-100 text-xs focus:border-cyan outline-none"
                  >
                    <option value="hypertrophy">Hypertrophie</option>
                    <option value="strength">Force Athlétique</option>
                    <option value="calisthenics">Calisthénie / Poids du Corps</option>
                    <option value="cardio_hiit">Cardio & HIIT</option>
                    <option value="custom">Autre / Spécifique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Durée Estimée (min)</label>
                  <input
                    type="number"
                    value={newRoutineEstMin}
                    onChange={(e) => setNewRoutineEstMin(parseInt(e.target.value) || 30)}
                    className="w-full p-2.5 rounded-xl bg-card border border-soft text-slate-100 text-xs focus:border-cyan outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Description / Objectif</label>
                <textarea
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                  placeholder="Notes sur la fréquence, le tempo ou la méthode de surcharge..."
                  className="w-full h-16 p-2.5 rounded-xl bg-card border border-soft text-slate-100 text-xs focus:border-cyan outline-none"
                />
              </div>

              {/* Dynamic Exercises List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Exercices du Programme</span>
                  <button
                    type="button"
                    onClick={handleAddCustomExerciseRow}
                    className="text-xs text-cyan-400 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un exercice
                  </button>
                </div>

                {newExercises.map((ne, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-card border border-soft space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={ne.name}
                        onChange={(e) => {
                          const updated = [...newExercises];
                          updated[idx].name = e.target.value;
                          setNewExercises(updated);
                        }}
                        placeholder="Nom de l'exercice"
                        className="p-1.5 rounded-xl bg-[#051428] border border-soft text-slate-100 outline-none"
                      />
                      <select
                        value={ne.muscleGroup}
                        onChange={(e: any) => {
                          const updated = [...newExercises];
                          updated[idx].muscleGroup = e.target.value;
                          setNewExercises(updated);
                        }}
                        className="p-1.5 rounded-xl bg-[#051428] border border-soft text-slate-100 outline-none"
                      >
                        <option value="pecs">Pectoraux</option>
                        <option value="dos">Dos</option>
                        <option value="epaules">Épaules</option>
                        <option value="biceps">Biceps</option>
                        <option value="triceps">Triceps</option>
                        <option value="jambes">Jambes</option>
                        <option value="abdos">Abdominaux</option>
                        <option value="cardio">Cardio</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500">Séries:</span>
                        <input
                          type="number"
                          value={ne.setsCount}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].setsCount = parseInt(e.target.value) || 1;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-[#051428] border border-soft text-slate-100 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Reps:</span>
                        <input
                          type="number"
                          value={ne.targetReps}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].targetReps = parseInt(e.target.value) || 10;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-[#051428] border border-soft text-slate-100 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Charge (kg):</span>
                        <input
                          type="number"
                          value={ne.weightKg}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].weightKg = parseFloat(e.target.value) || 0;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-[#051428] border border-soft text-slate-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs"
                >
                  Sauvegarder le Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BODY METRIC */}
      {isMetricModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#051428] border border-cyan/60 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-soft pb-2">
              <h3 className="text-base font-bold text-cyan-400">Saisir Mesures Biométriques</h3>
              <button onClick={() => setIsMetricModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveBodyMetric} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Poids Corporel (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={metricWeight}
                  onChange={(e) => setMetricWeight(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Masse Grasse (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricBodyFat}
                    onChange={(e) => setMetricBodyFat(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Masse Musculaire (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricMuscleMass}
                    onChange={(e) => setMetricMuscleMass(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Poitrine (cm)</label>
                  <input
                    type="number"
                    value={metricChest}
                    onChange={(e) => setMetricChest(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={metricWaist}
                    onChange={(e) => setMetricWaist(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Biceps (cm)</label>
                  <input
                    type="number"
                    value={metricBiceps}
                    onChange={(e) => setMetricBiceps(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Notes / État d'esprit</label>
                <input
                  type="text"
                  placeholder="Ex: Forme olympique..."
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMetricModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD RECORD PERSONNAL (PR) */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#051428] border border-cyan/60 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-soft pb-2">
              <h3 className="text-base font-bold text-cyan-400">Enregistrer un Record Personnel</h3>
              <button onClick={() => setIsPRModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSavePR} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Nom de l'exercice</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Développé Couché, Soulevé de terre..."
                  value={prExerciseName}
                  onChange={(e) => setPrExerciseName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Groupe Musculaire</label>
                <select
                  value={prMuscleGroup}
                  onChange={(e: any) => setPrMuscleGroup(e.target.value)}
                  className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                >
                  <option value="pecs">Pectoraux</option>
                  <option value="dos">Dos</option>
                  <option value="epaules">Épaules</option>
                  <option value="biceps">Biceps</option>
                  <option value="triceps">Triceps</option>
                  <option value="jambes">Jambes</option>
                  <option value="abdos">Abdominaux</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Poids Soulevé (kg)</label>
                  <input
                    type="number"
                    required
                    value={prWeightKg}
                    onChange={(e) => setPrWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Répétitions</label>
                  <input
                    type="number"
                    required
                    value={prReps}
                    onChange={(e) => setPrReps(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-xl bg-card border border-soft text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-soft text-center font-mono">
                <span className="text-[10px] text-slate-500 uppercase">1RM ESTIMÉ CALCULÉ:</span>
                <div className="text-base font-bold text-cyan-400">
                  {Math.round(prWeightKg * (1 + prReps / 30))} kg
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPRModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
