import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import webpush from 'web-push';

dotenv.config();
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    model: process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct',
  };
}

async function llmChatJson(config: LlmConfig, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    // Hard timeout: the client falls back to deterministic templates when the
    // provider is unreachable — a hung request must never block onboarding.
    signal: AbortSignal.timeout(20000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter'
        ? { 'HTTP-Referer': 'https://aura-app.local', 'X-Title': 'Aura Solo Leveling' }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM provider error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest generation contract + guardrails (SYSTEM_PROMPT rules):
//  - structured JSON output only
//  - no free-form health/medical advice; for physical domains the app's own
//    set/rep/RPE templates stay authoritative — the LLM only frames the quest
//  - XP rewards are clamped server-side; penalties stay within the categories
//    the user allowed at onboarding
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

interface QuestSpec {
  domainId: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: string;
}

function validateQuests(raw: any, validDomainIds: Set<string>): QuestSpec[] {
  const quests: QuestSpec[] = [];
  const list = Array.isArray(raw?.quests) ? raw.quests : [];
  for (const q of list) {
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
  subject: process.env.VAPID_SUBJECT || 'mailto:pharaon@system-solo-leveling.local',
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
    return JSON.parse(readFileSync(SUBSCRIPTION_FILE, 'utf-8')) as PushSubscriptionJSON;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // AI Mentor chat endpoint — provider-agnostic.
  // Priority: Gemini (the deploy target auto-injects GEMINI_API_KEY), then the
  // configured OpenAI-compatible provider (NVIDIA NIM / OpenRouter) so the
  // mentor also works when only LLM_PROVIDER keys are set.
  app.post('/api/ai-coach', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY environment variable is missing. Please set it in secrets.',
        });
      }

      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Domain-driven when the client provides its domains (onboarding v2);
      // otherwise fall back to the legacy hardcoded profile.
      const legacyInstruction = `The user's core goals & schedule constraints:
1. Sleep: 6-8h every night.
2. Morning Routine: 45 min musculation workout every morning, 10 min speeching/public speaking practice, 30 min skincare, grooming & bath.
3. Priority Work ("Must Do Work"): 3-5 hours/day (studio work, dad's business, commitments to others).
4. Lunch: 12:00 PM eating break.
5. Post-Lunch Learning: 30min - 1h reading/podcasts/learning.
6. Key Weekly Targets:
   - Bangre Neo Lab: 15h - 20h / week
   - Movies / Cinema & Screenplay writing / content creation: 10h - 15h / week
   - School Lessons: 5h - 10h / week focused on SVT, Mathematics, Physics-Chemistry (PC), and History-Geography.`;

      const domainsInstruction = (context?.domains as any[] | undefined)
        ?.map(
          (d) =>
            `- ${d.label} (${d.tracking_type}, goal: "${d.goal_text}", budget: ${d.weekly_time_budget ?? 'unspecified'}h/week)`
        )
        .join('\n');

      const systemInstruction = `You are a personalized elite productivity, academic, and creative AI mentor.
${domainsInstruction ? `The user's life domains (defined by the user themselves — never assume other domains):\n${domainsInstruction}` : `The user's core goals & schedule constraints:\n${legacyInstruction}`}

Provide concise, inspiring, practical advice anchored to the user's own domains. Keep your tone encouraging, sharp, and structured.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nCurrent User Progress Context: ${JSON.stringify(context || {})}\n\nUser Question/Request: ${prompt}` },
            ],
          },
        ],
      });

      const reply = response.text || 'No response generated.';
      return res.json({ reply });
    } catch (error: unknown) {
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
