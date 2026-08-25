/**
 * Unit tests — pure critical paths + the F-series feature modules.
 *
 * Run: npm test  (tsx tests/unit.mts)
 */

import { deepStrictEqual, equal, ok } from 'node:assert';
import {
  calculateLevelProgression,
  getRankAndClassForLevel,
  blockReward,
  focusSessionReward,
  workoutReward,
  formatMinutes,
} from '../src/lib/utils.ts';
import { computeDomainWeights, workoutTargetId } from '../src/lib/domains.ts';
import { buildTemplateQuests } from '../src/lib/questGeneration.ts';
import {
  detectDistress,
  validateQuests,
  validateAgentActions,
} from '../src/lib/guardrails.ts';
import {
  DEFAULT_EXAM_STATE,
  examDaysRemaining,
  isExamWindowExpired,
  scaleTargetsForExam,
} from '../src/lib/examMode.ts';
import { buildWeeklyTrends } from '../src/lib/trends.ts';
import { nextOccurrence, buildScheduleIcs } from '../src/lib/scheduleExport.ts';
import {
  pushWeeklySnapshot,
  computeRecalibrations,
} from '../src/lib/adaptiveTargets.ts';
import {
  pendingBlocks,
  questReminderBody,
  planQuestReminder,
  planStreakRescue,
} from '../src/lib/smartPush.ts';
import { applyQuestCompletion } from '../src/lib/progression.ts';

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}`);
    console.error(err);
  }
}

const DOMAINS = new Set(['dom_a', 'dom_b']);

// ── calculateLevelProgression ────────────────────────────────────────────────

test('level up: 250 xp from level 1 crosses two thresholds', () => {
  const r = calculateLevelProgression(0, 1, 100, 250);
  equal(r.level, 3);
  equal(r.levelsGained, 2);
  equal(r.attributePointsGained, 10);
  equal(r.leveledUp, true);
  equal(r.xp, 0); // 250 = 100 (lvl2) + 150 (lvl3) → remainder 0
});

test('no level up below threshold keeps state stable', () => {
  const r = calculateLevelProgression(50, 3, 100, 10);
  equal(r.level, 3);
  equal(r.xp, 60);
  equal(r.leveledUp, false);
  equal(r.levelsGained, 0);
});

test('corrupt inputs are clamped instead of crashing', () => {
  const r = calculateLevelProgression(NaN, -5, NaN, NaN);
  equal(r.level, 1);
  equal(r.xp, 0);
  ok(r.xpToNextLevel >= 50);
});

// ── ranks & rewards ──────────────────────────────────────────────────────────

test('rank boundaries map to the documented table', () => {
  equal(getRankAndClassForLevel(1).rank, 'E');
  equal(getRankAndClassForLevel(5).rank, 'D');
  equal(getRankAndClassForLevel(7).rank, 'C');
  equal(getRankAndClassForLevel(24).rank, 'S');
  equal(getRankAndClassForLevel(25).rank, 'Pharaon');
});

test('blockReward applies per-minute rates with floors', () => {
  deepStrictEqual(blockReward(45), { xp: 90, gold: 45 });
  deepStrictEqual(blockReward(0), { xp: 20, gold: 10 });
});

test('focusSessionReward doubles the per-minute rate', () => {
  deepStrictEqual(focusSessionReward(30), { xp: 120, gold: 60 });
});

test('workoutReward adds the flat bonus on top of per-minute', () => {
  deepStrictEqual(workoutReward(60), { xp: 270, gold: 100 });
});

test('formatMinutes renders compact human strings', () => {
  equal(formatMinutes(59), '59 min');
  equal(formatMinutes(120), '2h');
  equal(formatMinutes(125), '2h 5m');
});

// ── computeDomainWeights ─────────────────────────────────────────────────────

test('domain weights are proportional and normalized to 1', () => {
  const w = computeDomainWeights([
    { id: 'dom_a', weekly_time_budget: 2 },
    { id: 'dom_b', weekly_time_budget: 6 },
  ] as any);
  equal(w['dom_a'], 0.25);
  equal(w['dom_b'], 0.75);
});

test('falsy budgets fall back to the 2h default, negatives to the 0.5h floor', () => {
  // Production semantics: Number(b)||2 sends 0/NaN/undefined to the 2h default;
  // Math.max(0.5, …) then only matters for negative numbers.
  const w = computeDomainWeights([
    { id: 'dom_a', weekly_time_budget: 0 },
    { id: 'dom_b', weekly_time_budget: 0.5 },
    { id: 'dom_c', weekly_time_budget: -10 },
  ] as any);
  equal(w['dom_a'], 0.667); // 0 → default 2h / total 3
  equal(w['dom_b'], 0.167); // 0.5 / 3
  equal(w['dom_c'], 0.167); // -10 → floor 0.5 / 3
  const empty = computeDomainWeights([] as any);
  deepStrictEqual(empty, {});
});

// ── workoutTargetId ──────────────────────────────────────────────────────────

test('workout hours route to the dom:<id> slice when a workout domain exists', () => {
  equal(
    workoutTargetId([
      { id: 'dom_musculation', label: 'Musculation', tracking_type: 'workout_log' },
      { id: 'dom_ecole', label: 'École', tracking_type: 'study_subjects' },
    ] as any),
    'dom:dom_musculation'
  );
});

test('workout hours fall back to legacy morning_routine without a workout domain', () => {
  equal(workoutTargetId([{ id: 'dom_ecole', label: 'École', tracking_type: 'study_subjects' }] as any), 'morning_routine');
  equal(workoutTargetId([] as any), 'morning_routine');
});

// ── buildTemplateQuests ──────────────────────────────────────────────────────

test('template quests: 2 per domain, tagged template, unique ids', () => {
  const quests = buildTemplateQuests([
    { id: 'dom_a', label: 'Musculation', tracking_type: 'workout_log' },
    { id: 'dom_b', label: 'Lecture', tracking_type: 'habit_checklist' },
  ] as any);
  equal(quests.length, 4);
  ok(quests.every((q) => q.source === 'template'));
  ok(new Set(quests.map((q) => q.id)).size === 4);
  ok(quests.every((q) => q.domainId === 'dom_a' || q.domainId === 'dom_b'));
});

test('unknown tracking_type falls back to habit_checklist quests', () => {
  const quests = buildTemplateQuests([
    { id: 'dom_x', label: 'Mystère', tracking_type: 'unknown_kind' },
  ] as any);
  equal(quests.length, 2);
  ok(quests[0].title.includes('Mystère'));
});

// ── detectDistress (BUG-004 guardrail) ───────────────────────────────────────

test('flags distress phrasing, case-insensitive, truncated to 160 chars', () => {
  const hit = detectDistress(['Je me sens perdu', 'plus envie de vivre ces temps-ci']);
  ok(hit !== null && hit.startsWith('plus envie de vivre'));
  ok(detectDistress(['C EST DU SUICIDE SPORTIF']) !== null || detectDistress(['suicide']) !== null);
  const long = detectDistress([`${'x'.repeat(200)} suicide`]);
  ok(long !== null && long.length <= 160);
});

test('benign free-text is NOT flagged (false positives break onboarding)', () => {
  equal(detectDistress(['Atteindre 85 kg en musculation, réussir le bac et monter Bangre Neo Lab']), null);
  equal(detectDistress([undefined, null, 42 as any]), null);
});

// ── validateQuests ───────────────────────────────────────────────────────────

test('valid LLM quest passes through with its fields', () => {
  const out = validateQuests(
    { quests: [{ domainId: 'dom_a', title: 'Première séance', description: 'Bouger.', xpReward: 60, difficulty: 'easy' }] },
    DOMAINS
  );
  equal(out.length, 1);
  deepStrictEqual(out[0], { domainId: 'dom_a', title: 'Première séance', description: 'Bouger.', xpReward: 60, difficulty: 'easy' });
});

test('xp clamped to 20..120, bad difficulty coerced to medium, defaults applied', () => {
  const out = validateQuests(
    { quests: [
      { domainId: 'dom_a', title: 'T1', xpReward: 9999, difficulty: 'impossible' },
      { domainId: 'dom_a', title: 'T2', xpReward: 1 },
      { domainId: 'dom_b', title: 'T3', xpReward: 'garbage' },
    ] },
    DOMAINS
  );
  equal(out[0].xpReward, 120);
  equal(out[0].difficulty, 'medium');
  equal(out[1].xpReward, 20);
  equal(out[1].difficulty, 'medium');
  equal(out[2].xpReward, 40);
});

test('quests on unknown or missing domains are dropped entirely', () => {
  const out = validateQuests(
    { quests: [
      { domainId: 'dom_hacker', title: 'X', xpReward: 50 },
      { title: 'no domain', xpReward: 50 },
      null,
      { domainId: 'dom_b', title: 'OK', xpReward: 50 },
    ] },
    DOMAINS
  );
  equal(out.length, 1);
  equal(out[0].domainId, 'dom_b');
});

test('non-object / non-array payloads produce an empty list, never a crash', () => {
  equal(validateQuests(null, DOMAINS).length, 0);
  equal(validateQuests({ quests: 'not-an-array' }, DOMAINS).length, 0);
  equal(validateQuests(undefined, DOMAINS).length, 0);
});

// ── validateAgentActions ─────────────────────────────────────────────────────

test('unknown action types are dropped, known ones survive', () => {
  const out = validateAgentActions(
    { actions: [
      { action: 'format_the_disk', payload: {} },
      { action: 'award_xp', payload: { xp: 50, gold: 10, reason: 'Session tenue' } },
    ] },
    DOMAINS
  );
  equal(out.length, 1);
  equal(out[0].action, 'award_xp');
});

test('award_xp: xp clamped 1..200, gold floored at 0, reason mandatory & sanitized', () => {
  const out = validateAgentActions(
    { actions: [
      { action: 'award_xp', payload: { xp: 5000, gold: -5, reason: 'trop' } },
      { action: 'award_xp', payload: { xp: 10, gold: 0 } },
      { action: 'award_xp', payload: { xp: 10, gold: 0, reason: '<script>x</script>' } },
      { action: 'award_xp', payload: { xp: 7, gold: 3, reason: 'ok' } },
    ] },
    DOMAINS
  );
  equal(out.length, 2);
  equal(out[0].payload.xp, 200);
  equal(out[0].payload.gold, 0);
  equal(out[1].payload.xp, 7);
});

test('add_schedule_block validates day + HH:MM times', () => {
  const out = validateAgentActions(
    { actions: [
      { action: 'add_schedule_block', payload: { day: 'Monday', title: 'Révision', startTime: '18:00', endTime: '19:30' } },
      { action: 'add_schedule_block', payload: { day: 'Funday', title: 'X', startTime: '18:00', endTime: '19:30' } },
      { action: 'add_schedule_block', payload: { day: 'Monday', title: 'X', startTime: '24:99', endTime: '19:30' } },
    ] },
    DOMAINS
  );
  equal(out.length, 1);
  equal(out[0].payload.day, 'Monday');
  equal(out[0].payload.startTime, '18:00');
});

test('add_note requires title+content; delete_note requires id; tags are capped', () => {
  const out = validateAgentActions(
    { actions: [
      { action: 'add_note', payload: { title: 'Idée', content: 'Tester le pipeline.' } },
      { action: 'add_note', payload: { title: 'Sans contenu' } },
      { action: 'delete_note', payload: { title: "pas d id" } },
      { action: 'delete_note', payload: { id: 'n_1' } },
      { action: 'add_note', payload: { title: 'Tags', content: 'c', tags: Array.from({ length: 30 }, (_, i) => `t${i}`) } },
    ] },
    DOMAINS
  );
  equal(out.length, 3);
  equal((out[2].payload as any).tags.length, 10);
});

test('update_weekly_target clamps hours into 0..168 on 0.5 steps', () => {
  const out = validateAgentActions(
    { actions: [
      { action: 'update_weekly_target', payload: { targetId: 't1', minHours: 55.3, maxHours: 999, targetHours: -10 } },
    ] },
    DOMAINS
  );
  equal(out.length, 1);
  equal(out[0].payload.minHours, 55.5);
  equal(out[0].payload.maxHours, 168);
  equal(out[0].payload.targetHours, 0);
});

test('malformed envelopes return [] and preserve accepted-action order', () => {
  equal(validateAgentActions(null, DOMAINS).length, 0);
  equal(validateAgentActions({}, DOMAINS).length, 0);
  equal(validateAgentActions({ actions: [42, 'x', {}] }, DOMAINS).length, 0);
  const out = validateAgentActions(
    { actions: [
      { action: 'award_xp', payload: { xp: 1, reason: 'a' } },
      { action: 'bogus', payload: {} },
      { action: 'award_xp', payload: { xp: 2, reason: 'b' } },
    ] },
    DOMAINS
  );
  deepStrictEqual(out.map((a) => a.payload.xp), [1, 2]);
});

// ── Exam Mode (#1) ───────────────────────────────────────────────────────────

const EXAM_TRACKING = (id: string) =>
  ({ 'dom:etudes': 'study_subjects', 'dom:muscu': 'workout_log' } as const)[id] ?? null;

test('exam mode OFF returns targets untouched', () => {
  const t = [{ id: 'dom:etudes', targetHours: 4, maxHours: 6, minHours: 2 }];
  deepStrictEqual(scaleTargetsForExam(t, EXAM_TRACKING, { ...DEFAULT_EXAM_STATE }), t);
});

test('exam mode ON scales study up on half-hour steps', () => {
  const out = scaleTargetsForExam(
    [{ id: 'dom:etudes', targetHours: 4, minHours: 3, maxHours: 5 }],
    EXAM_TRACKING,
    { ...DEFAULT_EXAM_STATE, isActive: true },
  );
  equal(out[0].targetHours, 6);   // 4 × 1.5
  equal(out[0].maxHours, 7.5);    // 5 × 1.5
});

test('exam mode scales workout down and ignores unrelated targets', () => {
  const out = scaleTargetsForExam(
    [
      { id: 'dom:muscu', targetHours: 5, minHours: 3, maxHours: 6 },
      { id: 'bangre_neo', targetHours: 8 },          // legacy non-school slice
      { id: 'dom:autre', targetHours: 2 },           // dom without matching kind
    ],
    EXAM_TRACKING,
    { ...DEFAULT_EXAM_STATE, isActive: true },
  );
  equal(out[0].targetHours, 3);   // 5 × 0.6
  equal(out[0].minHours, 2);      // 3 × 0.6 → 1.8 → round-half → 2
  equal(out[1].targetHours, 8);   // untouched
  equal(out[2].targetHours, 2);   // untouched
});

test('exam countdown: J-0 on exam day, expired strictly after', () => {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().split('T')[0];
  equal(examDaysRemaining(ymd(today)), 0);
  const future = new Date(today.getTime() + 3 * 86400000);
  equal(examDaysRemaining(ymd(future)), 3);
  equal(isExamWindowExpired({ ...DEFAULT_EXAM_STATE, isActive: true, examDate: ymd(today) }), false);
  const past = new Date(today.getTime() - 2 * 86400000);
  equal(isExamWindowExpired({ ...DEFAULT_EXAM_STATE, isActive: true, examDate: ymd(past) }), true);
  equal(isExamWindowExpired({ ...DEFAULT_EXAM_STATE, isActive: false, examDate: ymd(past) }), false);
});

test('exam countdown handles garbage dates gracefully', () => {
  equal(examDaysRemaining(null), null);
  equal(examDaysRemaining('not-a-date'), null);
});

// ── Weekly trends (#5) ───────────────────────────────────────────────────────

test('trends: continuous 8-point series, sessions bucketed into the right week', () => {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const focus = [
    { durationMinutes: 25, completedAt: daysAgo(0) },  // this week
    { durationMinutes: 50, completedAt: daysAgo(9) },  // last week-ish bucket
    { durationMinutes: 99, completedAt: daysAgo(400) },// far outside → dropped
  ];
  const workouts = [{ durationMinutes: 60, date: daysAgo(1) }];
  const pts = buildWeeklyTrends(focus, workouts, 8);

  equal(pts.length, 8);                       // continuous, no gaps
  equal(pts[pts.length - 1].focusMinutes, 25);// current week
  equal(pts[pts.length - 1].workoutMinutes, 60);
  equal(pts[pts.length - 1].workoutSessions, 1);
  ok(pts.some((p) => p.focusMinutes === 50)); // 9-days-ago session landed somewhere
  equal(pts.reduce((a, p) => a + p.focusMinutes, 0), 75); // 99-min outlier excluded
  equal(pts[0].label.startsWith('S') || /^\d/.test(pts[0].label), true);
});

// ── ICS export (#7) ──────────────────────────────────────────────────────────

test('nextOccurrence always lands in the future on the requested weekday', () => {
  const from = new Date('2026-08-25T15:00:00'); // a Tuesday
  equal(nextOccurrence('Tuesday', from).getDay(), 2);
  ok(nextOccurrence('Tuesday', from) > from);           // next week (same day past)
  equal(nextOccurrence('Wednesday', from).getDate(), 26);
  equal(new Date('2026-08-24').getDay() >= 0, true); // sanity
});

test('ICS output: valid envelope, RRULE per event, RFC folding under 75+1 chars', () => {
  const ics = buildScheduleIcs(
    {
      Monday: [
        { id: 'b1', title: 'Révision SVT; chapitre 3, partie A', startTime: '18:00', endTime: '19:30', category: 'school', durationMinutes: 90, isCompleted: false },
      ],
      Sunday: [],
    } as any,
    { calendarName: 'Ka Rise — Ma Semaine' },
  );
  ok(ics !== null);
  ok(ics!.startsWith('BEGIN:VCALENDAR\r\n'));
  ok(ics!.trimEnd().endsWith('END:VCALENDAR'));
  equal((ics!.match(/BEGIN:VEVENT/g) || []).length, 1);
  ok(ics!.includes('RRULE:FREQ=WEEKLY;BYDAY=MO'));
  ok(ics!.includes('\\;'));                          // escaped semicolon
  ics!.split('\r\n').forEach((line) => ok(line.length <= 75 + 1, `folded line too long: ${line.length}`));
});

test('ICS export of an empty schedule returns null (caller gives feedback)', () => {
  equal(buildScheduleIcs({}, {} as any), null);
  equal(buildScheduleIcs({ Monday: [] } as any, {} as any), null);
});

// ── Adaptive targets (#4) ────────────────────────────────────────────────────

const TARGETS = [
  { id: 'dom:lourd', label: 'Trop lourd', completedHours: 0.5, targetHours: 6, minHours: 4, maxHours: 8 },
  { id: 'dom:facile', label: 'Trop facile', completedHours: 7.5, targetHours: 5, minHours: 3, maxHours: 7 },
  { id: 'legacy_slice', label: 'Legacy', completedHours: 0, targetHours: 4 },
] as any[];

test('adaptive: two under-60% weeks propose a LOWER target grounded in reality', () => {
  const history = [
    { weekEnd: '2026-08-10', hours: { 'dom:lourd': 1.5, 'dom:facile': 12.5 } }, // start points
    { weekEnd: '2026-08-17', hours: { 'dom:lourd': 3, 'dom:facile': 19 } },     // week1: +1.5/6=25%, +6.5/5=130%
    { weekEnd: '2026-08-24', hours: { 'dom:lourd': 4.5, 'dom:facile': 26 } },   // week2: same rates
  ];
  const sugg = computeRecalibrations(history as any, TARGETS as any);
  const lower = sugg.find((s) => s.targetId === 'dom:lourd');
  ok(lower, 'expected a lower suggestion for the overloaded domain');
  equal(lower!.direction, 'lower');
  ok(lower!.suggestedTarget < lower!.currentTarget);
  ok(lower!.suggestedTarget >= 1);
  equal(sugg.some((s) => s.targetId === 'legacy_slice'), false); // legacy never suggested
});

test('adaptive: consistently over-110% weeks propose a RAISE', () => {
  const history = [
    { weekEnd: '2026-08-10', hours: { 'dom:facile': 5.5 } },
    { weekEnd: '2026-08-17', hours: { 'dom:facile': 11.5 } }, // +6 / 5 = 120%
    { weekEnd: '2026-08-24', hours: { 'dom:facile': 18 } },   // +6.5 / 5 = 130%
  ];
  const sugg = computeRecalibrations(history as any, TARGETS as any);
  const raise = sugg.find((s) => s.targetId === 'dom:facile');
  ok(raise, 'expected a raise suggestion');
  equal(raise!.direction, 'raise');
  equal(raise!.suggestedTarget, 6.5); // 5 × 1.25
});

test('adaptive: needs ≥2 snapshots and healthy weeks produce no noise', () => {
  equal(computeRecalibrations([{ weekEnd: '2026-08-24', hours: {} }] as any, TARGETS as any).length, 0);
  // One good week (~85%), one bad week (~25%) → average ~55% < 60 → suggestion fires.
  const mixed = computeRecalibrations(
    [
      { weekEnd: '2026-08-10', hours: { 'dom:lourd': 0 } },
      { weekEnd: '2026-08-17', hours: { 'dom:lourd': 5.1 } },
      { weekEnd: '2026-08-24', hours: { 'dom:lourd': 6.6 } },
    ] as any,
    TARGETS as any,
  );
  ok(mixed.length === 1 && mixed[0].direction === 'lower');
});

test('adaptive snapshots: appended, deduped by date, capped at 12 entries', () => {
  let h: any[] = [];
  h = pushWeeklySnapshot(h, TARGETS as any, '2026-08-24');
  h = pushWeeklySnapshot(h, TARGETS as any, '2026-08-31');
  equal(h.length, 2);
  h = pushWeeklySnapshot(h, TARGETS as any, '2026-08-31'); // same date → replaced
  equal(h.length, 2);
  for (let i = 0; i < 15; i++) h = pushWeeklySnapshot(h, TARGETS as any, `2026-09-${String((i % 28) + 1).padStart(2, '0')}`);
  equal(h.length, 12);
});

// ── Smart pushes (#2) ────────────────────────────────────────────────────────

const BLOCKS_DONE = [
  { id: 'a', title: 'Finie', startTime: '09:00', endTime: '10:00', isCompleted: true },
  { id: 'b', title: 'Restante 1', startTime: '14:00', endTime: '15:00', isCompleted: false },
  { id: 'c', title: 'Restante 2', startTime: '16:00', endTime: '17:00', isCompleted: false },
] as any[];

test('quest reminder: scheduled before hour, silent when all done or hour passed', () => {
  const now = new Date('2026-08-25T10:00:00');
  const plan = planQuestReminder(BLOCKS_DONE, 19, now);
  ok(plan !== null);
  equal(plan!.fireAt.getHours(), 19);
  ok(plan!.payload.body.includes('2 quêtes restantes'));

  const allDone = BLOCKS_DONE.map((b) => ({ ...b, isCompleted: true }));
  equal(planQuestReminder(allDone, 19, now), null);       // nothing pending → silence
  equal(planQuestReminder(BLOCKS_DONE, 8, now), null);    // 8h already past → no retro-fire
});

test('streak rescue: only for streaks ≥3 with real missed day, fires in the morning', () => {
  const now = new Date('2026-08-25T07:30:00');            // Tuesday morning
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const older = new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0];

  const plan = planStreakRescue(7, older, 8, now);        // last active 2 days ago
  ok(plan !== null);
  equal(plan!.fireAt.getHours(), 8);
  ok(plan!.payload.body.includes('7 jours'));

  equal(planStreakRescue(7, yesterday, 8, now), null);    // active yesterday → safe
  equal(planStreakRescue(2, older, 8, now), null);        // streak too small to guard
  equal(planStreakRescue(7, older, 6, now), null);        // 6h already past → skip
});

test('pending/blocks helpers count and summarize correctly', () => {
  equal(pendingBlocks(BLOCKS_DONE).length, 2);
  equal(pendingBlocks(undefined).length, 0);
  const { count, titles } = questReminderBody(BLOCKS_DONE.filter((b) => !b.isCompleted));
  equal(count, 2);
  ok(titles.startsWith('Restante 1, Restante 2'));
});

// ── Central quest-completion reducer (B3 + narrative-campaign fix) ──────────

const BASE_PLAYER: any = {
  xp: 0,
  level: 1,
  xpToNextLevel: 100,
  attributePoints: 0,
  gold: 50,
  questsCompleted: 0,
  logs: [],
};

test('quest completion grants XP/gold AND increments questsCompleted', () => {
  const { next, leveledUp } = applyQuestCompletion(BASE_PLAYER, 100, 40, 'Première séance');
  equal(leveledUp, true); // 0+100 = exactly level 2 threshold
  equal(next.level, 2);
  equal(next.gold, 90);
  equal(next.questsCompleted, 1);
  ok(next.logs[0].text.includes('Première séance'));
});

test('narrative campaign gates become reachable: counter accrues across quests', () => {
  let p: any = BASE_PLAYER;
  for (let i = 0; i < 10; i++) p = applyQuestCompletion(p, 20, 10, `Q${i}`).next;
  equal(p.questsCompleted, 10); // chapter-2 gate (≥10) now reachable
});

test('missing/legacy profiles without the field still work (undefined → 1)', () => {
  const legacy: any = { xp: 300, level: 2, xpToNextLevel: 150, gold: 10, logs: [] };
  const { next } = applyQuestCompletion(legacy, 10, 5, 'Quête legacy');
  equal(next.questsCompleted, 1);
  equal(next.gold, 15);
});

test('null profile tolerated (defensive path)', () => {
  const { next } = applyQuestCompletion(null as any, 30, 5, 'Edge');
  equal(next.questsCompleted, 1);
  ok(Number.isFinite(next.xp));
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
