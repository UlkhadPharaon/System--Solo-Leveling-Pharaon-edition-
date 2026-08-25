/**
 * Unit tests for the pure critical paths (QUALITY_AUDIT B2).
 *
 * Scope: XP/rank progression, reward tables, domain weights, quest templates,
 * and the server guardrails (distress detection, LLM output validators).
 * Everything tested here is pure logic extracted from production paths —
 * no HTTP, no LLM, no localStorage required.
 *
 * Run: npm test  (node --experimental-strip-types)
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
  // 250 = 100 (lvl2) + 150 (lvl3) → remainder 0
  equal(r.xp, 0);
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
  equal(r.level, 1); // negative level → floor 1
  equal(r.xp, 0);     // NaN xp/gain → 0
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
  deepStrictEqual(blockReward(0), { xp: 20, gold: 10 }); // floors
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
  equal(out[1].difficulty, 'medium'); // default when absent
  equal(out[2].xpReward, 40);         // Number() NaN → default 40
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
      { action: 'award_xp', payload: { xp: 10, gold: 0 } },                       // no reason
      { action: 'award_xp', payload: { xp: 10, gold: 0, reason: '<script>x</script>' } }, // bad chars
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
      { action: 'delete_note', payload: { title: 'pas d id' } },
      { action: 'delete_note', payload: { id: 'n_1' } },
      { action: 'add_note', payload: { title: 'Tags', content: 'c', tags: Array.from({ length: 30 }, (_, i) => `t${i}`) } },
    ] },
    DOMAINS
  );
  equal(out.length, 3);
  equal((out[2].payload as any).tags.length, 10); // capped at 10
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

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
