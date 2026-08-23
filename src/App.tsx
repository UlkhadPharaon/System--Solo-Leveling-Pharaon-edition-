import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
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
  SystemLog,
  Domain,
  HabitCheck
} from './types';
// Push notification helpers
import { sendPushViaServer, showLocalNotification } from './lib/pushNotifications';
import { 
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
// Default tab stays eager (first paint); everything else is code-split so
// phones don't download recharts/lottie/budget code they may never open.
const ScheduleView = lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const VictoryJournal = lazy(() => import('./components/VictoryJournal').then(m => ({ default: m.VictoryJournal })));
const FocusTimer = lazy(() => import('./components/FocusTimer').then(m => ({ default: m.FocusTimer })));
const NotepadWorkspace = lazy(() => import('./components/NotepadWorkspace').then(m => ({ default: m.NotepadWorkspace })));
const BudgetTracker = lazy(() => import('./components/BudgetTracker').then(m => ({ default: m.BudgetTracker })));
const WorkoutSystem = lazy(() => import('./components/WorkoutSystem').then(m => ({ default: m.WorkoutSystem })));
const PersonalizationModal = lazy(() => import('./components/PersonalizationModal').then(m => ({ default: m.PersonalizationModal })));
import { WeeklyReportCard } from './components/WeeklyReportCard';
// Landing tab + lightweight modals stay in the main bundle.
import { SystemSoloLeveling } from './components/SystemSoloLeveling';
import { AIAssistantModal } from './components/AIAssistantModal';
import { DataManagementModal } from './components/DataManagementModal';
import { MiniPlayer } from './components/MiniPlayer';
import { FloatingRewardLayer } from './components/FloatingReward';
import { TabSkeleton } from './components/TabSkeleton';
import { SystemWindowLayer, announceSystem } from './components/SystemWindow';
import { playSfx } from './lib/sfx';
import { CelebrationBanner, CelebrationInfo } from './components/CelebrationBanner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DailyRitual } from './components/DailyRitual';
import { triggerVictoryConfetti, triggerAllTasksCompletedConfetti } from './lib/confetti';
import { calculateLevelProgression, getRankAndClassForLevel, blockReward, focusSessionReward, workoutReward, XP_RATES } from './lib/utils';
import { haptic } from './lib/haptics';
import { buildWeeklyReport } from './lib/weeklyReport';
import { registerComboHit } from './lib/comboEngine';
import { fireReward } from './components/FloatingReward';
import { DailyBonusModal } from './components/DailyBonusModal';
import { registerTodayActivity, shouldShowDailyPopup, DailyStreakState } from './lib/dailyEngine';
import { cloudSync } from './lib/supabaseSync';
import {
  loadDomains,
  saveDomains,
  migrateLegacyDomainsIfNeeded,
  computeDomainWeights,
  domainsForTracking,
  styleForDomain,
} from './lib/domains';
import { generateInitialQuests, buildTemplateQuests } from './lib/questGeneration';
import { HabitChecklistCard } from './components/HabitChecklistCard';
import { OnboardingModal, OnboardingV2Result, ONBOARDING_V2_ENABLED } from './components/OnboardingModal';
import { SystemIntroOverlay } from './components/SystemIntroOverlay';

/** Safe localStorage JSON loader — falls back to default when corrupt (#13). */
function loadJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/** Reset daily quests when the date changes since last visit (#3). */
function resetDailyQuestsIfNeeded<T extends { dailyQuests?: any[]; penaltyQuest?: any }>(profile: T): T {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = localStorage.getItem('aura_daily_quest_reset');
    if (lastReset === today || !profile?.dailyQuests) return profile;
    localStorage.setItem('aura_daily_quest_reset', today);
    // New day: quests reset AND MP fully regenerates (#16 — MP was spent but never restored)
    return {
      ...profile,
      mp: (profile as any).maxMp || 50,
      dailyQuests: profile.dailyQuests.map((q: any) => ({
        ...q,
        isCompleted: false,
        currentCount: 0,
      })),
    };
  } catch {
    return profile;
  }
}

export default function App() {
  // Today name initialization
  const todayWeekdayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Navigation & Selected Day State
  // PWA shortcuts (manifest.json) deep-link via ?tab=<id> — honor it on boot.
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('tab');
      const valid: ActiveTab[] = ['system_solo', 'dashboard', 'workout', 'focus_timer', 'weekly_targets', 'victory_journal', 'notepad', 'budget'];
      return (valid as string[]).includes(fromUrl || '') ? (fromUrl as ActiveTab) : 'system_solo';
    } catch {
      return 'system_solo';
    }
  });
  // First-visit orientation (#5 UX audit): the tour overlay is shown right
  // after onboarding closes (see handleCompleteOnboarding*), and once at boot
  // for users who already completed onboarding but never saw it. It can be
  // re-opened anytime via the header Help button.
  const [showSystemIntro, setShowSystemIntro] = useState<boolean>(false);

  useEffect(() => {
    if (localStorage.getItem('aura_onboarding_completed') && !localStorage.getItem('aura_system_initialized')) {
      setShowSystemIntro(true);
    }
  }, []);

  const dismissSystemIntro = () => {
    setShowSystemIntro(false);
    localStorage.setItem('aura_system_initialized', 'true');
  };
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(todayWeekdayName)
      ? todayWeekdayName
      : 'Monday'
  );
  // Real consecutive-day streak engine (#1 audit: old streakCount was dead state)
  const [dailyStreak, setDailyStreak] = useState<DailyStreakState>(() => {
    const { state } = registerTodayActivity();
    return state;
  });
  const [showDailyBonus, setShowDailyBonus] = useState<boolean>(() => shouldShowDailyPopup());
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

  const handleCompleteOnboarding = (data?: { userName: string; mainGoal: string; intensity: string }) => {
    setPersonalization((prev) => ({ ...prev, userName: data?.userName }));
    localStorage.setItem('aura_onboarding_completed', 'true');
    setIsOnboardingOpen(false);
    setShowSystemIntro(true);
  };

  /**
   * Onboarding v2 completion — the Domain engine's entry point. Everything
   * downstream (targets, subjects, buckets, quests, weights) is DERIVED from
   * the domains the user declared; nothing is hardcoded per profile anymore.
   */
  const handleCompleteOnboardingV2 = (result: OnboardingV2Result) => {
    const { userName, answers, domains: newDomains, coachingIntensity, penaltyCategoriesAllowed } = result;

    // 1. Domains become the source of truth
    saveDomains(newDomains);
    setDomains(newDomains);

    // 2. Persona: name + calibration persisted (previously discarded) — the
    // legacy personalization blobs (cinema/bangre profiles, school lessons,
    // hardcoded tagline & workout focus) are blanked for fresh users.
    setPersonalization((prev) => ({
      ...prev,
      userName,
      userTagline: 'Chasseur en ascension — des domaines de vie définis par toi.',
      workoutFocusByDay: {},
      cinemaProject: { ...prev.cinemaProject, title: '', synopsis: '', milestones: [] },
      bangreLab: { ...prev.bangreLab, projectName: '', milestones: [] },
      lessons: [],
    }));

    // 3. Weekly category targets derived from domain time budgets
    const derivedTargets = newDomains.map((d) => {
      const style = styleForDomain(d);
      const budget = d.weekly_time_budget || 3;
      return {
        id: `dom:${d.id}` as any,
        label: d.label,
        minHours: Math.max(1, Math.round(budget * 0.7)),
        maxHours: Math.round(budget * 1.2),
        targetHours: budget,
        completedHours: 0,
        color: style.color,
        bgGradient: 'from-cyan-950/40 to-card',
        description: d.goal_text || `Objectif hebdomadaire — ${d.label}`,
      };
    });
    setCategoryTargets(derivedTargets);
    localStorage.setItem('aura_category_targets', JSON.stringify(derivedTargets));

    // 4. Study subjects from study_subjects domains (their labels, not hardcoded SVT/Maths)
    const derivedSubjects = domainsForTracking(newDomains, 'study_subjects').map((d) => ({
      subject: `domain_subject:${d.id}` as any,
      name: d.label,
      targetWeeklyHours: d.weekly_time_budget || 3,
      completedHours: 0,
      color: styleForDomain(d).color,
      domainId: d.id,
    }));
    setSubjectGoals(derivedSubjects);
    localStorage.setItem('aura_subject_goals', JSON.stringify(derivedSubjects));

    // 5. Budget envelopes from budget_bucket domains (+ generic savings/daily)
    const domainBuckets = domainsForTracking(newDomains, 'budget_bucket').map((d) => ({
      bucket: `domain:${d.id}` as any,
      label: d.label,
      monthlyAllocation: 0,
      description: d.goal_text || `Enveloppe ${d.label}`,
      color: styleForDomain(d).color,
    }));
    const genericBuckets = [
      {
        bucket: 'savings_investment' as any,
        label: 'Épargne & Réserves',
        monthlyAllocation: 0,
        description: 'Réserve de sécurité et investissements',
        color: '#10b981',
      },
      {
        bucket: 'living_essentials' as any,
        label: 'Dépenses Essentielles',
        monthlyAllocation: 0,
        description: 'Quotidien : logement, nourriture, transport',
        color: '#3b82f6',
      },
    ];
    const newBuckets = [...domainBuckets, ...genericBuckets];
    setBudgetBuckets(newBuckets);
    localStorage.setItem('aura_budget_buckets', JSON.stringify(newBuckets));

    // 5b. Fresh start: strip the legacy demo dataset (Bangre/Cinéma/École
    // sample transactions, notes, schedules…) — a new user must see zero
    // hardcoded labels from the previous hardcoded profile.
    setTransactions([]);
    localStorage.setItem('aura_transactions', '[]');
    setNotes([]);
    localStorage.setItem('aura_notes', '[]');
    setFocusSessions([]);
    localStorage.setItem('aura_focus_sessions', '[]');
    setVictoryLogs([]);
    localStorage.setItem('aura_victory_logs', '[]');
    setStreakRecords([]);
    localStorage.setItem('aura_streak_records', '[]');
    setProjectPhases([]);
    localStorage.setItem('aura_project_phases', '[]');
    setSavingsGoals([]);
    localStorage.setItem('aura_savings_goals', '[]');
    const emptySchedule = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
    } as Record<DayOfWeek, never[]>;
    setDaySchedules(emptySchedule);
    localStorage.setItem('aura_day_schedules', JSON.stringify(emptySchedule));

    // 6. domain_weights: deterministic normalization of weekly budgets
    const weights = computeDomainWeights(newDomains);

    // 7. First quests: deterministic templates immediately (never blocked),
    //    then upgraded by LLM-generated quests when the endpoint answers.
    const templateQuests = buildTemplateQuests(newDomains);
    setPlayerProfile((prev) => ({
      ...prev,
      onboarding_answers: answers,
      coaching_intensity: coachingIntensity,
      penalty_categories_allowed: penaltyCategoriesAllowed,
      domain_weights: weights,
      generatedQuests: templateQuests,
    }));

    generateInitialQuests({
      vision: answers.vision,
      domains: newDomains,
      coachingIntensity,
      physicalConstraint: answers.physicalConstraint,
    }).then((quests) => {
      if (quests.some((q) => q.source === 'llm')) {
        setPlayerProfile((prev) => ({ ...prev, generatedQuests: quests }));
      }
    });

    // 8. Flags — v2 versioned so a rollback path exists
    localStorage.setItem('aura_onboarding_completed', 'true');
    localStorage.setItem('aura_onboarding_version', '2');
    setIsOnboardingOpen(false);
    // 9. Show the module tour right away — new users must know where everything lives.
    setShowSystemIntro(true);
  };

  // habit_checklist module: daily check toggle (XP via centralized rate table)
  const handleToggleHabitCheck = (domain: Domain) => {
    const existing = habitChecks.find((c) => c.domainId === domain.id && c.date === todayStr);
    if (existing?.done) {
      // un-check (no XP clawback — keep it simple and forgiving)
      setHabitChecks((prev) => prev.filter((c) => c.id !== existing.id));
      return;
    }
    setHabitChecks((prev) => [
      ...prev.filter((c) => !(c.domainId === domain.id && c.date === todayStr)),
      { id: `hc-${Date.now()}`, domainId: domain.id, date: todayStr, done: true },
    ]);
    addXPAndGoldToPlayer(XP_RATES.habitCheckXp, XP_RATES.habitCheckGold, `Habitude : ${domain.label}`);
  };

  // Persistent User Personalization
  const [personalization, setPersonalization] = useState<UserPersonalization>(() =>
    loadJson('aura_personalization', INITIAL_PERSONALIZATION)
  );

  // Adaptive Domain Engine state (onboarding v2) — one-shot legacy migration
  // at boot keeps the existing (Ulrich) instance pixel-identical, now driven
  // by Domain rows instead of hardcoded labels.
  const [domains, setDomains] = useState<Domain[]>(() => migrateLegacyDomainsIfNeeded());

  // habit_checklist daily checks
  const [habitChecks, setHabitChecks] = useState<HabitCheck[]>(() =>
    loadJson<HabitCheck[]>('aura_habit_checks', [])
  );
  const todayStr = new Date().toISOString().split('T')[0];

  // Persistent Schedules Per Day
  const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, RoutineBlock[]>>(() => {
    const saved = localStorage.getItem('aura_day_schedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let modified = false;
        for (const day in parsed) {
          parsed[day] = parsed[day].map((block: any) => {
            if (block.category === 'sleep' && block.endTime === '06:30') {
              modified = true;
              return { ...block, endTime: '05:00', durationMinutes: 390 };
            }
            if (block.title.includes('Musculation') && block.startTime === '06:30') {
              modified = true;
              return { ...block, startTime: '05:00', endTime: '05:45', durationMinutes: 45 };
            }
            if (block.title.includes('Oratoire') && block.startTime === '07:15') {
              modified = true;
              return { ...block, startTime: '05:45', endTime: '05:55', durationMinutes: 10 };
            }
            if (block.title.includes('Visage') && block.startTime === '07:25') {
              modified = true;
              return { ...block, startTime: '05:55', endTime: '06:25', durationMinutes: 30 };
            }
            return block;
          });
        }
        if (modified) {
          localStorage.setItem('aura_day_schedules', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_DAY_SCHEDULES;
  });

  // Current day blocks derived from daySchedules
  const currentDayBlocks = daySchedules[selectedDay] || INITIAL_DAY_SCHEDULES[selectedDay] || [];

  const [categoryTargets, setCategoryTargets] = useState<WeeklyCategoryTarget[]>(() => {
    return loadJson('aura_category_targets', INITIAL_CATEGORY_TARGETS);
  });

  const [subjectGoals, setSubjectGoals] = useState<SubjectGoal[]>(() => {
    return loadJson('aura_subject_goals', INITIAL_SCHOOL_SUBJECTS);
  });

  const [victoryLogs, setVictoryLogs] = useState<VictoryLog[]>(() => {
    return loadJson('aura_victory_logs', INITIAL_VICTORY_LOGS);
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    return loadJson('aura_notes', INITIAL_NOTES);
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    return loadJson('aura_focus_sessions', INITIAL_FOCUS_SESSIONS);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return loadJson('aura_transactions', INITIAL_TRANSACTIONS);
  });

  const [budgetBuckets, setBudgetBuckets] = useState<BudgetBucketGoal[]>(() => {
    return loadJson('aura_budget_buckets', INITIAL_BUDGET_BUCKETS);
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    return loadJson('aura_savings_goals', INITIAL_SAVINGS_GOALS);
  });

  const [streakRecords, setStreakRecords] = useState<StreakDayRecord[]>(() => {
    return loadJson('aura_streak_records', INITIAL_STREAK_RECORDS);
  });

  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>(() => {
    return loadJson('aura_project_phases', INITIAL_PROJECT_PHASES);
  });

  // Solo Leveling System State
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('aura_player_profile');
    if (saved) {
      try {
        const parsed = resetDailyQuestsIfNeeded(JSON.parse(saved));
        if (parsed && typeof parsed === 'object') {
          const rawLevel = typeof parsed.level === 'number' && parsed.level > 0 ? parsed.level : INITIAL_PLAYER_PROFILE.level;
          const rawXp = typeof parsed.xp === 'number' && parsed.xp >= 0 ? parsed.xp : 0;
          const rawXpNext = typeof parsed.xpToNextLevel === 'number' && parsed.xpToNextLevel > 0 ? parsed.xpToNextLevel : 100;
          
          const progression = calculateLevelProgression(rawXp, rawLevel, rawXpNext, 0);
          const rankInfo = getRankAndClassForLevel(progression.level);

          return {
            ...INITIAL_PLAYER_PROFILE,
            ...parsed,
            level: progression.level,
            xp: progression.xp,
            xpToNextLevel: progression.xpToNextLevel,
            rank: parsed.rank || rankInfo.rank,
            hunterClass: parsed.hunterClass || rankInfo.hunterClass,
            attributePoints: typeof parsed.attributePoints === 'number' && parsed.attributePoints >= 0 ? parsed.attributePoints : INITIAL_PLAYER_PROFILE.attributePoints,
            gold: typeof parsed.gold === 'number' && parsed.gold >= 0 ? parsed.gold : INITIAL_PLAYER_PROFILE.gold,
            attributes: {
              ...INITIAL_PLAYER_PROFILE.attributes,
              ...(parsed.attributes || {})
            },
            shadows: Array.isArray(parsed.shadows) ? parsed.shadows : [],
            dailyQuests: Array.isArray(parsed.dailyQuests) ? parsed.dailyQuests : INITIAL_PLAYER_PROFILE.dailyQuests,
            penaltyQuest: parsed.penaltyQuest || INITIAL_PLAYER_PROFILE.penaltyQuest,
            unlockedDungeons: Array.isArray(parsed.unlockedDungeons) ? parsed.unlockedDungeons : INITIAL_PLAYER_PROFILE.unlockedDungeons,
            logs: Array.isArray(parsed.logs) ? parsed.logs : INITIAL_PLAYER_PROFILE.logs,
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : INITIAL_PLAYER_PROFILE.inventory,
          };
        }
      } catch {
        return INITIAL_PLAYER_PROFILE;
      }
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
    return loadJson('aura_workout_routines', INITIAL_WORKOUT_ROUTINES);
  });

  const [completedWorkoutSessions, setCompletedWorkoutSessions] = useState<CompletedWorkoutSession[]>(() => {
    return loadJson('aura_completed_workout_sessions', INITIAL_COMPLETED_WORKOUTS);
  });

  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() => {
    return loadJson('aura_personal_records', INITIAL_PERSONAL_RECORDS);
  });

  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricLog[]>(() => {
    return loadJson('aura_body_metrics', INITIAL_BODY_METRICS);
  });

  // F4 — Weekly report ("Palier de la Semaine"): pure aggregation of the
  // same state the app already renders; recomputed only when inputs change.
  const weeklyReport = useMemo(
    () =>
      buildWeeklyReport(
        categoryTargets,
        focusSessions,
        dailyStreak,
        Object.values(daySchedules).flat().filter((b: any) => b.isCompleted).length,
        Object.values(daySchedules).flat().length,
      ),
    [categoryTargets, focusSessions, dailyStreak, daySchedules],
  );

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

  useEffect(() => {
    if (domains.length > 0) localStorage.setItem('aura_domains', JSON.stringify(domains));
  }, [domains]);

  useEffect(() => {
    localStorage.setItem('aura_habit_checks', JSON.stringify(habitChecks));
  }, [habitChecks]);

  // Cloud sync: initialize once, then debounce-push whenever any synced slice changes.
  const syncTick = [personalization, daySchedules, categoryTargets, subjectGoals, victoryLogs, notes,
    focusSessions, transactions, budgetBuckets, savingsGoals, streakRecords, projectPhases,
    playerProfile, dungeons, workoutRoutines, completedWorkoutSessions, personalRecords, bodyMetrics,
    domains, habitChecks];

  useEffect(() => {
    cloudSync.init();
    const onRestored = () => window.location.reload(); // rehydrate from cloud snapshot
    window.addEventListener('aura:cloud-restored', onRestored);
    return () => window.removeEventListener('aura:cloud-restored', onRestored);
  }, []);

  useEffect(() => {
    cloudSync.schedulePush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, syncTick);

  // System XP & Gold Reward Grant Helper
  // Side effects (confetti / banner) are computed from current state BEFORE the
  // updater so React StrictMode double-invocation cannot double-grant them (#2).
  const celebrationGuardRef = useRef<string>('');
  const addXPAndGoldToPlayer = (xpGained: number, goldGained: number, sourceName: string) => {
    setPlayerProfile((prev) => {
      const progression = calculateLevelProgression(prev?.xp, prev?.level, prev?.xpToNextLevel, xpGained);
      const rankInfo = getRankAndClassForLevel(progression.level);
      const leveledUp = progression.leveledUp;

      const newGold = (prev?.gold || 0) + (goldGained || 0);

      if (leveledUp) {
        // Fire celebration once — deduped against updater double-invocation (#2)
        queueMicrotask(() => {
          if (celebrationGuardRef.current === `levelup-${progression.level}`) return;
          celebrationGuardRef.current = `levelup-${progression.level}`;
          triggerVictoryConfetti();
          haptic('levelup');
          // N3 — the System speaks (authentic SL popup SFX).
          playSfx('system-popup');
          announceSystem([
            `Félicitations, Chasseur.`,
            `Vous avez atteint le niveau ${progression.level}.`,
            `+${progression.attributePointsGained} point(s) de statut disponible(s).`,
          ], 'NOTIFICATION', 'reward');
          setCelebrationInfo({
            show: true,
            title: `VOUS AVEZ MONTE EN NIVEAU ! 🎉 (NIVEAU ${progression.level})`,
            message: `Félicitations Chasseur ! Vous avez franchi un nouveau seuil de puissance. +${progression.attributePointsGained} Points de statut attribués !`,
            type: 'victory',
          });
        });
      }

      return {
        ...prev,
        xp: progression.xp,
        level: progression.level,
        xpToNextLevel: progression.xpToNextLevel,
        attributePoints: (prev?.attributePoints || 0) + progression.attributePointsGained,
        rank: rankInfo.rank,
        hunterClass: rankInfo.hunterClass,
        gold: newGold,
        logs: [
          {
            id: `log-xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: `[RÉCOMPENSE SYSTÈME] +${xpGained} XP, +${goldGained} Or obtenus via : ${sourceName}.`,
            type: 'xp',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...(prev?.logs || []),
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
              new Notification(`Session à venir : ${block.title}`, {
                body: `Début dans ${displayMins} min (${block.startTime}). Catégorie : ${categoryLabel}`,
                icon: '/icon.jpg',
                tag: notificationKey,
              });
              // Also fire server-relayed push (works even when tab is closed)
              sendPushViaServer({
                title: `Session à venir : ${block.title}`,
                body: `Début dans ${displayMins} min (${block.startTime}). Catégorie : ${categoryLabel}`,
                tag: notificationKey,
                url: '/',
                icon: '/icon.jpg',
                data: {},
              }).catch(() => {/* non-fatal */});
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
              title: `100% des Objectifs ${r.dayName} Accomplis ! 🎉`,
              message: `Travail formidable — votre momentum d'exécution sur ${r.dayName} est intact, Chasseur.`,
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
  // All rewards & side effects are computed from current state BEFORE the
  // updater — never inside it — so StrictMode cannot double-grant (#2).
  const handleToggleBlockComplete = (id: string, evt?: React.MouseEvent) => {
    const currentBlocks = daySchedules[selectedDay] || [];
    const target = currentBlocks.find((b) => b.id === id);
    if (!target) return;

    const newStatus = !target.isCompleted;
    if (newStatus && evt) {
      // M3 — immediate dopamine: floating burst + combo + haptic tick.
      const reward = blockReward(target.durationMinutes);
      const combo = registerComboHit();
      fireReward([`+${reward.xp} XP`, `+${reward.gold} Or`], evt, combo.count);
      haptic('tap');
      playSfx('ui-success', 0.7);
    }
    const hoursDelta = (target.durationMinutes / 60) * (newStatus ? 1 : -1);
    const wasAllCompletedBefore = currentBlocks.length > 0 && currentBlocks.every((b) => b.isCompleted);
    const willBeAllCompleted =
      currentBlocks.length > 0 && currentBlocks.every((b) => (b.id === id ? newStatus : b.isCompleted));

    // 1. Rewards (centralized rate table #15)
    if (newStatus) {
      const reward = blockReward(target.durationMinutes);
      addXPAndGoldToPlayer(reward.xp, reward.gold, `Tâche : ${target.title}`);
    }

    // 2. Category & subject hour credits
    setCategoryTargets((targets) =>
      targets.map((t) => {
        if (t.id === target.category) {
          return { ...t, completedHours: Math.max(0, t.completedHours + hoursDelta) };
        }
        return t;
      })
    );
    if (target.category === 'school' && target.schoolSubject) {
      setSubjectGoals((subjs) =>
        subjs.map((s) => {
          if (s.subject === target.schoolSubject) {
            return { ...s, completedHours: Math.max(0, s.completedHours + hoursDelta) };
          }
          return s;
        })
      );
    }

    // 3. Full-day completion bonus
    if (!wasAllCompletedBefore && willBeAllCompleted) {
      triggerAllTasksCompletedConfetti();
      playSfx('system-popup', 0.9);
      announceSystem([
        `Toutes les quêtes de la journée sont accomplies.`,
        `Le Système reconnaît votre discipline.`,
        `Bonus de journée parfaite attribué.`,
      ], 'JOURNÉE PARFAITE', 'reward');
      addXPAndGoldToPlayer(XP_RATES.fullDayBonusXp, XP_RATES.fullDayBonusGold, `100% de la journée ${selectedDay} accomplie !`);
      setCelebrationInfo({
        show: true,
        title: `100% du Programme ${selectedDay} Accomplis ! 🎉`,
        message: `Discipline exceptionnelle Chasseur ! Vous avez rempli tous les blocs de votre journée (+${XP_RATES.fullDayBonusXp} XP, +${XP_RATES.fullDayBonusGold} Or).`,
        type: 'tasks_complete',
      });
    }

    // 4. Pure state update
    setDaySchedules((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((b) => (b.id === id ? { ...b, isCompleted: newStatus } : b)),
    }));
  };

  const handleAddBlock = (newBlock: RoutineBlock) => {
    setDaySchedules((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newBlock],
    }));
  };

  const handleEditBlock = (updatedBlock: RoutineBlock) => {
    setDaySchedules((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
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
    const reward = focusSessionReward(session.durationMinutes);
    addXPAndGoldToPlayer(reward.xp, reward.gold, `Session Focus : ${session.title}`);

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
    addXPAndGoldToPlayer(XP_RATES.victoryLogXp, XP_RATES.victoryLogGold, 'Journal des Victoires Enregistré');
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
    const wReward = workoutReward(session.durationMinutes);
    addXPAndGoldToPlayer(wReward.xp, wReward.gold, `Entraînement : ${session.routineName}`);
    setPlayerProfile((prev) => ({
      ...prev,
      attributes: {
        ...(prev?.attributes || INITIAL_PLAYER_PROFILE.attributes),
        force: ((prev?.attributes?.force) ?? INITIAL_PLAYER_PROFILE.attributes.force) + 1,
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
    addXPAndGoldToPlayer(XP_RATES.bodyMetricXp, XP_RATES.bodyMetricGold, 'Pesée Biométrique Enregistrée');
  };

  const handleAddPR = (pr: PersonalRecord) => {
    setPersonalRecords((prev) => [pr, ...prev]);
    addXPAndGoldToPlayer(XP_RATES.personalRecordXp, XP_RATES.personalRecordGold, `Nouveau Record : ${pr.exerciseName}`);
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
    setPlayerProfile((prev) => {
      const progression = calculateLevelProgression(prev?.xp, prev?.level, prev?.xpToNextLevel, xpAmount);
      const rankInfo = getRankAndClassForLevel(progression.level);

      const log: SystemLog = {
        id: `ritual-${Date.now()}`,
        text: `[RITUEL] Vous avez reçu une Bénédiction Divine. +${xpAmount} XP obtenus.`,
        type: 'xp',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      if (progression.leveledUp) {
        triggerVictoryConfetti();
      }

      return {
        ...prev,
        xp: progression.xp,
        level: progression.level,
        xpToNextLevel: progression.xpToNextLevel,
        attributePoints: (prev?.attributePoints || 0) + progression.attributePointsGained,
        rank: rankInfo.rank,
        hunterClass: rankInfo.hunterClass,
        logs: [log, ...(prev?.logs || [])],
      };
    });
  };

  return (
    <div className="min-h-screen bg-pharaoh text-pharaoh font-sans selection:bg-gold/30 selection:text-text-primary flex flex-col justify-between">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakCount={dailyStreak.currentStreak}
        playerProfile={playerProfile}
        personalization={personalization}
        openAICoach={() => setIsAICoachOpen(true)}
        openFocusTimerQuick={() => setActiveTab('focus_timer')}
        openPersonalizationModal={() => setIsPersonalizationOpen(true)}
        openDataManagement={() => setIsDataManagementOpen(true)}
        openHelp={() => setShowSystemIntro(true)}
        isOffline={isOffline}
        showWorkoutTab={domains.length === 0 || domainsForTracking(domains, 'workout_log').length > 0}
      />

      {/* Main Container — pb tracks the mobile bottom nav's visibility
          (nav is hidden at lg): md tablets previously got only 32px bottom
          padding and their last rows sat UNDER the fixed nav. */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-24 lg:py-8 w-full flex-1">
        {/* No exit animation on tab switch: nested AnimatePresence (e.g. SystemSoloLeveling)
            could hang the exit and leave the old tab stuck on screen. */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full h-full relative"
        >
          <Suspense fallback={<TabSkeleton tab={activeTab} />}>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DailyRitual onInvokeBlessing={handleInvokeRitualBlessing} />
                <HabitChecklistCard
                  habitDomains={domainsForTracking(domains, 'habit_checklist')}
                  checks={habitChecks}
                  today={todayStr}
                  onToggleCheck={handleToggleHabitCheck}
                />
                <ScheduleView
                  blocks={currentDayBlocks}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  personalization={personalization}
                  onToggleComplete={handleToggleBlockComplete}
                  onAddBlock={handleAddBlock}
                  onEditBlock={handleEditBlock}
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
                streakCount={dailyStreak.currentStreak}
                onOpenDataManagement={() => setIsDataManagementOpen(true)}
              />
            )}

            {activeTab === 'workout' && (
              <WorkoutSystem
                routines={workoutRoutines}
                completedSessions={completedWorkoutSessions}
                personalRecords={personalRecords}
                bodyMetrics={bodyMetrics}
                onSaveRoutine={handleSaveWorkoutRoutine}
                onDeleteRoutine={handleDeleteWorkoutRoutine}
                onCompleteSession={handleCompleteWorkoutSession}
                onAddBodyMetric={handleAddBodyMetric}
                onAddPR={handleAddPR}
                triggerVictoryConfetti={triggerVictoryConfetti}
                domain={domainsForTracking(domains, 'workout_log')[0]}
                hasPhysicalDomain={domains.length === 0 || domainsForTracking(domains, 'workout_log').length > 0}
              />
            )}

            {activeTab === 'weekly_targets' && (
              <div className="space-y-6">
              <WeeklyReportCard report={weeklyReport} />
              <ProgressDashboard
                categoryTargets={categoryTargets}
                subjectGoals={subjectGoals}
                personalization={personalization}
                streakRecords={streakRecords}
                currentStreak={dailyStreak.currentStreak}
                onUpdateCategoryHours={handleUpdateCategoryHours}
                onUpdateSubjectHours={handleUpdateSubjectHours}
                onOpenFocusTimer={() => setActiveTab('focus_timer')}
                openPersonalizationModal={() => setIsPersonalizationOpen(true)}
                onUpdatePersonalization={setPersonalization}
                onToggleDayStreak={handleToggleDayStreak}
                domains={domains}
              />
              </div>
            )}

            {activeTab === 'focus_timer' && (
              <FocusTimer
                initialCategory={focusTimerCategory}
                onSessionComplete={handleFocusSessionComplete}
                domains={domains}
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
                domains={domains}
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
          </Suspense>
        </motion.div>
      </main>

      {/* M1 - Global focus-audio mini player: survives tab switches because
          the audio element lives in lib/globalAudio, not in any view. */}
      <MiniPlayer />
      {/* M3 — floating +XP/×combo reward bursts (pointer-events-none). */}
      <FloatingRewardLayer />
      {/* N3 — Solo Leveling "System" notification windows. */}
      <SystemWindowLayer />

      {/* Footer */}
      <footer className="border-t border-lapis-border/50 bg-obsidian/60 py-6 px-4 lg:px-8 text-center text-xs text-pharaoh-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
            {personalization.userName.toUpperCase()} OS • AURA MASTERY SYSTEM
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap justify-center">
            {domains.length > 0
              ? domains.map((d) => (
                  <span key={d.id} className="opacity-70">
                    {d.label}: <strong className="text-gold-bright">{d.weekly_time_budget ?? '-'}h/wk</strong>
                  </span>
                ))
              : categoryTargets.slice(0, 3).map((c) => (
                  <span key={c.id} className="opacity-70">
                    {c.label}: <strong className="text-gold-bright">{c.minHours}-{c.maxHours}h/wk</strong>
                  </span>
                ))}
          </div>
        </div>
      </footer>

      {/* AI Coach Assistant Modal */}
      <AIAssistantModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        contextData={{
          domains,
          categoryTargets,
          subjectGoals,
          completedBlocks: currentDayBlocks.filter((b) => b.isCompleted).length,
          totalBlocks: currentDayBlocks.length,
          streakCount: dailyStreak.currentStreak,
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
        onCompleteV2={ONBOARDING_V2_ENABLED ? handleCompleteOnboardingV2 : undefined}
      />

      {/* First-visit module tour — shown after onboarding, re-openable via the header Help button */}
      {showSystemIntro && (
        <SystemIntroOverlay
          onDismiss={dismissSystemIntro}
          onNavigate={(tab) => {
            setActiveTab(tab);
            dismissSystemIntro();
          }}
        />
      )}

      {/* Celebration Confetti Toast Overlay */}
      <CelebrationBanner
        info={celebrationInfo}
        onClose={() => setCelebrationInfo(null)}
        shareContext={{ level: playerProfile.level, rank: playerProfile.rank, streak: dailyStreak.currentStreak }}
      />

      {/* Daily Connection Bonus — engagement loop */}
      {showDailyBonus && (
        <DailyBonusModal
          streak={dailyStreak.currentStreak}
          personalMotto={personalization.dailyQuote}
          onClaim={(xp, gold) => {
            addXPAndGoldToPlayer(xp, gold, 'Bonus de Connexion Quotidienne');
            setDailyStreak((prev) => ({ ...prev, lastBonusClaimedDate: new Date().toISOString().split('T')[0] }));
          }}
          onClose={() => setShowDailyBonus(false)}
        />
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
