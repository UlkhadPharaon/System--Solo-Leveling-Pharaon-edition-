// ============================================================================
// Générateur d'animations Lottie originales (athlète 2D stylisé)
// Émet des .json Lottie 5.7 valides dans src/assets/lottie/
// Principe : chaque animation = squelette (segments entre articulations)
// + 2-3 poses clés interpolées en boucle. Props statiques (sol, barre, chaise).
// Usage: node scripts/gen-lottie.mjs
// ============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'assets', 'lottie');
mkdirSync(OUT, { recursive: true });

const W = 300, H = 200, FR = 30, DUR = 60; // 2 s en boucle
const GOLD = [0.831, 0.686, 0.216]; // #D4AF37
const CYAN = [0.133, 0.827, 0.933]; // #22D3EE
const SLATE = [0.302, 0.42, 0.55]; // #4D6B8C props

let ind = 1;
const num = (v) => (Math.round(v * 10) / 10);

function keyframes(values, times) {
  // values: array of [num] or [x,y,0]; times: array of frame numbers
  return values.map((s, idx) => {
    const kf = { t: times[idx], s: s.map(num) };
    if (idx < values.length - 1) {
      kf.i = { x: [0.35], y: [1] };
      kf.o = { x: [0.65], y: [0] };
    }
    return kf;
  });
}

function segLayer(name, poses, times, color = GOLD, width = 8, dashes) {
  // poses: array of [ [x1,y1], [x2,y2] ] (start/end du segment par pose)
  const rots = poses.map(([a, b]) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  const poss = poses.map(([a]) => [a[0], a[1], 0]);
  const len = Math.hypot(poses[0][1][0] - poses[0][0][0], poses[0][1][1] - poses[0][0][1]);
  const stroke = {
    ty: 'st', c: { a: 0, k: color }, o: { a: 0, k: 100 },
    w: { a: 0, k: width }, lc: 2, lj: 2,
  };
  if (dashes) stroke.d = [{ n: 'd', nm: 'dash', v: { a: 0, k: dashes } }, { n: 'g', nm: 'gap', v: { a: 0, k: 10 } }, { n: 'o', nm: 'offset', v: { a: 0, k: 0 } }];
  return {
    ddd: 0, ind: ind++, ty: 4, nm: name, sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 1, k: keyframes(rots.map((r) => [r]), times) },
      p: { a: 1, k: keyframes(poss, times) },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [{
      ty: 'gr', nm: name + 'g', np: 2, cix: 2, ix: 1, bm: 0, hd: false,
      it: [
        { ty: 'sh', d: 1, ks: { a: 0, k: { c: false, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[0, 0], [num(len), 0]] } } },
        stroke,
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ],
    }],
    ip: 0, op: DUR, st: 0, bm: 0,
  };
}

function dotLayer(name, poses, times, r = 6, color = GOLD) {
  return {
    ddd: 0, ind: ind++, ty: 4, nm: name, sr: 1,
    ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      p: { a: 1, k: keyframes(poses.map((p) => [p[0], p[1], 0]), times) },
      a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [{
      ty: 'gr', nm: name + 'g', np: 2, cix: 2, ix: 1, bm: 0, hd: false,
      it: [
        { ty: 'el', d: 1, s: { a: 0, k: [r * 2, r * 2] }, p: { a: 0, k: [0, 0] } },
        { ty: 'st', c: { a: 0, k: color }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 }, lc: 2, lj: 2 },
        { ty: 'fl', c: { a: 0, k: [0.016, 0.051, 0.102] }, o: { a: 0, k: 100 } },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ],
    }],
    ip: 0, op: DUR, st: 0, bm: 0,
  };
}

function headLayer(poses, times, r = 11) {
  return {
    ddd: 0, ind: ind++, ty: 4, nm: 'head', sr: 1,
    ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      p: { a: 1, k: keyframes(poses.map((p) => [p[0], p[1], 0]), times) },
      a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [{
      ty: 'gr', nm: 'headg', np: 3, cix: 2, ix: 1, bm: 0, hd: false,
      it: [
        { ty: 'el', d: 1, s: { a: 0, k: [r * 2, r * 2] }, p: { a: 0, k: [0, 0] } },
        { ty: 'st', c: { a: 0, k: GOLD }, o: { a: 0, k: 100 }, w: { a: 0, k: 6 }, lc: 2, lj: 2 },
        { ty: 'fl', c: { a: 0, k: [0.016, 0.051, 0.102] }, o: { a: 0, k: 100 } },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ],
    }],
    ip: 0, op: DUR, st: 0, bm: 0,
  };
}

function staticLayer(name, shapeItems, pos = [0, 0]) {
  return {
    ddd: 0, ind: ind++, ty: 4, nm: name, sr: 1,
    ks: {
      o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [pos[0], pos[1], 0] },
      a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
    },
    shapes: [{ ty: 'gr', nm: name + 'g', np: shapeItems.length, cix: 2, ix: 1, bm: 0, hd: false, it: [...shapeItems, { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } }] }],
    ip: 0, op: DUR, st: 0, bm: 0,
  };
}

const floorShape = () => staticLayer('floor', [
  { ty: 'sh', d: 1, ks: { a: 0, k: { c: false, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[-140, 0], [140, 0]] } } },
  { ty: 'st', c: { a: 0, k: SLATE }, o: { a: 0, k: 70 }, w: { a: 0, k: 4 }, lc: 2, lj: 2, d: [{ n: 'd', nm: 'dash', v: { a: 0, k: 12 } }, { n: 'g', nm: 'gap', v: { a: 0, k: 10 } }, { n: 'o', nm: 'offset', v: { a: 0, k: 0 } }] },
], [150, 172]);

const propRect = (name, x, y, w, h) => staticLayer(name, [
  { ty: 'rc', d: 1, s: { a: 0, k: [w, h] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 6 } },
  { ty: 'st', c: { a: 0, k: SLATE }, o: { a: 0, k: 90 }, w: { a: 0, k: 4 }, lc: 2, lj: 2 },
  { ty: 'fl', c: { a: 0, k: [0.063, 0.173, 0.329] }, o: { a: 0, k: 60 } },
], [x, y]);

// figure(name, skeletonJoints, boneList, poses, times, opts)
// skeletonJoints: per pose, map jointName -> [x,y]
function figure(poses, times, bones, opts = {}) {
  const layers = [];
  for (const [boneName, [j1, j2, color, wdt]] of bones) {
    layers.push(segLayer(boneName, poses.map((p) => [p[j1], p[j2]]), times, color ?? GOLD, wdt ?? 8));
  }
  if (opts.head) layers.push(headLayer(poses.map((p) => p[opts.head]), times, opts.headR ?? 11));
  if (opts.handDots) {
    for (const jt of opts.handDots) layers.push(dotLayer('dot', poses.map((p) => p[jt]), times, 5, CYAN));
  }
  return layers;
}

const T2 = [0, 30, 60]; // 2 poses + retour
const T3 = [0, 20, 40, 60];

const anims = {};

// --- POMPES (classiques) -----------------------------------------------------
anims.pushup = {
  poses: [
    { head: [86, 84], neck: [100, 96], shoulder: [104, 98], elbow: [86, 128], hand: [68, 164], hip: [178, 106], knee: [236, 120], toe: [272, 160] },
    { head: [82, 118], neck: [96, 130], shoulder: [100, 134], elbow: [84, 152], hand: [68, 164], hip: [174, 128], knee: [234, 122], toe: [272, 160] },
    { head: [86, 84], neck: [100, 96], shoulder: [104, 98], elbow: [86, 128], hand: [68, 164], hip: [178, 106], knee: [236, 120], toe: [272, 160] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'toe']]],
  head: 'head', handDots: ['hand'],
};

// --- POMPES DÉCLINÉES ---------------------------------------------------------
anims.declinePushup = {
  poses: [
    { head: [78, 74], neck: [94, 84], shoulder: [100, 88], elbow: [84, 122], hand: [68, 162], hip: [184, 70], knee: [238, 50], toe: [276, 34] },
    { head: [74, 104], neck: [90, 114], shoulder: [96, 118], elbow: [82, 146], hand: [68, 162], hip: [180, 96], knee: [236, 74], toe: [276, 34] },
    { head: [78, 74], neck: [94, 84], shoulder: [100, 88], elbow: [84, 122], hand: [68, 162], hip: [184, 70], knee: [238, 50], toe: [276, 34] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'toe']]],
  head: 'head', handDots: ['hand'],
  props: [propRect('box', 288, 60, 24, 60)],
};

// --- POMPES ARCHER / UNE MAIN -------------------------------------------------
anims.archerPushup = {
  poses: [
    { head: [96, 84], neck: [110, 94], shoulder: [114, 96], elbow: [96, 128], hand: [78, 164], straightHand: [216, 160], hip: [190, 104], knee: [244, 118], toe: [276, 158] },
    { head: [92, 116], neck: [106, 128], shoulder: [110, 132], elbow: [94, 150], hand: [78, 164], straightHand: [216, 160], hip: [186, 126], knee: [242, 120], toe: [276, 158] },
    { head: [96, 84], neck: [110, 94], shoulder: [114, 96], elbow: [96, 128], hand: [78, 164], straightHand: [216, 160], hip: [190, 104], knee: [244, 118], toe: [276, 158] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['straightArm', ['shoulder', 'straightHand', [0.42, 0.55, 0.7], 6]], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'toe']]],
  head: 'head', handDots: ['hand', 'straightHand'],
};

// --- TRACTIONS ---------------------------------------------------------------
anims.pullup = {
  poses: [
    { head: [150, 46], shoulder: [150, 64], elbow: [126, 52], hand: [150, 30], hip: [150, 116], knee: [136, 148], foot: [142, 176] },
    { head: [150, 92], shoulder: [150, 108], elbow: [128, 116], hand: [150, 30], hip: [150, 158], knee: [138, 186], foot: [144, 198] },
    { head: [150, 46], shoulder: [150, 64], elbow: [126, 52], hand: [150, 30], hip: [150, 116], knee: [136, 148], foot: [142, 176] },
  ],
  bones: [['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
  props: [propRect('bar', 150, 26, 120, 6)],
};

// --- ROW INVERSÉ --------------------------------------------------------------
anims.row = {
  poses: [
    { head: [172, 96], neck: [162, 104], shoulder: [150, 110], elbow: [126, 96], hand: [150, 88], hip: [206, 132], knee: [240, 158], foot: [266, 186] },
    { head: [188, 134], neck: [176, 138], shoulder: [162, 140], elbow: [136, 118], hand: [150, 88], hip: [212, 162], knee: [244, 180], foot: [268, 194] },
    { head: [172, 96], neck: [162, 104], shoulder: [150, 110], elbow: [126, 96], hand: [150, 88], hip: [206, 132], knee: [240, 158], foot: [266, 186] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
  props: [propRect('bar', 150, 84, 130, 6)],
};

// --- SUPERMAN ------------------------------------------------------------------
anims.superman = {
  poses: [
    { head: [72, 132], neck: [88, 138], shoulder: [96, 140], elbow: [62, 126], hand: [34, 114], hip: [172, 148], knee: [214, 134], foot: [248, 122] },
    { head: [72, 122], neck: [88, 128], shoulder: [96, 130], elbow: [62, 112], hand: [34, 98], hip: [172, 138], knee: [214, 122], foot: [248, 108] },
    { head: [72, 132], neck: [88, 138], shoulder: [96, 140], elbow: [62, 126], hand: [34, 114], hip: [172, 148], knee: [214, 134], foot: [248, 122] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
};

// --- PLANCHE -------------------------------------------------------------------
anims.plank = {
  poses: [
    { head: [80, 118], neck: [94, 122], shoulder: [100, 124], elbow: [88, 146], hand: [76, 164], hip: [180, 128], knee: [236, 134], toe: [272, 158] },
    { head: [80, 113], neck: [94, 117], shoulder: [100, 119], elbow: [88, 142], hand: [76, 164], hip: [180, 122], knee: [236, 129], toe: [272, 158] },
    { head: [80, 118], neck: [94, 122], shoulder: [100, 124], elbow: [88, 146], hand: [76, 164], hip: [180, 128], knee: [236, 134], toe: [272, 158] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'toe']]],
  head: 'head', handDots: ['hand'],
};

// --- PLANCHE LATÉRALE -----------------------------------------------------------
anims.sidePlank = {
  poses: [
    { head: [110, 78], neck: [118, 92], shoulder: [120, 100], elbow: [110, 132], hand: [104, 158], topHand: [150, 120], hip: [196, 122], foot: [268, 156] },
    { head: [110, 73], neck: [118, 87], shoulder: [120, 96], elbow: [110, 128], hand: [104, 158], topHand: [152, 114], hip: [196, 117], foot: [268, 152] },
    { head: [110, 78], neck: [118, 92], shoulder: [120, 100], elbow: [110, 132], hand: [104, 158], topHand: [150, 120], hip: [196, 122], foot: [268, 156] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['topArm', ['shoulder', 'topHand', [0.42, 0.55, 0.7], 6]], ['bodyline', ['hip', 'foot']]],
  head: 'head', handDots: ['hand'],
};

// --- PIKE PUSH-UP ---------------------------------------------------------------
anims.pike = {
  poses: [
    { head: [96, 118], neck: [104, 110], shoulder: [110, 106], elbow: [90, 136], hand: [72, 162], hip: [166, 58], knee: [204, 104], toe: [236, 158] },
    { head: [86, 138], neck: [96, 130], shoulder: [102, 126], elbow: [88, 148], hand: [72, 162], hip: [166, 56], knee: [204, 104], toe: [236, 158] },
    { head: [96, 118], neck: [104, 110], shoulder: [110, 106], elbow: [90, 136], hand: [72, 162], hip: [166, 58], knee: [204, 104], toe: [236, 158] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'toe']]],
  head: 'head', handDots: ['hand'],
};

// --- DIPS ------------------------------------------------------------------------
anims.dip = {
  poses: [
    { head: [150, 52], neck: [150, 66], shoulder: [150, 70], elbow: [176, 96], hand: [176, 128], hip: [150, 122], knee: [128, 152], foot: [124, 186] },
    { head: [150, 78], neck: [150, 90], shoulder: [150, 94], elbow: [176, 118], hand: [176, 128], hip: [150, 146], knee: [128, 170], foot: [124, 192] },
    { head: [150, 52], neck: [150, 66], shoulder: [150, 70], elbow: [176, 96], hand: [176, 128], hip: [150, 122], knee: [128, 152], foot: [124, 186] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
  props: [propRect('chairL', 176, 140, 22, 56), propRect('chairR', 124, 198, 22, 12)],
};

// --- CURL (serviette) -------------------------------------------------------------
anims.curl = {
  poses: [
    { head: [150, 44], neck: [150, 58], shoulder: [150, 62], elbow: [176, 106], hand: [210, 104], hip: [150, 120], knee: [150, 158], foot: [150, 186], towelEnd: [252, 100] },
    { head: [150, 44], neck: [150, 58], shoulder: [150, 62], elbow: [176, 106], hand: [204, 74], hip: [150, 120], knee: [150, 158], foot: [150, 186], towelEnd: [246, 66] },
    { head: [150, 44], neck: [150, 58], shoulder: [150, 62], elbow: [176, 106], hand: [210, 104], hip: [150, 120], knee: [150, 158], foot: [150, 186], towelEnd: [252, 100] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']], ['towel', ['hand', 'towelEnd', [0.83, 0.62, 0.22], 4, 6]]],
  head: 'head', handDots: ['hand'],
};

// --- SQUAT -------------------------------------------------------------------------
anims.squat = {
  poses: [
    { head: [150, 38], neck: [150, 54], shoulder: [150, 58], elbow: [128, 72], hand: [112, 56], hip: [150, 116], knee: [150, 156], foot: [150, 186], fwdArm: [172, 72] },
    { head: [162, 76], neck: [158, 92], shoulder: [156, 96], elbow: [134, 110], hand: [118, 96], hip: [126, 138], knee: [162, 152], foot: [150, 186], fwdArm: [178, 108] },
    { head: [150, 38], neck: [150, 54], shoulder: [150, 58], elbow: [128, 72], hand: [112, 56], hip: [150, 116], knee: [150, 156], foot: [150, 186], fwdArm: [172, 72] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['uarmF', ['shoulder', 'fwdArm', [0.42, 0.55, 0.7], 6]], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
};

// --- FENTES (bulgares) ---------------------------------------------------------------
anims.lunge = {
  poses: [
    { head: [120, 44], neck: [122, 60], shoulder: [124, 64], elbow: [104, 80], hand: [90, 66], hip: [128, 122], knee: [106, 158], foot: [104, 186], backKnee: [176, 150], backFoot: [212, 148] },
    { head: [120, 52], neck: [122, 68], shoulder: [124, 72], elbow: [104, 88], hand: [90, 74], hip: [128, 128], knee: [104, 158], foot: [104, 186], backKnee: [176, 160], backFoot: [212, 148] },
    { head: [120, 44], neck: [122, 60], shoulder: [124, 64], elbow: [104, 80], hand: [90, 66], hip: [128, 122], knee: [106, 158], foot: [104, 186], backKnee: [176, 150], backFoot: [212, 148] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']], ['backThigh', ['hip', 'backKnee', [0.42, 0.55, 0.7], 6]], ['backShin', ['backKnee', 'backFoot', [0.42, 0.55, 0.7], 6]]],
  head: 'head', handDots: ['hand'],
  props: [propRect('chair', 214, 172, 60, 14)],
};

// --- PONT FESSIER -----------------------------------------------------------------------
anims.gluteBridge = {
  poses: [
    { head: [66, 156], neck: [84, 158], shoulder: [94, 158], elbow: [72, 168], hand: [52, 170], hip: [166, 152], knee: [188, 122], foot: [196, 164] },
    { head: [66, 156], neck: [84, 158], shoulder: [94, 158], elbow: [72, 168], hand: [52, 170], hip: [166, 118], knee: [192, 108], foot: [196, 164] },
    { head: [66, 156], neck: [84, 158], shoulder: [94, 158], elbow: [72, 168], hand: [52, 170], hip: [166, 152], knee: [188, 122], foot: [196, 164] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
};

// --- MOLLETS (sur marche) ------------------------------------------------------------------
anims.calfRaise = {
  poses: [
    { head: [150, 40], neck: [150, 56], shoulder: [150, 60], elbow: [128, 76], hand: [114, 60], hip: [150, 118], knee: [150, 156], heel: [150, 172], toe: [150, 186] },
    { head: [150, 26], neck: [150, 42], shoulder: [150, 46], elbow: [128, 62], hand: [114, 46], hip: [150, 104], knee: [150, 142], heel: [154, 156], toe: [150, 186] },
    { head: [150, 40], neck: [150, 56], shoulder: [150, 60], elbow: [128, 76], hand: [114, 60], hip: [150, 118], knee: [150, 156], heel: [150, 172], toe: [150, 186] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'heel']]],
  head: 'head', handDots: ['hand'],
  props: [propRect('step', 150, 190, 60, 10)],
};

// --- CRUNCH ---------------------------------------------------------------------------------
anims.crunch = {
  poses: [
    { head: [82, 148], neck: [96, 150], shoulder: [110, 152], elbow: [96, 160], hand: [84, 166], hip: [190, 156], knee: [196, 120], foot: [222, 148] },
    { head: [92, 124], neck: [106, 130], shoulder: [118, 138], elbow: [104, 148], hand: [92, 152], hip: [190, 156], knee: [196, 120], foot: [222, 148] },
    { head: [82, 148], neck: [96, 150], shoulder: [110, 152], elbow: [96, 160], hand: [84, 166], hip: [190, 156], knee: [196, 120], foot: [222, 148] },
  ],
  bones: [['neck-head', ['neck', 'head']], ['torso', ['shoulder', 'hip']], ['uarm', ['shoulder', 'elbow']], ['farm', ['elbow', 'hand']], ['thigh', ['hip', 'knee']], ['shin', ['knee', 'foot']]],
  head: 'head', handDots: ['hand'],
};

// --- REPOS (horloge pulsante pour le minuteur) ----------------------------------------------
anims.rest = {
  poses: null, // spécial
};

// --- TROPHÉE / SÉANCE TERMINÉe --------------------------------------------------------------
anims.complete = {
  poses: null, // spécial
};

function buildAnimation(def) {
  const layers = [];
  if (def.props) layers.push(...def.props);
  layers.push(floorShape());
  layers.push(...figure(def.poses, def.times ?? T2, def.bones, def));
  return {
    v: '5.7.4', fr: FR, ip: 0, op: DUR, w: W, h: H, nm: 'anim', ddd: 0, assets: [],
    layers: layers.reverse().map((l, i) => ({ ...l, ind: i + 1 })), // reverse: premier dessiné en dessous
  };
}

function buildRest() {
  // Horloge : cercle + aiguille en rotation continue + pulsation
  const layers = [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'hand', sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: DUR, s: [360] }] },
        p: { a: 0, k: [150, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [{ ty: 'gr', nm: 'hg', np: 2, cix: 2, ix: 1, bm: 0, hd: false, it: [
        { ty: 'sh', d: 1, ks: { a: 0, k: { c: false, i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[0, 0], [0, -34]] } } },
        { ty: 'st', c: { a: 0, k: CYAN }, o: { a: 0, k: 100 }, w: { a: 0, k: 6 }, lc: 2, lj: 2 },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ] }],
      ip: 0, op: DUR, st: 0, bm: 0,
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: 'clock', sr: 1,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [150, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: 30, s: [110, 110, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: DUR, s: [100, 100, 100] }] },
      },
      shapes: [{ ty: 'gr', nm: 'cg', np: 2, cix: 2, ix: 1, bm: 0, hd: false, it: [
        { ty: 'el', d: 1, s: { a: 0, k: [96, 96] }, p: { a: 0, k: [0, 0] } },
        { ty: 'st', c: { a: 0, k: GOLD }, o: { a: 0, k: 100 }, w: { a: 0, k: 7 }, lc: 2, lj: 2 },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ] }],
      ip: 0, op: DUR, st: 0, bm: 0,
    },
  ];
  return { v: '5.7.4', fr: FR, ip: 0, op: DUR, w: W, h: H, nm: 'rest', ddd: 0, assets: [], layers };
}

function buildComplete() {
  // Coche qui se dessine (trim path) dans un cercle
  const stroke = { ty: 'st', c: { a: 0, k: [0.13, 0.72, 0.42] }, o: { a: 0, k: 100 }, w: { a: 0, k: 10 }, lc: 2, lj: 2 };
  const layers = [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'check', sr: 1,
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [150, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
      shapes: [{ ty: 'gr', nm: 'ckg', np: 3, cix: 2, ix: 1, bm: 0, hd: false, it: [
        { ty: 'sh', d: 1, ks: { a: 0, k: { c: false, i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-24, 4], [-6, 22], [28, -18]] } } },
        { ...stroke },
        { ty: 'tm', s: { a: 1, k: [{ t: 0, s: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: 35, s: [0] }] }, e: { a: 1, k: [{ t: 0, s: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } }, { t: 35, s: [100] }] }, o: { a: 0, k: 0 }, m: 1 },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ] }],
      ip: 0, op: DUR, st: 0, bm: 0,
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: 'ring', sr: 1,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [150, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [60, 60, 100], i: { x: [0.3], y: [1] }, o: { x: [0.7], y: [0] } }, { t: 25, s: [100, 100, 100] }] },
      },
      shapes: [{ ty: 'gr', nm: 'rg', np: 2, cix: 2, ix: 1, bm: 0, hd: false, it: [
        { ty: 'el', d: 1, s: { a: 0, k: [110, 110] }, p: { a: 0, k: [0, 0] } },
        { ty: 'st', c: { a: 0, k: [0.13, 0.72, 0.42] }, o: { a: 0, k: 60 }, w: { a: 0, k: 8 }, lc: 2, lj: 2 },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
      ] }],
      ip: 0, op: DUR, st: 0, bm: 0,
    },
  ];
  return { v: '5.7.4', fr: FR, ip: 0, op: DUR, w: W, h: H, nm: 'complete', ddd: 0, assets: [], layers };
}

// --- Émission ---------------------------------------------------------------------------
let count = 0;
for (const [name, def] of Object.entries(anims)) {
  const json = name === 'rest' ? buildRest() : name === 'complete' ? buildComplete() : buildAnimation(def);
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(json));
  count++;
  console.log('✓', name);
}
writeFileSync(join(OUT, 'rest.json'), JSON.stringify(buildRest()));
writeFileSync(join(OUT, 'complete.json'), JSON.stringify(buildComplete()));
console.log(`${count + 2} animations générées dans src/assets/lottie/`);
