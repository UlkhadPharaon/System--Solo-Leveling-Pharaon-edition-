import React, { useState } from 'react';
import { VictoryLog } from '../types';
import { triggerVictoryConfetti } from '../lib/confetti';
import { playSfx } from '../lib/sfx';
import { ConfirmDialog } from './ui/ConfirmDialog';
import {
  Trophy,
  Plus,
  Star,
  Flame,
  Sparkles,
  CheckCircle2,
  Trash2,
  Calendar,
  Medal,
  Zap,
  X,
  Check,
  ArrowRight
} from './ui/PharaohIcons';

interface VictoryJournalProps {
  logs: VictoryLog[];
  onAddLog: (log: VictoryLog) => void;
  onDeleteLog: (id: string) => void;
  /** User domains (onboarding v2) — samples, intro & badges become domain-driven. */
  domains?: { label: string }[];
}

export const VictoryJournal: React.FC<VictoryJournalProps> = ({
  logs,
  onAddLog,
  onDeleteLog,
  domains = [],
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  // #3 UX audit: deleting an XP-bearing log was a single unconfirmed tap.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteLog = logs.find((l) => l.id === pendingDeleteId) ?? null;

  // Form State
  const [successInput, setSuccessInput] = useState('');
  const [successList, setSuccessList] = useState<string[]>([
    domains.length > 0
      ? `Aujourd’hui j’ai travaillé sur : ${domains.map((d) => d.label).slice(0, 3).join(', ')}.`
      : 'Séance de musculation matinale de 45m et 10m d’élocution complétées.',
  ]);
  const [improvementInput, setImprovementInput] = useState('');
  const [improvementList, setImprovementList] = useState<string[]>([
    domains.length > 0
      ? 'Rester concentré sur mes objectifs sans distractions parasites.'
      : 'Maintenir la concentration sans ouvrir d’onglets non essentiels pendant le travail Bangre Neo.',
  ]);
  const [energyRating, setEnergyRating] = useState<number>(5);
  const [moodRating, setMoodRating] = useState<number>(5);
  const [highlights, setHighlights] = useState('');
  const [gratitude, setGratitude] = useState('');

  const handleAddSuccess = () => {
    if (!successInput.trim()) return;
    setSuccessList([...successList, successInput.trim()]);
    setSuccessInput('');
  };

  const handleAddImprovement = () => {
    if (!improvementInput.trim()) return;
    setImprovementList([...improvementList, improvementInput.trim()]);
    setImprovementInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (successList.length === 0) return;

    // Trigger celebration confetti
    triggerVictoryConfetti();

    const newLog: VictoryLog = {
      id: 'vl-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      successes: successList,
      improvements: improvementList,
      energyRating,
      moodRating,
      highlights: highlights || 'Excellente discipline et très bonne concentration aujourd’hui.',
      gratitude: gratitude || 'Reconnaissant pour la santé, l’énergie et l’opportunité d’avancer.',
      createdAt: new Date().toISOString(),
    };

    onAddLog(newLog);
    playSfx('system-popup', 0.9);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 anim-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide font-medium bg-gold/10 text-gold border border-gold/40 flex items-center gap-1.5">
                <Trophy size={14} color="var(--color-gold)" />
                Journal de Haut Faits & Croissance
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-light text-gradient-gold tracking-wide">
              Registre des Succès & Améliorations
            </h2>
            <p className="text-xs text-pharaoh-muted mt-2 max-w-2xl leading-relaxed">
              {domains.length > 0
                ? `Enregistrez vos hauts faits quotidiens, célébrez vos progrès sur vos domaines : ${domains.map((d) => d.label).slice(0, 4).join(', ')}.`
                : 'Enregistrez vos haut faits quotidiennes, célébrez vos progrès sur Bangre Neo Lab et vos projets Cinéma, et perfectionnez votre routine jour après jour.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="btn-press flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs tracking-wide font-medium transition-all self-start md:self-auto"
          >
            <Plus size={16} color="var(--color-gold-bright)" />
            <span>Enregistrer des Haut Faits</span>
          </button>
        </div>
      </div>

      {/* Unlocked Milestones & Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {(domains.length > 0
          ? domains.slice(0, 4).map((d, i) => ({
              title: d.label,
              desc: 'Progrès & régularité sur ce domaine',
              icon: [Flame, Zap, Medal, Sparkles][i % 4],
            }))
          : [
              { title: 'Guerrier du Matin', desc: '45m Musculation & 10m Élocution', icon: Flame },
              { title: 'Pionnier Bangre Neo', desc: '15h+ Ingénierie Lab', icon: Zap },
              { title: 'Scénariste Cinéma', desc: 'Dialogues & Plan de Film', icon: Medal },
              { title: 'Érudit Académique', desc: 'SVT, Maths, PC & Hist-Géo', icon: Sparkles },
            ]
        ).map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-panel border border-lapis-border hover:border-gold/40 hover-lift flex items-center gap-3.5 transition-all"
            >
              <div className="p-2.5 rounded-xl bg-panel-gold border border-gold/30 text-gold">
                <Icon size={20} color="var(--color-gold)" />
              </div>
              <div>
                <h4 className="font-display text-lg font-light text-pharaoh tracking-wide">{badge.title}</h4>
                <p className="font-mono text-[10px] uppercase text-pharaoh-subtle">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Entry Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-lapis border border-gold/50 rounded-2xl max-w-xl w-full p-6 shadow-card-hover space-y-5 my-8 anim-pop">
            <div className="flex items-center justify-between border-b border-lapis-border pb-3">
              <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide flex items-center gap-2">
                <Trophy size={20} color="var(--color-gold)" />
                Enregistrer les Haut Faits & Réglages
              </h3>
              <span className="font-mono text-xs text-pharaoh-subtle">
                {new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Successes */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] tracking-wide font-medium text-pharaoh-subtle flex items-center gap-1.5">
                  <CheckCircle2 size={16} color="var(--color-emerald)" />
                  Qu'est-ce qui s'est bien passé aujourd'hui ? (Succès & Haut Faits)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex : Écrit 3 pages de dialogues de scénario..."
                    value={successInput}
                    onChange={(e) => setSuccessInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSuccess())}
                    className="flex-1 bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddSuccess}
                    className="btn-press px-3 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono uppercase text-[11px]"
                  >
                    Ajouter Haut Fait
                  </button>
                </div>

                <ul className="space-y-1 mt-2">
                  {successList.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-obsidian border border-lapis-border text-pharaoh">
                      <span className="flex items-center gap-1.5"><Check size={12} color="var(--color-emerald)" className="shrink-0" /> {item}</span>
                      <button
                        type="button"
                        onClick={() => setSuccessList(successList.filter((_, idx) => idx !== i))}
                        className="text-pharaoh-subtle hover:text-blood transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] tracking-wide font-medium text-pharaoh-subtle flex items-center gap-1.5">
                  <Sparkles size={16} color="var(--color-amethyst)" />
                  Que puis-je améliorer demain ?
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex : Désactiver le téléphone pendant la session Bangre Neo de 14h..."
                    value={improvementInput}
                    onChange={(e) => setImprovementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImprovement())}
                    className="flex-1 bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddImprovement}
                    className="btn-press px-3 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono uppercase text-[11px]"
                  >
                    Ajouter Perfectionnement
                  </button>
                </div>

                <ul className="space-y-1 mt-2">
                  {improvementList.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted">
                      <span className="flex items-center gap-1.5"><ArrowRight size={12} color="var(--color-amethyst)" className="shrink-0" /> {item}</span>
                      <button
                        type="button"
                        onClick={() => setImprovementList(improvementList.filter((_, idx) => idx !== i))}
                        className="text-pharaoh-subtle hover:text-blood transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Niveau d'Énergie (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEnergyRating(star)}
                        className={`btn-press p-1.5 rounded-xl border ${
                          energyRating >= star
                            ? 'bg-panel-gold text-gold-bright border-gold/50'
                            : 'bg-obsidian text-pharaoh-subtle border-lapis-border'
                        }`}
                      >
                        <Zap size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Humeur & Motivation (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMoodRating(star)}
                        className={`btn-press p-1.5 rounded-xl border ${
                          moodRating >= star
                            ? 'bg-panel-gold text-gold-bright border-gold/50'
                            : 'bg-obsidian text-pharaoh-subtle border-lapis-border'
                        }`}
                      >
                        <Star size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Faits Marquants & Réflexions</label>
                <textarea
                  rows={2}
                  placeholder="Moment fort ou percée du jour..."
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Gratitude Quotidienne</label>
                <textarea
                  rows={2}
                  placeholder="De quoi êtes-vous reconnaissant aujourd'hui ?"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-lapis-border">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-press px-4 py-2 rounded-xl bg-obsidian text-pharaoh-muted border border-lapis-border font-mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase"
                >
                  Enregistrer le Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Victory Logs List */}
      <div className="space-y-4">
        <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide flex items-center gap-2 border-b border-lapis-border pb-2">
          <Calendar size={20} color="var(--color-gold)" />
          Journaux de Haut Faits & Réflexions Passés
        </h3>
        {logs.length === 0 && (
          <div className="rounded-2xl border border-lapis-border bg-obsidian-elevated/40 px-6 py-10 text-center space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-gold-dim" />
            <p className="font-display text-base text-pharaoh">Aucune victoire enregistrée</p>
            <p className="text-xs text-pharaoh-subtle">Chaque soir, consignez vos hauts faits — le Système récompense la constance.</p>
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-panel border border-lapis-border rounded-2xl p-6 space-y-4 relative group hover-lift"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lapis-border pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gold bg-obsidian px-2.5 py-1 rounded-xl border border-gold-dim">
                  {log.date}
                </span>
                <span className="font-mono text-[10px] uppercase text-pharaoh-subtle flex items-center gap-2">
                  Énergie : <strong className="text-gold font-mono">{log.energyRating}/5</strong> | Humeur : <strong className="text-gold font-mono">{log.moodRating}/5</strong>
                </span>
              </div>

              <button
                onClick={() => setPendingDeleteId(log.id)}
                className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 text-pharaoh-subtle hover:text-blood transition-all self-end sm:self-auto"
                title="Supprimer le journal"
                aria-label={`Supprimer le journal du ${log.date}`}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wins */}
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] tracking-wide font-medium text-emerald flex items-center gap-1.5">
                  <CheckCircle2 size={14} color="var(--color-emerald)" />
                  Succès & Réalisations
                </h4>
                <ul className="space-y-1.5">
                  {log.successes.map((s, idx) => (
                    <li key={idx} className="text-xs text-pharaoh bg-obsidian p-2.5 rounded-xl border border-lapis-border flex items-start gap-1.5">
                      <Check size={12} color="var(--color-emerald)" className="shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] tracking-wide font-medium text-amethyst flex items-center gap-1.5">
                  <Sparkles size={14} color="var(--color-amethyst)" />
                  Objectifs d'Amélioration
                </h4>
                <ul className="space-y-1.5">
                  {log.improvements.map((imp, idx) => (
                    <li key={idx} className="text-xs text-pharaoh-muted bg-obsidian p-2.5 rounded-xl border border-lapis-border flex items-start gap-1.5">
                      <ArrowRight size={12} color="var(--color-amethyst)" className="shrink-0 mt-0.5" /> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {log.highlights && (
              <div className="text-xs bg-obsidian border border-gold/30 rounded-xl p-3 text-pharaoh">
                <strong className="text-gold font-mono uppercase text-[10px] mr-1">Fait Marquant :</strong> {log.highlights}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation (#3 UX audit) — logs are XP-bearing and irreplaceable */}
      <ConfirmDialog
        isOpen={pendingDeleteLog != null}
        title="Supprimer ce journal ?"
        message="Cette entrée de victoire sera définitivement supprimée de votre historique. L'XP déjà gagnée est conservée, mais le souvenir sera perdu."
        details={pendingDeleteLog ? `Journal du ${pendingDeleteLog.date} — ${pendingDeleteLog.successes.length} succès consignés` : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        onConfirm={() => {
          if (pendingDeleteId) onDeleteLog(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};
