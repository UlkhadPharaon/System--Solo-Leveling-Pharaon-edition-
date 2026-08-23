# FEATURE PROPOSALS — Phase 3c (propositions uniquement — RIEN d'implémenté)

> Chaque proposition liste la valeur, l'effort estimé (S/M/L) et le risque. Aucune ne
> doit être lancée sans validation explicite.

## F1 — Boucle quotidienne unifiée (« Ordre du jour »)
**Valeur** : le joueur voit sur un seul écran missions + quêtes de domaine + habitude
du jour + donjon recommandé, avec une progression globale du jour (%).
**Effort** : M · **Risque** : bas (lecture seule au-dessus des modules existants).
Dépend de DISC-002 (fait).

## F2 — Fin de semaine narrative
**Valeur** : le rapport hebdo devient un « récit de guilde » généré par LLM à partir
des données locales uniquement (heures par domaine, streaks, hauts faits), ton Solo
Leveling, avec garde-fous existants. Le contenu chiffré reste calculé côté app.
**Effort** : S · **Risque** : bas (réutilise /api/ai-coach + WeeklyReportCard).

## F3 — Donjons générés par les domaines
**Valeur** : un « portail » hebdo par domaine actif dont la difficulté dérive du budget
d'heures et dont les récompenses alimentent Forge/Boutique — donne un sens de jeu aux
données déjà suivies.
**Effort** : M · **Risque** : moyen (équilibrage économie ; garder les 6 donjons E→S
comme socle fixe).

## F4 — Mode examen (période bac/blanc)
**Valeur** : bascule temporaire qui repondère les cibles study_subjects, réduit les
pénalités physiques, ajoute un compte à rebours jusqu'à la date d'examen déclarée.
**Effort** : S · **Risque** : bas.

## F5 — Export/sauvegarde chiffrée locale
**Valeur** : bouton « exporter mon royaume » (JSON signé, mot de passe optionnel via
WebCrypto) en complément de l'export plat existant dans Gestion des données.
**Effort** : S · **Risque** : bas.

## F6 — Notifications push intelligentes
**Valeur** : l'infra VAPID existe déjà (serveur + client) mais n'envoie que des rappels
fixes. Proposé : rappels contextuels (quête non complétée à 20 h, streak menacé,
session focus planifiée) déclenchés par `/api/push/schedule` existant.
**Effort** : M · **Risque** : bas.

## F7 — Recréation du backend Supabase (prérequis leaderboard cloud)
**Valeur** : réactive Classement mondial + sync multi-appareils. Nécessite une action
humaine : créer le projet Supabase, y jouer `scripts/supabase-migration.sql`, mettre à
jour `VITE_SUPABASE_URL/ANON_KEY`. **Le code est prêt et se réactivera seul** grâce au
gate BUG-005.
**Effort** : humain (10 min) + tests · **Risque** : bas.

## F8 — Page d'accueil PWA « Éveil »
**Valeur** : écran de marque Ka Rise avant le premier onboarding (logo, promesse,
bouton Commencer) — renforce l'identité après le renommage.
**Effort** : S · **Risque** : bas.

---
**Ordre recommandé si validé** : F7 (action humaine) → F2 → F1 → F6 → F8 → F4 → F5 → F3.
