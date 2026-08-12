import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  RoutineBlock, 
  VictoryLog, 
  NoteItem, 
  FocusSession, 
  WeeklyCategoryTarget, 
  SubjectGoal, 
  ActiveTab, 
  Category,
  Transaction,
  BudgetBucketGoal,
  SavingsGoal,
  MoneyFlowBucket,
  UserPersonalization,
  DayOfWeek,
  StreakDayRecord,
  ProjectPhase,
  PlayerProfile,
  DungeonBoss,
  WorkoutRoutine,
  CompletedWorkoutSession,
  PersonalRecord,
  BodyMetricLog,
  SystemLog
} from './types';
import { 
  INITIAL_ROUTINE_BLOCKS, 
  INITIAL_DAY_SCHEDULES,
  INITIAL_PERSONALIZATION,
  INITIAL_CATEGORY_TARGETS, 
  INITIAL_SCHOOL_SUBJECTS, 
  INITIAL_VICTORY_LOGS, 
  INITIAL_NOTES, 
  INITIAL_FOCUS_SESSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGET_BUCKETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_STREAK_RECORDS,
  INITIAL_PLAYER_PROFILE,
  INITIAL_DUNGEONS,
  INITIAL_WORKOUT_ROUTINES,
  INITIAL_COMPLETED_WORKOUTS,
  INITIAL_PERSONAL_RECORDS,
  INITIAL_BODY_METRICS
} from './data/defaultData';
import { INITIAL_PROJECT_PHASES } from './data/initialPhases';
import { Header } from './components/Header';
import { ScheduleView } from './components/ScheduleView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { VictoryJournal } from './components/VictoryJournal';
import { FocusTimer } from './components/FocusTimer';
import { NotepadWorkspace } from './components/NotepadWorkspace';
import { BudgetTracker } from './components/BudgetTracker';
import { SystemSoloLeveling } from './components/SystemSoloLeveling';
import { WorkoutSystem } from './components/WorkoutSystem';
import { AIAssistantModal } from './components/AIAssistantModal';
import { PersonalizationModal } from './components/PersonalizationModal';
import { DataManagementModal } from './components/DataManagementModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CelebrationBanner, CelebrationInfo } from './components/CelebrationBanner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DailyRitual } from './components/DailyRitual';
import { triggerVictoryConfetti, triggerAllTasksCompletedConfetti } from './lib/confetti';

export default function App() {
  // Today name initialization
  const todayWeekdayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Navigation & Selected Day State
  const [activeTab, setActiveTab] = useState<ActiveTab>('system_solo');
  const [showSystemIntro, setShowSystemIntro] = useState<boolean>(() => {
    return !localStorage.getItem('aura_system_initialized');
  });

  useEffect(() => {
    if (showSystemIntro) {
      const timer = setTimeout(() => {
        setShowSystemIntro(false);
        localStorage.setItem('aura_system_initialized', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSystemIntro]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(todayWeekdayName)
      ? todayWeekdayName
      : 'Monday'
  );
  const [streakCount, setStreakCount] = useState<number>(0);
  const [focusTimerCategory, setFocusTimerCategory] = useState<Category>('bangre_neo');
  const [isAICoachOpen, setIsAICoachOpen] = useState<boolean>(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState<boolean>(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [celebrationInfo, setCelebrationInfo] = useState<CelebrationInfo | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('aura_onboarding_completed')) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleCompleteOnboarding = (data: { userName: string; mainGoal: string; intensity: string }) => {
    setPersonalization((prev) => ({ ...prev, userName: data.userName }));
    localStorage.setItem('aura_onboarding_completed', 'true');
    setIsOnboardingOpen(false);
  };

  // Persistent User Personalization
  const [personalization, setPersonalization] = useState<UserPersonalization>(() => {
    const saved = localStorage.getItem('aura_personalization');
    return saved ? JSON.parse(saved) : INITIAL_PERSONALIZATION;
  });

  // Persistent Schedules Per Day
  const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, RoutineBlock[]>>(() => {
    const saved = localStorage.getItem('aura_day_schedules');
    return saved ? JSON.parse(saved) : INITIAL_DAY_SCHEDULES;
  });

  // Current day blocks derived from daySchedules
  const currentDayBlocks = daySchedules[selectedDay] || INITIAL_ROUTINE_BLOCKS;

  const [categoryTargets, setCategoryTargets] = useState<WeeklyCategoryTarget[]>(() => {
    const saved = localStorage.getItem('aura_category_targets');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORY_TARGETS;
  });

  const [subjectGoals, setSubjectGoals] = useState<SubjectGoal[]>(() => {
    const saved = localStorage.getItem('aura_subject_goals');
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_SUBJECTS;
  });

  const [victoryLogs, setVictoryLogs] = useState<VictoryLog[]>(() => {
    const saved = localStorage.getItem('aura_victory_logs');
    return saved ? JSON.parse(saved) : INITIAL_VICTORY_LOGS;
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('aura_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('aura_focus_sessions');
    return saved ? JSON.parse(saved) : INITIAL_FOCUS_SESSIONS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('aura_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgetBuckets, setBudgetBuckets] = useState<BudgetBucketGoal[]>(() => {
    const saved = localStorage.getItem('aura_budget_buckets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET_BUCKETS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('aura_savings_goals');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  const [streakRecords, setStreakRecords] = useState<StreakDayRecord[]>(() => {
    const saved = localStorage.getItem('aura_streak_records');
    return saved ? JSON.parse(saved) : INITIAL_STREAK_RECORDS;
  });

  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>(() => {
    const saved = localStorage.getItem('aura_project_phases');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_PHASES;
  });

  // Solo Leveling System State
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('aura_player_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_PLAYER_PROFILE,
        ...parsed,
        shadows: parsed.shadows || [],
        dailyQuests: parsed.dailyQuests || INITIAL_PLAYER_PROFILE.dailyQuests,
        penaltyQuest: parsed.penaltyQuest || INITIAL_PLAYER_PROFILE.penaltyQuest,
        unlockedDungeons: parsed.unlockedDungeons || INITIAL_PLAYER_PROFILE.unlockedDungeons,
        logs: parsed.logs || INITIAL_PLAYER_PROFILE.logs,
        inventory: parsed.inventory || INITIAL_PLAYER_PROFILE.inventory,
      };
    }
    return INITIAL_PLAYER_PROFILE;
  });

  const [dungeons, setDungeons] = useState<DungeonBoss[]>(() => {
    const saved = localStorage.getItem('aura_dungeons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
         // Optionally merge with INITIAL_DUNGEONS or just return parsed
         return parsed;
      }
    }
    return INITIAL_DUNGEONS;
  });

  // Workout System State
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>(() => {
    const saved = localStorage.getItem('aura_workout_routines');
    return saved ? JSON.parse(saved) : INITIAL_WORKOUT_ROUTINES;
  });

  const [completedWorkoutSessions, setCompletedWorkoutSessions] = useState<CompletedWorkoutSession[]>(() => {
    const saved = localStorage.getItem('aura_completed_workout_sessions');
    return saved ? JSON.parse(saved) : INITIAL_COMPLETED_WORKOUTS;
  });

  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() => {
    const saved = localStorage.getItem('aura_personal_records');
    return saved ? JSON.parse(saved) : INITIAL_PERSONAL_RECORDS;
  });

  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricLog[]>(() => {
    const saved = localStorage.getItem('aura_body_metrics');
    return saved ? JSON.parse(saved) : INITIAL_BODY_METRICS;
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('aura_personalization', JSON.stringify(personalization));
  }, [personalization]);

  useEffect(() => {
    localStorage.setItem('aura_day_schedules', JSON.stringify(daySchedules));
  }, [daySchedules]);

  useEffect(() => {
    localStorage.setItem('aura_category_targets', JSON.stringify(categoryTargets));
  }, [categoryTargets]);

  useEffect(() => {
    localStorage.setItem('aura_subject_goals', JSON.stringify(subjectGoals));
  }, [subjectGoals]);

  useEffect(() => {
    localStorage.setItem('aura_victory_logs', JSON.stringify(victoryLogs));
  }, [victoryLogs]);

  useEffect(() => {
    localStorage.setItem('aura_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('aura_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem('aura_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aura_budget_buckets', JSON.stringify(budgetBuckets));
  }, [budgetBuckets]);

  useEffect(() => {
    localStorage.setItem('aura_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('aura_streak_records', JSON.stringify(streakRecords));
  }, [streakRecords]);

  useEffect(() => {
    localStorage.setItem('aura_project_phases', JSON.stringify(projectPhases));
  }, [projectPhases]);

  useEffect(() => {
    localStorage.setItem('aura_player_profile', JSON.stringify(playerProfile));
  }, [playerProfile]);

  useEffect(() => {
    localStorage.setItem('aura_dungeons', JSON.stringify(dungeons));
  }, [dungeons]);

  useEffect(() => {
    localStorage.setItem('aura_workout_routines', JSON.stringify(workoutRoutines));
  }, [workoutRoutines]);

  useEffect(() => {
    localStorage.setItem('aura_completed_workout_sessions', JSON.stringify(completedWorkoutSessions));
  }, [completedWorkoutSessions]);

  useEffect(() => {
    localStorage.setItem('aura_personal_records', JSON.stringify(personalRecords));
  }, [personalRecords]);

  useEffect(() => {
    localStorage.setItem('aura_body_metrics', JSON.stringify(bodyMetrics));
  }, [bodyMetrics]);

  // System XP & Gold Reward Grant Helper
  const addXPAndGoldToPlayer = (xpGained: number, goldGained: number, sourceName: string) => {
    setPlayerProfile((prev) => {
      let newXp = prev.xp + xpGained;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let newAp = prev.attributePoints;
      let newRank = prev.rank;
      let newClass = prev.hunterClass;

      let leveledUp = false;
      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        newAp += 5;
        leveledUp = true;
      }

      if (leveledUp) {
        triggerVictoryConfetti();
        setCelebrationInfo({
          show: true,
          title: `VOUS AVEZ MONTE EN NIVEAU ! 🎉 (NIVEAU ${newLevel})`,
          message: `Félicitations Chasseur ! Vous avez franchi un nouveau seuil de puissance. +5 Points de statut attribués !`,
          type: 'victory',
        });

        if (newLevel >= 25) {
          newRank = 'Pharaon';
          newClass = 'Pharaon des Dieux';
        } else if (newLevel >= 20) {
          newRank = 'S';
          newClass = 'Commandant des Ombres';
        } else if (newLevel >= 15) {
          newRank = 'A';
          newClass = 'Assassin Vorace';
        } else if (newLevel >= 10) {
          newRank = 'B';
          newClass = 'Mage des Éléments';
        } else if (newLevel >= 5) {
          newRank = 'D';
          newClass = 'Guerrier Agile';
        }
      }

      const newGold = prev.gold + goldGained;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: newAp,
        rank: newRank,
        hunterClass: newClass,
        gold: newGold,
        logs: [
          {
            id: `log-xp-${Date.now()}`,
            text: `[RÉCOMPENSE SYSTÈME] +${xpGained} XP, +${goldGained} Or obtenus via : ${sourceName}.`,
            type: 'xp',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs,
        ],
      };
    });
  };

  // Background Session Start Alert Engine
  const notifiedBlocksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!personalization.notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const checkUpcomingSessions = () => {
      const now = new Date();
      const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[now.getDay()];
      const todayBlocks = daySchedules[todayName] || [];
      const leadMins = personalization.notificationLeadMinutes || 5;

      todayBlocks.forEach((block) => {
        if (block.isCompleted) return;

        const [hours, minutes] = block.startTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;

        const blockStartTime = new Date(now);
        blockStartTime.setHours(hours, minutes, 0, 0);

        const diffMs = blockStartTime.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // Alert if session starts within leadMins and hasn't started more than 1 minute ago
        if (diffMins > -1 && diffMins <= leadMins) {
          const notificationKey = `${now.toDateString()}-${todayName}-${block.id}-${block.startTime}`;
          if (!notifiedBlocksRef.current.has(notificationKey)) {
            notifiedBlocksRef.current.add(notificationKey);

            const displayMins = Math.max(1, Math.ceil(diffMins));
            const categoryLabel = block.category.replace('_', ' ').toUpperCase();

            try {
              new Notification(`Upcoming Session: ${block.title}`, {
                body: `Starts in ${displayMins} min (${block.startTime}). Category: ${categoryLabel}`,
                icon: '/favicon.ico',
                tag: notificationKey,
              });
            } catch (err) {
              console.error('Notification trigger error:', err);
            }
          }
        }
      });
    };

    checkUpcomingSessions();
    const intervalId = setInterval(checkUpcomingSessions, 20000);

    return () => clearInterval(intervalId);
  }, [personalization.notificationsEnabled, personalization.notificationLeadMinutes, daySchedules]);

  const handleToggleDayStreak = (id: string) => {
    setStreakRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isAchievedNow = !r.allGoalsMet;
          if (isAchievedNow) {
            triggerAllTasksCompletedConfetti();
            setCelebrationInfo({
              show: true,
              title: `100% ${r.dayName} Goals Fulfilled! 🎉`,
              message: `Fantastic work maintaining your execution momentum on ${r.dayName}.`,
              type: 'tasks_complete',
            });
          }
          return {
            ...r,
            allGoalsMet: isAchievedNow,
            completionPercentage: isAchievedNow ? 100 : 80,
            completedBlocksCount: isAchievedNow ? r.totalBlocksCount : Math.max(0, r.totalBlocksCount - 2),
          };
        }
        return r;
      })
    );
  };

  // Financial Handlers
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateBucketAllocation = (bucketKey: MoneyFlowBucket, newLimit: number) => {
    setBudgetBuckets((prev) =>
      prev.map((b) => (b.bucket === bucketKey ? { ...b, monthlyAllocation: newLimit } : b))
    );
  };

  const handleAddSavingsGoal = (newGoal: SavingsGoal) => {
    setSavingsGoals((prev) => [...prev, newGoal]);
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateSavingsGoalAmount = (id: string, delta: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) } : g))
    );
  };

  // Routine Checkbox Toggle Handler
  const handleToggleBlockComplete = (id: string) => {
    setDaySchedules((prev) => {
      const currentBlocks = prev[selectedDay] || [];
      const wasAllCompletedBefore = currentBlocks.length > 0 && currentBlocks.every((b) => b.isCompleted);

      const updatedBlocks = currentBlocks.map((b) => {
        if (b.id === id) {
          const newStatus = !b.isCompleted;
          const hoursDelta = (b.durationMinutes / 60) * (newStatus ? 1 : -1);

          if (newStatus) {
            // Reward XP and Gold via System
            const xpAmount = Math.max(30, Math.floor(b.durationMinutes * 0.8));
            const goldAmount = Math.max(15, Math.floor(b.durationMinutes * 0.4));
            addXPAndGoldToPlayer(xpAmount, goldAmount, `Tâche : ${b.title}`);
          }

          // Update Category Targets
          setCategoryTargets((targets) =>
            targets.map((t) => {
              if (t.id === b.category) {
                return { ...t, completedHours: Math.max(0, t.completedHours + hoursDelta) };
              }
              return t;
            })
          );

          // If school block, also update subject hours
          if (b.category === 'school' && b.schoolSubject) {
            setSubjectGoals((subjs) =>
              subjs.map((s) => {
                if (s.subject === b.schoolSubject) {
                  return { ...s, completedHours: Math.max(0, s.completedHours + hoursDelta) };
                }
                return s;
              })
            );
          }

          return { ...b, isCompleted: newStatus };
        }
        return b;
      });

      const isAllCompletedNow = updatedBlocks.length > 0 && updatedBlocks.every((b) => b.isCompleted);

      if (!wasAllCompletedBefore && isAllCompletedNow) {
        triggerAllTasksCompletedConfetti();
        addXPAndGoldToPlayer(200, 100, `100% de la journée ${selectedDay} accomplie !`);
        setCelebrationInfo({
          show: true,
          title: `100% du Programme ${selectedDay} Accomplis ! 🎉`,
          message: `Discipline exceptionnelle Chasseur ! Vous avez rempli tous les blocs de votre journée (+200 XP, +100 Or).`,
          type: 'tasks_complete',
        });
      }

      return {
        ...prev,
        [selectedDay]: updatedBlocks,
      };
    });
  };

  const handleAddBlock = (newBlock: RoutineBlock) => {
    setDaySchedules((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newBlock],
    }));
  };

  const handleDeleteBlock = (id: string) => {
    setDaySchedules((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter((b) => b.id !== id),
    }));
  };

  const handleUpdateCategoryHours = (id: string, delta: number) => {
    setCategoryTargets((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, completedHours: Math.max(0, c.completedHours + delta) };
        }
        return c;
      })
    );
  };

  const handleUpdateSubjectHours = (subjectKey: string, delta: number) => {
    setSubjectGoals((prev) =>
      prev.map((s) => {
        if (s.subject === subjectKey) {
          return { ...s, completedHours: Math.max(0, s.completedHours + delta) };
        }
        return s;
      })
    );
  };

  // Focus Session Completion Handler
  const handleFocusSessionComplete = (session: FocusSession) => {
    setFocusSessions((prev) => [session, ...prev]);

    const hoursAdded = session.durationMinutes / 60;
    const xpBonus = Math.floor(session.durationMinutes * 1.5);
    const goldBonus = Math.floor(session.durationMinutes * 0.8);
    addXPAndGoldToPlayer(xpBonus, goldBonus, `Session Focus : ${session.title}`);

    // Credit category hours
    setCategoryTargets((prev) =>
      prev.map((c) => {
        if (c.id === session.category) {
          return { ...c, completedHours: c.completedHours + hoursAdded };
        }
        return c;
      })
    );

    // Credit subject hours if school session
    if (session.category === 'school' && session.schoolSubject) {
      setSubjectGoals((prev) =>
        prev.map((s) => {
          if (s.subject === session.schoolSubject) {
            return { ...s, completedHours: s.completedHours + hoursAdded };
          }
          return s;
        })
      );
    }
  };

  const handleStartFocusSession = (category: Category) => {
    setFocusTimerCategory(category);
    setActiveTab('focus_timer');
  };

  // Victory Log Handlers
  const handleAddVictoryLog = (log: VictoryLog) => {
    setVictoryLogs((prev) => [log, ...prev]);
    setStreakCount((s) => s + 1);
    addXPAndGoldToPlayer(100, 50, 'Journal des Victoires Enregistré');
    triggerVictoryConfetti();
    setCelebrationInfo({
      show: true,
      title: 'Bilan de Victoire Enregistré ! 🏆',
      message: `Nouvelle entrée ajoutée au journal de bord pour ${log.date}. +100 XP & +50 Or attribués par le Système !`,
      type: 'victory',
    });
  };

  const handleDeleteVictoryLog = (id: string) => {
    setVictoryLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Note Handlers
  const handleAddNote = (note: NoteItem) => {
    setNotes((prev) => [note, ...prev]);
  };

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Workout Handlers
  const handleSaveWorkoutRoutine = (routine: WorkoutRoutine) => {
    setWorkoutRoutines((prev) => [routine, ...prev]);
  };

  const handleDeleteWorkoutRoutine = (routineId: string) => {
    setWorkoutRoutines((prev) => prev.filter((r) => r.id !== routineId));
  };

  const handleCompleteWorkoutSession = (session: CompletedWorkoutSession, newPRs: PersonalRecord[]) => {
    setCompletedWorkoutSessions((prev) => [session, ...prev]);

    if (newPRs.length > 0) {
      setPersonalRecords((prev) => {
        const updated = [...prev];
        newPRs.forEach((npr) => {
          const idx = updated.findIndex(
            (p) => p.exerciseName.toLowerCase() === npr.exerciseName.toLowerCase()
          );
          if (idx >= 0) {
            updated[idx] = npr;
          } else {
            updated.push(npr);
          }
        });
        return updated;
      });
    }

    // Award XP and Gold via Solo Leveling System (+250 XP, +80 Gold, +1 Force)
    addXPAndGoldToPlayer(250, 80, `Entraînement : ${session.routineName}`);
    setPlayerProfile((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        force: prev.attributes.force + 1,
      },
    }));

    // Credit Morning Routine hours
    setCategoryTargets((prev) =>
      prev.map((c) => {
        if (c.id === 'morning_routine') {
          return { ...c, completedHours: c.completedHours + session.durationMinutes / 60 };
        }
        return c;
      })
    );

    setCelebrationInfo({
      show: true,
      title: `Séance de Musculation Validée ! 🏋️`,
      message: `Excellent effort ! ${session.durationMinutes} min complétées (${session.totalVolumeKg} kg soulevés). +250 XP, +80 Or & +1 Statut Force attribués par le Système !`,
      type: 'victory',
    });
  };

  const handleAddBodyMetric = (metric: BodyMetricLog) => {
    setBodyMetrics((prev) => [metric, ...prev]);
    addXPAndGoldToPlayer(50, 20, 'Pesée Biométrique Enregistrée');
  };

  const handleAddPR = (pr: PersonalRecord) => {
    setPersonalRecords((prev) => [pr, ...prev]);
    addXPAndGoldToPlayer(100, 40, `Nouveau Record : ${pr.exerciseName}`);
    triggerVictoryConfetti();
  };

  // Project Phase Handlers
  const handleAddPhase = (newPhase: ProjectPhase) => {
    setProjectPhases((prev) => [...prev, newPhase]);
  };

  const handleUpdatePhase = (updatedPhase: ProjectPhase) => {
    setProjectPhases((prev) => prev.map((p) => (p.id === updatedPhase.id ? updatedPhase : p)));
  };

  const handleDeletePhase = (id: string) => {
    setProjectPhases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleInvokeRitualBlessing = (xpAmount: number) => {
    setPlayerProfile(prev => {
      let newXp = prev.xp + xpAmount;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let leveledUp = false;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        leveledUp = true;
      }

      const log: SystemLog = {
        id: `ritual-${Date.now()}`,
        text: `[RITUEL] Vous avez reçu une Bénédiction Divine. +${xpAmount} XP obtenus.`,
        type: 'xp',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      if (leveledUp) {
        triggerVictoryConfetti();
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: leveledUp ? prev.attributePoints + 5 : prev.attributePoints,
        logs: [log, ...prev.logs]
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#051428] text-white font-sans selection:bg-cyan-400/30 selection:text-white flex flex-col justify-between">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakCount={streakCount}
        playerProfile={playerProfile}
        openAICoach={() => setIsAICoachOpen(true)}
        openFocusTimerQuick={() => setActiveTab('focus_timer')}
        openPersonalizationModal={() => setIsPersonalizationOpen(true)}
        openDataManagement={() => setIsDataManagementOpen(true)}
        isOffline={isOffline}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-24 md:py-8 w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full relative"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DailyRitual onInvokeBlessing={handleInvokeRitualBlessing} />
                <ScheduleView
                  blocks={currentDayBlocks}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  personalization={personalization}
                  onToggleComplete={handleToggleBlockComplete}
                  onAddBlock={handleAddBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onStartFocusSession={handleStartFocusSession}
                  openPersonalizationModal={() => setIsPersonalizationOpen(true)}
                />
              </div>
            )}

            {activeTab === 'system_solo' && (
              <SystemSoloLeveling
                player={playerProfile}
                dungeons={dungeons}
                onUpdatePlayer={setPlayerProfile}
                onUpdateDungeons={setDungeons}
                onTriggerVictoryConfetti={triggerVictoryConfetti}
                totalCompletedTasks={Object.values(daySchedules).flat().filter((b: any) => b.isCompleted).length}
                streakCount={streakCount}
                onOpenDataManagement={() => setIsDataManagementOpen(true)}
              />
            )}

            {activeTab === 'workout' && (
              <WorkoutSystem
                workoutRoutines={workoutRoutines}
                completedSessions={completedWorkoutSessions}
                personalRecords={personalRecords}
                bodyMetrics={bodyMetrics}
                onSaveRoutine={handleSaveWorkoutRoutine}
                onDeleteRoutine={handleDeleteWorkoutRoutine}
                onCompleteSession={handleCompleteWorkoutSession}
                onAddMetric={handleAddBodyMetric}
                onAddPR={handleAddPR}
              />
            )}

            {activeTab === 'weekly_targets' && (
              <ProgressDashboard
                categoryTargets={categoryTargets}
                subjectGoals={subjectGoals}
                personalization={personalization}
                streakRecords={streakRecords}
                currentStreak={streakCount}
                onUpdateCategoryHours={handleUpdateCategoryHours}
                onUpdateSubjectHours={handleUpdateSubjectHours}
                onOpenFocusTimer={() => setActiveTab('focus_timer')}
                openPersonalizationModal={() => setIsPersonalizationOpen(true)}
                onUpdatePersonalization={setPersonalization}
                onToggleDayStreak={handleToggleDayStreak}
              />
            )}

            {activeTab === 'focus_timer' && (
              <FocusTimer
                initialCategory={focusTimerCategory}
                onSessionComplete={handleFocusSessionComplete}
              />
            )}

            {activeTab === 'victory_journal' && (
              <VictoryJournal
                logs={victoryLogs}
                onAddLog={handleAddVictoryLog}
                onDeleteLog={handleDeleteVictoryLog}
              />
            )}

            {activeTab === 'notepad' && (
              <NotepadWorkspace
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                projectPhases={projectPhases}
                onAddPhase={handleAddPhase}
                onUpdatePhase={handleUpdatePhase}
                onDeletePhase={handleDeletePhase}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetTracker
                transactions={transactions}
                budgetBuckets={budgetBuckets}
                savingsGoals={savingsGoals}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateBucketAllocation={handleUpdateBucketAllocation}
                onAddSavingsGoal={handleAddSavingsGoal}
                onUpdateSavingsGoalAmount={handleUpdateSavingsGoalAmount}
                onDeleteSavingsGoal={handleDeleteSavingsGoal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-soft bg-[#051428] py-6 px-4 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">
            {personalization.userName.toUpperCase()} OS • BANGRE NEO LAB & CINEMA MASTERY SYSTEM
          </p>
          <div className="flex items-center gap-3 mono text-[11px]">
            <span className="opacity-70">Bangre Neo: <strong className="accent-cyan">15-20h/wk</strong></span>
            <span className="opacity-30">•</span>
            <span className="opacity-70">Cinema: <strong className="accent-cyan">10-15h/wk</strong></span>
            <span className="opacity-30">•</span>
            <span className="opacity-70">School: <strong className="accent-cyan">5-10h/wk</strong></span>
          </div>
        </div>
      </footer>

      {/* AI Coach Assistant Modal */}
      <AIAssistantModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        contextData={{
          categoryTargets,
          subjectGoals,
          completedBlocks: currentDayBlocks.filter((b) => b.isCompleted).length,
          totalBlocks: currentDayBlocks.length,
          streakCount,
        }}
      />

      {/* User Personalization Modal */}
      <PersonalizationModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        personalization={personalization}
        onUpdatePersonalization={setPersonalization}
      />

      {/* Data Management Modal */}
      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />

      {/* Celebration Confetti Toast Overlay */}
      <CelebrationBanner
        info={celebrationInfo}
        onClose={() => setCelebrationInfo(null)}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
