import React, { useState } from 'react';
import { ProjectPhase, PhaseStatus, ProjectDeliverable, NoteItem } from '../types';
import { 
  Film, 
  Code, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  Square, 
  Trash2, 
  FileText, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Layers
} from 'lucide-react';
import { triggerVictoryConfetti } from '../lib/confetti';

interface ProjectTimelineViewProps {
  phases: ProjectPhase[];
  onAddPhase: (phase: ProjectPhase) => void;
  onUpdatePhase: (phase: ProjectPhase) => void;
  onDeletePhase: (id: string) => void;
  onCreateNoteFromPhase: (note: NoteItem) => void;
}

export const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({
  phases,
  onAddPhase,
  onUpdatePhase,
  onDeletePhase,
  onCreateNoteFromPhase,
}) => {
  const [selectedProject, setSelectedProject] = useState<'all' | 'cinema' | 'bangre_neo'>('cinema');
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Record<string, boolean>>({
    'phase-cin-2': true,
    'phase-lab-2': true,
  });

  // New Phase Modal State
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'cinema' | 'bangre_neo' | 'school' | 'general'>('cinema');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newStatus, setNewStatus] = useState<PhaseStatus>('in_progress');
  const [newKeyDeliverable, setNewKeyDeliverable] = useState('');
  const [newDeliverablesRaw, setNewDeliverablesRaw] = useState('');

  // Inline deliverable input state per phase
  const [newDeliverableInput, setNewDeliverableInput] = useState<Record<string, string>>({});

  const filteredPhases = phases
    .filter((p) => selectedProject === 'all' || p.projectCategory === selectedProject)
    .sort((a, b) => a.phaseNumber - b.phaseNumber);

  const totalPhases = (filteredPhases || []).length;
  const completedPhases = (filteredPhases || []).filter((p) => p.status === 'completed').length;
  const inProgressPhases = (filteredPhases || []).filter((p) => p.status === 'in_progress').length;
  const upcomingPhases = (filteredPhases || []).filter((p) => p.status === 'upcoming').length;

  const totalDeliverablesCount = (filteredPhases || []).reduce((acc, p) => acc + (p.deliverables || []).length, 0);
  const completedDeliverablesCount = (filteredPhases || []).reduce(
    (acc, p) => acc + (p.deliverables || []).filter((d) => d.isCompleted).length,
    0
  );

  const overallProgressPercent = totalDeliverablesCount > 0
    ? Math.round((completedDeliverablesCount / totalDeliverablesCount) * 100)
    : totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedPhaseIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleDeliverable = (phase: ProjectPhase, deliverableId: string) => {
    const updatedDeliverables = phase.deliverables.map((d) => {
      if (d.id === deliverableId) {
        return { ...d, isCompleted: !d.isCompleted };
      }
      return d;
    });

    const allCompleted = (updatedDeliverables || []).length > 0 && (updatedDeliverables || []).every((d) => d.isCompleted);
    const newPhaseStatus: PhaseStatus = allCompleted
      ? 'completed'
      : updatedDeliverables.some((d) => d.isCompleted)
      ? 'in_progress'
      : phase.status;

    if (allCompleted && phase.status !== 'completed') {
      triggerVictoryConfetti();
    }

    onUpdatePhase({
      ...phase,
      status: newPhaseStatus,
      deliverables: updatedDeliverables,
    });
  };

  const handleStatusChange = (phase: ProjectPhase, status: PhaseStatus) => {
    if (status === 'completed' && phase.status !== 'completed') {
      triggerVictoryConfetti();
    }
    onUpdatePhase({ ...phase, status });
  };

  const handleAddDeliverable = (phase: ProjectPhase) => {
    const title = newDeliverableInput[phase.id]?.trim();
    if (!title) return;

    const newDeliverable: ProjectDeliverable = {
      id: 'del-' + Date.now(),
      title,
      isCompleted: false,
    };

    onUpdatePhase({
      ...phase,
      deliverables: [...phase.deliverables, newDeliverable],
    });

    setNewDeliverableInput((prev) => ({ ...prev, [phase.id]: '' }));
  };

  const handleCreateNoteFromPhase = (phase: ProjectPhase) => {
    const deliverablesList = phase.deliverables
      .map((d) => `- [${d.isCompleted ? 'x' : ' '}] ${d.title}`)
      .join('\n');

    const newNote: NoteItem = {
      id: 'note-phase-' + Date.now(),
      title: `Phase ${phase.phaseNumber}: ${phase.title}`,
      content: `# Phase de Projet ${phase.phaseNumber}: ${phase.title}\n\n**Catégorie**: ${phase.projectCategory.toUpperCase()}\n**Statut**: ${phase.status.toUpperCase()}\n**Échéance Cible**: ${phase.targetDate || 'À définir'}\n\n## Livrable Clé\n> ${phase.keyDeliverable}\n\n## Description de la Phase\n${phase.description}\n\n## Liste des Livrables\n${deliverablesList}\n\n## Notes & Journal d'Exécution\n- `,
      category: phase.projectCategory,
      tags: [phase.projectCategory, 'ChronologiePhase', `Phase${phase.phaseNumber}`],
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateNoteFromPhase(newNote);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const delList: ProjectDeliverable[] = newDeliverablesRaw
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, idx) => ({
        id: `del-custom-${Date.now()}-${idx}`,
        title: item.replace(/^[-*]\s*/, ''),
        isCompleted: false,
      }));

    const categoryPhases = (phases || []).filter((p) => p.projectCategory === newCategory);
    const nextPhaseNum = (categoryPhases || []).length + 1;

    const newPhase: ProjectPhase = {
      id: 'phase-' + Date.now(),
      phaseNumber: nextPhaseNum,
      title: newTitle,
      projectCategory: newCategory,
      description: newDescription,
      targetDate: newTargetDate,
      status: newStatus,
      keyDeliverable: newKeyDeliverable || newTitle,
      deliverables: (delList || []).length > 0 ? delList : [{ id: 'del-1', title: 'Configuration initiale', isCompleted: false }],
      createdAt: new Date().toISOString(),
    };

    onAddPhase(newPhase);
    setIsAddingPhase(false);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewTargetDate('');
    setNewKeyDeliverable('');
    setNewDeliverablesRaw('');
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs & Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-soft p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setSelectedProject('cinema')}
            className={`px-3 py-1.5 rounded-xl mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
              selectedProject === 'cinema'
                ? 'bg-cyan-950/40 text-amber-300 border border-cyan shadow-sm'
                : 'bg-black/30 text-slate-400 hover:text-slate-200 border border-soft'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Feuille de Route Cinéma</span>
          </button>

          <button
            onClick={() => setSelectedProject('bangre_neo')}
            className={`px-3 py-1.5 rounded-xl mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
              selectedProject === 'bangre_neo'
                ? 'bg-cyan-950/40 text-purple-300 border border-purple-500/60 shadow-sm'
                : 'bg-black/30 text-slate-400 hover:text-slate-200 border border-soft'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span>Spécifications Bangre Neo</span>
          </button>

          <button
            onClick={() => setSelectedProject('all')}
            className={`px-3 py-1.5 rounded-xl mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
              selectedProject === 'all'
                ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'bg-black/30 text-slate-400 hover:text-slate-200 border border-soft'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Toutes les Phases</span>
          </button>
        </div>

        <button
          onClick={() => setIsAddingPhase(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-card hover:bg-card-hover text-amber-300 border border-cyan mono text-xs uppercase transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Ajouter une Phase</span>
        </button>
      </div>

      {/* Overview Progress Header */}
      <div className="bg-gradient-to-r from-[#161920] via-card to-[#161920] border border-soft rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="mono text-[10px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {selectedProject === 'cinema'
                  ? 'Chronologie du Long-Métrage Cinéma'
                  : selectedProject === 'bangre_neo'
                  ? 'Feuille de Route du Lab Autonome Bangre Neo'
                  : 'Feuille de Route Globale Multi-Projets'}
              </span>
            </div>
            <h3 className="serif text-xl font-light italic text-white">
              {selectedProject === 'cinema'
                ? 'The Gold Horizon — Du Scénario à la Première'
                : selectedProject === 'bangre_neo'
                ? 'Aura Engine — De l’Architecture au Déploiement Cloud'
                : 'Toutes les Phases de Projets & Échéances'}
            </h3>
          </div>

          {/* Meter Stats */}
          <div className="flex items-center gap-4 bg-black/40 border border-soft p-3 rounded-xl self-start md:self-auto shrink-0">
            <div>
              <div className="mono text-[10px] uppercase text-slate-400">Progression Globale</div>
              <div className="serif text-xl font-medium text-amber-300">{overallProgressPercent}%</div>
            </div>
            <div className="h-8 w-px bg-soft" />
            <div className="grid grid-cols-3 gap-3 text-center mono text-[10px]">
              <div>
                <div className="text-emerald-400 font-bold">{completedPhases}</div>
                <div className="text-slate-500">Terminé</div>
              </div>
              <div>
                <div className="text-amber-400 font-bold">{inProgressPhases}</div>
                <div className="text-slate-500">Actif</div>
              </div>
              <div>
                <div className="text-slate-400 font-bold">{upcomingPhases}</div>
                <div className="text-slate-500">À venir</div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mono">
            <span className="text-slate-400">
              Livrables Réalisés : <strong className="text-white">{completedDeliverablesCount}</strong> / {totalDeliverablesCount}
            </span>
            <span className="text-amber-300">{overallProgressPercent}% Complété</span>
          </div>
          <div className="h-2 w-full bg-[#101216] rounded-full overflow-hidden border border-soft">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="relative pl-4 md:pl-8 space-y-6 before:absolute before:left-3 md:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-500/80 before:via-purple-500/50 before:to-slate-800">
        {filteredPhases.map((phase) => {
          const isExpanded = expandedPhaseIds[phase.id] ?? false;
          const phaseDelivTotal = (phase.deliverables || []).length;
          const phaseDelivDone = (phase.deliverables || []).filter((d) => d.isCompleted).length;
          const phasePercent = phaseDelivTotal > 0 ? Math.round((phaseDelivDone / phaseDelivTotal) * 100) : 0;

          const isCinema = phase.projectCategory === 'cinema';

          const getStatusLabel = (st: PhaseStatus) => {
            if (st === 'completed') return 'Terminé';
            if (st === 'in_progress') return 'En cours';
            return 'À venir';
          };

          return (
            <div key={phase.id} className="relative group">
              {/* Stepper Node Icon */}
              <div
                className={`absolute -left-4 md:-left-8 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  phase.status === 'completed'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : phase.status === 'in_progress'
                    ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : phase.status === 'in_progress' ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Timeline Card */}
              <div
                className={`bg-card border rounded-xl p-4 md:p-5 transition-all space-y-4 ${
                  phase.status === 'completed'
                    ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/10 via-card to-card'
                    : phase.status === 'in_progress'
                    ? isCinema
                      ? 'border-amber-500/60 bg-gradient-to-r from-amber-950/20 via-card to-card shadow-lg shadow-amber-500/5'
                      : 'border-purple-500/60 bg-gradient-to-r from-purple-950/20 via-card to-card shadow-lg shadow-purple-500/5'
                    : 'border-soft bg-black/20 opacity-85'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-soft pb-3">
                  <div className="flex items-center gap-3">
                    <span className="mono text-[10px] font-bold tracking-wide font-medium px-2 py-0.5 rounded-xl bg-black/60 border border-soft text-slate-300">
                      Phase 0{phase.phaseNumber}
                    </span>

                    <span
                      className={`mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl border ${
                        isCinema
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : phase.projectCategory === 'bangre_neo'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {phase.projectCategory.replace('_', ' ')}
                    </span>

                    <h4 className="serif text-lg font-normal italic text-white">{phase.title}</h4>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="flex items-center gap-1 bg-black/40 border border-soft p-1 rounded-xl">
                      {(['completed', 'in_progress', 'upcoming'] as PhaseStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(phase, st)}
                          className={`mono text-[9px] uppercase px-2 py-0.5 rounded-xl transition-all ${
                            phase.status === st
                              ? st === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : st === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : 'bg-slate-800 text-slate-300 border border-slate-600'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {getStatusLabel(st)}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCreateNoteFromPhase(phase)}
                      className="p-1.5 rounded-xl bg-cyan-950/40 border border-soft text-slate-400 hover:text-amber-300 transition-colors"
                      title="Générer une note pour cette phase"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeletePhase(phase.id)}
                      className="p-1.5 rounded-xl bg-cyan-950/40 border border-soft text-slate-500 hover:text-red-400 transition-colors"
                      title="Supprimer la phase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description & Key Deliverable Callout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">{phase.description}</p>

                    {phase.targetDate && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mono">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Échéance Cible : {phase.targetDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 bg-black/40 border border-soft rounded-xl p-3 space-y-1">
                    <div className="mono text-[9px] uppercase text-amber-400 flex items-center gap-1 font-bold">
                      <Target className="w-3 h-3" />
                      Livrable Clé Attendu
                    </div>
                    <div className="serif text-xs italic text-slate-200">{phase.keyDeliverable}</div>
                  </div>
                </div>

                {/* Deliverables Checklist Toggle Header */}
                <div className="pt-2 border-t border-soft">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(phase.id)}
                      className="flex items-center gap-2 mono text-xs text-amber-300 hover:text-amber-200 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>
                        Tâches de la Phase ({phaseDelivDone}/{phaseDelivTotal} réalisées)
                      </span>
                      <span className="mono text-[10px] text-slate-400">({phasePercent}%)</span>
                    </button>

                    {/* Progress Bar Mini */}
                    <div className="w-32 h-1.5 bg-[#101216] rounded-full overflow-hidden border border-soft">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${phasePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Task Deliverables Checklist */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 bg-[#13151A] border border-soft rounded-xl p-3.5">
                      <div className="space-y-2">
                        {(phase.deliverables || []).map((deliv) => (
                          <div
                            key={deliv.id}
                            onClick={() => handleToggleDeliverable(phase, deliv.id)}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                              deliv.isCompleted
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300/80 line-through'
                                : 'bg-black/30 border-soft hover:border-amber-500/50 text-slate-200'
                            }`}
                          >
                            <button className="mt-0.5 shrink-0">
                              {deliv.isCompleted ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            <span className="text-xs leading-snug">{deliv.title}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add Sub-task Deliverable Input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-soft/60">
                        <input
                          type="text"
                          placeholder="Ajouter un livrable à cette phase..."
                          value={newDeliverableInput[phase.id] || ''}
                          onChange={(e) =>
                            setNewDeliverableInput({ ...newDeliverableInput, [phase.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDeliverable(phase);
                            }
                          }}
                          className="flex-1 bg-black/40 border border-soft rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan"
                        />
                        <button
                          onClick={() => handleAddDeliverable(phase)}
                          className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover text-amber-300 border border-cyan mono text-xs uppercase"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Add New Project Phase */}
      {isAddingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
              <Plus className="w-5 h-5 accent-cyan" />
              Ajouter une Phase au Projet
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre de la Phase</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Post-Production Audio & Effets Bruitages"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Projet</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="cinema">Cinéma & Scénario</option>
                    <option value="bangre_neo">Bangre Neo Lab</option>
                    <option value="school">Études Académiques</option>
                    <option value="general">Projet Général</option>
                  </select>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Date de Fin Cible</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Statut Initial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PhaseStatus)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="upcoming">À venir</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Livrable Clé Principal</label>
                  <input
                    type="text"
                    placeholder="ex. Mixage Audio Surround 5.1"
                    value={newKeyDeliverable}
                    onChange={(e) => setNewKeyDeliverable(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Description de la Phase</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez l'objectif et la portée de cette phase..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl p-3 text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">
                  Tâches Livrables (Une par ligne)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enregistrer le doublage ADR&#10;Synchroniser les bruits de pas&#10;Exporter le mixage final"
                  value={newDeliverablesRaw}
                  onChange={(e) => setNewDeliverablesRaw(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl p-3 mono text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setIsAddingPhase(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/40 text-slate-300 mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-amber-300 border border-cyan mono text-xs uppercase font-semibold"
                >
                  Enregistrer la Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
