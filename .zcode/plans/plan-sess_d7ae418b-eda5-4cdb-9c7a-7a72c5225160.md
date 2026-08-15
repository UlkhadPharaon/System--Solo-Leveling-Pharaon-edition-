# Ulkhad 10-Month Workout Program — Full Integration

## Stack decision (you let me choose)
Keep the existing **React web app** and ship it as a **fully-offline installable PWA** ("Add to Home Screen" gives a real fullscreen mobile-app experience, works 100% offline). This preserves all your existing Solo Leveling systems instead of a risky multi-week React Native rewrite. For the libraries you named:
- **Lottie**: `lottie-react` (official web wrapper of the exact same Lottie engine as `lottie-react-native` — same .json files are reusable if you ever go native).
- **gluestack-ui**: its v2 is React-Native-only, so I'll implement **gluestack's design token system** (typography scale, radii, shadows, semantic colors) as CSS variables in your existing Tailwind v4 setup — same visual quality, zero compatibility risk.

## 1. Program data — `src/data/ulkhadProgram.ts` (new)
Full transcription of the PDF as structured data:
- 2 mésocycles (Masse 5 mois / Force 5 mois) × 4 microcycles (Mécanique 6w, Métabolique 6w, Overreaching 4w, Deload 1w) — 17-week structure per meso.
- Every J1 (Pecs+Dos), J2 (Épaules+Bras), J3 (Jambes+Abdos), J4 (repos) table: exercise, sets, reps, rest, intensification note — exactly as in the PDF.
- Guide content: goals, surcharge progressive rules, techniques d'intensification (superset, tempo, isométrie, pliométrie, rest-pause, pyramide), zones de travail, astuces, nutrition tips, philosophy quote.

## 2. Custom Lottie animations — `src/assets/lottie/` (new)
I hand-author ~14 original 2D Lottie JSON animations (stick-figure athlete, matching the app's gold/cyan palette): pompes, pompes déclinées, pompes archer/une main, tractions, row inversé, superman, planche (+latérale), pike push-up, dips, squats, fentes bulgares, pont fessier, mollets, crunch. Mapped via an `exerciseAnimation(name)` resolver. Bundled locally → offline.

## 3. New guided workout experience — `src/components/UlkhadProgramView.tsx` (new) + WorkoutSystem integration
- **Phase timeline**: visual map of the 10 months (meso/micro cycles) with current-week tracking (persisted start date → auto-computes active phase & week; deload weeks highlighted).
- **"Séance du jour"**: auto-picks J1/J2/J3/J4 by weekday (Lun→J1, Mar→J2, etc. per the program's structure).
- **Exercise detail cards**: Lottie animation demo + muscle badge + sets×reps×rest + intensification/technique explanation in plain French (intuitive for beginners).
- **Live session mode**: set-by-set checkoff, rest timer auto-started from the program's prescribed rest, RPE, notes → reuses existing `onCompleteSession` XP/gold/confetti reward flow.
- UI rebuilt with gluestack-style tokens + `motion` entrance animations, matching the existing dark Pharaoh theme.

## 4. Default data for all new users
- `INITIAL_WORKOUT_ROUTINES` (currently empty) → seeded with all Ulkhad routines (id-stable, `isCustom: false`), so every new user starts with the complete program. Migration-safe: existing users' localStorage untouched (only seeds when key absent).

## 5. Bug fixes found during exploration
- App.tsx passes wrong props to WorkoutSystem: `onAddMetric` vs expected `onAddBodyMetric`, `workoutRoutines` vs `routines`, and missing `triggerVictoryConfetti` — body-metric save and session finish would throw at runtime. Fix the wiring.
- Verify/ensure `navigator.serviceWorker.register('/sw.js')` actually runs (currently no registration found).

## 6. PWA offline hardening — `public/sw.js`
- Precache the hashed Vite bundles (via a build-generated or expanded precache list) so the app is fully usable offline on **first** install, not just after visiting every page.

## 7. Verification
- `tsc --noEmit` clean, `vite build` succeeds, dev-server smoke test of the workout tab (program renders, animations loop, session completes and grants XP).