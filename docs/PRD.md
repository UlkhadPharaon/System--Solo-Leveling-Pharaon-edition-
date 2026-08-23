# PRD — Ka Rise (Product Requirements Document)

> Reconstruit depuis le code réel le 2026-08-23 (prompt 2/2, BUG-008) — ce document
> décrit ce qui EXISTE, pas une roadmap théorique. Source de vérité technique :
> `docs/ARCHITECTURE.md` ; état des lieux détaillé : `docs/STATE_REPORT.md`.

## 1. Vision produit

Ka Rise est un **système de développement personnel gamifié** (esthétique inspirée de
Solo Leveling, identité propre) mono-utilisateur, local-first, en français. L'utilisateur
définit ses **domaines de vie** à l'onboarding ; l'app transforme sa vie réelle en
boucle de jeu : quêtes, XP, rangs, or, donjons (sessions chronométrées), ombres
(extraction de victoires), forge/boutique (économies de matériaux et d'or), journal,
bilan hebdomadaire.

## 2. Utilisateur cible

Ulrich — lycéen (Terminale visée oct. 2026), projets créatifs/tech multiples.
Un seul profil actif par instance ; aucune authentification obligatoire (mode local),
sync cloud optionnelle via Supabase anonyme.

## 3. Parcours utilisateur clé

1. **Premier lancement** → écran Système + tour d'introduction.
2. **Onboarding « Éveil » v2** (4 blocs) : Vision → Domaines (2–5, type de suivi
   déterministe) → Calibrage (intensité coaching, catégories de pénalité autorisées,
   contrainte physique texte libre) → Confirmation éditable.
   À la validation : cibles hebdo, matières, enveloppes budgétaires, poids de domaines
   et premières quêtes sont **dérivés automatiquement** ; données de démo purgées.
3. **Boucle quotidienne** : Dashboard (planning + habitudes) → Missions du jour →
   Focus/donjon → XP/or → montée en rang.
4. **Boucle hebdomadaire** : Bilan (heures par domaine vs budgets) + rapport.

## 4. Modules (16 écrans)

| Module | Fonction | Données |
|---|---|---|
| Statut | HP/MP/XP, attributs, badges, équipement | persistant |
| Missions | Quêtes quotidiennes + narrative + quêtes de domaine (LLM/template) | persistant |
| Donjons | Catalogue E→S, entrées MP, timers, boss, extraction « Arise » | progression persistante |
| Armée Divine | Ombres extraites + synergies | persistant |
| Forge Royale | Matériaux → reliques/équipement | persistant |
| Boutique | Or → objets/loot box, équipement | persistant |
| Classement | Local (chasseurs de légende + vous) ; cloud « bientôt disponible » tant que Supabase est hors service | mixte |
| Journal | Chroniques de toutes les actions | persistant |
| Custom | Avatar, ambiance sonore, préférences | persistant |
| Dashboard | Planning hebdo CRUD, checklist habitudes, rituel quotidien | persistant |
| Entraînement | Programme 10 mois, sessions, PR, mensurations | persistant |
| Focus | Minuteur multi-domaine, audio global, reprise de session | persistant |
| Bilan | Sliders heures vs cibles dérivées des domaines, rapport hebdo | persistant |
| Hauts Faits | Journal des victoires + carte partageable | persistant |
| Notes | Notes + phases de projet liées aux domaines | persistant |
| Trésorerie | Transactions, enveloppes (dont `domain:<id>`), objectifs épargne, taux de change | persistant |

## 5. Exigences non fonctionnelles

- **Local-first absolu** : tout fonctionne sans réseau ; sync cloud jamais bloquante ;
  sondes de joignabilité avant tout appel externe (BUG-005).
- **PWA installable offline** (service worker, shell pré-caché).
- **IA assistante mais jamais bloquante** : fallback template déterministe sur timeout /
  absence de clé / flag de sécurité (BUG-004).
- **Garde-fous IA** : JSON structuré validé serveur, XP clampé 20–120, aucune
  prescription santé, `flag_for_human_review` sur signaux de détresse.
- **Performance** : chunks vendor séparés, lazy-loading par onglet, budget bundle
  surveillé en CI.
- **Langue** : interface 100 % française.

## 6. Hors périmètre (v1)

Multi-utilisateur/authentification complète, marketplace de routines, mode sombre/clair
(thème unique), i18n, applications natives.
