# Agent Contribution & Push Guide

This document explains how future agents (or you) should push modifications to this repository.

---

## Repository Structure

- **Default branch**: `master` (canonical)
- **Legacy branch**: `main` (kept for history, will be deprecated)
- **Remote**: `origin` → `https://github.com/UlkhadPharaon/System--Solo-Leveling-Pharaon-edition-.git`

---

## Quick Push Workflow

```bash
# 1. Ensure you're on master
git checkout master

# 2. Pull latest (if collaborating)
git pull origin master

# 3. Make your changes
# ... edit files ...

# 4. Stage changes (respects .gitignore — .env.local stays local)
git add -A

# 5. Commit with conventional message
git commit -m "type(scope): short description

Longer explanation if needed.
- Bullet points for multiple changes
- Reference issues: Fixes #123"

# 6. Push
git push origin master
```

---

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `docs` | Documentation only |
| `chore` | Build, deps, tooling, CI |
| `perf` | Performance improvement |
| `test` | Adding tests |

**Format:** `type(scope): imperative subject` (max 72 chars)
**Body:** Optional, explains *what* and *why*, not *how*.

---

## Environment Variables — Critical Rules

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template with all keys + defaults | ✅ Yes |
| `.env.local` | **Actual secrets** (Supabase URL/key, NVIDIA NIM key) | ❌ **Never** — gitignored |
| `.env` | Optional local overrides | ❌ Never |

**To add a new key:**
1. Add it to `.env.example` with a comment and default (if safe)
2. Add the real value to your local `.env.local`
3. **Never commit real secrets**

**Keys currently used:**
- `VITE_SUPABASE_URL` — Supabase project URL (client-side, `VITE_` prefix)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon public key (client-side)
- `LLM_PROVIDER` — `nvidia_nim` \| `openrouter`
- `NVIDIA_NIM_API_KEY` — NVIDIA NIM key (`nvapi-...`)
- `NVIDIA_NIM_BASE_URL` — Default: `https://integrate.api.nvidia.com/v1`
- `NVIDIA_NIM_MODEL` — Default: `meta/llama-3.1-70b-instruct`
- `OPENROUTER_API_KEY` — OpenRouter key (`sk-or-...`)
- `GEMINI_API_KEY` — Legacy AI coach endpoint (optional)

---

## Server-Side Config Loading

`server.ts` loads env in this order:
```typescript
dotenv.config();                    // .env (if exists)
if (existsSync('.env.local')) {     // .env.local OVERRIDES
  dotenv.config({ path: '.env.local', override: true });
}
```
This means `.env.local` always wins — use it for your actual keys.

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, default branch |
| `feature/*` | Short-lived feature branches (optional) |
| `hotfix/*` | Urgent fixes to master |

**No long-running dev branches.** Merge to `master` directly for small changes; use PRs for larger ones.

---

## Pre-Push Checklist

Run these before pushing:

```bash
# 1. TypeScript compiles
npm run lint

# 2. Build succeeds
npm run build

# 3. Dev server starts (smoke test)
npm run dev &
sleep 5
curl -s http://localhost:3000/api/health | grep '"status":"ok"'
kill %1

# 4. PRODUCTION bundle actually boots — the dev test does NOT cover this.
#    (Catches CJS/esbuild issues like the import.meta crash fixed 2026-08-16.)
NODE_ENV=production PORT=3999 node dist/server.cjs &
sleep 4
curl -s http://localhost:3999/api/health | grep '"status":"ok"'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3999/   # expect 200
kill %1
```

If any step fails, fix before pushing.

---

## Common Tasks

### Add a new dependency
```bash
npm install <pkg>           # runtime
npm install -D <pkg>        # dev only
# commit package.json + package-lock.json
```

### Update Supabase schema
1. Edit `scripts/supabase-migration.sql`
2. Run via Supabase Dashboard → SQL Editor
3. Commit the `.sql` file

### Add a new LLM provider
1. Extend `LlmProvider` type in `server.ts`
2. Add config in `getLlmConfig()`
3. Add keys to `.env.example`
4. Test with `curl -X POST /api/generate-quests`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `git push` rejected (non-fast-forward) | `git pull --rebase origin master` then push |
| Secrets accidentally committed | `git filter-repo` or BFG Repo-Cleaner, then rotate keys |
| Port 3000 in use | `taskkill /F /IM node.exe` (Windows) |
| `.env.local` not loading | Check `server.ts` has the `existsSync('.env.local')` block |
| Vite doesn't see `VITE_` vars | Restart dev server; only `VITE_` prefix vars exposed to client |

---

## Useful Aliases (add to your shell)

```bash
alias gst='git status'
alias gaa='git add -A'
alias gcm='git commit -m'
alias gp='git push'
alias gpl='git pull --rebase'
alias glog='git log --oneline -20'
```

---

## Contact / Context

- **Repo owner**: UlkhadPharaon
- **App**: Solo Leveling Self-Dev System (Pharaoh Edition)
- **Stack**: React 19 + Vite 6 + Express + Tailwind 4 + Supabase + NVIDIA NIM
- **Deploy target**: AI Studio / Cloud Run (auto-injects `GEMINI_API_KEY`, `APP_URL`)

---

*Generated 2026-08-15 — keep this file updated as conventions evolve.*