import { 
  RoutineBlock, 
  VictoryLog, 
  NoteItem, 
  FocusSession, 
  WeeklyCategoryTarget, 
  SubjectGoal,
  Transaction,
  BudgetBucketGoal,
  SavingsGoal,
  UserPersonalization,
  DayOfWeek,
  StreakDayRecord,
  PlayerProfile,
  DungeonBoss,
  WorkoutRoutine,
  PersonalRecord,
  BodyMetricLog,
  CompletedWorkoutSession
} from '../types';

export const INITIAL_PLAYER_PROFILE: PlayerProfile = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  rank: 'E',
  hunterClass: 'Chasseur de Rang E (Débutant)',
  title: 'Le Chasseur Débutant',
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  gold: 0,
  questsCompleted: 0,
  totalXP: 0,
  streakDays: 0,
  goldSpent: 0,
  attributePoints: 0,
  attributes: {
    force: 10,
    agilite: 10,
    intelligence: 10,
    vitalite: 10,
    perception: 10,
  },
  shadows: [],
  synergies: [],
  narrativeQuests: [],
  activeNarrativeQuestId: undefined,
  avatar: { skinTone: '#D4AF37', auraColor: 'cyan', crownType: 'none', eyeColor: '#00F0FF' },
  inventory: [],
  equippedWeaponId: undefined,
  equippedArmorId: undefined,
  // Blank canvas: no pre-seeded missions. Fresh users get their daily loop
  // from domain quests (generatedQuests) + habit checks after onboarding v2 —
  // nothing from another profile is injected here.
  dailyQuests: [],
  penaltyQuest: {
    isActive: false,
    title: 'QUÊTE DE CHÂTIMENT',
    description: 'Aucune pénalité active.',
    reason: 'Aucun manquement',
    timeRemainingSeconds: 0,
    hpPenalty: 0,
    xpPenalty: 0,
    tasks: [],
  },
  unlockedDungeons: ['dun-e1'],
  badges: [],
  logs: [
    {
      id: 'log-1',
      text: 'Le Système s’est éveillé ! Préparez votre progression sur une page blanche.',
      type: 'quest',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ],
};

export const INITIAL_DUNGEONS: DungeonBoss[] = [
  {
    id: 'dun-e1',
    title: 'Porte Rang E : La Caverne des Gobelins',
    bossName: 'Chef Gobelin aux Yeux Sanglants',
    rank: 'E',
    maxHp: 200,
    currentHp: 200,
    attackPower: 15,
    xpReward: 250,
    goldReward: 150,
    keyRequiredId: 'inv-4',
    keyRequiredName: 'Clé de Donjon Instantané (Rang E)',
    description: 'Un donjon souterrain rempli de soldats gobelins. Idéal pour les chasseurs de Rang E débutants.',
    shadowName: 'Gobelin de l’Ombre',
    shadowQuote: 'Kiii ! L’Ombre Gobeline s’incline devant son nouveau maître.',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dun-d1',
    title: 'Porte Rang D : La Tanière des Lycans',
    bossName: 'Lycan au Pelage d’Acier - Rasaka',
    rank: 'D',
    maxHp: 500,
    currentHp: 500,
    attackPower: 30,
    xpReward: 600,
    goldReward: 400,
    keyRequiredId: 'key-d',
    keyRequiredName: 'Clé de Donjon de Rang D',
    description: 'Des bêtes féroces rôdent dans les ruines oubliées. Vainquez Rasaka pour obtenir son Croc Venimeux !',
    shadowName: 'Rasaka l’Ombre',
    shadowQuote: 'Grrr... Le féroce Rasaka rejoint l’Armée des Ombres !',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dun-c1',
    title: 'Porte Rang C : Le Nid des Insectes Géants',
    bossName: 'Reine des Arachnides de Sang',
    rank: 'C',
    maxHp: 1200,
    currentHp: 1200,
    attackPower: 55,
    xpReward: 1500,
    goldReward: 1000,
    keyRequiredId: 'key-c',
    keyRequiredName: 'Clé de Donjon de Rang C',
    description: 'Une colonie souterraine d’insectes venimeux. Nécessite une grande agilité et une intelligence tactique.',
    shadowName: 'Arachné l’Ombre',
    shadowQuote: 'Chhh... L’armée arachnide fige vos ennemis dans la toile des ombres !',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dun-b1',
    title: 'Porte Rang B : Le Donjon de la Nécropole',
    bossName: 'Commandant Chevalier Igris le Rouge',
    rank: 'B',
    maxHp: 3000,
    currentHp: 3000,
    attackPower: 110,
    xpReward: 4000,
    goldReward: 3000,
    keyRequiredId: 'key-b',
    keyRequiredName: 'Clé du Château Réel (Rang B)',
    description: 'Un redoutable chevalier en armure écarlate protégeant le trône du Souverain. Combat d’Élite !',
    shadowName: 'Igris le Chevalier Rouge',
    shadowQuote: '« Mon Épée appartient désormais au Pharaon des Dieux. Mon Seigneur, ordonnez ! »',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1600577916048-804c9191e36c?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dun-a1',
    title: 'Porte Rang A : La Forge du Château DÉMON',
    bossName: 'Roi DÉMON Baran le Terrible',
    rank: 'A',
    maxHp: 8000,
    currentHp: 8000,
    attackPower: 250,
    xpReward: 12000,
    goldReward: 10000,
    keyRequiredId: 'key-a',
    keyRequiredName: 'Clé de la Forge de Baran (Rang A)',
    description: 'Baran commande les foudres démoniaques au sommet de la tour. Victoire décisive vers le Rang Pharaon.',
    shadowName: 'Kaisel le Dragon d’Ombre',
    shadowQuote: 'ROAAAAR ! Le Dragon Kaisel déploie ses ailes d’Ombre dans les cieux !',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1608976478335-e102dbd66e76?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dun-s1',
    title: 'Porte Rang S : Raid de l’Île de Jeju',
    bossName: 'Le Roi des Fourmis - Beru',
    rank: 'S',
    maxHp: 20000,
    currentHp: 20000,
    attackPower: 600,
    xpReward: 35000,
    goldReward: 30000,
    keyRequiredId: 'key-s',
    keyRequiredName: 'Passe de Raid Rang S (Île de Jeju)',
    description: 'Le sommet des Chasseurs. Un monstre capable d’annihiler des escouades complètes de Rang S.',
    shadowName: 'Beru le Roi Fourmi',
    shadowQuote: '« Mon Roi... Mon précieux Roi ! Je dévorerai quiconque vous manque de respect ! »',
    shadowExtractable: true,
    isDefeated: false,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
  },
];

// ── Defaults are a BLANK CANVAS ─────────────────────────────────────────────
// Fresh users (no saved localStorage) must never see another profile's plan.
// All pre-filled lists below are therefore empty; every data slice is filled
// by onboarding v2 (domains → derived targets/subjects/buckets/quests) or by
// the user themselves. Existing users keep their saved data untouched.

export const INITIAL_CATEGORY_TARGETS: WeeklyCategoryTarget[] = [];

export const INITIAL_SCHOOL_SUBJECTS: SubjectGoal[] = [];

export const INITIAL_VICTORY_LOGS: VictoryLog[] = [];

export const INITIAL_NOTES: NoteItem[] = [];

export const INITIAL_FOCUS_SESSIONS: FocusSession[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGET_BUCKETS: BudgetBucketGoal[] = [];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_PERSONALIZATION: UserPersonalization = {
  userName: 'Chasseur',
  userTagline: '',
  notificationsEnabled: false,
  notificationLeadMinutes: 5,
  notifyScheduleStart: true,
  notifyFocusComplete: true,
  notifyStreakWarning: true,
  notifyDailyBonus: true,
  notifyLevelUp: true,
  notifyRitualNudge: true,
  dailyBonusReminderHour: 8,
  ritualNudgeHour: 7,
  workoutFocusByDay: {},
  cinemaProject: {
    title: '',
    genre: '',
    currentStage: '',
    synopsis: '',
    milestones: [],
  },
  bangreLab: {
    projectName: '',
    focusModule: '',
    currentStage: '',
    architectureGoal: '',
    milestones: [],
  },
  lessons: [],
};

/** Blank schedules for all seven days — filled by the user or onboarding v2. */
export const INITIAL_DAY_SCHEDULES: Record<DayOfWeek, RoutineBlock[]> = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

export const INITIAL_STREAK_RECORDS: StreakDayRecord[] = [];

// Blank canvas: no pre-seeded workout routines. The guided "Programme Ulkhad"
// tab stays available as a built-in feature (see UlkhadProgramView), but the
// user's routine list starts empty so nothing personal to another profile is
// injected into a fresh user's plan.
export const INITIAL_WORKOUT_ROUTINES: WorkoutRoutine[] = [];

export const INITIAL_PERSONAL_RECORDS: PersonalRecord[] = [];

export const INITIAL_BODY_METRICS: BodyMetricLog[] = [];

export const INITIAL_COMPLETED_WORKOUTS: CompletedWorkoutSession[] = [];