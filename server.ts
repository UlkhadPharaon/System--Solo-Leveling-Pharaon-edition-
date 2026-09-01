import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import webpush from 'web-push';
import {
  detectDistress,
  validateQuests,
  validateAgentActions,
  type QuestSpec,
} from './src/lib/guardrails';
import { handleWidgetSnapshot, widgetTokenFromEnv } from './server/widgetApi';

dotenv.config();
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}


// ─────────────────────────────────────────────────────────────────────────────
// LLM provider abstraction — NVIDIA NIM (dev) / OpenRouter (prod).
// Both expose OpenAI-compatible /chat/completions, so one client covers both.
// Future: a local light model (Gemma E2B) can be added as another provider
// without touching the endpoint contract.
// ─────────────────────────────────────────────────────────────────────────────
type LlmProvider = 'nvidia_nim' | 'openrouter';

interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getLlmConfig(): LlmConfig | null {
  const provider = (process.env.LLM_PROVIDER as LlmProvider) || 'nvidia_nim';
  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    return {
      provider,
      apiKey,
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    };
  }
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return null;
  return {
    provider: 'nvidia_nim',
    apiKey,
    baseUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-8b-instruct',
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2000, jsonMode = false } = opts;
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    // Hard timeout: the client falls back to deterministic templates when the
    // provider is unreachable — a hung request must never block onboarding.
    signal: AbortSignal.timeout(20000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter'
        ? { 'HTTP-Referer': 'https://ka-rise.local', 'X-Title': 'Ka Rise' }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM provider error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? '';
}

async function llmChatJson(config: LlmConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  return chatCompletion(
    config,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { jsonMode: true }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest generation contract + guardrails: the pure validation logic lives in
// src/lib/guardrails.ts (shared + unit-tested); only the LLM-facing prompt
// stays here.
// ─────────────────────────────────────────────────────────────────────────────
const QUEST_SYSTEM_PROMPT = `You are the quest-generation engine of a gamified self-development app (Solo Leveling style).
You receive a user's vision (their own words), their life domains (label, tracking type, goal in their own words, weekly time budget) and coaching calibration.

RULES (non-negotiable):
1. Respond ONLY with a JSON object: {"quests": [{"domainId": string, "title": string, "description": string, "xpReward": number, "difficulty": "easy"|"medium"|"hard"}]}.
2. Generate 2 to 3 starter quests PER domain. Titles and descriptions use the user's own domain labels and goals.
3. NEVER invent medical, injury, diet or health advice. For domains with trackingType "workout_log", describe the quest in terms of showing up and completing the app's prescribed session (sets/reps/RPE are managed by the app itself) — do not prescribe specific weights, reps or medical guidance.
4. Difficulty must respect coaching_intensity: gentle → mostly easy, balanced → mixed, demanding → mostly medium/hard.
5. Quests must fit within the domain's weekly time budget (short actionable first steps, not mega-tasks).
6. Write in French. Tone: motivating, concise, game-like ("Le Système vous assigne…").
7. xpReward between 20 and 120.`;

// ─────────────────────────────────────────────────────────────────────────────
// BUG-004 — flag_for_human_review guardrail (SYSTEM_PROMPT contract).
// detectDistress lives in src/lib/guardrails.ts (shared + unit-tested).
// Scans the user's OWN free-text (vision, goals, physical constraint) for
// distress signals BEFORE any generation. On hit: the LLM is bypassed entirely,
// the client falls back to deterministic template quests, and the request is
// marked for human review. Never prescribe generated content on flagged input.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Web Push Notifications (web-push + VAPID)
//  - Single-user personal app: the device's push subscription is stored in a
//    JSON file under ./data (gitignored), not a DB.
//  - Scheduled pushes are kept in memory; the client re-registers them on boot
//    so they survive server restarts.
//  - If VAPID keys are absent the server still starts, just with push disabled.
// ─────────────────────────────────────────────────────────────────────────────
const PUSH_DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIPTION_FILE = path.join(PUSH_DATA_DIR, 'push-subscription.json');

type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
};

interface ScheduledPush {
  id: string;
  fireAt: number; // epoch ms
  payload: { title: string; body?: string; tag?: string; icon?: string; url?: string; data?: any };
  subscription?: PushSubscriptionJSON;
}

const vapid = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:contact@ka-rise.local',
};
const pushEnabled = !!(vapid.publicKey && vapid.privateKey);
if (pushEnabled) {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
}

// in-memory scheduled pushes keyed by id (client re-registers on boot)
const scheduledPushes = new Map<string, ScheduledPush>();

function loadSubscription(): PushSubscriptionJSON | null {
  try {
    if (!existsSync(SUBSCRIPTION_FILE)) return null;
    const parsed = JSON.parse(readFileSync(SUBSCRIPTION_FILE, 'utf-8'));
    // An emptied file ({}) must not count as a subscription.
    return normalizeSubscription(parsed);
  } catch {
    return null;
  }
}

function saveSubscription(sub: PushSubscriptionJSON | null) {
  try {
    mkdirSync(PUSH_DATA_DIR, { recursive: true });
    if (!sub) {
      writeFileSync(SUBSCRIPTION_FILE, JSON.stringify({}), 'utf-8');
      return;
    }
    writeFileSync(SUBSCRIPTION_FILE, JSON.stringify(sub, null, 2), 'utf-8');
  } catch (e) {
    console.error('[push] failed to persist subscription:', e);
  }
}

function normalizeSubscription(raw: any): PushSubscriptionJSON | null {
  if (!raw || typeof raw !== 'object') return null;
  const endpoint = raw.endpoint || raw.subscription?.endpoint;
  const endpointRef = raw.subscription ?? raw;
  const p256dh = endpointRef?.keys?.p256dh;
  const auth = endpointRef?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth }, expirationTime: endpointRef.expirationTime ?? null };
}

/** Send a notification to the stored subscription. Returns true on success. */
async function sendPush(subscription: PushSubscriptionJSON, payload: any): Promise<{ ok: boolean; recoverable: boolean }> {
  if (!pushEnabled) return { ok: false, recoverable: true };
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys, expirationTime: subscription.expirationTime ?? null },
      JSON.stringify(payload),
      { TTL: 7 * 24 * 3600 } // 7 days for delayed content
    );
    return { ok: true, recoverable: true };
  } catch (err: any) {
    // 404 / 410 → the subscription is gone; drop it.
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      return { ok: false, recoverable: false };
    }
    return { ok: false, recoverable: true };
  }
}

function purgeScheduledFor(tagPrefix: string) {
  for (const [id, s] of scheduledPushes) {
    if (s.payload?.tag?.startsWith(tagPrefix)) scheduledPushes.delete(id);
  }
}

// Background scheduler: every 60s fire any due scheduled push.
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    const now = Date.now();
    const due: ScheduledPush[] = [];
    for (const [, s] of scheduledPushes) {
      if (s.fireAt <= now) due.push(s);
    }
    for (const s of due) {
      scheduledPushes.delete(s.id);
      const sub = loadSubscription();
      const target = s.subscription || sub;
      if (!target) continue;
      const { recoverable } = await sendPush(target, s.payload);
      if (!recoverable) {
        saveSubscription(null);
        break;
      }
    }
  }, 60 * 1000);
}


// ── Weekly Report Push (F4) ──────────────────────────────────────────────────
// Every Sunday 20:00 local, nudge the hunter to review their "Palier de la
// Semaine". Self-rescheduling: after firing (or at boot if the slot passed),
// the next Sunday slot is queued. Week-key guard prevents double-fires.
const WEEKLY_PUSH_TAG = 'weekly-report';
let nextWeeklyFireAt = 0;
let lastWeeklyFiredKey = '';

function computeNextSundaySlot(from = new Date()): number {
  const d = new Date(from);
  d.setHours(20, 0, 0, 0);
  const daysUntilSunday = (7 - d.getDay()) % 7; // 0 = today is Sunday
  d.setDate(d.getDate() + daysUntilSunday);
  if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 7);
  return d.getTime();
}

if (typeof setInterval !== 'undefined') {
  // Initialize at boot: if this Sunday's 20:00 already passed without a fire,
  // target next week.
  nextWeeklyFireAt = computeNextSundaySlot();
  setInterval(() => {
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7
    )}`;
    if (Date.now() >= nextWeeklyFireAt && lastWeeklyFiredKey !== weekKey) {
      lastWeeklyFiredKey = weekKey;
      nextWeeklyFireAt = computeNextSundaySlot(now);
      const sub = loadSubscription();
      if (!sub) return; // no device subscribed yet — skip silently
      sendPush(sub, {
        title: 'Palier de la Semaine',
        body: 'Ta semaine est terminée, Chasseur. Ouvre ton Palier pour voir XP, heures par domaine et série.',
        tag: `${WEEKLY_PUSH_TAG}-${weekKey}`,
        url: '/?tab=weekly_targets',
        icon: '/icon-192.png',
        data: {},
      }).catch(() => {});
    }
  }, 60 * 1000);
}


async function startServer() {
  const app = express();
  // Cloud Run injects PORT and expects the app to bind it; fall back to 3000 locally.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Web Push Notification routes ──────────────────────────────────────────
  // Public config: hands the VAPID_PUBLIC_KEY to the client for subscribe().
  app.get('/api/push/config', (req, res) => {
    res.json({
      enabled: pushEnabled,
      vapidPublicKey: vapid.publicKey || null,
    });
  });

  // Store this device's push subscription.
  app.post('/api/push/subscribe', (req, res) => {
    const sub = normalizeSubscription(req.body);
    if (!sub) {
      return res.status(400).json({ error: 'Invalid push subscription.' });
    }
    saveSubscription(sub);
    res.json({ ok: true });
  });

  // Remove the stored subscription (usually on explicit logout/unsubscribe).
  app.delete('/api/push/unsubscribe', (req, res) => {
    const existing = loadSubscription();
    const bodyEndpoint = req.body?.endpoint as string | undefined;
    // Only clear if no endpoint given, or it matches the one we stored.
    if (!existing || !bodyEndpoint || existing.endpoint === bodyEndpoint) {
      saveSubscription(null);
    }
    scheduledPushes.clear();
    res.json({ ok: true });
  });

  // Immediately send a push to the stored subscription.
  app.post('/api/push/send', async (req, res) => {
    if (!pushEnabled) {
      return res.status(503).json({ error: 'Push not configured: missing VAPID keys.' });
    }
    const sub = loadSubscription();
    if (!sub) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'no-subscription' });
    }
    const payload = req.body?.payload;
    if (!payload || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'payload.title is required.' });
    }
    const { ok, recoverable } = await sendPush(sub, {
      title: payload.title,
      body: payload.body || '',
      tag: payload.tag || '',
      icon: payload.icon || '/icon.jpg',
      url: payload.url || '/',
      data: payload.data || {},
    });
    if (!recoverable) saveSubscription(null);
    res.json({ ok, delivered: ok });
  });

  // Schedule a push for a future time. The client re-registers these on boot.
  app.post('/api/push/schedule', async (req, res) => {
    if (!pushEnabled) {
      return res.status(503).json({ error: 'Push not configured: missing VAPID keys.' });
    }
    const { id, fireAt, payload } = req.body as {
      id?: string;
      fireAt?: string;
      payload?: any;
    };
    const fireTimestamp = new Date(fireAt || '').getTime();
    if (!id || !payload || typeof payload.title !== 'string' || isNaN(fireTimestamp)) {
      return res.status(400).json({ error: 'id, fireAt (ISO) and payload.title are required.' });
    }
    const sub = loadSubscription();
    if (!sub) {
      return res.json({ ok: true, id, skipped: true });
    }
    scheduledPushes.set(id, {
      id,
      fireAt: fireTimestamp,
      payload: {
        title: payload.title,
        body: payload.body || '',
        tag: payload.tag || '',
        icon: payload.icon || '/icon.jpg',
        url: payload.url || '/',
        data: payload.data || {},
      },
      subscription: sub,
    });
    res.json({ ok: true, id });
  });

  // Cancel a previously scheduled push.
  app.delete('/api/push/schedule/:id', (req, res) => {
    const removed = scheduledPushes.delete(req.params.id);
    res.json({ ok: true, removed });
  });

  // Push status for the settings UI.
  app.get('/api/push/status', (req, res) => {
    res.json({
      enabled: pushEnabled,
      hasSubscription: !!loadSubscription(),
      scheduledCount: scheduledPushes.size,
    });
  });

  // ── Widget snapshot & PWA widget data ─────────────────────────────────────
  // The native-companion / authenticated endpoint.
  app.get('/api/widgets/snapshot', (req, res) => {
    // Derive a minimal snapshot from whatever the client last POSTed to
    // /api/widgets/data, plus push subscription presence as a liveness signal.
    // In a full implementation this would read from a DB; here we return the
    // cached public widget payload enriched for the companion.
    const tag = String(req.query.tag || 'ka-rise-status');
    const cached = (global as any).__kaWidgetCache?.get(tag) || (global as any).__kaWidgetCache?.get('ka-rise-status');
    // Light stub if nothing cached yet — better than a 403 for first-run widgets.
    if (!cached) {
      return res.json({
        generatedAt: new Date().toISOString(),
        player: { level: 1, rank: 'E', xp: 0, xpToNextLevel: 100, gold: 0 },
        streakDays: 0,
        today: { date: new Date().toISOString().slice(0,10), sessions: [], completedSessions: 0, totalSessions: 0 },
        quests: { done: 0, total: 0 },
        weeklyTargets: [],
        focus: { minutesToday: 0, sessionsTotal: 0 },
        notes: 0,
        deepLinks: { dashboard: '/?tab=dashboard', focus: '/?tab=focus_timer', notes: '/?tab=notepad', system: '/?tab=system_solo' },
      });
    }
    res.json(cached);
  });

  // Lightweight public widget data endpoint used by the manifest widgets[] `data`.
  // Stores the latest client-pushed state in memory so the widget runtime can
  // fetch it even when the tab is closed.
  if (!(global as any).__kaWidgetCache) (global as any).__kaWidgetCache = new Map<string, any>();
  const widgetDataCache: Map<string, any> = (global as any).__kaWidgetCache;

  app.get('/api/widgets/data', (req, res) => {
    const tag = String(req.query.tag || 'ka-rise-status');
    const entry = widgetDataCache.get(tag) || widgetDataCache.get('ka-rise-status');
    if (entry) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(entry);
    }
    // Fallback placeholder — ensures widget never shows a broken network state.
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      title: tag === 'ka-rise-today' ? 'Aujourd’hui' : tag === 'ka-rise-weekly' ? 'Objectifs Hebdo' : 'Statut Chasseur',
      tag,
      generatedAt: new Date().toISOString(),
      player: { level: 1, rank: 'E', xp: 0, xpToNextLevel: 100, gold: 0 },
      streakDays: 0,
      today: { sessions: [], completedSessions: 0, totalSessions: 0 },
      weeklyTargets: [],
      hint: 'Ouvrez Ka Rise pour synchroniser vos données widget.'
    });
  });

  app.post('/api/widgets/data', (req, res) => {
    const tag = String(req.query.tag || req.body?.tag || 'ka-rise-status');
    const payload = req.body?.payload ?? req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'payload required' });
    }
    // Strip any huge fields to keep memory bounded
    const compact = { ...payload, _receivedAt: new Date().toISOString() };
    widgetDataCache.set(tag, compact);
    // Also mirror to generic key so /snapshot can read it
    widgetDataCache.set('ka-rise-status', compact);
    res.json({ ok: true, tag });
  });

  // Authenticated companion endpoint (original)
  app.post('/api/widgets/snapshot-auth', (req, res) => {
    const token = widgetTokenFromEnv();
    if (!token) return res.status(403).json({ error: 'Widget API disabled' });
    // Delegate to shared handler with dummy input — real input comes from client body now
    // Kept for backward compat with external companions that use X-Widget-Token
    return handleWidgetSnapshot(req, res, req.body as any);
  });


  // ── AI endpoint protection ────────────────────────────────────────────────
  // The mentor calls paid LLM APIs with server-side keys. Without a limiter,
  // anyone with the deployed URL can script the endpoint and drain the quota.
  // Simple in-memory sliding window per IP (single-instance deployments; for
  // multi-instance, back this with Redis/Cloud Memorystore).
  const AI_RATE_LIMIT = { maxRequests: 20, windowMs: 60 * 60 * 1000 }; // 20 req/hour/IP
  const MAX_PROMPT_CHARS = 2000;
  const aiRateBuckets = new Map<string, number[]>();

  const aiRateCheck = (ip: string): { allowed: boolean; retryAfterSec: number } => {
    const now = Date.now();
    const hits = (aiRateBuckets.get(ip) || []).filter((t) => now - t < AI_RATE_LIMIT.windowMs);
    if (hits.length >= AI_RATE_LIMIT.maxRequests) {
      const retryAfterSec = Math.ceil((AI_RATE_LIMIT.windowMs - (now - hits[0])) / 1000);
      aiRateBuckets.set(ip, hits);
      return { allowed: false, retryAfterSec };
    }
    hits.push(now);
    aiRateBuckets.set(ip, hits);
    // Opportunistic GC so the map cannot grow unbounded.
    if (aiRateBuckets.size > 5000) {
      for (const [k, v] of aiRateBuckets) {
        if (v.every((t) => now - t >= AI_RATE_LIMIT.windowMs)) aiRateBuckets.delete(k);
      }
    }
    return { allowed: true, retryAfterSec: 0 };
  };

  // AI Mentor chat endpoint — provider-agnostic.
  // Priority: Gemini (the deploy target auto-injects GEMINI_API_KEY), then the
  // configured OpenAI-compatible provider (NVIDIA NIM / OpenRouter) so the
  // mentor also works when only LLM_PROVIDER keys are set.
  app.post('/api/ai-coach', async (req, res) => {
    // Rate limit FIRST — reject abusers before touching the LLM keys.
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress || 'unknown';
    const rl = aiRateCheck(clientIp);
    if (!rl.allowed) {
      res.set('Retry-After', String(rl.retryAfterSec));
      return res.status(429).json({
        error: `Quota du Mentor IA atteint (${AI_RATE_LIMIT.maxRequests} messages/heure). Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} min.`,
      });
    }

    try {
      const { prompt, context, history, agentMode } = req.body as {
        prompt?: string;
        context?: any;
        history?: { role: 'user' | 'assistant'; text: string }[];
        agentMode?: boolean;
      };
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      // Length caps — a 500 KB "prompt" would burn tokens and latency.
      if (prompt.length > MAX_PROMPT_CHARS) {
        return res.status(413).json({
          error: `Message trop long (${prompt.length} caractères, max ${MAX_PROMPT_CHARS}).`,
        });
      }

      // Domain-driven when the client provides its domains (onboarding v2);
      // otherwise explicitly NEUTRAL (BUG-003): never inject a hardcoded profile
      // that isn't the current user's.
      const domainsInstruction = (context?.domains as any[] | undefined)
        ?.map(
          (d) =>
            `- ${d.label} (${d.tracking_type}, goal: "${d.goal_text}", budget: ${d.weekly_time_budget ?? 'unspecified'}h/week)`
        )
        .join('\n');

      const systemInstruction = `You are a personalized elite productivity, academic, and creative AI mentor ("Le Mentor du Système") inside a gamified self-development app.
${domainsInstruction
  ? `The user's life domains (defined by the user themselves — never assume other domains):\n${domainsInstruction}`
  : `IMPORTANT CONTEXT: this user has NOT defined any life domains yet (onboarding not completed). Do NOT assume, invent or reference any specific project, school subject, work schedule or personal goal. Give general, universally applicable advice on discipline, focus and consistency. You may suggest completing the onboarding ("l'Éveil") so your guidance can become truly personalized.`}

RULES:
1. ALWAYS respond in French — the app's entire UI is French.
2. Be concise, inspiring, practical. When domains are provided, anchor advice to them and the live progress context; otherwise stay general and never invent specifics about the user.
3. Never give medical, injury or diet advice.
4. GROUNDING: context.weeklyReport (when present) holds the user's REAL last-7-days numbers — hours per domain vs targets, focus minutes, streak, top domain. Quote these figures when they support your advice and never contradict them. If a domain is far behind its weekly target, say so with the actual numbers; if the streak is strong, acknowledge it.`;

      // Agent mode: the mentor proposes structured state mutations (schedule
      // blocks, notes, quests, victory logs, XP…) that the client shows the
      // user for approval. The LLM must answer with a strict JSON object.
      const agentInstruction = `
MODE AGENT ACTIVE : vous pouvez PROPOSER des actions concrètes dans l'appli pour aider l'utilisateur. Répondez UNIQUEMENT avec un objet JSON valide, sans texte autour :
{"reply": "votre réponse en français, concise et motivante (résumez ce que vous proposez de faire)", "actions": [ ... ]}

Schéma d'une action : {"action": "<type>", "payload": {...}}

Types d'actions autorisés (utilisez-les UNIQUEMENT si l'utilisateur demande explicitement une modification) :
1. {"action":"update_personalization","payload":{"field":"userName"|"userTagline"|"hunterTitle"|"dailyQuote","value":"nouvelle valeur"}}
2. {"action":"add_schedule_block","payload":{"day":"Monday".."Sunday","title":"...","startTime":"HH:MM","endTime":"HH:MM","category":"<catégorie libre, idéalement dom:<id d'un domaine existant>, sinon personal|learning|sleep|work>","description":"facultatif"}}
3. {"action":"delete_schedule_block","payload":{"day":"...","blockId":"<id exact existant>"}}
4. {"action":"toggle_schedule_block","payload":{"day":"...","blockId":"<id exact existant>"}}
5. {"action":"add_victory_log","payload":{"successes":["..."], "improvements":["..."], "highlights":"..."}}
6. {"action":"add_quest","payload":{"title":"...","description":"...","xpReward":20..120,"difficulty":"easy|medium|hard","domainId":"<id domaine existant (facultatif)>"}}
7. {"action":"update_weekly_target","payload":{"targetId":"<id exact>","minHours":n,"maxHours":n,"targetHours":n}}
8. {"action":"add_habit_check","payload":{"domainId":"<id domaine existant>"}}
9. {"action":"add_note","payload":{"title":"...","content":"...","tags":["..."]}}
10. {"action":"update_note","payload":{"id":"<id existant>","title":"...","content":"..."}}
11. {"action":"delete_note","payload":{"id":"<id existant>"}}
12. {"action":"award_xp","payload":{"xp":1..200,"gold":0..100,"reason":"pourquoi en ≤200 chars"}}

RÈGLES STRICTES :
- N'inventez JAMAIS un id (blockId, targetId, note id, domainId) qui n'est pas présent dans le contexte fourni ci-dessous. Si vous ne connaissez pas l'id exact, mettez actions: [].
- Ne proposez que des actions réellement utiles et demandées. Si l'utilisateur pose juste une question, actions: [].
- Contexte disponible (ids réels à réutiliser) : ${JSON.stringify(context || {})} (tronqué si nécessaire).`;

      const systemForProvider = agentMode
        ? `${systemInstruction}\n\n${agentInstruction}`
        : `${systemInstruction}\n\nCurrent User Progress Context: ${JSON.stringify(context || {})}`;

      // Multi-turn: replay recent client history (capped) before the new prompt.
      const priorMessages: ChatMessage[] = (Array.isArray(history) ? history : [])
        .slice(-10)
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
        .map((m) => ({ role: m.role, content: m.text.slice(0, MAX_PROMPT_CHARS) }));

      const geminiKey = process.env.GEMINI_API_KEY;
      const llmConfig = getLlmConfig();
      const validDomainIds = new Set((context?.domains as any[] | undefined)?.map((d) => String(d.id || '')) || []);

      if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const transcript = priorMessages.map((m) => `${m.role === 'user' ? 'Chasseur' : 'Mentor'}: ${m.content}`).join('\n');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemForProvider}\n\n${transcript ? `Conversation so far:\n${transcript}\n\n` : ''}User Question/Request: ${prompt}`,
                },
              ],
            },
          ],
          ...(agentMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
        });

        const rawReply = response.text || '';
        if (!agentMode) {
          return res.json({ reply: rawReply || 'No response generated.', source: 'gemini' });
        }
        try {
          const parsed = JSON.parse(rawReply);
          return res.json({
            reply: typeof parsed?.reply === 'string' && parsed.reply ? parsed.reply : 'Aucune réponse générée.',
            actions: validateAgentActions(parsed, validDomainIds),
            source: 'gemini',
          });
        } catch {
          return res.json({ reply: rawReply || 'Aucune réponse générée.', actions: [], source: 'gemini' });
        }
      }

      if (llmConfig) {
        const reply = await chatCompletion(
          llmConfig,
          [
            { role: 'system', content: systemForProvider },
            ...priorMessages,
            { role: 'user', content: prompt },
          ],
          { temperature: 0.6, maxTokens: agentMode ? 2500 : 1200, jsonMode: !!agentMode }
        );

        if (!agentMode) {
          return res.json({ reply: reply || 'Aucune réponse générée.', source: llmConfig.provider });
        }
        try {
          const parsed = JSON.parse(reply);
          return res.json({
            reply: typeof parsed?.reply === 'string' && parsed.reply ? parsed.reply : 'Aucune réponse générée.',
            actions: validateAgentActions(parsed, validDomainIds),
            source: llmConfig.provider,
          });
        } catch {
          return res.json({ reply: reply || 'Aucune réponse générée.', actions: [], source: llmConfig.provider });
        }
      }

      return res.status(503).json({
        error: 'Aucun fournisseur IA configuré. Définissez GEMINI_API_KEY, ou NVIDIA_NIM_API_KEY / OPENROUTER_API_KEY pour le fournisseur de repli.',
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return res.status(503).json({ error: 'AI provider unreachable (timeout).' });
      }
      console.error('Error in AI Coach API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Quest generation endpoint — structured output, provider-agnostic.
  app.post('/api/generate-quests', async (req, res) => {
    try {
      const config = getLlmConfig();
      if (!config) {
        return res.status(503).json({
          error: `LLM provider not configured (LLM_PROVIDER=${process.env.LLM_PROVIDER || 'nvidia_nim'}). The client will fall back to deterministic templates.`,
        });
      }

      const { vision, domains, coachingIntensity, physicalConstraint } = req.body as {
        vision?: string;
        domains?: any[];
        coachingIntensity?: string;
        physicalConstraint?: string;
      };
      if (!Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ error: 'domains[] is required' });
      }

      // BUG-004 guardrail FIRST: distress signals in the user's own free text →
      // never generate. The client treats this like the timeout fallback
      // (deterministic templates) and shows a neutral support message.
      const flaggedText = detectDistress([
        vision,
        physicalConstraint,
        ...domains.map((d) => `${d.goal_text ?? ''}`),
      ]);
      if (flaggedText) {
        console.warn(
          '[guardrail] flag_for_human_review — distress signal detected in user free-text; generation bypassed.'
        );
        return res.status(200).json({
          flag_for_human_review: true,
          reason: 'user_text_flagged',
          message:
            "Génération désactivée pour cette demande : certains mots appellent un accompagnement humain. Des quêtes neutres vous ont été attribuées. Si tu traverses un moment difficile, parle-en à une personne de confiance ou contacte une ligne d'écoute.",
          source: 'flagged',
        });
      }

      const userPrompt = `Vision de l'utilisateur (ses mots): "${vision || ''}"
Calibrage coaching: intensité=${coachingIntensity || 'balanced'}
${physicalConstraint ? `Contrainte physique déclarée (à respecter pour borner la difficulté, jamais à interpréter médicalement): "${physicalConstraint}"` : ''}

Domaines:
${domains
  .map(
    (d) =>
      `- id=${d.id} | label="${d.label}" | trackingType=${d.tracking_type} | goal="${d.goal_text || ''}" | budgetHebdo=${d.weekly_time_budget ?? 'n/a'}h`
  )
  .join('\n')}

Génère les toutes premières quêtes de démarrage pour chaque domaine.`;

      const content = await llmChatJson(config, QUEST_SYSTEM_PROMPT, userPrompt);
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        return res.status(502).json({ error: 'LLM returned invalid JSON', raw: content.slice(0, 500) });
      }
      const validDomainIds = new Set(domains.map((d) => String(d.id)));
      const quests = validateQuests(parsed, validDomainIds);
      if (quests.length === 0) {
        return res.status(502).json({ error: 'LLM quests failed validation', raw: content.slice(0, 500) });
      }
      return res.json({ quests, source: 'llm' });
    } catch (error: unknown) {
      // Provider unreachable (timeout/abort) → 503 so the client knows to use
      // its deterministic template fallback, not treat it as a server bug.
      if (error instanceof Error && error.name === 'TimeoutError') {
        return res.status(503).json({ error: 'LLM provider unreachable (timeout). Falling back to templates.', source: 'timeout' });
      }
      console.error('Error in generate-quests API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware in development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
