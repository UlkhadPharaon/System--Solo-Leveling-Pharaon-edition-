import React, { useState } from 'react';
import {
  User, Target, Zap, Check, Plus, Trash, Sparkles, ArrowLeft, Wand,
  Crown, Dumbbell, Film, GraduationCap, Briefcase, BookOpen, Calendar,
  Shield, Sword, Star, Flame, Eye, X, ChevronRight,  type PharaohIcon,
} from './ui/PharaohIcons';
import {
  Domain,
  DomainCategory,
  TrackingType,
  CoachingIntensity,
  PenaltyCategory,
  OnboardingAnswers,
} from '../types';
import {
  TRACKING_TYPE_CHOICES,
  DEFAULT_CATEGORY_FOR_TRACKING,
  DOMAIN_CATEGORY_STYLES,
  makeDomainId,
  buildLegacyDomains,
} from '../lib/domains';
import { motion, AnimatePresence } from 'motion/react';

export const ONBOARDING_V2_ENABLED = true;

export interface OnboardingV2Result {
  userName: string;
  answers: OnboardingAnswers;
  domains: Domain[];
  coachingIntensity: CoachingIntensity;
  penaltyCategoriesAllowed: PenaltyCategory[];
}

interface DomainDraft {
  tempId: string;
  label: string;
  tracking_type: TrackingType;
  currentStatus: string;
  goalText: string;
  weeklyTimeBudget: number;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete?: (legacy?: { userName: string; mainGoal: string; intensity: string }) => void;
  onCompleteV2?: (result: OnboardingV2Result) => void;
}

const INTENSITIES: { value: CoachingIntensity; label: string; hint: string; icon: PharaohIcon; color: string }[] = [
  { value: 'gentle', label: 'Doux', hint: 'Quêtes accessibles, progression lente. Idéal pour débuter.', icon: Shield, color: '#10b981' },
  { value: 'balanced', label: 'Équilibré', hint: 'Mélange facile/moyen/difficile. Progression naturelle.', icon: Target, color: '#06b6d4' },
  { value: 'demanding', label: 'Exigeant', hint: 'Majorité de quêtes difficiles. Pour chasseurs expérimentés.', icon: Sword, color: '#ef4444' },
];

const PENALTIES: { value: PenaltyCategory; label: string; hint: string; icon: PharaohIcon; color: string }[] = [
  { value: 'creative_makeup', label: 'Rattrapage Créatif', hint: 'Tâche artistique/écriture pour compenser.', icon: Sparkles, color: '#f59e0b' },
  { value: 'physical_penalty', label: 'Pénalité Physique', hint: 'Exercice corporel (pompes, squats, marche).', icon: Flame, color: '#ef4444' },
  { value: 'xp_loss', label: 'Perte d\'XP', hint: 'Le Système retranche de l\'expérience.', icon: Star, color: '#8b5cf6' },
];
const newDraft = (): DomainDraft => ({
  tempId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  tracking_type: 'habit_checklist',
  currentStatus: '',
  goalText: '',
  weeklyTimeBudget: 3,
});

const TRACKING_ICON_MAP: Record<TrackingType, PharaohIcon> = {
  workout_log: Dumbbell,
  project_phases: Film,
  study_subjects: GraduationCap,
  focus_sessions: Target,
  budget_bucket: Briefcase,
  habit_checklist: Check,
};

const TRACKING_COLOR_MAP: Record<TrackingType, string> = {
  workout_log: '#C0392B',
  project_phases: '#F0C42D',
  study_subjects: '#1D6FA5',
  focus_sessions: '#7B3FE4',
  budget_bucket: '#1E8A49',
  habit_checklist: '#D4A81E',
};

/** One-tap domain suggestions for the Domaines step (no typing required). */
const DOMAIN_SUGGESTIONS: { label: string; tracking_type: TrackingType }[] = [
  { label: 'Musculation', tracking_type: 'workout_log' },
  { label: 'Études / Révisions', tracking_type: 'study_subjects' },
  { label: 'Projet personnel', tracking_type: 'project_phases' },
  { label: 'Finances', tracking_type: 'budget_bucket' },
  { label: 'Concentration', tracking_type: 'focus_sessions' },
  { label: 'Habitudes du matin', tracking_type: 'habit_checklist' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, onCompleteV2 }) => {
  const useV2 = ONBOARDING_V2_ENABLED && !!onCompleteV2;
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [intensity, setIntensity] = useState('moderate');

  // v2 state
  const [vision, setVision] = useState('');
  const [drafts, setDrafts] = useState<DomainDraft[]>([newDraft()]);
  const [activeDraft, setActiveDraft] = useState(0);
  const [coachingIntensity, setCoachingIntensity] = useState<CoachingIntensity>('balanced');
  const [penaltyChoice, setPenaltyChoice] = useState<PenaltyCategory>('creative_makeup');
  const [physicalConstraint, setPhysicalConstraint] = useState('');
  const [confirmEditIdx, setConfirmEditIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // Legacy flow (rollback path)
  if (!useV2) {
    return (
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-obsidian/95 backdrop-blur-sm overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-panel border border-lapis-border rounded-2xl p-8 w-full max-w-lg shadow-card-hover space-y-6"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-light text-gradient-gold">Bienvenue, Chasseur</h2>
            <button onClick={() => onComplete?.()} className="btn-press p-2 rounded-lg text-pharaoh-subtle hover:text-pharaoh hover:bg-panel-hover"><X size={20} /></button>
          </div>

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <p className="text-pharaoh-subtle">Comment le Système doit-il vous appeler ?</p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Entrez votre nom..."
                className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <button
                disabled={!userName}
                onClick={() => setStep(2)}
                className="w-full btn-press py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 disabled:opacity-50 hover:shadow-gold"
              >
                Continuer <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <Target size={22} color="var(--color-sapphire)" />
                <h2 className="font-display text-xl font-light text-pharaoh">Votre Objectif</h2>
              </div>
              <p className="text-pharaoh-subtle">Quelle est votre quête principale ?</p>
              <input
                type="text"
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                placeholder="Ex: Devenir développeur, Musculation..."
                className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              <button
                disabled={!mainGoal}
                onClick={() => setStep(3)}
                className="w-full btn-press py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 disabled:opacity-50 hover:shadow-gold"
              >
                Continuer <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={22} color="var(--color-gold)" />
                <h2 className="font-display text-xl font-light text-pharaoh">Intensité du Système</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['débutant', 'modéré', 'avancé'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`btn-press w-full text-left p-4 rounded-xl border ${
                      intensity === level
                        ? 'bg-panel-gold border-gold/50 text-gold-bright shadow-gold'
                        : 'bg-panel border-lapis-border text-pharaoh hover:bg-panel-hover'
                    }`}
                  >
                    <span className="font-medium capitalize">{level}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => onComplete?.({ userName, mainGoal, intensity })}
                className="w-full btn-press py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold flex items-center justify-center gap-2"
              >
                <Check size={20} /> Éveiller le Système
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // v2 flow
  const domainCount = drafts.length;
  const active = drafts[activeDraft] ?? drafts[0];
  const draftsValid = domainCount >= 2 && domainCount <= 5 && drafts.every((d) => d.label.trim().length >= 2);
  const visionValid = vision.trim().length >= 10;

  const updateDraft = (patch: Partial<DomainDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === activeDraft ? { ...d, ...patch } : d)));
  };

  const addDraft = () => {
    if (domainCount >= 5) return;
    setDrafts((prev) => [...prev, newDraft()]);
    setActiveDraft(domainCount);
  };

  const removeDraft = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
    setActiveDraft(0);
  };

  const applyPreset = () => {
    const now = Date.now();
    const preset = buildLegacyDomains().map((d, i) => ({
      tempId: `preset_${i}_${now}`,
      label: d.label,
      tracking_type: d.tracking_type,
      currentStatus: '',
      goalText: d.goal_text,
      weeklyTimeBudget: d.weekly_time_budget ?? 3,
    }));
    setDrafts(preset);
    setActiveDraft(0);
  };

  // One-tap domain presets: fill the active draft if it is still empty,
  // otherwise append a new draft — no typing required for quick setups.
  const applySuggestion = (s: { label: string; tracking_type: TrackingType }) => {
    if (domainCount >= 5) return;
    if (active.label.trim()) {
      setDrafts((prev) => [...prev, { ...newDraft(), label: s.label, tracking_type: s.tracking_type }]);
      setActiveDraft(domainCount);
    } else {
      updateDraft({ label: s.label, tracking_type: s.tracking_type });
    }
  };

  const finish = () => {
    if (!onCompleteV2) return;
    const now = Date.now();
    const domains: Domain[] = drafts.map((d, i) => {
      const category: DomainCategory = DEFAULT_CATEGORY_FOR_TRACKING[d.tracking_type];
      const style = DOMAIN_CATEGORY_STYLES[category];
      return {
        id: makeDomainId(d.label || `domaine_${i}`),
        user_id: null,
        label: d.label.trim(),
        category,
        tracking_type: d.tracking_type,
        icon_ref: style.icon,
        color_accent: style.color,
        goal_text: d.goalText.trim(),
        weekly_time_budget: d.weeklyTimeBudget,
        created_at: now + i,
      };
    });
    const domainAnswers: OnboardingAnswers['domainAnswers'] = {};
    domains.forEach((dom, i) => {
      domainAnswers[dom.id] = {
        currentStatus: drafts[i].currentStatus.trim(),
        goalText: drafts[i].goalText.trim(),
      };
    });
    onCompleteV2({
      userName: userName.trim() || 'Chasseur',
      answers: {
        vision: vision.trim(),
        domainAnswers,
        physicalConstraint: physicalConstraint.trim() || undefined,
      },
      domains,
      coachingIntensity,
      penaltyCategoriesAllowed: [penaltyChoice],
    });
  };

  const stepLabels = ['Bienvenue', 'Vision', 'Domaines', 'Calibrage', 'Confirmation'];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-obsidian/95 backdrop-blur-sm overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-panel border border-lapis-border rounded-3xl p-4 sm:p-6 md:p-8 w-full max-w-xl min-w-0 shadow-card-hover space-y-5 my-3 sm:my-8 overflow-x-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        {/* Stepper */}
        <motion.div
          className="flex items-center gap-2 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <motion.div
                className="flex-1 h-1.5 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                style={{
                  background: i + 1 <= step
                    ? 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))'
                    : 'var(--color-lapis-border)',
                }}
              />
            </div>
          ))}
        </motion.div>

        <motion.p
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-bright text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Éveil du Système — {stepLabels[step - 1]}
        </motion.p>

        {/* Bloc 1 — Bienvenue : ce qu'est le Système, en langage simple.
            The old flow opened directly on configuration (Vision) with zero
            explanation of what the app IS — beta testers reported being lost. */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-3 rounded-xl bg-panel-gold">
                  <Crown size={24} color="var(--color-gold)" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-light text-gradient-gold">Bienvenue, Chasseur.</h2>
                  <p className="text-pharaoh-subtle text-sm">Tes objectifs de vie, transformés en jeu.</p>
                </div>
              </motion.div>

              <motion.p
                className="text-sm text-pharaoh-muted leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Le Système est un coach de développement personnel gamifié : tu définis
                tes objectifs (<strong className="text-gold">2 minutes</strong>), il les transforme en{' '}
                <strong className="text-gold">quêtes quotidiennes</strong>, et chaque vraie action
                accomplie te fait gagner de l'<strong className="text-gold">XP</strong> et monter
                de niveau — comme dans Solo Leveling.
              </motion.p>

              <div className="space-y-2.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle">
                  Comment ça marche — en 3 étapes
                </p>
                {[
                  { icon: Target, color: '#06b6d4', title: '1. Choisis tes domaines de vie', desc: 'Musculation, études, finances, projets… tout ce que tu veux améliorer.' },
                  { icon: Calendar, color: '#1D6FA5', title: '2. Reçois tes quêtes du jour', desc: 'Le Système te propose chaque jour des actions concrètes à cocher.' },
                  { icon: Zap, color: '#D4A81E', title: '3. Gagne XP, or et monte de rang', desc: 'Chaque tâche accomplie te fait progresser : rang E → S → Shadow Monarch.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-obsidian border border-lapis-border"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                  >
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${item.color}1a`, border: `1px solid ${item.color}44` }}>
                      <item.icon size={18} style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-pharaoh">{item.title}</p>
                      <p className="text-xs text-pharaoh-muted leading-snug">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={() => setStep(2)}
                className="w-full btn-press py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                C'est parti — Configurer <ChevronRight size={18} />
              </motion.button>
              <p className="text-center font-mono text-[9px] uppercase tracking-wide text-pharaoh-subtle">
                Configuration rapide : ~2 minutes
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bloc 2 — Vision */}
        <AnimatePresence mode="wait">
          {step === 2 && (
            <motion.div
              key="vision"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-3 rounded-xl bg-panel-gold">
                  <Sparkles size={24} color="var(--color-gold)" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-light text-gradient-gold">Bienvenue, Chasseur.</h2>
                  <p className="text-pharaoh-subtle text-sm">Le Système attend votre nom et votre vision.</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                  Comment le Système doit-il vous appeler ?
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Votre nom…"
                  className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                  Décrivez en quelques phrases ce que vous voulez accomplir dans les 3 à 6 prochains mois.
                </label>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={4}
                  placeholder="Ex: Je veux transformer ma discipline, produire mon premier film et devenir plus fort physiquement…"
                  className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={visionValid ? 'text-emerald-400' : 'text-pharaoh-subtle'}>
                    {vision.trim().length}/10 caractères minimum
                  </span>
                  <span className={visionValid ? 'text-gold-bright' : 'text-pharaoh-subtle'}>
                    {visionValid ? 'Vision acceptée' : 'Continuez...'}
                  </span>
                </div>
              </motion.div>

              <motion.button
                disabled={!visionValid || !userName.trim()}
                onClick={() => setStep(3)}
                className="w-full btn-press py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 disabled:opacity-50 hover:shadow-gold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Continuer <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bloc 3 — Domaines */}
        <AnimatePresence mode="wait">
          {step === 3 && (
            <motion.div
              key="domains"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #8b5cf622, #8b5cf600)', border: '1px solid #8b5cf644' }}>
                  <Target size={24} color="#8b5cf6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-light text-pharaoh">Tes domaines de vie</h2>
                  <p className="text-pharaoh-subtle text-sm">{domainCount}/5 domaines définis</p>
                </div>
              </motion.div>

              <motion.button
                onClick={applyPreset}
                className="w-full btn-press flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-xs tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf622, #8b5cf600)',
                  border: '1px solid #8b5cf644',
                  color: '#8b5cf6',
                }}
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Wand size={18} /> Partir du preset « Créateur multi-discipline » (Musculation · Cinéma · Tech · École)
              </motion.button>

              {/* One-tap suggestions — the fastest path to a valid setup */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle">
                  Ou ajoute un domaine en un clic :
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s.label}
                      onClick={() => applySuggestion(s)}
                      className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-lapis-border text-xs text-pharaoh-muted hover:text-gold hover:border-gold/50 bg-obsidian/40"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.02 * DOMAIN_SUGGESTIONS.indexOf(s) }}
                    >
                      <Plus size={13} /> {s.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Domain tabs */}
              <motion.div
                className="flex items-center gap-2 flex-wrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {drafts.map((d, i) => (
                  <motion.div
                    key={d.tempId}
                    className="flex items-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <motion.button
                      onClick={() => setActiveDraft(i)}
                      className={`btn-press relative px-3 py-1.5 rounded-xl text-xs border ${
                        i === activeDraft
                          ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                          : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                      } ${drafts.length === 1 ? 'rounded-r-xl' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {d.label.trim() || `Domaine ${i + 1}`}
                      {i === activeDraft && (
                        <motion.span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                      )}
                    </motion.button>
                    {drafts.length > 2 && i === activeDraft && (
                      <motion.button
                        onClick={() => removeDraft(i)}
                        title="Supprimer ce domaine"
                        className="btn-press px-2 py-1.5 rounded-r-xl border border-l-0 border-lapis-border bg-panel text-pharaoh-subtle hover:text-blood hover:border-blood/50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash size={14} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
                {domainCount < 5 && (
                  <motion.button
                    onClick={addDraft}
                    className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-lapis-border text-pharaoh-subtle hover:text-gold hover:border-gold/50 text-xs"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Plus size={14} /> Ajouter
                  </motion.button>
                )}
              </motion.div>

              {/* Active domain form */}
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    key={active.tempId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 border border-lapis-border rounded-2xl p-5 bg-obsidian/50"
                  >
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                          Comment tu appelles ce domaine ?
                        </label>
                        <input
                          type="text"
                          value={active.label}
                          onChange={(e) => updateDraft({ label: e.target.value })}
                          placeholder="Ex: Piano, Ma startup, Révisions internat…"
                          className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                          Ça ressemble le plus à…
                        </label>
                        <div className="space-y-2">
                          {TRACKING_TYPE_CHOICES.map((choice) => {
                            const Icon = TRACKING_ICON_MAP[choice.value] || Target;
                            const color = TRACKING_COLOR_MAP[choice.value] || '#06b6d4';
                            const isSel = active.tracking_type === choice.value;
                            return (
                              <motion.button
                                key={choice.value}
                                onClick={() => updateDraft({ tracking_type: choice.value })}
                                className={`btn-press w-full text-left px-3 py-2.5 rounded-xl border text-sm flex items-center gap-3 ${
                                  isSel
                                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                                    : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                                }`}
                                style={{ color: isSel ? color : undefined }}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <Icon size={18} className={isSel ? 'anim-glow' : ''} style={{ color: isSel ? color : undefined }} />
                                <span>{choice.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                          Où en es-tu aujourd'hui sur ce point ? (court)
                        </label>
                        <input
                          type="text"
                          value={active.currentStatus}
                          onChange={(e) => updateDraft({ currentStatus: e.target.value })}
                          placeholder="Ex: Débutant total / 2x par semaine irrégulier…"
                          className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                          À quoi ressemblerait une réussite dans 6 mois ?
                        </label>
                        <textarea
                          value={active.goalText}
                          onChange={(e) => updateDraft({ goalText: e.target.value })}
                          rows={2}
                          placeholder="Dans tes mots — conservé tel quel par le Système."
                          className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1 flex items-center justify-between">
                          Heures par semaine réalistes
                          <span className="font-display text-gold-bright">{active.weeklyTimeBudget}h</span>
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={30}
                          step={1}
                          value={active.weeklyTimeBudget}
                          onChange={(e) => updateDraft({ weeklyTimeBudget: Number(e.target.value) })}
                          className="w-full accent-gold"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  onClick={() => setStep(2)}
                  className="btn-press px-4 py-3 rounded-xl border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh flex items-center gap-1"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft size={18} /> Retour
                </motion.button>
                <motion.button
                  disabled={!draftsValid}
                  onClick={() => setStep(4)}
                  className="btn-press flex-1 py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 disabled:opacity-50 hover:shadow-gold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuer <ChevronRight size={18} />
                  {!draftsValid && <span className="text-[10px]">({domainCount}/2 min)</span>}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bloc 4 — Calibrage */}
        <AnimatePresence mode="wait">
          {step === 4 && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b22, #f59e0b00)', border: '1px solid #f59e0b44' }}>
                  <Zap size={24} color="#f59e0b" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-light text-pharaoh">Calibrage du coaching</h2>
                  <p className="text-pharaoh-subtle text-sm">Le Système adapte sa rigueur à votre profil.</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle">Intensité du Système :</p>
                {INTENSITIES.map((it) => (
                  <motion.button
                    key={it.value}
                    onClick={() => setCoachingIntensity(it.value)}
                    className={`btn-press w-full text-left px-4 py-3 rounded-xl border ${
                      coachingIntensity === it.value
                        ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                        : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${it.color}22`, border: `1px solid ${it.color}44` }}>
                        <it.icon size={20} style={{ color: it.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium block">{it.label}</span>
                        <span className="block text-xs text-pharaoh-subtle">{it.hint}</span>
                      </div>
                      {coachingIntensity === it.value && <Check size={18} color="var(--color-gold)" className="anim-pop" />}
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle">Si tu rates une quête, tu es plutôt team…</p>
                {PENALTIES.map((p) => (
                  <motion.button
                    key={p.value}
                    onClick={() => setPenaltyChoice(p.value)}
                    className={`btn-press w-full text-left px-4 py-3 rounded-xl border ${
                      penaltyChoice === p.value
                        ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                        : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}>
                        <p.icon size={20} style={{ color: p.color }} />
                      </div>
                      <span className="font-medium">{p.label}</span>
                      {penaltyChoice === p.value && <Check size={18} color="var(--color-gold)" className="anim-pop" />}
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-pharaoh-subtle mb-1">
                  Contrainte physique à prendre en compte ? <span className="text-pharaoh-muted font-normal tracking-normal">(optionnel — sert uniquement à borner la difficulté)</span>
                </label>
                <input
                  type="text"
                  value={physicalConstraint}
                  onChange={(e) => setPhysicalConstraint(e.target.value)}
                  placeholder="Ex: genou sensible, dos à ménager…"
                  className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-3 text-pharaoh focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </motion.div>

              <motion.div className="flex gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <motion.button
                  onClick={() => setStep(3)}
                  className="btn-press px-4 py-3 rounded-xl border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh flex items-center gap-1"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft size={18} /> Retour
                </motion.button>
                <motion.button
                  onClick={() => setStep(5)}
                  className="btn-press flex-1 py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuer <ChevronRight size={18} />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bloc 5 — Confirmation */}
        <AnimatePresence mode="wait">
          {step === 5 && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-3 rounded-xl bg-panel-gold">
                  <Check size={24} color="var(--color-gold)" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-light text-gradient-gold">Confirmation du Système</h2>
                  <p className="text-pharaoh-subtle text-sm">Vérifiez votre configuration avant l'éveil.</p>
                </div>
              </motion.div>

              <motion.p
                className="text-pharaoh-subtle text-sm italic bg-obsidian/50 border border-lapis-border rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                "{vision}"
              </motion.p>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {drafts.map((d, i) => {
                  const cat = DEFAULT_CATEGORY_FOR_TRACKING[d.tracking_type];
                  const editing = confirmEditIdx === i;
                  const Icon = TRACKING_ICON_MAP[d.tracking_type] || Target;
                  const color = TRACKING_COLOR_MAP[d.tracking_type] || '#06b6d4';
                  const style = DOMAIN_CATEGORY_STYLES[cat];

                  return (
                    <motion.div
                      key={d.tempId}
                      className={`border rounded-2xl p-4 bg-obsidian/50 transition-all ${editing ? 'border-gold/50 bg-panel-gold/20' : 'border-lapis-border'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                            <Icon size={20} style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-base font-light text-pharaoh truncate">{d.label}</p>
                            <p className="font-mono text-[10px] text-pharaoh-subtle">
                              {style.label} · {d.weeklyTimeBudget}h/sem
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => setConfirmEditIdx(editing ? null : i)}
                          className="btn-press text-xs font-mono tracking-wide px-3 py-1.5 rounded-lg shrink-0"
                          style={{
                            background: editing ? 'var(--color-gold)22' : 'transparent',
                            color: editing ? 'var(--color-gold)' : 'var(--color-gold-bright)',
                            border: editing ? '1px solid var(--color-gold)44' : 'none',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {editing ? 'Terminer' : 'Modifier'}
                        </motion.button>
                      </div>

                      <AnimatePresence mode="wait">
                        {editing && (
                          <motion.div
                            key="edit"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-3 border-t border-lapis-border/50"
                          >
                            <input
                              type="text"
                              value={d.label}
                              onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                              className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-2 text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                            />
                            <select
                              value={d.tracking_type}
                              onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, tracking_type: e.target.value as TrackingType } : x)))}
                              className="w-full min-w-0 bg-obsidian border border-lapis-border rounded-xl p-2 text-pharaoh text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
                            >
                              {TRACKING_TYPE_CHOICES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div className="flex gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <motion.button
                  onClick={() => setStep(4)}
                  className="btn-press px-4 py-3 rounded-xl border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh flex items-center gap-1"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft size={18} /> Retour
                </motion.button>
                <motion.button
                  onClick={finish}
                  className="btn-press flex-1 py-3 px-4 rounded-xl font-medium bg-panel-gold text-gold-bright border-gold/50 hover:shadow-gold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={20} /> Éveiller le Système
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};