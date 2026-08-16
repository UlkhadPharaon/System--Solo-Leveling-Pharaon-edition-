export type Category =
  | 'bangre_neo'
  | 'cinema'
  | 'school'
  | 'must_do_work'
  | 'morning_routine'
  | 'learning'
  | 'sleep'
  | 'personal'
  // Dynamic domain categories (onboarding v2): `dom:<domainId>`
  | `dom:${string}`;

// ── Adaptive Domain Engine ─────────────────────────────────────────────────
// A Domain replaces the hardcoded life categories (Musculation, Cinéma,
// Bangre Neo Lab, École). Content (label, goal) is free text chosen by the
// user at onboarding; container (tracking_type) deterministically reuses an
// existing UI module.

export type DomainCategory =
  | 'physical'
  | 'creative'
  | 'intellectual'
  | 'craft'
  | 'habit'
  | 'financial'
  | 'social';

export type TrackingType =
  | 'workout_log'      // → Entraînement (séries/reps/RPE)
  | 'project_phases'   // → Jalons projets (Notes / Timeline)
  | 'study_subjects'   // → Matières & objectifs (Bilan)
  | 'focus_sessions'   // → Pomodoro/Focus catégorisé par Domaine
  | 'budget_bucket'    // → Enveloppes budgétaires (Trésorerie)
  | 'habit_checklist'; // → Check quotidien (module Habitudes, Dashboard)

export interface DomainTargetMetric {
  type: string; // e.g. "weight_target" — free-form, never medically interpreted
  value: number;
}

export interface Domain {
  id: string;
  user_id: string | null; // null = local-only; Supabase uid when cloud sync is on
  label: string;          // free text, displayed everywhere — never an enum
  category: DomainCategory;
  tracking_type: TrackingType;
  icon_ref: string;
  color_accent: string;
  goal_text: string;      // user's own words, preserved verbatim
  target_metric?: DomainTargetMetric;
  weekly_time_budget?: number; // hours/week
  created_at: number;
  /** Legacy Category this domain migrated from (non-regression mapping). */
  legacyCategory?: Category;
}

export type CoachingIntensity = 'gentle' | 'balanced' | 'demanding';

export type PenaltyCategory = 'in_app_restriction' | 'creative_makeup' | 'physical_penalty' | 'xp_loss' | 'none';

export interface OnboardingAnswers {
  /** Bloc 1 — free-text vision, stored verbatim. */
  vision: string;
  /** Bloc 2 — per-domain raw answers ("where are you today", etc.). */
  domainAnswers: Record<string, { currentStatus?: string; goalText?: string }>;
  /** Bloc 3 — optional free-text physical constraint (bounds difficulty only, never medical advice). */
  physicalConstraint?: string;
}

export interface HabitCheck {
  id: string;
  domainId: string;
  date: string; // YYYY-MM-DD
  done: boolean;
}

export interface GeneratedQuest {
  id: string;
  domainId: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Deterministic template used as fallback when the LLM is unavailable. */
  source: 'llm' | 'template';
  /** Lifecycle on the Quest Board (older saves have no status = active). */
  status?: 'active' | 'completed' | 'abandoned';
  completedAt?: string; // ISO date (YYYY-MM-DD)
}

export type SchoolSubject = 'svt' | 'math' | 'pc' | 'hist_geo';

export interface RoutineBlock {
  id: string;
  title: string;
  startTime: string; // HH:MM 24h format
  endTime: string;
  durationMinutes: number;
  category: Category;
  schoolSubject?: SchoolSubject;
  description: string;
  isCompleted: boolean;
  tagline?: string;
  iconName: string;
}

export interface VictoryLog {
  id: string;
  date: string; // YYYY-MM-DD
  successes: string[];
  improvements: string[];
  energyRating: number; // 1-5
  moodRating: number; // 1-5
  highlights: string;
  gratitude: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  date: string;
  title: string;
  category: Category;
  domainId?: string;
  schoolSubject?: SchoolSubject;
  durationMinutes: number;
  notes?: string;
  completedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  // Legacy fixed categories + dynamic `domain:<domainId>` (onboarding v2)
  category: 'bangre_neo' | 'cinema' | 'school' | 'general' | `domain:${string}`;
  schoolSubject?: SchoolSubject;
  domainId?: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectGoal {
  // Legacy fixed subjects + dynamic domain-driven subject keys (onboarding v2)
  subject: SchoolSubject | `domain_subject:${string}`;
  name: string;
  targetWeeklyHours: number;
  completedHours: number;
  color: string;
  domainId?: string;
}

export interface WeeklyCategoryTarget {
  id: Category;
  label: string;
  minHours: number;
  maxHours: number;
  targetHours: number;
  completedHours: number;
  color: string;
  bgGradient: string;
  description: string;
}

export type ActiveTab = 'dashboard' | 'weekly_targets' | 'workout' | 'focus_timer' | 'victory_journal' | 'notepad' | 'budget' | 'system_solo';

// Workout App System Types
export type MuscleGroup = 'pecs' | 'dos' | 'epaules' | 'biceps' | 'triceps' | 'jambes' | 'abdos' | 'cardio';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  targetReps: number;
  actualReps?: number;
  weightKg: number;
  isCompleted: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
  restSeconds: number;
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  category: 'hypertrophy' | 'strength' | 'calisthenics' | 'cardio_hiit' | 'custom';
  description: string;
  estimatedDurationMin: number;
  exercises: WorkoutExercise[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface CompletedWorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  caloriesBurned: number;
  exercisesLog: WorkoutExercise[];
  notes?: string;
  rating?: number; // 1-5
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  maxWeightKg: number;
  maxReps: number;
  estimated1RM: number;
  date: string;
}

export interface BodyMetricLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  bicepsCm?: number;
  notes?: string;
}

// Solo Leveling Gamification System Types
export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Pharaon';

export type HunterClass =
  | 'Chasseur de Rang E (Débutant)'
  | 'Guerrier Agile'
  | 'Guerrier Éprouvé'
  | 'Mage des Éléments'
  | 'Assassin Vorace'
  | 'Commandant des Ombres'
  | 'Pharaon des Dieux';

export type AttributeKey = 'force' | 'agilite' | 'intelligence' | 'vitalite' | 'perception';

export interface PlayerAttributes {
  force: number;
  agilite: number;
  intelligence: number;
  vitalite: number;
  perception: number;
}

export interface ShadowSynergy {
  id: string;
  name: string;
  description: string;
  requiredSoldierIds: string[];
  bonus: Partial<PlayerAttributes> & { bonusXpPercent?: number; bonusGoldPercent?: number };
  isActive: boolean;
}

export interface ShadowSoldier {
  id: string;
  name: string;
  rank: HunterRank;
  power: number;
  iconName: string;
  quote: string;
  description: string;
  extractedAt: string;
}

export interface CraftingMaterial {
  id: string;
  name: string;
  description: string;
  rarity: HunterRank;
  quantity: number;
}

export interface SystemItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'key' | 'elixir' | 'material';
  rarity: HunterRank;
  description: string;
  statBonus?: Partial<PlayerAttributes>;
  hpRestore?: number;
  mpRestore?: number;
  goldValue: number;
  iconName: string;
  isEquipped?: boolean;
  quantity?: number;
  craftingCost?: { materialId: string; amount: number }[];
}

export interface NarrativeQuestStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  targetCount?: number;
  currentCount?: number;
  type: 'focus' | 'workout' | 'task' | 'dungeon';
}

export interface NarrativeQuest {
  id: string;
  title: string;
  lore: string;
  steps: NarrativeQuestStep[];
  isCompleted: boolean;
  xpReward: number;
  goldReward: number;
  itemRewardId?: string;
  chapter: number;
}

export interface AvatarCustomization {
  skinTone: string;
  auraColor: string;
  crownType: 'none' | 'nemes' | 'pschent' | 'khepresh';
  eyeColor: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  level: number;
  rank: HunterRank;
  hunterClass: HunterClass;
  totalXp: number;
  avatar: AvatarCustomization;
}

export interface DungeonBoss {
  id: string;
  title: string;
  bossName: string;
  rank: HunterRank;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  xpReward: number;
  goldReward: number;
  keyRequiredId: string;
  keyRequiredName: string;
  description: string;
  shadowName?: string;
  shadowQuote?: string;
  shadowExtractable?: boolean;
  isDefeated?: boolean;
  imageUrl?: string;
  isLimitedTime?: boolean;
  expiresAt?: string; // ISO string or timestamp
  lifeImprovementGoal?: string; // Meaningful real-life challenge
}

export interface DailyMandatoryQuest {
  id: string;
  title: string;
  description: string;
  category: Category;
  targetCount: number;
  currentCount: number;
  unit: string;
  isCompleted: boolean;
  xpReward: number;
  goldReward: number;
  iconName: string;
}

export interface PenaltyTask {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  isCompleted: boolean;
}

export interface PenaltyQuest {
  isActive: boolean;
  title: string;
  description: string;
  reason: string;
  timeRemainingSeconds: number;
  tasks: PenaltyTask[];
  hpPenalty: number;
  xpPenalty: number;
  /** ISO timestamp of the grace deadline (persisted — survives reloads). */
  deadlineAt?: string;
  /** True once the penalty has been settled (paid or cancelled). */
  resolved?: boolean;
}

export interface SystemLog {
  id: string;
  text: string;
  type: 'xp' | 'level' | 'penalty' | 'loot' | 'shadow' | 'quest';
  timestamp: string;
}

export interface PlayerProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  rank: HunterRank;
  hunterClass: HunterClass;
  title: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  attributePoints: number;
  attributes: PlayerAttributes;
  shadows: ShadowSoldier[];
  synergies: ShadowSynergy[];
  inventory: SystemItem[];
  equippedWeaponId?: string;
  equippedArmorId?: string;
  dailyQuests: DailyMandatoryQuest[];
  narrativeQuests: NarrativeQuest[];
  activeNarrativeQuestId?: string;
  penaltyQuest: PenaltyQuest;
  unlockedDungeons: string[]; // dungeon IDs
  logs: SystemLog[];
  badges: string[]; // List of badge IDs
  avatar: AvatarCustomization;
  // ── Adaptive Domain Engine (onboarding v2) ──
  onboarding_answers?: OnboardingAnswers;
  coaching_intensity?: CoachingIntensity;
  penalty_categories_allowed?: PenaltyCategory[];
  /** Computed from Domain.weekly_time_budget (normalized to sum 1) — never LLM-invented. */
  domain_weights?: Record<string, number>;
  /** First quests generated from each domain's goal_text at onboarding. */
  generatedQuests?: GeneratedQuest[];
  /** Total number of daily quests completed across all time. */
  questsCompleted: number;
  /** Total XP accumulated across all time. */
  totalXP: number;
  /** Current consecutive day streak. */
  streakDays: number;
  /** Total gold spent via the system. */
  goldSpent: number;
  /** Unlocked rewards — plain item IDs or full narrative chapter reward records. */
  unlockedItems?: Array<string | { id: string; name: string; type: string; statBonus?: string; unlockedAt?: number }>;
}

export type TransactionType = 'income' | 'expense';

export type MoneyFlowBucket =
  | 'bangre_neo_tech'
  | 'cinema_production'
  | 'school_education'
  | 'living_essentials'
  | 'savings_investment'
  | 'personal_lifestyle'
  // Dynamic domain buckets: `domain:<domainId>` (onboarding v2)
  | `domain:${string}`;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  bucket: MoneyFlowBucket;
  sourceOrVendor: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetBucketGoal {
  bucket: MoneyFlowBucket;
  label: string;
  monthlyAllocation: number; // Planned budget cap or income target
  description: string;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  bucket: MoneyFlowBucket;
  targetDate?: string;
  notes?: string;
}

// Personalization Types
export type LessonStatus = 'not_started' | 'in_progress' | 'mastered';

export interface AcademicLesson {
  id: string;
  subject: SchoolSubject;
  title: string;
  chapter: string;
  status: LessonStatus;
  targetExamDate?: string;
  notes?: string;
  /** Optional planned workload — lessons without an estimate simply hide the badge. */
  estimatedHours?: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  stageName: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface CinemaProjectProfile {
  title: string;
  genre: string;
  currentStage: string;
  synopsis: string;
  milestones: ProjectMilestone[];
}

export interface BangreLabProfile {
  projectName: string;
  focusModule: string;
  currentStage: string;
  architectureGoal: string;
  milestones: ProjectMilestone[];
}

export interface UserPersonalization {
  userName: string;
  userTagline: string;
  /** Custom hunter epithet shown next to the level badge (e.g. "L'Ombre d'Osiris"). */
  hunterTitle?: string;
  /** Personal motto displayed on the daily bonus screen. */
  dailyQuote?: string;
  notificationsEnabled?: boolean;
  notificationLeadMinutes?: number;
  /** Hour (0-23) of the evening "quests still open / streak at risk" reminder. Default 19. */
  questReminderHour?: number;
  /** Opt-in morning briefing ("N quests assigned today"). Default false. */
  morningBriefingEnabled?: boolean;
  notifyStreakRescue?: boolean;
  // ── Push notification category toggles (default all true when push is on) ──
  notifyScheduleStart?: boolean;
  notifyFocusComplete?: boolean;
  notifyStreakWarning?: boolean;
  notifyDailyBonus?: boolean;
  notifyLevelUp?: boolean;
  notifyRitualNudge?: boolean;
  /** True once the device has successfully subscribed to the push server. */
  pushSubscriptionSynced?: boolean;
  /** Preferred local hour (0-23) the morning daily-bonus nudge fires. Default 8. */
  dailyBonusReminderHour?: number;
  /** Preferred local hour (0-23) for the ritual blessing nudge. Default 7. */
  ritualNudgeHour?: number;
  workoutFocusByDay: Record<string, string>;
  cinemaProject: CinemaProjectProfile;
  bangreLab: BangreLabProfile;
  lessons: AcademicLesson[];
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type PhaseStatus = 'upcoming' | 'in_progress' | 'completed';

export interface ProjectDeliverable {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ProjectPhase {
  id: string;
  phaseNumber: number;
  title: string;
  projectCategory: 'cinema' | 'bangre_neo' | 'school' | 'general' | `domain:${string}`;
  domainId?: string;
  description: string;
  targetDate?: string;
  status: PhaseStatus;
  keyDeliverable: string;
  deliverables: ProjectDeliverable[];
  createdAt: string;
}

export interface StreakDayRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: DayOfWeek;
  completedBlocksCount: number;
  totalBlocksCount: number;
  allGoalsMet: boolean;
  completionPercentage: number;
  highlights?: string;
  completedCategories?: Category[];
}


// ── AI Mentor Agent Actions ────────────────────────────────────────────────
// Structured operations the AI Mentor (speaking through /api/ai-coach) can
// propose. The server validates each action against whitelists before sending
// them back; the client renders them as confirmation cards the user approves
// before App.tsx applies them via the existing state setters.

export interface AgentUpdatePersonalizationAction {
  action: 'update_personalization';
  payload: {
    field: 'userName' | 'userTagline' | 'hunterTitle' | 'dailyQuote';
    value: string;
  };
}

export interface AgentAddScheduleBlockAction {
  action: 'add_schedule_block';
  payload: {
    day: DayOfWeek;
    title: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    category: Category;
    description?: string;
  };
}

export interface AgentDeleteScheduleBlockAction {
  action: 'delete_schedule_block';
  payload: {
    day: DayOfWeek;
    blockId: string;
  };
}

export interface AgentToggleScheduleBlockAction {
  action: 'toggle_schedule_block';
  payload: {
    day: DayOfWeek;
    blockId: string;
  };
}

export interface AgentAddVictoryLogAction {
  action: 'add_victory_log';
  payload: {
    successes: string[];
    improvements?: string[];
    highlights?: string;
  };
}

export interface AgentAddQuestAction {
  action: 'add_quest';
  payload: {
    title: string;
    description: string;
    xpReward: number;
    difficulty: 'easy' | 'medium' | 'hard';
    domainId?: string;
  };
}

export interface AgentUpdateWeeklyTargetAction {
  action: 'update_weekly_target';
  payload: {
    targetId: string;
    minHours?: number;
    maxHours?: number;
    targetHours?: number;
  };
}

export interface AgentAddHabitCheckAction {
  action: 'add_habit_check';
  payload: {
    domainId: string;
  };
}

export interface AgentNoteCrudAction {
  action: 'add_note' | 'update_note' | 'delete_note';
  payload: {
    id?: string; // required for update/delete
    title?: string;
    content?: string;
    tags?: string[];
  };
}

export interface AgentAwardXpAction {
  action: 'award_xp';
  payload: {
    xp: number;
    gold?: number;
    reason: string;
  };
}

export type AgentAction =
  | AgentUpdatePersonalizationAction
  | AgentAddScheduleBlockAction
  | AgentDeleteScheduleBlockAction
  | AgentToggleScheduleBlockAction
  | AgentAddVictoryLogAction
  | AgentAddQuestAction
  | AgentUpdateWeeklyTargetAction
  | AgentAddHabitCheckAction
  | AgentNoteCrudAction
  | AgentAwardXpAction;
