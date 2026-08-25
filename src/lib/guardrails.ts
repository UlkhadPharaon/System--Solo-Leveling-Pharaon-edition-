/**
 * Pure guardrail & validation primitives shared by the Express server and
 * (potentially) client code. Extracted verbatim from server.ts so the test
 * suite can exercise the exact production logic without booting HTTP or LLM
 * machinery (QUALITY_AUDIT B2).
 *
 * Constraints honored:
 * - ZERO imports: server.ts is bundled standalone by esbuild and intentionally
 *   does not pull in src/types.ts — this module keeps that property.
 * - No DOM / no Node APIs: runs identically under tsx, node and browsers.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BUG-004 — flag_for_human_review guardrail (SYSTEM_PROMPT contract).
// Scans the user's OWN free-text (vision, goals, physical constraint) for
// distress signals BEFORE any generation. On hit: the LLM is bypassed entirely,
// the client falls back to deterministic template quests, and the request is
// marked for human review. Never prescribe generated content on flagged input.
// ─────────────────────────────────────────────────────────────────────────────
const DISTRESS_PATTERN = new RegExp(
  [
    '\\bsuicide\\b',
    '\\bsuicider\\b',
    '\\bsuicidal\\b',
    '\\bautomutilation\\b',
    '\\bautomutiler\\b',
    '\\bself[\\s-]?harm(?:ing)?\\b',
    '\\bje\\s+veux\\s+mourir\\b',
    '\\bplus\\s+envie\\s+de\\s+vivre\\b',
    '\\bdépression\\b',
    '\\bdepression\\b',
    '\\bdépressif\\b',
    '\\bdépressive\\b',
    '\\bdepressed\\b',
    '\\bdésespéré\\b',
    '\\bdésespérée\\b',
    '\\bdésespoir\\b',
    '\\boverdose\\b',
  ].join('|'),
  'i'
);

export function detectDistress(texts: (string | undefined | null)[]): string | null {
  for (const t of texts) {
    if (typeof t === 'string' && DISTRESS_PATTERN.test(t)) {
      return t.slice(0, 160);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest generation contract + guardrails (SYSTEM_PROMPT rules):
//  - structured JSON output only
//  - XP rewards clamped server-side (20..120), difficulty whitelisted,
//    domainIds validated against the user's real domains
// ─────────────────────────────────────────────────────────────────────────────
export interface QuestSpec {
  domainId: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: string;
}

export function validateQuests(raw: unknown, validDomainIds: Set<string>): QuestSpec[] {
  const quests: QuestSpec[] = [];
  const rawRec = raw as { quests?: unknown } | null | undefined;
  const list = Array.isArray(rawRec?.quests) ? rawRec!.quests : [];
  for (const q of list as any[]) {
    if (!q || typeof q.domainId !== 'string' || !validDomainIds.has(q.domainId)) continue;
    const xp = Math.min(120, Math.max(20, Math.round(Number(q.xpReward) || 40)));
    const difficulty = ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium';
    quests.push({
      domainId: q.domainId,
      title: String(q.title || 'Quête').slice(0, 120),
      description: String(q.description || '').slice(0, 600),
      xpReward: xp,
      difficulty,
    });
  }
  return quests;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Mentor "agent" actions — structured mutations the LLM proposes and the
// client turns into real state changes (after user confirmation). Mirror of the
// validateQuests pipeline: whitelist the action type, coerce/clamp every field,
// drop anything that fails. Bad output must never crash the client.
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentAction {
  action: string;
  payload: any;
}

const AGENT_ACTION_TYPES = new Set([
  'update_personalization',
  'add_schedule_block',
  'delete_schedule_block',
  'toggle_schedule_block',
  'add_victory_log',
  'add_quest',
  'update_weekly_target',
  'add_habit_check',
  'add_note',
  'update_note',
  'delete_note',
  'award_xp',
]);

const DAYS_OF_WEEK = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Clamp hours to 0..168 and round to 0.5 steps (sane weekly budgets). */
function clampHours(n: number): number {
  const val = Math.max(0, Math.min(168, Math.round(Number(n) * 2) / 2));
  return val;
}

function sliceStr(v: any, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function noBadChars(s: string): boolean {
  // Allow letters (incl. accents), digits, spaces, and common punctuation —
  // reject anything dangerous like <script> or control chars.
  return !/[<>{}\\]/u.test(s);
}

export function validateAgentActions(raw: unknown, validDomainIds: Set<string>): AgentAction[] {
  if (!raw || !Array.isArray((raw as any).actions)) return [];
  const out: AgentAction[] = [];

  for (const a of (raw as any).actions) {
    if (!a || typeof a !== 'object') continue;
    const type = a.action;
    if (typeof type !== 'string' || !AGENT_ACTION_TYPES.has(type)) continue;
    const p = a.payload && typeof a.payload === 'object' ? a.payload : {};

    switch (type) {
      case 'update_personalization': {
        const field = p.field;
        const value = sliceStr(p.value, 80);
        if (!['userName', 'userTagline', 'hunterTitle', 'dailyQuote'].includes(field) || !value || !noBadChars(value)) continue;
        out.push({ action: type, payload: { field, value } });
        break;
      }
      case 'add_schedule_block': {
        const day = p.day;
        const startTime = sliceStr(p.startTime, 5);
        const endTime = sliceStr(p.endTime, 5);
        const category = sliceStr(p.category, 60);
        const title = sliceStr(p.title, 90);
        if (!DAYS_OF_WEEK.has(day) || !TIME_RE.test(startTime) || !TIME_RE.test(endTime) || !title || !noBadChars(title)) continue;
        // Category is either a fixed value or `dom:<id>` — accept both.
        out.push({
          action: type,
          payload: {
            day,
            title,
            startTime,
            endTime,
            category,
            description: sliceStr(p.description, 300),
          },
        });
        break;
      }
      case 'delete_schedule_block':
      case 'toggle_schedule_block': {
        const day = p.day;
        const blockId = sliceStr(p.blockId, 80);
        if (!DAYS_OF_WEEK.has(day) || !blockId) continue;
        out.push({ action: type, payload: { day, blockId } });
        break;
      }
      case 'add_victory_log': {
        const successes = Array.isArray(p.successes) ? p.successes.map((s: any) => sliceStr(s, 200)).filter(Boolean) : [];
        const improvements = Array.isArray(p.improvements) ? p.improvements.map((s: any) => sliceStr(s, 200)).filter(Boolean) : [];
        if (successes.length === 0) continue;
        out.push({ action: type, payload: { successes, improvements, highlights: sliceStr(p.highlights, 300) } });
        break;
      }
      case 'add_quest': {
        const title = sliceStr(p.title, 120);
        const description = sliceStr(p.description, 600);
        const xpReward = Math.min(120, Math.max(5, Math.round(Number(p.xpReward) || 20)));
        const difficulty = ['easy', 'medium', 'hard'].includes(p.difficulty) ? p.difficulty : 'medium';
        const domainId = typeof p.domainId === 'string' && validDomainIds.has(p.domainId) ? p.domainId : undefined;
        if (!title || !noBadChars(title)) continue;
        out.push({ action: type, payload: { title, description, xpReward, difficulty, domainId } });
        break;
      }
      case 'update_weekly_target': {
        const targetId = sliceStr(p.targetId, 80);
        if (!targetId) continue;
        const payload: any = { targetId };
        if (typeof p.minHours === 'number' && isFinite(p.minHours)) payload.minHours = clampHours(p.minHours);
        if (typeof p.maxHours === 'number' && isFinite(p.maxHours)) payload.maxHours = clampHours(p.maxHours);
        if (typeof p.targetHours === 'number' && isFinite(p.targetHours)) payload.targetHours = clampHours(p.targetHours);
        out.push({ action: type, payload });
        break;
      }
      case 'add_habit_check': {
        const domainId = sliceStr(p.domainId, 80);
        if (!validDomainIds.has(domainId)) continue;
        out.push({ action: type, payload: { domainId } });
        break;
      }
      case 'add_note':
      case 'update_note':
      case 'delete_note': {
        const id = sliceStr(p.id, 80);
        const title = sliceStr(p.title, 120);
        const content = sliceStr(p.content, 2000);
        const tags = Array.isArray(p.tags) ? p.tags.map((t: any) => sliceStr(t, 40)).filter(Boolean).slice(0, 10) : [];
        if (type === 'delete_note' || type === 'update_note') {
          if (!id) continue;
          out.push({ action: type, payload: { id, title, content, tags } });
        } else {
          if (!title || !content) continue;
          out.push({ action: type, payload: { id: id || undefined, title, content, tags } });
        }
        break;
      }
      case 'award_xp': {
        const xp = Math.min(200, Math.max(1, Math.round(Number(p.xp) || 10)));
        const gold = Math.max(0, Math.round(Number(p.gold) || 0));
        const reason = sliceStr(p.reason, 200);
        if (!reason || !noBadChars(reason)) continue;
        out.push({ action: type, payload: { xp, gold, reason } });
        break;
      }
      default:
        break;
    }
  }
  return out;
}
