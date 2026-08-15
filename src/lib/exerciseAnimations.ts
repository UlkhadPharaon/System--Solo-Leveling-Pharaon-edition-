// Résolution animation Lottie par nom d'exercice (avec correspondances floues FR)
import pushup from '../assets/lottie/pushup.json';
import declinePushup from '../assets/lottie/declinePushup.json';
import archerPushup from '../assets/lottie/archerPushup.json';
import pullup from '../assets/lottie/pullup.json';
import row from '../assets/lottie/row.json';
import superman from '../assets/lottie/superman.json';
import plank from '../assets/lottie/plank.json';
import sidePlank from '../assets/lottie/sidePlank.json';
import pike from '../assets/lottie/pike.json';
import dip from '../assets/lottie/dip.json';
import curl from '../assets/lottie/curl.json';
import squat from '../assets/lottie/squat.json';
import lunge from '../assets/lottie/lunge.json';
import gluteBridge from '../assets/lottie/gluteBridge.json';
import calfRaise from '../assets/lottie/calfRaise.json';
import crunch from '../assets/lottie/crunch.json';
import rest from '../assets/lottie/rest.json';
import complete from '../assets/lottie/complete.json';

export const REST_ANIMATION: LottieData = rest;
export const COMPLETE_ANIMATION: LottieData = complete;

// Données Lottie : structure hétérogène selon l'animation, on garde le typage souple
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LottieData = any;

const TABLE: [RegExp, LottieData][] = [
  [/une main|archer/i, archerPushup],
  [/d[ée]clin/i, declinePushup],
  [/sur[éee]lev|poings|pieds/i, declinePushup],
  [/diamant|pompes? (classique|standard|saut|large|pliom)/i, pushup],
  [/pompes|pompe/i, pushup],
  [/tractions?|chin/i, pullup],
  [/row/i, row],
  [/superman|cobra/i, superman],
  [/planche lat|lat[ée]rale/i, sidePlank],
  [/planche|gainage|ab-wheel|roue/i, plank],
  [/pike|handstand/i, pike],
  [/dips?/i, dip],
  [/curl|serviette/i, curl],
  [/fente|lunge/i, lunge],
  [/pont|fessier/i, gluteBridge],
  [/mollet|calf/i, calfRaise],
  [/crunch|abdos|relev/i, crunch],
  [/squat|pistol/i, squat],
];

export function animationForExercise(name: string): LottieData {
  for (const [re, data] of TABLE) {
    if (re.test(name)) return data;
  }
  return pushup; // fallback universel
}
