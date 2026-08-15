import React, { useState } from 'react';
import { User, Target, Zap, Check, Plus, Trash2, Sparkles, ArrowLeft, Wand2 } from 'lucide-react';
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

/**
 * Onboarding v2 — real 4-block flow (Vision / Domaines / Calibrage / Confirmation).
 * Kept behind ONBOARDING_V2_ENABLED so the legacy flow can be restored by
 * flipping one flag (rollback path required by the task spec).
 */
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
  onComplete: (data: { userName: string; mainGoal: string; intensity: string }) => void;
  /** Onboarding v2 completion — receives the full structured result. */
  onCompleteV2?: (result: OnboardingV2Result) => void;
}

const INTENSITIES: { value: CoachingIntensity; label: string; hint: string }[] = [
  { value: 'gentle', label: 'Doux', hint: 'Le Système encourage, ne sanctionne presque jamais' },
  { value: 'balanced', label: 'Équilibré', hint: 'Fermes mais justes — le rythme par défaut' },
  { value: 'demanding', label: 'Exigeant', hint: 'Quêtes relevées, échecs assumés' },
];

const PENALTIES: { value: PenaltyCategory; label: string }[] = [
  { value: 'in_app_restriction', label: 'Restriction numérique dans l’app' },
  { value: 'creative_makeup', label: 'Tâche de rattrapage créative' },
  { value: 'none', label: 'Aucune pénalité' },
];

const newDraft = (): DomainDraft => ({
  tempId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  label: '',
  tracking_type: 'habit_checklist',
  currentStatus: '',
  goalText: '',
  weeklyTimeBudget: 3,
});

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, onCompleteV2 }) => {
  const useV2 = ONBOARDING_V2_ENABLED && !!onCompleteV2;
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [intensity, setIntensity] = useState('moderate');

  // ── v2 state ──
  const [vision, setVision] = useState('');
  const [drafts, setDrafts] = useState<DomainDraft[]>([newDraft()]);
  const [activeDraft, setActiveDraft] = useState(0);
  const [coachingIntensity, setCoachingIntensity] = useState<CoachingIntensity>('balanced');
  const [penaltyChoice, setPenaltyChoice] = useState<PenaltyCategory>('creative_makeup');
  const [physicalConstraint, setPhysicalConstraint] = useState('');
  const [confirmEditIdx, setConfirmEditIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // ─────────────────────── Legacy 3-field flow (rollback path) ──────────────
  if (!useV2) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#051428] backdrop-blur-sm">
        <div className="bg-[#051428] border border-cyan-500/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User className="text-cyan-400" /> Bienvenue Chasseur
              </h2>
              <p className="text-slate-300">Comment le Système doit-il vous appeler ?</p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Entrez votre nom..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
              />
              <button
                disabled={!userName}
                onClick={() => setStep(2)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="text-cyan-400" /> Votre Objectif
              </h2>
              <p className="text-slate-300">Quelle est votre quête principale ?</p>
              <input
                type="text"
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                placeholder="Ex: Devenir développeur, Musculation..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
              />
              <button
                disabled={!mainGoal}
                onClick={() => setStep(3)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="text-cyan-400" /> Intensité du Système
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {['débutant', 'modéré', 'avancé'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`p-4 rounded-xl border ${
                      intensity === level ? 'bg-cyan-950 border-cyan-500' : 'bg-slate-900 border-slate-700'
                    } text-white capitalize`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onComplete({ userName, mainGoal, intensity })}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Démarrer la Quête
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────── v2 flow ──────────────────────────────────
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

  const stepLabels = ['Vision', 'Domaines', 'Calibrage', 'Confirmation'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#051428]/95 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#051428] border border-cyan-500/30 rounded-2xl p-6 md:p-8 w-full max-w-xl shadow-2xl space-y-5 my-8">
        {/* Stepper */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`flex-1 h-1 rounded-full ${i + 1 <= step ? 'bg-cyan-400' : 'bg-slate-700'}`}
                title={label}
              />
            </div>
          ))}
        </div>
        <p className="mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
          Éveil du Système — {stepLabels[step - 1]}
        </p>

        {/* Bloc 1 — Vision */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-cyan-400" /> Bienvenue, Chasseur.
            </h2>
            <div>
              <label className="block text-slate-300 mb-1 text-sm">Comment le Système doit-il vous appeler ?</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Votre nom…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 text-sm">
                Décris en une ou deux phrases ce que tu veux accomplir dans les 3 à 6 prochains mois.
              </label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                rows={4}
                placeholder="Ex: Je veux transformer ma discipline, produire mon premier film et devenir plus fort physiquement…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none resize-none"
              />
            </div>
            <button
              disabled={!visionValid || !userName.trim()}
              onClick={() => setStep(2)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Bloc 2 — Domaines */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="text-cyan-400" /> Tes domaines de vie ({domainCount}/5)
            </h2>
            <button
              onClick={applyPreset}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-violet-500/50 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-sm"
            >
              <Wand2 className="w-4 h-4" /> Partir du preset « Créateur multi-discipline » (Musculation · Cinéma · Tech · École)
            </button>

            {/* Domain tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {drafts.map((d, i) => (
                <div key={d.tempId} className="flex items-center">
                  <button
                    onClick={() => setActiveDraft(i)}
                    className={`px-3 py-1.5 rounded-l-xl text-xs border ${
                      i === activeDraft
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    } ${drafts.length === 1 ? 'rounded-r-xl' : ''}`}
                  >
                    {d.label.trim() || `Domaine ${i + 1}`}
                  </button>
                  {drafts.length > 2 && i === activeDraft && (
                    <button
                      onClick={() => removeDraft(i)}
                      title="Supprimer ce domaine"
                      className="px-2 py-1.5 rounded-r-xl border border-l-0 border-slate-700 bg-slate-900 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {domainCount < 5 && (
                <button
                  onClick={addDraft}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-cyan-300 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              )}
            </div>

            {/* Active domain form */}
            {active && (
              <div className="space-y-3 border border-slate-700/60 rounded-xl p-4 bg-slate-900/40">
                <div>
                  <label className="block text-slate-300 mb-1 text-sm">Comment tu appelles ce domaine ?</label>
                  <input
                    type="text"
                    value={active.label}
                    onChange={(e) => updateDraft({ label: e.target.value })}
                    placeholder="Ex: Piano, Ma startup, Révisions internat…"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-sm">Ça ressemble le plus à…</label>
                  <div className="space-y-2">
                    {TRACKING_TYPE_CHOICES.map((choice) => (
                      <button
                        key={choice.value}
                        onClick={() => updateDraft({ tracking_type: choice.value })}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-sm ${
                          active.tracking_type === choice.value
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-sm">Où en es-tu aujourd'hui sur ce point ? (court)</label>
                  <input
                    type="text"
                    value={active.currentStatus}
                    onChange={(e) => updateDraft({ currentStatus: e.target.value })}
                    placeholder="Ex: Débutant total / 2x par semaine irrégulier…"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-sm">À quoi ressemblerait une réussite dans 6 mois ?</label>
                  <textarea
                    value={active.goalText}
                    onChange={(e) => updateDraft({ goalText: e.target.value })}
                    rows={2}
                    placeholder="Dans tes mots — conservé tel quel par le Système."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-sm">
                    Heures par semaine réalistes : <span className="text-cyan-300 font-bold">{active.weeklyTimeBudget}h</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={active.weeklyTimeBudget}
                    onChange={(e) => updateDraft({ weeklyTimeBudget: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                disabled={!draftsValid}
                onClick={() => setStep(3)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold disabled:opacity-50"
              >
                {draftsValid ? 'Continuer' : `Ajoute au moins 2 domaines nommés (${domainCount}/2)`}
              </button>
            </div>
          </div>
        )}

        {/* Bloc 3 — Calibrage */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-cyan-400" /> Calibrage du coaching
            </h2>
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">Intensité du Système :</p>
              {INTENSITIES.map((it) => (
                <button
                  key={it.value}
                  onClick={() => setCoachingIntensity(it.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${
                    coachingIntensity === it.value
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="font-bold">{it.label}</span>
                  <span className="block text-xs opacity-70">{it.hint}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">Si tu rates une quête, tu es plutôt team…</p>
              {PENALTIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPenaltyChoice(p.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                    penaltyChoice === p.value
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-slate-300 mb-1 text-sm">
                Contrainte physique à prendre en compte ? <span className="opacity-60">(optionnel — sert uniquement à borner la difficulté, jamais d'interprétation médicale)</span>
              </label>
              <input
                type="text"
                value={physicalConstraint}
                onChange={(e) => setPhysicalConstraint(e.target.value)}
                placeholder="Ex: genou sensible, dos à ménager…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Bloc 4 — Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Check className="text-cyan-400" /> Confirmation du Système
            </h2>
            <p className="text-slate-400 text-sm">{vision}</p>
            <div className="space-y-2">
              {drafts.map((d, i) => {
                const cat = DEFAULT_CATEGORY_FOR_TRACKING[d.tracking_type];
                const editing = confirmEditIdx === i;
                return (
                  <div key={d.tempId} className="border border-slate-700/60 rounded-xl p-3 bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{DOMAIN_CATEGORY_STYLES[cat].emoji}</span>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate">{d.label}</p>
                          <p className="text-xs text-slate-400">
                            {DOMAIN_CATEGORY_STYLES[cat].label} · {d.weeklyTimeBudget}h/sem
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmEditIdx(editing ? null : i)}
                        className="text-xs text-cyan-400 hover:underline shrink-0"
                      >
                        {editing ? 'Terminer' : 'Modifier'}
                      </button>
                    </div>
                    {editing && (
                      <div className="space-y-2 pt-2 border-t border-slate-700/60">
                        <input
                          type="text"
                          value={d.label}
                          onChange={(e) =>
                            setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-sm outline-none"
                        />
                        <select
                          value={d.tracking_type}
                          onChange={(e) =>
                            setDrafts((prev) =>
                              prev.map((x, j) => (j === i ? { ...x, tracking_type: e.target.value as TrackingType } : x))
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-sm outline-none"
                        >
                          {TRACKING_TYPE_CHOICES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={finish}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl p-3 font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Éveiller le Système
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
