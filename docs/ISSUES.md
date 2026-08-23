# ISSUES — Registre des bugs et dettes (prompt 2/2)

> Base : `docs/STATE_REPORT.md` (audit factuel du 2026-08-23). Ce fichier transfère les
> problèmes connus (BUG-\*) puis complète avec l'audit de code fin (DISC-\*).
> Statuts : `open` → `fixed` / `wontfix` (justifié) / `needs-human`.
> Corrections par lots de 5–10 avec checkpoint lint/build/smoke entre chaque.

---

## Bugs connus (transférés de la consigne + STATE_REPORT)

### BUG-001 — Identité d'app triple, cible « Ka Rise » · `bloquant / incohérence` · `fixed`
Trois noms coexistent : header « SOLO LEVELING » (Header.tsx:201), footer « AURA
MASTERY SYSTEM » (App.tsx), manifest « Pharaoh System », title « S Y S T E M | Pharaoh »
(index.html), package « system-solo-leveling », README « Pharaoh Edition ». Cible :
**« Ka Rise » partout où le nom est visible** (HTML, manifest, service worker, README,
UI). Décisions d'exécution :
- Les commentaires de code citant *Solo Leveling comme œuvre d'inspiration* (sfx,
  badges, types) restent factuels — ce ne sont pas des chaînes UI visibles ; les
  remplacer serait faux (les SFX VIENNENT de l'anime).
- La phrase d'onboarding « …comme dans Solo Leveling » est une comparaison culturelle,
  pas un auto-nommage : conservée, signalée ici pour arbitrage.
- Le rename du repo git lui-même n'est pas dans mes droits → signalé au résumé final.

### BUG-002 — Génération LLM morte : modèle reasoning vs timeout 20 s · `majeur / bug` · `fixed`
`.env.local` configure `nvidia/nemotron-3.5-lightning-30b-a3b` (modèle de raisonnement)
: brûle son budget en thinking, `finish_reason=length` à ~22 s mesuré, serveur coupe à
20 s (`AbortSignal.timeout(20000)` server.ts) → fallback template systématique,
silencieux. **Décision tranchée** : basculer sur `openai/gpt-4o-mini` via OpenRouter
(déjà configuré dans le code), pas d'augmentation de timeout sur le modèle reasoning.
Vérifier live que jsonMode reste compatible ; si la clé OpenRouter locale est invalide,
revenir au modèle instruct NIM par défaut du code (`meta/llama-3.1-70b-instruct`) et le
valider de la même façon.

### BUG-003 — Coach IA : profil legacy injecté hors contexte Domain · `majeur / incohérence` · `fixed`
`/api/ai-coach` (server.ts ~640) injecte le profil codé en dur (Bangre Neo Lab,
cinéma, SVT/Maths…) quand `context.domains` est absent → hallucine des objectifs qui
ne sont pas ceux de l'utilisateur courant (observé en test réel). Fix : comportement
neutre explicite quand aucun domaine n'est fourni (instruction système « utilisateur
sans domaines définis — ne présume d'aucun objectif », pas de profil fantôme).

### BUG-004 — `flag_for_human_review` jamais implémenté · `majeur / dette` · `fixed`
0 occurrence dans le code. Garde-fou prévu : couper/flagger la génération quand le
texte libre utilisateur (onboarding, quêtes) contient des signaux de détresse. À
implémenter côté serveur dans le chemin `validateQuests` : détection lexicale
(FR/EN) → réponse `{flag_for_human_review: true, …}`, quêtes templates servies,
raison loguée, jamais de prescription générée sur ce contenu.

### BUG-005 — Sync/leaderboard contre un projet Supabase mort · `majeur / bug` · `fixed`
DNS `tteayfimrsnjoparyzjl.supabase.co` inexistant → POST signup anonyme au boot +
GET leaderboard échouent à chaque session (E1/E2/E4 du rapport). **Décision tranchée**
: 100 % local-first tant qu'aucune config Supabase vivante — sonder la joignabilité
avant d'activer sync/signup ; Classement affiche un état « bientôt disponible » au lieu
de tenter/échouer en boucle. Code de sync conservé intact et ré-activable.

### BUG-006 — Image Unsplash 404 (Radar Donjons) · `mineur / bug` · `fixed`
`images.unsplash.com/photo-1608976478335…` codée en dur, photo supprimée côté Unsplash
(HTTP 404 constaté). Remplacer par asset local existant si pertinent ; sinon fond CSS/
dégradé du thème et signaler qu'un vrai asset serait bienvenu — ne PAS remettre une
URL externe en dur.

### BUG-007 — Fichiers morts · `mineur / dette` · `fixed`
`assets/` racine (vide), `Sound effects/*.mp3` brut (déjà converti en
`public/sounds/*.webm`), logo jpg jamais importé. Grep avant suppression ; archivage
plutôt que destruction si doute.

### BUG-008 — PRD.md / DATA_MODEL.md fantômes · `mineur / dette` · `fixed`
Cités par la documentation mais absents du repo (seul ARCHITECTURE.md existe, à jour).
Choix : recréer depuis l'état réel du code (plus fiable que les versions théoriques),
signalé au résumé final.

---

## Audit complémentaire (découvertes de la revue de code)

### DISC-001 — 7 URLs Unsplash codées en dur (Donjons) · `majeur / dette` · `fixed`
SystemSoloLeveling.tsx:79–169 (6 catalogues de donjons) + :1261 (fallback du rendu
`<img>`). Une seule est morte aujourd'hui (BUG-006) ; les autres sont des bombes
retardement : service externe non maîtrisé, images absentes du mode offline PWA alors
que le SW pré-cache tout le reste. Fix avec BUG-006 : assets locaux ou fond CSS thème.

### DISC-002 — Quêtes générées jamais affichées (composant orphelin) · `majeur / fonctionnel` · `fixed`
Les quêtes de démarrage issues de l'onboarding v2 (`playerProfile.generatedQuests`,
template OU LLM) ne sont rendues nulle part : `DomainQuestBoard` existe, est complet,
mais `<DomainQuestBoard` n'apparaît dans aucun autre fichier malgré son commentaire
d'en-tête qui prétend le contraire. La boucle « personnalisation → quêtes » est
invisible utilisateur ; corriger BUG-002 sans monter ce composant produirait des quêtes
LLM que personne ne voit.

### DISC-003 — Fetch leaderboard inconditionnel au montage du Dashboard · `majeur / perf` · `fixed`
Le tableau Classement déclenche `syncScoreToCloud()` (upsert + select Supabase) dès le
montage du dashboard, hors écran Classement → requêtes fantômes à chaque session même
quand la config cloud est morte. Se traite avec BUG-005 (gate de joignabilité partagé).

### DISC-004 — fx.ts : fetch taux de change sans timeout · `mineur / perf` · `fixed`
`src/lib/fx.ts` fetch l'API de change sans `AbortSignal.timeout` ni backoff ; fallback
dégradé propre mais latence potentielle non bornée au montage de la Trésorerie.

### DISC-005 — Pas de plafond de niveau · `mineur / robustesse` · `wontfix (documenté)`
`calculateLevelProgression` (utils.ts:207) : croissance xpToNext ×1.5 non bornée,
itérations capées à 500 — pas de « niveau max » par design. Cohérent avec le fantasme
Solo Leveling (montée infinie) ; les rangs s'épuisent à Pharaon (niv 25+) mais le
compteur continue. Documenté, aucune action.

### DISC-006 — Ordre boot quotidien correct · `info / vérifié` · `closed`
`resetDailyQuestsIfNeeded` s'applique dans l'initialiseur `loadJson('aura_player_profile')`
(App.tsx:465), donc AVANT toute hydration dérivée — pas de bug d'ordre. Archivé ici pour
éviter qu'un audit futur le re-creuse.

### DISC-007 — Classement sans état d'erreur visible · `mineur / UX` · `fixed`
Échecs cloud uniquement en console ; l'utilisateur voit un écran vide sans explication.
Résorbé par BUG-005 (état « bientôt disponible »).

<!-- DISC entries above -->
