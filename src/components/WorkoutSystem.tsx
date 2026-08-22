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
  Sparkles, 
  Trash2, 
  Scale, 
  Layers, 
  Check, 
  Calendar, 
  X, 
  Info, 
  Timer
} from './ui/PharaohIcons';
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

  // Muscle group badge color — Pharaoh palette
  const getMuscleBadgeColor = (group: MuscleGroup) => {
    switch (group) {
      case 'pecs': return 'bg-blood/10 text-blood border-blood/40';
      case 'dos': return 'bg-sapphire/10 text-sapphire border-sapphire/40';
      case 'epaules': return 'bg-gold/10 text-gold border-gold/40';
      case 'biceps': return 'bg-amethyst/10 text-amethyst border-amethyst/40';
      case 'triceps': return 'bg-amethyst/20 text-pharaoh border-amethyst/40';
      case 'jambes': return 'bg-emerald/10 text-emerald border-emerald/40';
      case 'abdos': return 'bg-gold/20 text-gold-bright border-gold/50';
      case 'cardio': return 'bg-blood/20 text-blood border-blood/50';
      default: return 'bg-lapis text-pharaoh-muted border-lapis-border';
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
      <div className="max-w-2xl mx-auto bg-panel border border-lapis-border rounded-xl p-10 text-center space-y-3">
        <Dumbbell size={40} className="mx-auto text-pharaoh-subtle" />
        <h2 className="font-display text-2xl italic text-pharaoh tracking-wide">Aucun domaine physique déclaré</h2>
        <p className="text-sm text-pharaoh-muted">
          Le Système n'a généré aucun contenu d'entraînement car tu n'as déclaré aucun domaine
          physique lors de l'éveil. Tu peux en ajouter un à tout moment depuis tes domaines de vie.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-pharaoh pb-24">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-panel border border-lapis-border p-6 shadow-glow-gold">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Dumbbell size={256} className="text-gold" />
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-xl bg-gold/10 border border-gold/40 text-gold font-mono text-[11px] font-semibold tracking-wider uppercase">
                ATHLETIC TRAINING HUB
              </span>
              {isTimerRunning && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blood/20 border border-blood/50 text-blood font-mono text-[11px] font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blood"></span>
                  SÉANCE EN COURS ({formatTime(elapsedSeconds)})
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-pharaoh font-display">
              Centre de <span className="text-gradient-gold font-medium">{domainLabel} & Condition Physique</span>
            </h1>
            <p className="text-xs lg:text-sm text-pharaoh-muted max-w-2xl mt-1">
              Programmes de musculation sur-mesure, suivi interactif des séries en temps réel, calcul du 1RM et synchronisation des récompenses XP avec le Système Solo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-panel-gold hover:bg-panel-hover text-gold-bright border border-gold text-xs font-medium transition-all shadow-gold"
            >
              <Plus size={16} />
              <span>Créer un Programme</span>
            </button>
            <button
              onClick={() => setIsMetricModalOpen(true)}
              className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-lapis hover:bg-lapis-light text-pharaoh border border-lapis-border text-xs font-medium transition-all"
            >
              <Scale size={16} className="text-gold" />
              <span>Saisir Mensurations</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-lapis-border/60 pt-4 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('ulkhad')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'ulkhad'
                ? 'bg-panel-gold text-gold-bright border border-gold/60 shadow-gold'
                : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-transparent'
            }`}
          >
            <Sparkles size={16} />
            <span>Programme Ulkhad — 10 Mois</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'programs'
                ? 'bg-panel-gold text-gold-bright border border-gold shadow-gold'
                : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-transparent'
            }`}
          >
            <Layers size={16} />
            <span>Programmes & Routines ({(routines || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active_session')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'active_session'
                ? 'bg-blood/20 text-blood border border-blood/60 shadow-lg'
                : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-transparent'
            }`}
          >
            <Play size={16} className="text-blood" />
            <span>Séance Active {isTimerRunning && `(${formatTime(elapsedSeconds)})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'progress'
                ? 'bg-panel-gold text-gold-bright border border-gold shadow-gold'
                : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-transparent'
            }`}
          >
            <Trophy size={16} />
            <span>Records & Biométrie ({(personalRecords || []).length} PRs)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'history'
                ? 'bg-panel-gold text-gold-bright border border-gold shadow-gold'
                : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-transparent'
            }`}
          >
            <Activity size={16} />
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
                className="bg-panel border border-lapis-border rounded-xl p-5 hover:border-gold/50 transition-all flex flex-col justify-between group shadow-card hover-lift"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-xl bg-lapis border border-lapis-border text-pharaoh-muted font-mono text-[10px] uppercase">
                          {routine.category}
                        </span>
                        {routine.isCustom && (
                          <span className="px-2 py-0.5 rounded-xl bg-amethyst/10 border border-amethyst/40 text-amethyst font-mono text-[10px]">
                            Sur Mesure
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-medium text-pharaoh group-hover:text-gold-bright transition-colors tracking-wide">
                        {routine.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted font-mono text-xs">
                      <Clock size={14} className="text-gold" />
                      <span>~{routine.estimatedDurationMin} min</span>
                    </div>
                  </div>

                  <p className="text-xs text-pharaoh-muted mb-4 line-clamp-2">
                    {routine.description}
                  </p>

                  {/* Exercises List Preview */}
                  <div className="space-y-2 mb-5">
                    <span className="text-[11px] font-mono uppercase text-pharaoh-subtle tracking-wider font-semibold">
                      EXERCICES INCLUS ({(routine.exercises || []).length})
                    </span>
                    <div className="space-y-1.5">
                      {((routine?.exercises) || []).map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-obsidian/60 border border-lapis-border/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(ex.muscleGroup)}`}>
                              {ex.muscleGroup}
                            </span>
                            <span className="text-pharaoh font-medium">{ex.name}</span>
                          </div>
                          <span className="font-mono text-pharaoh-muted text-[11px]">
                            {ex.sets.length} séries × {ex.sets[0]?.targetReps || 10} reps ({ex.sets[0]?.weightKg || 0} kg)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-lapis-border/60">
                  <button
                    onClick={() => handleStartSession(routine)}
                    className="btn-press flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-bright text-obsidian font-semibold text-xs hover:brightness-110 transition-all shadow-glow-gold"
                  >
                    <Play size={16} className="fill-current" />
                    <span>DÉMARRER LA SÉANCE</span>
                  </button>

                  {routine.isCustom && (
                    <button
                      onClick={() => onDeleteRoutine(routine.id)}
                      className="p-2.5 rounded-xl bg-blood/10 text-blood border border-blood/30 hover:bg-blood/20 transition-all"
                      title="Supprimer la routine"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(routines || []).length === 0 && (
            <div className="bg-panel border border-lapis-border rounded-xl p-10 text-center space-y-3">
              <Dumbbell size={48} className="mx-auto text-pharaoh-subtle" />
              <h3 className="font-display text-lg font-medium text-pharaoh tracking-wide">Aucun programme d'entraînement</h3>
              <p className="text-xs text-pharaoh-muted max-w-md mx-auto leading-relaxed">
                Créez votre premier programme sur mesure avec le bouton « Créer un Programme », ou suivez le Programme Ulkhad guidé.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE LIVE WORKOUT SESSION */}
      {activeTab === 'active_session' && (
        <div className="space-y-6">
          {!activeRoutine ? (
            <div className="bg-panel border border-lapis-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
              <Dumbbell size={64} className="mx-auto text-pharaoh-subtle" />
              <h3 className="font-display text-lg font-medium text-pharaoh tracking-wide">Aucune Séance Active</h3>
              <p className="text-xs text-pharaoh-muted">
                Sélectionnez un programme dans l'onglet « Programmes & Routines » pour démarrer votre entraînement en temps réel.
              </p>
              <button
                onClick={() => setActiveTab('programs')}
                className="btn-press px-4 py-2 rounded-xl bg-panel-gold text-gold-bright border border-gold text-xs font-medium"
              >
                Parcourir les Programmes
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Session Control Bar */}
              <div className="bg-obsidian-elevated border border-blood/50 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blood animate-ping"></span>
                    <span className="font-mono text-xs text-blood uppercase font-semibold">
                      MODE ENTRAÎNEMENT INTENSIF
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-medium text-pharaoh tracking-wide">{activeRoutine.name}</h2>
                </div>

                {/* Session Live Counters */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-3.5 py-2 rounded-xl bg-panel border border-lapis-border text-center min-w-[100px]">
                    <div className="text-[10px] font-mono text-pharaoh-subtle uppercase">CHRONO</div>
                    <div className="text-lg font-bold font-mono text-gold-bright">{formatTime(elapsedSeconds)}</div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-panel border border-lapis-border text-center min-w-[100px]">
                    <div className="text-[10px] font-mono text-pharaoh-subtle uppercase">VOLUME</div>
                    <div className="text-lg font-bold font-mono text-gold-bright">{totalVolumeKg} kg</div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-panel border border-lapis-border text-center min-w-[100px]">
                    <div className="text-[10px] font-mono text-pharaoh-subtle uppercase">SÉRIES</div>
                    <div className="text-lg font-bold font-mono text-emerald">
                      {completedSetsCount} / {totalSetsCount}
                    </div>
                  </div>

                  <button
                    onClick={handleFinishSession}
                    className="btn-press px-5 py-2.5 rounded-xl bg-emerald hover:brightness-110 text-inverse font-bold text-xs shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>TERMINER & VALIDER</span>
                  </button>
                </div>
              </div>

              {/* Rest Timer Banner if Active */}
              {isRestActive && (
                <div className="bg-gold/10 border border-gold/60 rounded-xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Timer size={24} className="text-gold" />
                    <div>
                      <div className="text-xs font-semibold text-gold-bright uppercase font-mono">TEMPS DE REPOS ENTRE SÉRIES</div>
                      <div className="text-2xl font-black font-mono text-pharaoh">{formatTime(restSecondsLeft)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addRestTime(30)}
                      className="btn-press px-3 py-1.5 rounded-xl bg-gold/20 text-gold-bright border border-gold/40 text-xs font-mono hover:bg-gold/30"
                    >
                      +30s
                    </button>
                    <button
                      onClick={() => setIsRestActive(false)}
                      className="btn-press px-3 py-1.5 rounded-xl bg-obsidian text-pharaoh-muted border border-lapis-border text-xs"
                    >
                      Passer
                    </button>
                  </div>
                </div>
              )}

              {/* Active Exercises Set-by-Set Logging Cards */}
              <div className="space-y-6">
                {activeExercises.map((ex, exIdx) => (
                  <div key={ex.id} className="bg-panel border border-lapis-border rounded-xl p-5 space-y-4 hover-lift">
                    <div className="flex items-center justify-between border-b border-lapis-border pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-obsidian border border-gold text-gold font-mono text-xs flex items-center justify-center font-bold">
                          {exIdx + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-medium text-pharaoh">{ex.name}</h3>
                          <span className={`px-2 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(ex.muscleGroup)}`}>
                            {ex.muscleGroup} • Repos recommandé : {ex.restSeconds}s
                          </span>
                        </div>
                      </div>

                      {ex.notes && (
                        <p className="text-xs text-pharaoh-muted italic hidden md:flex items-center gap-1">
                          <Info size={14} className="text-gold flex-shrink-0" /> {ex.notes}
                        </p>
                      )}
                    </div>

                    {/* Sets Grid / Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-lapis-border/50 text-pharaoh-subtle font-mono text-[11px] uppercase">
                            <th className="py-2 px-3">Série</th>
                            <th className="py-2 px-3">Charge (kg)</th>
                            <th className="py-2 px-3">Répétitions</th>
                            <th className="py-2 px-3">Valider</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lapis-border/30">
                          {((ex?.sets) || []).map((set) => (
                            <tr
                              key={set.id}
                              className={`transition-colors ${
                                set.isCompleted ? 'bg-emerald/10' : 'hover:bg-obsidian/40'
                              }`}
                            >
                              <td className="py-3 px-3 font-mono font-bold text-pharaoh-muted">
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
                                    className="w-20 px-2 py-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh font-mono text-xs font-semibold focus:border-gold outline-none"
                                  />
                                  <span className="text-pharaoh-subtle font-mono">kg</span>
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
                                    className="w-20 px-2 py-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh font-mono text-xs font-semibold focus:border-gold outline-none"
                                  />
                                  <span className="text-pharaoh-subtle font-mono">reps</span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleToggleSet(ex.id, set.id)}
                                  className={`btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                                    set.isCompleted
                                      ? 'bg-emerald text-inverse shadow-card'
                                      : 'bg-obsidian text-pharaoh-muted border border-lapis-border hover:border-gold hover:text-pharaoh'
                                  }`}
                                >
                                  <Check size={14} />
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
              <div className="bg-panel border border-lapis-border rounded-xl p-5 space-y-4">
                <h3 className="font-display text-sm font-medium text-pharaoh tracking-wide">Bilan & Remarques de la Séance</h3>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Ex: Excellentes sensations sur le développé couché. Bonne congestion des épaules..."
                  className="w-full h-20 p-3 rounded-xl bg-obsidian border border-lapis-border text-pharaoh text-xs outline-none focus:border-gold"
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
                <h2 className="font-display text-lg font-medium text-pharaoh tracking-wide">Records Personnels (PRs & 1RM Estimé)</h2>
                <p className="text-xs text-pharaoh-muted">Performances maximales enregistrées par exercice.</p>
              </div>
              <button
                onClick={() => setIsPRModalOpen(true)}
                className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel-gold text-gold-bright border border-gold text-xs font-medium"
              >
                <Plus size={14} />
                <span>Nouveau Record</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(personalRecords || []).map((pr) => (
                <div key={pr.id} className="bg-panel border border-lapis-border rounded-xl p-4 hover:border-gold/50 transition-all hover-lift">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-xl border text-[10px] uppercase font-mono ${getMuscleBadgeColor(pr.muscleGroup)}`}>
                      {pr.muscleGroup}
                    </span>
                    <span className="font-mono text-[10px] text-pharaoh-subtle">{pr.date}</span>
                  </div>

                  <h3 className="text-sm font-bold font-display text-pharaoh mb-3">{pr.exerciseName}</h3>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-obsidian border border-lapis-border text-center">
                    <div>
                      <div className="text-[10px] font-mono text-pharaoh-subtle uppercase">CHARGE MAX</div>
                      <div className="text-base font-black font-mono text-gold">
                        {pr.maxWeightKg} kg <span className="text-xs text-pharaoh-muted font-normal">×{pr.maxReps}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-pharaoh-subtle uppercase">1RM ESTIMÉ</div>
                      <div className="text-base font-black font-mono text-gold">{pr.estimated1RM} kg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Biometrics Tracker */}
          <div className="space-y-4 border-t border-lapis-border/60 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-medium text-pharaoh tracking-wide">Suivi Biométrique & Mensurations</h2>
                <p className="text-xs text-pharaoh-muted">Évolution du poids corporel et des mensurations musculaires.</p>
              </div>
              <button
                onClick={() => setIsMetricModalOpen(true)}
                className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lapis text-pharaoh border border-lapis-border text-xs font-medium"
              >
                <Plus size={14} />
                <span>Enregistrer Pesée</span>
              </button>
            </div>

            <div className="space-y-4">
              {(bodyMetrics || []).map((metric) => (
                <div key={metric.id} className="bg-panel border border-lapis-border rounded-xl p-5 space-y-3 hover-lift">
                  <div className="flex items-center justify-between border-b border-lapis-border pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gold" />
                      <span className="font-mono text-xs font-bold text-pharaoh">{metric.date}</span>
                    </div>
                    <span className="font-mono text-sm font-black text-gold">{metric.weightKg} kg</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
                    <div className="p-2 rounded-xl bg-obsidian border border-lapis-border">
                      <div className="text-[10px] font-mono text-pharaoh-subtle">GRASSE (%)</div>
                      <div className="text-xs font-bold font-mono text-blood">{metric.bodyFatPercentage || '-'}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian border border-lapis-border">
                      <div className="text-[10px] font-mono text-pharaoh-subtle">MUSCLE (%)</div>
                      <div className="text-xs font-bold font-mono text-emerald">{metric.muscleMassPercentage || '-'}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian border border-lapis-border">
                      <div className="text-[10px] font-mono text-pharaoh-subtle">POITRINE</div>
                      <div className="text-xs font-bold font-mono text-pharaoh">{metric.chestCm || '-'} cm</div>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian border border-lapis-border">
                      <div className="text-[10px] font-mono text-pharaoh-subtle">TAILLE</div>
                      <div className="text-xs font-bold font-mono text-pharaoh">{metric.waistCm || '-'} cm</div>
                    </div>
                    <div className="p-2 rounded-xl bg-obsidian border border-lapis-border">
                      <div className="text-[10px] font-mono text-pharaoh-subtle">BICEPS</div>
                      <div className="text-xs font-bold font-mono text-pharaoh">{metric.bicepsCm || '-'} cm</div>
                    </div>
                  </div>

                  {metric.notes && (
                    <p className="text-xs text-pharaoh-muted italic bg-obsidian/50 p-2 rounded-xl">
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
          <h2 className="font-display text-lg font-medium text-pharaoh tracking-wide">Historique des Séances Validées</h2>

          {(completedSessions || []).length === 0 ? (
            <div className="bg-panel border border-lapis-border rounded-xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="p-3 rounded-2xl bg-panel-gold">
                <CheckCircle2 size={24} color="var(--color-gold)" />
              </div>
              <p className="font-display text-lg font-light text-pharaoh">Aucune séance enregistrée</p>
              <p className="text-xs text-pharaoh-subtle max-w-xs">Validez votre première séance pour construire l'historique et débloquer des records.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(completedSessions || []).map((session) => (
                <div key={session.id} className="bg-panel border border-lapis-border rounded-xl p-5 space-y-3 hover-lift">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lapis-border pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-gold">{session.date}</span>
                        <span className="text-pharaoh-subtle">•</span>
                        <span className="font-mono text-xs text-pharaoh-muted">{session.startTime}</span>
                      </div>
                      <h3 className="text-base font-bold font-display text-pharaoh">{session.routineName}</h3>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted">
                        <Timer size={14} className="text-gold" /> {session.durationMinutes} min
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-obsidian border border-lapis-border text-gold font-bold">
                        <Dumbbell size={14} /> {session.totalVolumeKg} kg
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-obsidian border border-lapis-border text-blood font-bold">
                        <Flame size={14} /> {session.caloriesBurned} kcal
                      </div>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-pharaoh italic bg-obsidian p-3 rounded-xl border border-lapis-border/50 flex items-start gap-1.5">
                      <Sparkles size={14} className="text-gold flex-shrink-0 mt-0.5" /> {session.notes}
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
          <div className="bg-obsidian-elevated border border-gold/60 rounded-xl w-full max-w-2xl p-6 space-y-5 shadow-glow-gold-lg">
            <div className="flex items-center justify-between border-b border-lapis-border pb-3">
              <h3 className="font-display text-lg font-bold text-gold tracking-wide">Créer un Programme Sur Mesure</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="btn-press p-2 rounded-xl border border-lapis-border text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-pharaoh-muted uppercase mb-1">Nom du Programme</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Upper Body Hypertrophie, Core & Cardio..."
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-panel border border-lapis-border text-pharaoh text-xs focus:border-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-pharaoh-muted uppercase mb-1">Catégorie</label>
                  <select
                    value={newRoutineCategory}
                    onChange={(e: any) => setNewRoutineCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-panel border border-lapis-border text-pharaoh text-xs focus:border-gold outline-none"
                  >
                    <option value="hypertrophy">Hypertrophie</option>
                    <option value="strength">Force Athlétique</option>
                    <option value="calisthenics">Calisthénie / Poids du Corps</option>
                    <option value="cardio_hiit">Cardio & HIIT</option>
                    <option value="custom">Autre / Spécifique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-pharaoh-muted uppercase mb-1">Durée Estimée (min)</label>
                  <input
                    type="number"
                    value={newRoutineEstMin}
                    onChange={(e) => setNewRoutineEstMin(parseInt(e.target.value) || 30)}
                    className="w-full p-2.5 rounded-xl bg-panel border border-lapis-border text-pharaoh text-xs focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-pharaoh-muted uppercase mb-1">Description / Objectif</label>
                <textarea
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                  placeholder="Notes sur la fréquence, le tempo ou la méthode de surcharge..."
                  className="w-full h-16 p-2.5 rounded-xl bg-panel border border-lapis-border text-pharaoh text-xs focus:border-gold outline-none"
                />
              </div>

              {/* Dynamic Exercises List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gold uppercase font-bold">Exercices du Programme</span>
                  <button
                    type="button"
                    onClick={handleAddCustomExerciseRow}
                    className="text-xs text-gold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Ajouter un exercice
                  </button>
                </div>

                {newExercises.map((ne, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-panel border border-lapis-border space-y-2 text-xs">
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
                        className="p-1.5 rounded-xl bg-obsidian border border-lapis-border text-pharaoh outline-none focus:border-gold"
                      />
                      <select
                        value={ne.muscleGroup}
                        onChange={(e: any) => {
                          const updated = [...newExercises];
                          updated[idx].muscleGroup = e.target.value;
                          setNewExercises(updated);
                        }}
                        className="p-1.5 rounded-xl bg-obsidian border border-lapis-border text-pharaoh outline-none focus:border-gold"
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
                        <span className="text-[10px] text-pharaoh-subtle">Séries:</span>
                        <input
                          type="number"
                          value={ne.setsCount}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].setsCount = parseInt(e.target.value) || 1;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-pharaoh-subtle">Reps:</span>
                        <input
                          type="number"
                          value={ne.targetReps}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].targetReps = parseInt(e.target.value) || 10;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-pharaoh-subtle">Charge (kg):</span>
                        <input
                          type="number"
                          value={ne.weightKg}
                          onChange={(e) => {
                            const updated = [...newExercises];
                            updated[idx].weightKg = parseFloat(e.target.value) || 0;
                            setNewExercises(updated);
                          }}
                          className="w-full p-1 rounded-xl bg-obsidian border border-lapis-border text-pharaoh outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-lapis-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-press px-4 py-2 rounded-xl bg-lapis text-pharaoh-muted text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-bright text-obsidian font-bold text-xs shadow-glow-gold"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-elevated border border-gold/60 rounded-xl w-full max-w-md p-6 space-y-4 shadow-glow-gold-lg">
            <div className="flex items-center justify-between border-b border-lapis-border pb-2">
              <h3 className="font-display text-base font-bold text-gold tracking-wide">Saisir Mesures Biométriques</h3>
              <button onClick={() => setIsMetricModalOpen(false)} className="btn-press p-2 rounded-xl border border-lapis-border text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover transition-all"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveBodyMetric} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-pharaoh-muted mb-1">Poids Corporel (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={metricWeight}
                  onChange={(e) => setMetricWeight(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Masse Grasse (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricBodyFat}
                    onChange={(e) => setMetricBodyFat(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Masse Musculaire (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricMuscleMass}
                    onChange={(e) => setMetricMuscleMass(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Poitrine (cm)</label>
                  <input
                    type="number"
                    value={metricChest}
                    onChange={(e) => setMetricChest(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={metricWaist}
                    onChange={(e) => setMetricWaist(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Biceps (cm)</label>
                  <input
                    type="number"
                    value={metricBiceps}
                    onChange={(e) => setMetricBiceps(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-pharaoh-muted mb-1">Notes / État d'esprit</label>
                <input
                  type="text"
                  placeholder="Ex: Forme olympique..."
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMetricModalOpen(false)}
                  className="btn-press px-3 py-1.5 rounded-xl bg-lapis text-pharaoh-muted"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-1.5 rounded-xl bg-gold text-obsidian font-bold shadow-glow-gold"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-obsidian-elevated border border-gold/60 rounded-xl w-full max-w-md p-6 space-y-4 shadow-glow-gold-lg">
            <div className="flex items-center justify-between border-b border-lapis-border pb-2">
              <h3 className="font-display text-base font-bold text-gold tracking-wide">Enregistrer un Record Personnel</h3>
              <button onClick={() => setIsPRModalOpen(false)} className="btn-press p-2 rounded-xl border border-lapis-border text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover transition-all"><X size={18} /></button>
            </div>

            <form onSubmit={handleSavePR} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-pharaoh-muted mb-1">Nom de l'exercice</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Développé Couché, Soulevé de terre..."
                  value={prExerciseName}
                  onChange={(e) => setPrExerciseName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-mono text-pharaoh-muted mb-1">Groupe Musculaire</label>
                <select
                  value={prMuscleGroup}
                  onChange={(e: any) => setPrMuscleGroup(e.target.value)}
                  className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
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
                  <label className="block font-mono text-pharaoh-muted mb-1">Poids Soulevé (kg)</label>
                  <input
                    type="number"
                    required
                    value={prWeightKg}
                    onChange={(e) => setPrWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-pharaoh-muted mb-1">Répétitions</label>
                  <input
                    type="number"
                    required
                    value={prReps}
                    onChange={(e) => setPrReps(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-xl bg-panel border border-lapis-border text-pharaoh outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-panel border border-lapis-border text-center font-mono">
                <span className="text-[10px] text-pharaoh-subtle uppercase">1RM ESTIMÉ CALCULÉ:</span>
                <div className="text-base font-bold text-gold">
                  {Math.round(prWeightKg * (1 + prReps / 30))} kg
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPRModalOpen(false)}
                  className="btn-press px-3 py-1.5 rounded-xl bg-lapis text-pharaoh-muted"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-1.5 rounded-xl bg-gold text-obsidian font-bold shadow-glow-gold"
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
