import { ProjectPhase } from '../types';

// Blank canvas: no pre-seeded project phases. Fresh users build their own
// project timelines (or get domain-driven project_phases from onboarding v2).
// Existing users keep their saved phases untouched.
export const INITIAL_PROJECT_PHASES: ProjectPhase[] = [];