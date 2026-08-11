export type Category = 
  | 'bangre_neo' 
  | 'cinema' 
  | 'school' 
  | 'must_do_work' 
  | 'morning_routine' 
  | 'learning' 
  | 'sleep' 
  | 'personal';

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
  schoolSubject?: SchoolSubject;
  durationMinutes: number;
  notes?: string;
  completedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: 'bangre_neo' | 'cinema' | 'school' | 'general';
  schoolSubject?: SchoolSubject;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectGoal {
  subject: SchoolSubject;
  name: string;
  targetWeeklyHours: number;
  completedHours: number;
  color: string;
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

export interface SystemItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'key' | 'elixir';
  rarity: HunterRank;
  description: string;
  statBonus?: Partial<PlayerAttributes>;
  hpRestore?: number;
  mpRestore?: number;
  goldValue: number;
  iconName: string;
  isEquipped?: boolean;
  quantity?: number;
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
  inventory: SystemItem[];
  equippedWeaponId?: string;
  equippedArmorId?: string;
  dailyQuests: DailyMandatoryQuest[];
  penaltyQuest: PenaltyQuest;
  unlockedDungeons: string[]; // dungeon IDs
  logs: SystemLog[];
  badges: string[]; // List of badge IDs
}

export type TransactionType = 'income' | 'expense';

export type MoneyFlowBucket = 
  | 'bangre_neo_tech'
  | 'cinema_production'
  | 'school_education'
  | 'living_essentials'
  | 'savings_investment'
  | 'personal_lifestyle';

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
  notificationsEnabled?: boolean;
  notificationLeadMinutes?: number;
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
  projectCategory: 'cinema' | 'bangre_neo' | 'school' | 'general';
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

