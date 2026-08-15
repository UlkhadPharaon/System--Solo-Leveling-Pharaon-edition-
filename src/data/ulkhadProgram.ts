// ============================================================================
// PROGRAMME DE MUSCULATION ULKHAD — 10 MOIS
// Transcription complète du PDF "Programme de Musculation Ulkhad sur 10 Mois"
// Structure : 2 Mésocycles (5 mois chacun) × 4 Microcycles
//   (Mécanique 6 sem → Métabolique 6 sem → Overreaching 4 sem → Deload 1 sem)
// ============================================================================

import { MuscleGroup, WorkoutRoutine, WorkoutExercise, ExerciseSet } from '../types';

export type MicrocycleId = 'mecanique' | 'metabolique' | 'overreaching' | 'deload';
export type DayId = 'J1' | 'J2' | 'J3' | 'J4';

export interface UlkhadExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: string;
  restLabel: string;
  restSeconds: number; // valeur représentative pour le minuteur
  intensification: string;
  technique?: string; // explication pédagogique (français simple)
}

export interface UlkhadDay {
  id: DayId;
  title: string;
  weekdays: number[]; // 1=Lundi ... 7=Dimanche
  exercises: UlkhadExercise[];
}

export interface UlkhadMicrocycle {
  id: MicrocycleId;
  name: string;
  shortName: string;
  weeks: number;
  rest: string;
  reps: string;
  workload: string;
  extras?: string[];
  days: UlkhadDay[];
}

export interface UlkhadMesocycle {
  id: 'meso1' | 'meso2';
  name: string;
  subtitle: string;
  microcycles: UlkhadMicrocycle[];
}

const REPOS = { min1: 60, min1_5: 90, min2: 120, min2_3: 150, min3: 180, zero: 0 };

// ---------------------------------------------------------------------------
// Contenus pédagogiques (pages 2–4 du PDF)
// ---------------------------------------------------------------------------
export const ULKHAD_GOALS = [
  'Prendre 30 kg de muscle',
  'Développer la force : pompes, tractions, squats',
  '+10 cm de tour de bras, de poitrine et de cuisses',
  'Développer un six-pack',
];

export const ULKHAD_PROGRESSIVE_OVERLOAD = {
  title: 'Surcharge progressive = clé de la croissance',
  rules: [
    'Augmente chaque mois un ou plusieurs paramètres',
    '+1 à 2 répétitions par série',
    '-15 s de repos',
    '+1 niveau de difficulté (ex : pompes → pompes déclinées → pompes archers → pompes à une main)',
  ],
  note: 'Utilise des variantes plus dures à mesure que tu progresses.',
};

export const ULKHAD_INTENSIFICATION_TECHNIQUES = [
  { name: 'Superset', icon: 'zap', desc: 'Enchaîner 2 exos opposés ou complémentaires (pousser ↔ tirer).' },
  { name: 'Tempo lent', icon: 'timer', desc: 'Surtout sur la descente (3–5 s), montée explosive.' },
  { name: 'Isométrie', icon: 'pause', desc: 'Pause en bas du mouvement ou en fin de série (ex : 30 s de squat statique).' },
  { name: 'Pliométrie', icon: 'flame', desc: 'Pompes sautées, fentes sautées, jump squats.' },
  { name: 'Rest-pause', icon: 'rotate', desc: 'Mini repos de 10–15 s entre mini-séries à l\'échec.' },
  { name: 'Pyramide', icon: 'trending', desc: '6-8-10-8-6 reps → progression puis retour.' },
];

export const ULKHAD_WORK_ZONES = [
  'Hypertrophie : 6–15 répétitions par série OU jusqu\'à 40 à l\'échec au poids du corps.',
  'Minimum 4 séries par muscle par semaine (10–12 en moyenne = parfait).',
];

export const ULKHAD_REST_BY_CYCLE: Record<MicrocycleId, string> = {
  mecanique: '2–3 min',
  metabolique: '30–60 s',
  overreaching: '1–2 min max (charge + fatigue volontaire)',
  deload: '2–3 min, sans forcer',
};

export const ULKHAD_TIPS = [
  {
    title: 'Progression intelligente',
    items: [
      'Évite de tout augmenter en même temps. Choisis UNE seule variable à booster par semaine (ex : +1 rep ou + difficulté).',
      'Garde un carnet d\'entraînement ou un tableau de progression.',
    ],
  },
  {
    title: 'Maîtrise du mouvement',
    items: [
      'L\'objectif n\'est pas juste de faire 10 pompes, mais 10 pompes parfaites :',
      'Contrôle • Amplitude • Posture • Gainage',
    ],
  },
  {
    title: 'Importance du Deload',
    items: [
      'N\'ignore JAMAIS la semaine de deload.',
      'Ton corps en a besoin pour supercompenser = gros boost de force & muscle après récupération.',
    ],
  },
  {
    title: 'Exploite le poids du corps à fond',
    items: [
      'Tu n\'as pas besoin de matériel pour devenir un monstre.',
      'Les variantes avancées (pompes à une main, handstand push-ups, pistols) sont plus difficiles que des machines.',
    ],
  },
  {
    title: 'Optimise ton alimentation',
    items: [
      'Tu veux de la masse → mange plus que ce que tu dépenses (sans junk food).',
      'Focus : protéines (œufs, poulet, arachides), glucides lents (patates douces, riz), lipides sains (huile d\'arachide, avocat).',
    ],
  },
];

export const ULKHAD_WEEKLY_STRUCTURE = [
  { day: 'J1', group: 'Pecs + Dos', freq: 'Lundi / Jeudi' },
  { day: 'J2', group: 'Épaules + Bras', freq: 'Mardi / Vendredi' },
  { day: 'J3', group: 'Jambes + Abdos', freq: 'Mercredi / Samedi' },
  { day: 'J4', group: 'Repos complet', freq: 'Dimanche' },
];

export const ULKHAD_SESSION_RULES = 'Durée de séance : 1h max, environ 4 exos principaux + 1–2 accessoires.';

export const ULKHAD_PHILOSOPHY = '« Devenir fort avec rien, c\'est être fort pour tout. »';

// Explications pédagogiques réutilisées
const EXPL: Record<string, string> = {
  pompes: 'Corps gainé en ligne, mains sous les épaules. Descends jusqu\'à ce que la poitrine frôle le sol, remonte en poussant fort.',
  decline: 'Pieds surélevés : plus de poids sur les pecs. Plus c\'est haut, plus c\'est dur.',
  archer: 'Une main fait le gros du travail, l\'autre est tendue sur le côté. Étape vers la pompe à une main.',
  tractions: 'Suspendu à une barre, tire tes épaules vers le bas jusqu\'au menton au-dessus de la barre, descends lentement.',
  row: 'Sous une table/barre basse, tire ta poitrine vers la barre, coudes serrés. Dos bien droit.',
  superman: 'Allongé sur le ventre, lève bras et jambes en même temps. Serre les lombaires.',
  planche: 'Sur les avant-bras, corps en ligne droite, abdos et fessiers serrés. Ne laisse pas le bassin tomber.',
  plancheLat: 'Sur un avant-bras, corps aligné de profil. Travaille les obliques.',
  pike: 'Hanches hautes en V inversé, tête vers le sol. Prépare au handstand push-up.',
  dips: 'Entre deux appuis, descends les coudes à 90° et remonte puissamment. Épaules basses.',
  curl: 'Serviette tenue tendue, tire en curl. Iso la force de préhension et des bras.',
  squat: 'Pieds largeur épaules, descends comme t\'asseoir, genoux dans l\'axe des pieds. Descends lentement.',
  fente: 'Un pied en avant (ou sur chaise pour les bulgares), descends le genou arrière vers le sol.',
  pont: 'Sur le dos, pieds près des fesses, pousse le bassin vers le haut en serrant les fessiers.',
  mollets: 'Bout des pieds sur une marche, monte sur la pointe le plus haut possible, redes descends lentement.',
  crunch: 'Sur le dos, enroule le buste en soufflant. Ne tire pas sur la nuque.',
};

// ---------------------------------------------------------------------------
// 1er MÉSOCYCLE — PRISE DE MASSE (5 mois)
// ---------------------------------------------------------------------------
const MESO1: UlkhadMesocycle = {
  id: 'meso1',
  name: '1er Mésocycle',
  subtitle: 'Prise de masse musculaire (5 mois)',
  microcycles: [
    {
      id: 'mecanique',
      name: 'Microcycle 1 : Mécanique',
      shortName: 'Mécanique',
      weeks: 6,
      rest: 'Longues (3 min)',
      reps: 'Courtes (4 reps)',
      workload: 'élevé',
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Pompes déclinées', muscleGroup: 'pecs', sets: 4, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Tempo excentrique 3–4 s', technique: EXPL.decline },
            { name: 'Pompes arche → 1 main (progressif)', muscleGroup: 'pecs', sets: 3, reps: '3–5', restLabel: '3 min', restSeconds: REPOS.min3, intensification: 'Variante difficile', technique: EXPL.archer },
            { name: 'Tractions pronation', muscleGroup: 'dos', sets: 4, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Descente lente, gainage fessiers', technique: EXPL.tractions },
            { name: 'Row inversé', muscleGroup: 'dos', sets: 4, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Descente lente, gainage fessiers', technique: EXPL.row },
            { name: 'Superman ou Cobra', muscleGroup: 'dos', sets: 3, reps: '10–12', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Isométrie 2 s en haut', technique: EXPL.superman },
            { name: 'Gainage planche unilatérale', muscleGroup: 'abdos', sets: 3, reps: '30–45 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Variante : jambe levée ou surface instable', technique: EXPL.planche },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Pompes diamant', muscleGroup: 'triceps', sets: 4, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Tempo contrôlé', technique: 'Mains en triangle sous la poitrine. Coudes près du corps : maximum de triceps.' },
            { name: 'Pike push-ups', muscleGroup: 'epaules', sets: 4, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Vers handstand push-up', technique: EXPL.pike },
            { name: 'Pompes une main assistée / Dips', muscleGroup: 'pecs', sets: 3, reps: '3–5 / 6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Progression technique', technique: EXPL.dips },
            { name: 'Curl inversé (serviette)', muscleGroup: 'biceps', sets: 3, reps: '6–8', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Curl isométrique', technique: EXPL.curl },
            { name: 'Planche latérale', muscleGroup: 'abdos', sets: 3, reps: '20–30 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Travail des obliques', technique: EXPL.plancheLat },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Squats complets', muscleGroup: 'jambes', sets: 4, reps: '8–10', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Descente lente / évolution vers pistol squat', technique: EXPL.squat },
            { name: 'Fentes bulgares sur chaise', muscleGroup: 'jambes', sets: 3, reps: '8–10 / jambe', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Progressif', technique: EXPL.fente },
            { name: 'Pont fessier', muscleGroup: 'jambes', sets: 3, reps: '10–12', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Pause isométrique 2 s', technique: EXPL.pont },
            { name: 'Mollets sur marche', muscleGroup: 'jambes', sets: 4, reps: '12–15', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Contraction max', technique: EXPL.mollets },
            { name: 'Crunch + Relevé jambes + Planche', muscleGroup: 'abdos', sets: 3, reps: '15 / 8–10 / 30–45 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Enchaînement abdominal intensif', technique: EXPL.crunch },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'metabolique',
      name: 'Microcycle 2 : Métabolique',
      shortName: 'Métabolique',
      weeks: 6,
      rest: 'court',
      reps: 'longues',
      workload: 'modéré',
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Superset : Pompes classiques + Row inversé', muscleGroup: 'pecs', sets: 3, reps: '12–15 chaque', restLabel: 'Repos après superset : 1 min', restSeconds: REPOS.min1, intensification: '↔ 0 s entre les deux', technique: EXPL.pompes },
            { name: 'Pompes mains larges', muscleGroup: 'pecs', sets: 3, reps: '15–20', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Pas d\'arrêt en bas', technique: EXPL.pompes },
            { name: 'Tractions négatives (descente lente)', muscleGroup: 'dos', sets: 3, reps: '6–8', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Assistance montée', technique: EXPL.tractions },
            { name: 'Pont fessier + Squat jump (enchaînés)', muscleGroup: 'jambes', sets: 3, reps: '12 + 10', restLabel: '↔ 0 s', restSeconds: REPOS.zero, intensification: 'Congestion + explosivité', technique: EXPL.pont },
            { name: 'Abdos roue ou ab-wheel improvisé', muscleGroup: 'abdos', sets: 3, reps: '8–12', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Forme stricte', technique: EXPL.crunch },
            { name: 'Gainage dynamique (rotation gauche-droite)', muscleGroup: 'abdos', sets: 3, reps: '30–45 s', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Mobilité oblique', technique: EXPL.planche },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Circuit : Pompes diamant + Dips + Curl inversé', muscleGroup: 'triceps', sets: 3, reps: '10–15 chaque', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Enchaînement type triset', technique: EXPL.dips },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Circuit : Squat + Fente + Fente sautée + Planche', muscleGroup: 'jambes', sets: 3, reps: '15 chaque', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Maximisation du stress métabolique', technique: EXPL.squat },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'overreaching',
      name: 'Microcycle 3 : Overreaching',
      shortName: 'Overreaching',
      weeks: 4,
      rest: 'modéré',
      reps: 'courtes',
      workload: 'élevé',
      extras: ['+ plus de Volume d\'entraînement', '+ plus d\'Intensité de travail', '+ Technique d\'intensification'],
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Pompes classiques (pyramides)', muscleGroup: 'pecs', sets: 5, reps: '8–10–12–10–8', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Superset avec pompes sautées', technique: EXPL.pompes },
            { name: 'Pompes sautées (clapping)', muscleGroup: 'pecs', sets: 3, reps: '6–8', restLabel: '90 s', restSeconds: REPOS.min1_5, intensification: 'Pliométrie', technique: 'Descends, explose vers le haut en frappant des mains. Atterrissage gainé.' },
            { name: 'Tractions pronation (pyramides)', muscleGroup: 'dos', sets: 5, reps: '6–8–10–8–6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Superset avec unilatéral ou explosifs', technique: EXPL.tractions },
            { name: 'Pompes une main', muscleGroup: 'pecs', sets: 4, reps: '3–5', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Variante force maximale', technique: EXPL.archer },
            { name: 'Gainage superman fessier', muscleGroup: 'abdos', sets: 3, reps: '15–20', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Posture maximale, fusible en fin de séance', technique: EXPL.superman },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Chin-ups', muscleGroup: 'dos', sets: 4, reps: '6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Tempo contrôlé et lent', technique: 'Tractions prise supination (paumes vers toi) : maximum de biceps.' },
            { name: 'Pike push-ups', muscleGroup: 'epaules', sets: 5, reps: '8', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Descente lente montée explosive', technique: EXPL.pike },
            { name: 'Row inversés pronation supination', muscleGroup: 'dos', sets: 4, reps: '8', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Progression technique', technique: EXPL.row },
            { name: 'Curl inversé (serviette)', muscleGroup: 'biceps', sets: 3, reps: '6–8', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Curl isométrique', technique: EXPL.curl },
            { name: 'Planche latérale', muscleGroup: 'abdos', sets: 3, reps: '20–30 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Travail des obliques', technique: EXPL.plancheLat },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Squats complets', muscleGroup: 'jambes', sets: 4, reps: '8–10', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Descente lente / évolution vers pistol squat', technique: EXPL.squat },
            { name: 'Fentes bulgares sur chaise', muscleGroup: 'jambes', sets: 3, reps: '8–10 / jambe', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Progressif', technique: EXPL.fente },
            { name: 'Pont fessier', muscleGroup: 'jambes', sets: 3, reps: '10–12', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Pause isométrique 2 s', technique: EXPL.pont },
            { name: 'Mollets sur marche', muscleGroup: 'jambes', sets: 4, reps: '12–15', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Contraction max', technique: EXPL.mollets },
            { name: 'Crunch + Relevé jambes + Planche', muscleGroup: 'abdos', sets: 3, reps: '15 / 8–10 / 30–45 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Enchaînement abdominal intensif', technique: EXPL.crunch },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'deload',
      name: 'Deload (1 semaine)',
      shortName: 'Deload',
      weeks: 1,
      rest: '2–3 min',
      reps: 'modéré',
      workload: 'récupération active',
      extras: ['- moins d\'Intensité', '- moins de Volume'],
      days: [
        {
          id: 'J1', title: 'Séance légère (tous les jours, 1 à 3)', weekdays: [1, 2, 3, 4, 5, 6],
          exercises: [
            { name: 'Pompes classiques', muscleGroup: 'pecs', sets: 2, reps: '12', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Version simplifiée', technique: EXPL.pompes },
            { name: 'Row inversé / Squats / Dips', muscleGroup: 'dos', sets: 2, reps: '12–15', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Aucune intensification, repos actif', technique: EXPL.row },
            { name: 'Abdos / gainage', muscleGroup: 'abdos', sets: 2, reps: 'modéré', restLabel: '2–3 min', restSeconds: REPOS.min2_3, intensification: 'Mobilité, routine légère', technique: EXPL.planche },
          ],
        },
        { id: 'J2', title: 'Repos', weekdays: [0], exercises: [] },
        { id: 'J3', title: 'Repos', weekdays: [], exercises: [] },
        { id: 'J4', title: 'Repos complet', weekdays: [], exercises: [] },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2e MÉSOCYCLE — PRISE DE FORCE (5 mois)
// ---------------------------------------------------------------------------
const MESO2: UlkhadMesocycle = {
  id: 'meso2',
  name: '2e Mésocycle',
  subtitle: 'Prise de Force (5 mois)',
  microcycles: [
    {
      id: 'mecanique',
      name: 'Microcycle 1 : Début',
      shortName: 'Début',
      weeks: 6,
      rest: 'modéré',
      reps: 'Courtes',
      workload: 'faible',
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Pompes pieds surélevés max hauteur', muscleGroup: 'pecs', sets: 4, reps: '4–6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Variante très difficile', technique: EXPL.decline },
            { name: 'Tractions pronation lestées (si possible)', muscleGroup: 'dos', sets: 4, reps: '5–6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Gainage + contraction dorsale', technique: EXPL.tractions },
            { name: 'Row inversé explosif ou tempo lent', muscleGroup: 'dos', sets: 4, reps: '6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Accent phase concentrique ou excentrique', technique: EXPL.row },
            { name: 'Superman', muscleGroup: 'dos', sets: 3, reps: '10–12', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Isométrie fin de mouvement', technique: EXPL.superman },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Pike push-ups (tête au sol)', muscleGroup: 'epaules', sets: 4, reps: '6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Tension continue', technique: EXPL.pike },
            { name: 'Pompes surélevées sur poings', muscleGroup: 'pecs', sets: 3, reps: '6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Variante force', technique: EXPL.pompes },
            { name: 'Dips entre deux chaises', muscleGroup: 'triceps', sets: 4, reps: '6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Descente contrôlée, montée puissante', technique: EXPL.dips },
            { name: 'Chin-ups lents', muscleGroup: 'biceps', sets: 3, reps: '5–6', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Phase excentrique ralentie', technique: EXPL.tractions },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Squats unilatéraux assistés', muscleGroup: 'jambes', sets: 3, reps: '6 / jambe', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Progression vers pistol complet', technique: EXPL.squat },
            { name: 'Fentes bulgares explosives', muscleGroup: 'jambes', sets: 4, reps: '6 / jambe', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Variation pliométrique', technique: EXPL.fente },
            { name: 'Pont fessier jambes levées', muscleGroup: 'jambes', sets: 3, reps: '10', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Isométrie + tempo', technique: EXPL.pont },
            { name: 'Crunch + Planche', muscleGroup: 'abdos', sets: 3, reps: '15 + 30 s', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Contraction max sur le crunch', technique: EXPL.crunch },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'metabolique',
      name: 'Microcycle 2 : Métabolique',
      shortName: 'Métabolique',
      weeks: 6,
      rest: 'modéré',
      reps: 'Courtes',
      workload: 'modéré',
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Pompes déclinées', muscleGroup: 'pecs', sets: 4, reps: '8', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Accent vitesse concentrique', technique: EXPL.decline },
            { name: 'Row inversé pronation', muscleGroup: 'dos', sets: 4, reps: '8–10', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Contracter le dos, tirer explosivement', technique: EXPL.row },
            { name: 'Superman + Gainage dynamique', muscleGroup: 'dos', sets: 3, reps: '12 + 30 s', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Superset', technique: EXPL.superman },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Pike push-ups', muscleGroup: 'epaules', sets: 4, reps: '8', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Phase excentrique + amplitude', technique: EXPL.pike },
            { name: 'Pompes diamant', muscleGroup: 'triceps', sets: 4, reps: '10', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Superset dips possibles', technique: EXPL.pompes },
            { name: 'Curl inversé (tirage serviette)', muscleGroup: 'biceps', sets: 3, reps: '10–12', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Isométrie de fin de course', technique: EXPL.curl },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Fentes sautées', muscleGroup: 'jambes', sets: 4, reps: '8 / jambe', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Plyo + équilibre', technique: EXPL.fente },
            { name: 'Squats unilatéraux ou Jump Squats', muscleGroup: 'jambes', sets: 4, reps: '8–10', restLabel: '1,5 min', restSeconds: REPOS.min1_5, intensification: 'Alternance pliométrie et isométrie', technique: EXPL.squat },
            { name: 'Mollets surélevés', muscleGroup: 'jambes', sets: 3, reps: '15', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Contraction max', technique: EXPL.mollets },
            { name: 'Abdos gainage + rotations', muscleGroup: 'abdos', sets: 3, reps: '30–45 s', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Travail complet', technique: EXPL.planche },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'overreaching',
      name: 'Microcycle 3 : Overreaching',
      shortName: 'Overreaching',
      weeks: 4,
      rest: 'modéré',
      reps: 'Courtes',
      workload: 'élevé',
      extras: ['+ Volume d\'entraînement', '+ Intensité de travail', '+ Technique d\'intensification'],
      days: [
        {
          id: 'J1', title: 'Pecs et Dos', weekdays: [1, 4],
          exercises: [
            { name: 'Pompes classiques (pyramide 8→12→8)', muscleGroup: 'pecs', sets: 5, reps: '8, 10, 12, 10, 8', restLabel: '1–2 min', restSeconds: REPOS.min1_5, intensification: 'Superset avec pompes pliométriques', technique: EXPL.pompes },
            { name: 'Pompes sautées + Pompes à une main', muscleGroup: 'pecs', sets: 3 + 4, reps: '6–8 / 3–5', restLabel: '90 s', restSeconds: REPOS.min1_5, intensification: 'Superset explosif + unilatéral', technique: EXPL.archer },
            { name: 'Row inversé rapide', muscleGroup: 'dos', sets: 4, reps: '10', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Contraction max + tempo dynamique', technique: EXPL.row },
            { name: 'Gainage dynamique (mouvements lents)', muscleGroup: 'abdos', sets: 3, reps: '30–45 s', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Mobilité + engagement profond', technique: EXPL.planche },
          ],
        },
        {
          id: 'J2', title: 'Épaules et Bras', weekdays: [2, 5],
          exercises: [
            { name: 'Pike push-ups tempo lent / explosif', muscleGroup: 'epaules', sets: 5, reps: '8', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Travail contrasté (force + vitesse)', technique: EXPL.pike },
            { name: 'Pompes surélevées sur poings + dips (superset)', muscleGroup: 'triceps', sets: 4, reps: '10–12', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Superset lourd', technique: EXPL.dips },
            { name: 'Curl inversé supination / pronation (superset)', muscleGroup: 'biceps', sets: 4, reps: '8 + 8', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Amplitude max', technique: EXPL.curl },
          ],
        },
        {
          id: 'J3', title: 'Jambes et Abdos', weekdays: [3, 6],
          exercises: [
            { name: 'Squats statiques (30 s) + squats sautés', muscleGroup: 'jambes', sets: 3, reps: '30 s + 10', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Pliométrie + isométrie enchaînée', technique: EXPL.squat },
            { name: 'Fentes bulgares lentes', muscleGroup: 'jambes', sets: 3, reps: '8 / jambe', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Descente lente, montée dynamique', technique: EXPL.fente },
            { name: 'Pont fessier jambe levée', muscleGroup: 'jambes', sets: 3, reps: '10 / jambe', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Phase haute tenue 2 s', technique: EXPL.pont },
            { name: 'Abdos roue ou crunch avancé', muscleGroup: 'abdos', sets: 3, reps: '12', restLabel: '1 min', restSeconds: REPOS.min1, intensification: 'Tension continue', technique: EXPL.crunch },
          ],
        },
        { id: 'J4', title: 'Repos complet', weekdays: [0], exercises: [] },
      ],
    },
    {
      id: 'deload',
      name: 'Deload (1 semaine)',
      shortName: 'Deload',
      weeks: 1,
      rest: '2–3 min',
      reps: 'modéré',
      workload: 'récupération active',
      extras: ['- Intensité', '- Volume'],
      days: [
        {
          id: 'J1', title: 'Séance légère (tous les jours, 1 à 3)', weekdays: [1, 2, 3, 4, 5, 6],
          exercises: [
            { name: 'Pompes standard', muscleGroup: 'pecs', sets: 2, reps: '10–12', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Pas d\'échec, technique propre', technique: EXPL.pompes },
            { name: 'Squats / Fentes', muscleGroup: 'jambes', sets: 2, reps: '12–15', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Variante assistée ou lente', technique: EXPL.squat },
            { name: 'Tractions négatives / Row', muscleGroup: 'dos', sets: 2, reps: '6–8', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Descente lente, amplitude complète', technique: EXPL.tractions },
            { name: 'Abdos au sol + planche', muscleGroup: 'abdos', sets: 2, reps: '12 / 30 s', restLabel: '2 min', restSeconds: REPOS.min2, intensification: 'Contrôle, pas d\'intensité extrême', technique: EXPL.planche },
          ],
        },
        { id: 'J2', title: 'Repos', weekdays: [0], exercises: [] },
        { id: 'J3', title: 'Repos', weekdays: [], exercises: [] },
        { id: 'J4', title: 'Repos complet', weekdays: [], exercises: [] },
      ],
    },
  ],
};

export const ULKHAD_MESOCYCLES: UlkhadMesocycle[] = [MESO1, MESO2];
export const ULKHAD_TOTAL_WEEKS = ULKHAD_MESOCYCLES.reduce((acc, m) => acc + m.microcycles.reduce((a, mc) => a + mc.weeks, 0), 0); // 34

// ---------------------------------------------------------------------------
// Helpers : position dans le programme & génération de routines
// ---------------------------------------------------------------------------
export interface ProgramPosition {
  mesocycle: UlkhadMesocycle;
  microcycle: UlkhadMicrocycle;
  weekInMicro: number;
  weekGlobal: number;
}

export function getProgramPosition(startDateMs: number, nowMs: number = Date.now()): ProgramPosition {
  const weekGlobal = Math.max(1, Math.floor((nowMs - startDateMs) / (7 * 24 * 3600 * 1000)) + 1);
  let w = weekGlobal;
  for (const meso of ULKHAD_MESOCYCLES) {
    for (const micro of meso.microcycles) {
      if (w <= micro.weeks) return { mesocycle: meso, microcycle: micro, weekInMicro: w, weekGlobal };
      w -= micro.weeks;
    }
  }
  // programme terminé → dernière position
  const lastMeso = ULKHAD_MESOCYCLES[ULKHAD_MESOCYCLES.length - 1];
  const lastMicro = lastMeso.microcycles[lastMeso.microcycles.length - 1];
  return { mesocycle: lastMeso, microcycle: lastMicro, weekInMicro: lastMicro.weeks, weekGlobal };
}

export function getDayForWeekday(pos: ProgramPosition, jsWeekday: number): UlkhadDay {
  const day = pos.microcycle.days.find((d) => d.weekdays.includes(jsWeekday));
  return day ?? pos.microcycle.days[0];
}

let idCounter = 0;
const uid = (p: string) => `${p}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Parse "6–8" / "8–10 / jambe" / "15 / 8–10 / 30–45 s" en nombre cible approx. */
function parseTargetReps(reps: string): number {
  const first = reps.match(/\d+/);
  return first ? parseInt(first[0], 10) : 10;
}

export function ulkhadExerciseToWorkout(ex: UlkhadExercise): WorkoutExercise {
  return {
    id: uid('ex'),
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    restSeconds: ex.restSeconds,
    notes: `${ex.intensification}${ex.technique ? ' — ' + ex.technique : ''}`,
    sets: Array.from({ length: ex.sets }, (_, i) => ({
      id: uid('set'),
      setNumber: i + 1,
      targetReps: parseTargetReps(ex.reps),
      weightKg: 0, // poids du corps
      isCompleted: false,
    })),
  };
}

export function buildUlkhadRoutine(meso: UlkhadMesocycle, micro: UlkhadMicrocycle, day: UlkhadDay): WorkoutRoutine {
  const estMin = Math.min(60, 15 + day.exercises.reduce((a, e) => a + e.sets * 2, 0));
  return {
    id: `ulkhad_${meso.id}_${micro.id}_${day.id}`,
    name: `Ulkhad — ${day.id} ${day.title}`,
    category: micro.id === 'metabolique' ? 'calisthenics' : micro.id === 'deload' ? 'custom' : 'hypertrophy',
    description: `${meso.name} · ${micro.name} — ${day.title}. ${micro.name} : repos ${micro.rest}, reps ${micro.reps}.`,
    estimatedDurationMin: estMin,
    isCustom: false,
    createdAt: new Date().toISOString(),
    exercises: day.exercises.map(ulkhadExerciseToWorkout),
  };
}

/** Toutes les routines Ulkhad (mésocycles "actifs" J1–J3 uniquement) pour l'onglet Programmes. */
export function buildAllUlkhadRoutines(): WorkoutRoutine[] {
  const out: WorkoutRoutine[] = [];
  for (const meso of ULKHAD_MESOCYCLES) {
    for (const micro of meso.microcycles) {
      for (const day of micro.days) {
        if (day.exercises.length > 0 && day.id !== 'J4') {
          out.push(buildUlkhadRoutine(meso, micro, day));
        }
      }
    }
  }
  return out;
}
