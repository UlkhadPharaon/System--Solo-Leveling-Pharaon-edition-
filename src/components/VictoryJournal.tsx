import React, { useState } from 'react';
import { VictoryLog } from '../types';
import { triggerVictoryConfetti } from '../lib/confetti';
import { 
  Trophy, 
  Plus, 
  Star, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface VictoryJournalProps {
  logs: VictoryLog[];
  onAddLog: (log: VictoryLog) => void;
  onDeleteLog: (id: string) => void;
}

export const VictoryJournal: React.FC<VictoryJournalProps> = ({
  logs,
  onAddLog,
  onDeleteLog,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [successInput, setSuccessInput] = useState('');
  const [successList, setSuccessList] = useState<string[]>([
    'Séance de musculation matinale de 45m et 10m d’élocution complétées.',
  ]);
  const [improvementInput, setImprovementInput] = useState('');
  const [improvementList, setImprovementList] = useState<string[]>([
    'Maintenir la concentration sans ouvrir d’onglets non essentiels pendant le travail Bangre Neo.',
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
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-soft p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 accent-cyan" />
                Journal de Haut Faits & Croissance
              </span>
            </div>
            <h2 className="serif text-3xl md:text-4xl font-light italic text-white tracking-tight">
              Registre des Succès & Améliorations
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Enregistrez vos haut faits quotidiennes, célébrez vos progrès sur Bangre Neo Lab et vos projets Cinéma, et perfectionnez votre routine jour après jour.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs tracking-wide font-medium transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Enregistrer des Haut Faits</span>
          </button>
        </div>
      </div>

      {/* Unlocked Milestones & Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Guerrier du Matin', desc: '45m Musculation & 10m Élocution', icon: Flame },
          { title: 'Pionnier Bangre Neo', desc: '15h+ Ingénierie Lab', icon: Zap },
          { title: 'Scénariste Cinéma', desc: 'Dialogues & Plan de Film', icon: Award },
          { title: 'Érudit Académique', desc: 'SVT, Maths, PC & Hist-Géo', icon: Sparkles },
        ].map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-card border border-soft hover:border-cyan/40 flex items-center gap-3.5 transition-all"
            >
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-soft text-cyan-400">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="serif text-lg font-light italic text-white">{badge.title}</h4>
                <p className="mono text-[10px] uppercase opacity-60">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Entry Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-soft pb-3">
              <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 accent-cyan" />
                Enregistrer les Haut Faits & Réglages
              </h3>
              <span className="mono text-xs opacity-60">
                {new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Successes */}
              <div className="space-y-2">
                <label className="block mono text-[10px] tracking-wide font-medium text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 accent-cyan" />
                  Qu'est-ce qui s'est bien passé aujourd'hui ? (Succès & Haut Faits)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex : Écrit 3 pages de dialogues de scénario..."
                    value={successInput}
                    onChange={(e) => setSuccessInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSuccess())}
                    className="flex-1 bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan"
                  />
                  <button
                    type="button"
                    onClick={handleAddSuccess}
                    className="px-3 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan font-mono uppercase text-[11px]"
                  >
                    Ajouter Haut Fait
                  </button>
                </div>

                <ul className="space-y-1 mt-2">
                  {successList.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-soft text-slate-200">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => setSuccessList(successList.filter((_, idx) => idx !== i))}
                        className="text-slate-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <label className="block mono text-[10px] tracking-wide font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 accent-cyan" />
                  Que puis-je améliorer demain ?
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex : Désactiver le téléphone pendant la session Bangre Neo de 14h..."
                    value={improvementInput}
                    onChange={(e) => setImprovementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImprovement())}
                    className="flex-1 bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan"
                  />
                  <button
                    type="button"
                    onClick={handleAddImprovement}
                    className="px-3 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan font-mono uppercase text-[11px]"
                  >
                    Ajouter Perfectionnement
                  </button>
                </div>

                <ul className="space-y-1 mt-2">
                  {improvementList.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-soft text-slate-300">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => setImprovementList(improvementList.filter((_, idx) => idx !== i))}
                        className="text-slate-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Niveau d'Énergie (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEnergyRating(star)}
                        className={`p-1.5 rounded-xl border ${
                          energyRating >= star
                            ? 'bg-card text-cyan-400 border-cyan'
                            : 'bg-cyan-950/40 text-slate-600 border-soft'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Humeur & Motivation (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMoodRating(star)}
                        className={`p-1.5 rounded-xl border ${
                          moodRating >= star
                            ? 'bg-card text-cyan-400 border-cyan'
                            : 'bg-cyan-950/40 text-slate-600 border-soft'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Faits Marquants & Réflexions</label>
                <textarea
                  rows={2}
                  placeholder="Moment fort ou percée du jour..."
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Gratitude Quotidienne</label>
                <textarea
                  rows={2}
                  placeholder="De quoi êtes-vous reconnaissant aujourd'hui ?"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/40 text-slate-300 mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase"
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
        <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
          <Calendar className="w-5 h-5 accent-cyan" />
          Journaux de Haut Faits & Réflexions Passés
        </h3>

        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-card border border-soft rounded-xl p-6 space-y-4 relative group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-soft pb-3">
              <div className="flex items-center gap-3">
                <span className="mono text-xs text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan">
                  {log.date}
                </span>
                <span className="mono text-[10px] uppercase opacity-60 flex items-center gap-2">
                  Énergie : <strong className="accent-cyan">{log.energyRating}/5</strong> | Humeur : <strong className="accent-cyan">{log.moodRating}/5</strong>
                </span>
              </div>

              <button
                onClick={() => onDeleteLog(log.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all self-end sm:self-auto"
                title="Supprimer le journal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wins */}
              <div className="space-y-2">
                <h4 className="mono text-[10px] tracking-wide font-medium text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 accent-cyan" />
                  Succès & Réalisations
                </h4>
                <ul className="space-y-1.5">
                  {log.successes.map((s, idx) => (
                    <li key={idx} className="text-xs text-slate-200 bg-cyan-950/40 p-2.5 rounded-xl border border-soft">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-2">
                <h4 className="mono text-[10px] tracking-wide font-medium text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 accent-cyan" />
                  Objectifs d'Amélioration
                </h4>
                <ul className="space-y-1.5">
                  {log.improvements.map((imp, idx) => (
                    <li key={idx} className="text-xs text-slate-300 bg-cyan-950/40 p-2.5 rounded-xl border border-soft">
                      ➔ {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {log.highlights && (
              <div className="text-xs bg-cyan-950/40 border border-cyan/30 rounded-xl p-3 text-slate-200">
                <strong className="accent-cyan font-mono uppercase text-[10px] mr-1">Fait Marquant :</strong> {log.highlights}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
