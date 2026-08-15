/**
 * Seed script — Ulrich's legacy profile → Domain rows (preset
 * "Créateur multi-discipline"). Run: npx tsx scripts/seed-domains.ts
 *
 * In practice the app performs this migration AUTOMATICALLY at boot
 * (migrateLegacyDomainsIfNeeded in src/lib/domains.ts): if onboarding was
 * completed on the legacy app but `aura_domains` is absent, the 4 domains
 * below are seeded. This script exists to (a) inspect the seed, (b) import it
 * manually into a browser profile via the Data Management modal:
 *   1. npx tsx scripts/seed-domains.ts > domains.json
 *   2. In the app: Data Management → Import (aura_domains key)
 *
 * Mapping decisions (tranché, see task summary):
 *   Musculation    → workout_log    / physical      (legacyCategory: morning_routine)
 *   Cinéma         → project_phases / creative      (legacyCategory: cinema)
 *   Bangre Neo Lab → project_phases / craft         (legacyCategory: bangre_neo)
 *   École          → study_subjects / intellectual  (legacyCategory: school)
 */

import { buildLegacyDomains } from '../src/lib/domains';

const domains = buildLegacyDomains();
console.log(JSON.stringify({ aura_domains: domains }, null, 2));
