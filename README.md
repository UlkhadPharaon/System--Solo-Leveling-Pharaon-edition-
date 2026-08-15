# ⚔️ Solo Leveling Self-Dev System — Pharaoh Edition

> *"Only I level up."* — A gamified self-development app inspired by Solo Leveling, built for disciplined growth across fitness, learning, creative work, and life management.

---

## ✨ Features

| System | Description |
|--------|-------------|
| **🏋️ Workout Engine** | Ulkhad's 10-month progressive program, RPE-based autoregulation, PR tracking, body metrics |
| **📚 Study & Skills** | Subject goals, spaced-repetition scheduling, focus sessions with Pomodoro timer |
| **🎨 Projects & Creative** | Phase-gated project tracking (Cinema, Bangre Neo Lab, etc.), weekly time budgets |
| **💰 Budget & Finance** | Envelope budgeting, savings goals, transaction logging, cash-flow visualization |
| **🗡️ Dungeons & Quests** | LLM-generated daily quests (NVIDIA NIM / OpenRouter), XP rewards, difficulty scaling |
| **🏆 Leaderboard** | Supabase-backed global ranking, seasonal resets, rank badges (E → Pharaoh) |
| **📓 Journaling** | Victory log, narrative quests, notepad workspace, habit checklists |
| **🎵 Focus Audio** | Procedural binaural beats, ambient layers, Spotify-style music library |
| **📱 PWA** | Installable, offline-capable, background sync |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Motion (Framer Motion) |
| **Backend** | Express (Node), tsx for dev |
| **Database / Sync** | Supabase (PostgreSQL + Realtime + Auth) |
| **LLM** | NVIDIA NIM (default: Llama 3.1 70B) / OpenRouter fallback |
| **Charts** | Recharts, custom AnubisCharts |
| **Animations** | Lottie, Canvas Confetti, CSS keyframes |
| **Deploy** | AI Studio → Cloud Run (auto-injects `GEMINI_API_KEY`, `APP_URL`) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Supabase project** (for cloud sync + leaderboard)
- **NVIDIA NIM account** (for quest generation) — free tier at [build.nvidia.com](https://build.nvidia.com)

### 1. Clone & Install
```bash
git clone https://github.com/UlkhadPharaon/System--Solo-Leveling-Pharaon-edition-.git
cd System--Solo-Leveling-Pharaon-edition-
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local` with your keys:

| Key | Where to get it |
|-----|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Same page → `anon` `public` key (starts with `eyJ...`) |
| `NVIDIA_NIM_API_KEY` | [build.nvidia.com](https://build.nvidia.com) → Get API Key → Generate |

> **Never commit `.env.local`** — it's gitignored. Only `.env.example` is tracked.

### 3. Run Development Server
```bash
npm run dev
```
Opens at `http://localhost:3000` with HMR.

### 4. Verify Endpoints
```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}

curl -X POST http://localhost:3000/api/generate-quests \
  -H "Content-Type: application/json" \
  -d '{"vision":"test","domains":[{"id":"test","label":"Test","tracking_type":"habit","goal_text":"test","weekly_time_budget":1}],"coachingIntensity":"moderate"}'
# Returns generated quests from NVIDIA NIM
```

---

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm run start
```

**Deploy to AI Studio:** Connect this repo → AI Studio auto-injects `GEMINI_API_KEY` and `APP_URL` at runtime.

---

## 📁 Project Structure

```
├── server.ts              # Express + Vite middleware + API routes
├── src/
│   ├── App.tsx            # Root component, routing, providers
│   ├── main.tsx           # Entry point
│   ├── index.css          # Tailwind + global styles
│   ├── components/        # 25+ UI components
│   ├── lib/               # Core logic (domains, quests, sync, audio, etc.)
│   ├── data/              # Default data, Ulkhad's 10-month program
│   └── types.ts           # TypeScript interfaces
├── scripts/
│   ├── supabase-migration.sql   # Schema for leaderboard, profiles, quests
│   └── seed-domains.ts          # Default domain seeds
├── public/                # Static assets (icons, manifest, SW)
├── .env.example           # Template with all keys + defaults
├── .env.local             # Your secrets (gitignored)
├── AGENTS.md              # Contribution guide for agents
└── package.json
```

---

## 🔑 Key Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | ✅ | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | Supabase anon public key |
| `LLM_PROVIDER` | | `nvidia_nim` | `nvidia_nim` or `openrouter` |
| `NVIDIA_NIM_API_KEY` | ✅* | — | NVIDIA NIM key (`nvapi-...`) |
| `NVIDIA_NIM_BASE_URL` | | `https://integrate.api.nvidia.com/v1` | NIM endpoint |
| `NVIDIA_NIM_MODEL` | | `meta/llama-3.1-70b-instruct` | Model ID |
| `OPENROUTER_API_KEY` | *if provider=openrouter | — | OpenRouter key (`sk-or-...`) |
| `GEMINI_API_KEY` | legacy | — | AI Studio auto-injects in Cloud Run |

*Required if using NVIDIA NIM (default provider).

---

## 🤖 Agent Contribution Guide

See **[AGENTS.md](AGENTS.md)** for:
- Push workflow & commit conventions
- Branching strategy
- Pre-push checklist
- Troubleshooting common issues
- How to add new keys, dependencies, LLM providers

---

## 📄 License

MIT — Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- **Solo Leveling** by Chugong (inspiration)
- **NVIDIA NIM** for free LLM inference
- **Supabase** for backend-as-a-service
- **AI Studio** for zero-config deployment

---

*Built with discipline. The System remembers every rep.*