# QUALITY AUDIT — Professionnalisme (phase 3a) + corrections appliquées (3b)

> Prompt 2/2, phase montée en gamme. Base : STATE_REPORT + ISSUES + revue de code du
> 2026-08-23. Notation : ✅ bon · ⚠️ améliorable (corrigé en 3b quand applicable) ·
> 📋 proposé uniquement (jamais exécuté sans validation).

## A. Ce qui est déjà au niveau production (à préserver)

| Domaine | Constat |
|---|---|
| Gestion d'état | ~30 slices persistées via loader tolérant aux JSON corrompus ; reset quotidien horodaté ; migration legacy 1-shot versionnée |
| Sécurité serveur | Rate limiting IA (429 + Retry-After), caps de longueur de prompt, whitelist/clamp des actions agent, anti-injection `noBadChars`, timeout LLM borné |
| Robustesse réseau | Fallback template systématique, retry auto côté Coach IA, gate de joignabilité cloud, fetch fx désormais borné (DISC-004) |
| Build/CI | tsc strict en lint, build prod vérifié, chunks vendor manuels, bundle-size guard CI |
| Offline/PWA | SW shell + bundles hashés, manifest complet, shortcuts deep-link |
| Accessibilité de base | aria-labels systématiques sur les boutons d'action, focus visible, contrastes thème respectés |
| Docs vivantes | ARCHITECTURE.md à jour + PRD/DATA_MODEL reconstruits depuis le code |

## B. Faiblesses structurelles observées (non bloquantes)

1. **Fichiers-monolithes** — `SystemSoloLeveling.tsx` ≈ 1 600 lignes (9 sous-onglets +
   toute l'économie de jeu), `App.tsx` ≈ 1 380 lignes (état global + dérivations).
   📋 Découpage proposé : un fichier par sous-onglet Système + hooks `usePlayerEconomy`,
   `useDomainDerivations`. **Non exécuté** : refacto à risque sans filet de tests.
2. **Aucune suite de tests** — le fallback silencieux a masqué le bug LLM pendant des
   semaines ; les chemins critiques (XP/rangs, validateurs serveur, garde-fous) sont
   purs et trivialement testables. ✅ **Exécuté 2026-08-25** : logique pure extraite
   dans `src/lib/guardrails.ts` + suite `npm test` (24 cas sur XP/rangs, récompenses,
   poids de domaines, quêtes templates, détresse, validateurs LLM) — voir section C.
3. **Duplication XP** — la logique « compléter quête → progression » existe en 3
   exemplaires (App.tsx, SystemSoloLeveling, DomainQuestBoard). 📋 Extraire
   `applyProgression(player, xp, gold)` partagée.
4. **Types `any` résiduels** dans les handlers de blocs planning (`(b: any)`). 📋
   Typer avec le type ScheduleBlock existant.

## C. Corrections appliquées en 3b (faible risque, faites)

| # | Correction | Fichier(s) |
|---|---|---|
| C1 | Sonde cloud dédupliquée (init + montage partagent une promesse, TTL 5 min) | supabaseSync.ts |
| C2 | Bouton « SYNCHRONISER SCORE » masqué quand le cloud est down (cohérence avec le bandeau bientôt disponible) | WorldLeaderboardView.tsx |
| C3 | Catégories de blocs planning de l'agent IA découplées du profil legacy (`dom:<id>` prioritaire) | server.ts |
| C4 | Fetch taux de change borné 6 s | fx.ts |
| C5 | Quêtes de domaine montées dans Missions (DISC-002) avec confettis à la complétion | SystemSoloLeveling.tsx / App.tsx |
| C6 | Suite de tests `npm test` (24 cas) sur les chemins critiques purs ; logique de validation serveur extraite dans `src/lib/guardrails.ts` et consommée par server.ts (~220 lignes dupliquées supprimées) — B2 ci-dessus | guardrails.ts / tests/unit.mts / server.ts |

## D. Hygiène de dépôt

- Artefacts QA (screenshots, runtime-results.json, script de navigation) committés par
  erreur dans e01dec3 → 📋 proposer un `.gitignore` ciblé (`scripts/shots-state/`,
  `scripts/runtime-results.json`) au prochain commit — non exécuté ici pour ne pas
  mélanger les sujets.
- Les scripts one-shot de patch historique vivent déjà dans `scripts/archive/` : OK.
