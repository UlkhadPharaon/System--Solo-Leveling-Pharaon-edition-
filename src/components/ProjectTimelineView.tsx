import React, { useState } from 'react';
import { ProjectPhase, PhaseStatus, ProjectDeliverable, NoteItem, Domain } from '../types';
import { domainsForTracking } from '../lib/domains';
import { 
  Film, 
  Code, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Calendar, 
  Trash2, 
  FileText, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Layers
} from './ui/PharaohIcons';
import { triggerVictoryConfetti } from '../lib/confetti';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface ProjectTimelineViewProps {
  phases: ProjectPhase[];
  onAddPhase: (phase: ProjectPhase) => void;
  onUpdatePhase: (phase: ProjectPhase) => void;
  onDeletePhase: (id: string) => void;
  onCreateNoteFromPhase: (note: NoteItem) => void;
  /** User domains (onboarding v2) — project tabs become domain-driven. */
  domains?: Domain[];
}

export const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({
  phases,
  onAddPhase,
  onUpdatePhase,
  onDeletePhase,
  onCreateNoteFromPhase,
  domains = [],
}) => {
  // project_phases domains drive the tabs when present (onboarding v2);
  // otherwise the legacy fixed Cinema / Bangre Neo tabs are used.
  const projectDomains = domainsForTracking(domains, 'project_phases');
  const legacyMode = projectDomains.length === 0;
  const [selectedProject, setSelectedProject] = useState<string>(
    legacyMode ? 'cinema' : `domain:${projectDomains[0].id}`
  );
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Record<string, boolean>>({
    'phase-cin-2': true,
    'phase-lab-2': true,
  });

  // New Phase Modal State
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [pendingDeletePhaseId, setPendingDeletePhaseId] = useState<string | null>(null);
  const pendingDeletePhase = phases.find((ph) => ph.id === pendingDeletePhaseId) ?? null;
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>(
    legacyMode ? 'cinema' : `domain:${projectDomains[0].id}`
  );
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newStatus, setNewStatus] = useState<PhaseStatus>('in_progress');
  const [newKeyDeliverable, setNewKeyDeliverable] = useState('');
  const [newDeliverablesRaw, setNewDeliverablesRaw] = useState('');

  // Inline deliverable input state per phase
  const [newDeliverableInput, setNewDeliverableInput] = useState<Record<string, string>>({});

  const filteredPhases = phases
    .filter((p) => selectedProject === 'all' || p.projectCategory === selectedProject)
    // domain-driven filter also matches phases carrying a domainId
    .filter((p) => !(selectedProject.startsWith('domain:')) || p.projectCategory === selectedProject || p.domainId === selectedProject.slice(7))
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
      projectCategory: newCategory as ProjectPhase['projectCategory'],
      domainId: newCategory.startsWith('domain:') ? newCategory.slice(7) : undefined,
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
    <div className="space-y-6 anim-in">
      {/* Category Tabs & Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-panel border border-lapis-border p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {legacyMode ? (
            <>
              <button
                onClick={() => setSelectedProject('cinema')}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
                  selectedProject === 'cinema'
                    ? 'bg-panel-gold text-gold-bright border border-gold/50 shadow-gold'
                    : 'bg-obsidian text-pharaoh-muted hover:text-pharaoh border border-lapis-border'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-gold" />
                <span>Feuille de Route Cinéma</span>
              </button>

              <button
                onClick={() => setSelectedProject('bangre_neo')}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
                  selectedProject === 'bangre_neo'
                    ? 'bg-panel-gold text-amethyst border border-amethyst/60 shadow-glow-amethyst'
                    : 'bg-obsidian text-pharaoh-muted hover:text-pharaoh border border-lapis-border'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-amethyst" />
                <span>Spécifications Bangre Neo</span>
              </button>
            </>
          ) : (
            projectDomains.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedProject('domain:' + d.id)}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
                  selectedProject === 'domain:' + d.id
                    ? 'bg-panel-gold text-gold-bright border border-gold/50 shadow-gold'
                    : 'bg-obsidian text-pharaoh-muted hover:text-pharaoh border border-lapis-border'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-gold" />
                <span>{d.label}</span>
              </button>
            ))
          )}

          <button
            onClick={() => setSelectedProject('all')}
            className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
              selectedProject === 'all'
                ? 'bg-panel-gold text-gold-bright border border-gold/50 shadow-gold'
                : 'bg-obsidian text-pharaoh-muted hover:text-pharaoh border border-lapis-border'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-gold" />
            <span>Toutes les Phases</span>
          </button>
        </div>

        <button
          onClick={() => setIsAddingPhase(true)}
          className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-panel-gold text-gold-bright border border-gold/50 hover:shadow-gold font-mono text-xs uppercase transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Ajouter une Phase</span>
        </button>
      </div>

      {/* Overview Progress Header */}
      <div className="bg-gradient-to-r from-lapis via-panel to-lapis border border-lapis-border rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-gold/10 text-gold-bright border border-gold/30">
                {selectedProject.startsWith('domain:')
                  ? 'Chronologie — ' + (projectDomains.find((d) => 'domain:' + d.id === selectedProject)?.label ?? 'Projet')
                  : selectedProject === 'cinema'
                  ? 'Chronologie du Long-Métrage Cinéma'
                  : selectedProject === 'bangre_neo'
                  ? 'Feuille de Route du Lab Autonome Bangre Neo'
                  : 'Feuille de Route Globale Multi-Projets'}
              </span>
            </div>
            <h3 className="font-display text-xl font-light text-pharaoh tracking-wide">
              {selectedProject.startsWith('domain:')
                ? (projectDomains.find((d) => 'domain:' + d.id === selectedProject)?.goal_text || 'Jalons du projet')
                : selectedProject === 'cinema'
                ? 'The Gold Horizon — Du Scénario à la Première'
                : selectedProject === 'bangre_neo'
                ? 'Aura Engine — De l’Architecture au Déploiement Cloud'
                : 'Toutes les Phases de Projets & Échéances'}
            </h3>
          </div>

          {/* Meter Stats */}
          <div className="flex items-center gap-4 bg-obsidian border border-lapis-border p-3 rounded-xl self-start md:self-auto shrink-0">
            <div>
              <div className="font-mono text-[10px] uppercase text-pharaoh-muted">Progression Globale</div>
              <div className="font-display text-xl font-medium text-gold-bright">{overallProgressPercent}%</div>
            </div>
            <div className="h-8 w-px bg-lapis-border" />
            <div className="grid grid-cols-3 gap-3 text-center font-mono text-[10px]">
              <div>
                <div className="text-emerald font-bold">{completedPhases}</div>
                <div className="text-pharaoh-subtle">Terminé</div>
              </div>
              <div>
                <div className="text-gold-bright font-bold">{inProgressPhases}</div>
                <div className="text-pharaoh-subtle">Actif</div>
              </div>
              <div>
                <div className="text-pharaoh-muted font-bold">{upcomingPhases}</div>
                <div className="text-pharaoh-subtle">À venir</div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-pharaoh-muted">
              Livrables Réalisés : <strong className="text-pharaoh">{completedDeliverablesCount}</strong> / {totalDeliverablesCount}
            </span>
            <span className="text-gold-bright">{overallProgressPercent}% Complété</span>
          </div>
          <div className="h-2 w-full bg-obsidian rounded-full overflow-hidden border border-lapis-border">
            <div
              className="h-full bg-gradient-to-r from-gold via-amethyst to-emerald transition-all duration-500 rounded-full"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="relative pl-4 md:pl-8 space-y-6 stagger before:absolute before:left-3 md:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-gold/80 before:via-amethyst/50 before:to-lapis-light">
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
                    ? 'bg-obsidian border-emerald text-emerald shadow-md shadow-emerald/20'
                    : phase.status === 'in_progress'
                    ? 'bg-obsidian border-gold text-gold-bright shadow-md shadow-gold/20 animate-pulse'
                    : 'bg-obsidian border-lapis-border text-pharaoh-subtle'
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
                className={`bg-panel border rounded-xl p-4 md:p-5 transition-all space-y-4 hover-lift ${
                  phase.status === 'completed'
                    ? 'border-emerald/40 bg-gradient-to-r from-emerald/10 via-panel to-panel'
                    : phase.status === 'in_progress'
                    ? isCinema
                      ? 'border-gold/60 bg-gradient-to-r from-gold/20 via-panel to-panel shadow-lg shadow-gold/5'
                      : 'border-amethyst/60 bg-gradient-to-r from-amethyst/20 via-panel to-panel shadow-lg shadow-amethyst/5'
                    : 'border-lapis-border bg-obsidian/20 opacity-85'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-lapis-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold tracking-wide font-medium px-2 py-0.5 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted">
                      Phase 0{phase.phaseNumber}
                    </span>

                    <span
                      className={`font-mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl border ${
                        isCinema
                          ? 'bg-gold/10 text-gold-bright border-gold/30'
                          : phase.projectCategory === 'bangre_neo'
                          ? 'bg-amethyst/10 text-amethyst border-amethyst/30'
                          : 'bg-sapphire/10 text-sapphire border-sapphire/30'
                      }`}
                    >
                      {phase.projectCategory.startsWith('domain:')
                        ? (domains.find((d) => d.id === phase.projectCategory.slice(7))?.label ?? phase.projectCategory.slice(7))
                        : phase.projectCategory.replace('_', ' ')}
                    </span>

                    <h4 className="font-display text-lg font-normal text-pharaoh tracking-wide">{phase.title}</h4>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="flex items-center gap-1 bg-obsidian border border-lapis-border p-1 rounded-xl">
                      {(['completed', 'in_progress', 'upcoming'] as PhaseStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(phase, st)}
                          className={`btn-press font-mono text-[9px] uppercase px-2 py-0.5 rounded-xl transition-all ${
                            phase.status === st
                              ? st === 'completed'
                                ? 'bg-emerald/20 text-emerald border border-emerald/50'
                                : st === 'in_progress'
                                ? 'bg-gold/20 text-gold-bright border border-gold/50'
                                : 'bg-lapis text-pharaoh-muted border border-lapis-border'
                              : 'text-pharaoh-subtle hover:text-pharaoh-muted'
                          }`}
                        >
                          {getStatusLabel(st)}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCreateNoteFromPhase(phase)}
                      className="btn-press p-1.5 rounded-xl bg-lapis border border-lapis-border text-pharaoh-muted hover:text-gold-bright transition-colors"
                      title="Générer une note pour cette phase"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setPendingDeletePhaseId(phase.id)}
                      className="btn-press p-1.5 rounded-xl bg-lapis border border-lapis-border text-pharaoh-subtle hover:text-blood transition-colors"
                      title="Supprimer la phase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description & Key Deliverable Callout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-2">
                    <p className="text-xs text-pharaoh-muted leading-relaxed">{phase.description}</p>

                    {phase.targetDate && (
                      <div className="flex items-center gap-1.5 font-mono text-pharaoh-muted text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-gold" />
                        <span>Échéance Cible : {phase.targetDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 bg-obsidian border border-lapis-border rounded-xl p-3 space-y-1">
                    <div className="font-mono text-[9px] uppercase text-gold flex items-center gap-1 font-bold">
                      <Target className="w-3 h-3" />
                      Livrable Clé Attendu
                    </div>
                    <div className="font-display text-xs italic text-pharaoh-muted">{phase.keyDeliverable}</div>
                  </div>
                </div>

                {/* Deliverables Checklist Toggle Header */}
                <div className="pt-2 border-t border-lapis-border">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(phase.id)}
                      className="btn-press flex items-center gap-2 font-mono text-xs text-gold-bright hover:text-gold transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>
                        Tâches de la Phase ({phaseDelivDone}/{phaseDelivTotal} réalisées)
                      </span>
                      <span className="font-mono text-[10px] text-pharaoh-muted">({phasePercent}%)</span>
                    </button>

                    {/* Progress Bar Mini */}
                    <div className="w-32 h-1.5 bg-obsidian rounded-full overflow-hidden border border-lapis-border">
                      <div
                        className="h-full bg-gold transition-all duration-300"
                        style={{ width: `${phasePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Task Deliverables Checklist */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3 bg-obsidian-elevated border border-lapis-border rounded-xl p-3.5">
                      <div className="space-y-2">
                        {(phase.deliverables || []).map((deliv) => (
                          <div
                            key={deliv.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={deliv.isCompleted}
                            onClick={() => handleToggleDeliverable(phase, deliv.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggleDeliverable(phase, deliv.id);
                              }
                            }}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                              deliv.isCompleted
                                ? 'bg-emerald/10 border-emerald/30 text-emerald line-through'
                                : 'bg-obsidian/30 border-lapis-border hover:border-gold/50 text-pharaoh-muted'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {deliv.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald" />
                              ) : (
                                <Circle className="w-4 h-4 text-pharaoh-subtle" />
                              )}
                            </span>
                            <span className="text-xs leading-snug">{deliv.title}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add Sub-task Deliverable Input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-lapis-border/60">
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
                          className="flex-1 bg-obsidian border border-lapis-border rounded-xl px-2.5 py-1.5 font-mono text-xs text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                        />
                        <button
                          onClick={() => handleAddDeliverable(phase)}
                          className="btn-press px-3 py-1.5 rounded-xl bg-panel hover:bg-panel-hover text-gold-bright border border-gold/50 font-mono text-xs uppercase"
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

      {/* Phase delete confirmation — destructive actions are guarded app-wide */}
      <ConfirmDialog
        isOpen={pendingDeletePhase != null}
        title="Supprimer cette phase ?"
        message="La phase et ses livrables seront définitivement retirés du projet."
        details={pendingDeletePhase ? pendingDeletePhase.title : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        onConfirm={() => {
          if (pendingDeletePhaseId) onDeletePhase(pendingDeletePhaseId);
          setPendingDeletePhaseId(null);
        }}
        onCancel={() => setPendingDeletePhaseId(null)}
      />

      {/* Modal to Add New Project Phase */}
      {isAddingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-lapis border border-gold/50 rounded-2xl max-w-lg w-full p-6 shadow-card-hover space-y-4 my-8">
            <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide flex items-center gap-2 border-b border-lapis-border pb-2">
              <Plus className="w-5 h-5 text-gold" />
              Ajouter une Phase au Projet
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Titre de la Phase</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Post-Production Audio & Effets Bruitages"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Projet</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-pharaoh focus:outline-none focus:border-gold"
                  >
                    {legacyMode ? (
                      <>
                        <option value="cinema">Cinéma & Scénario</option>
                        <option value="bangre_neo">Bangre Neo Lab</option>
                        <option value="school">Études Académiques</option>
                        <option value="general">Projet Général</option>
                      </>
                    ) : (
                      projectDomains.map((d) => (
                        <option key={d.id} value={'domain:' + d.id}>{d.label}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Date de Fin Cible</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-pharaoh focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Statut Initial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PhaseStatus)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-pharaoh focus:outline-none focus:border-gold"
                  >
                    <option value="upcoming">À venir</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Livrable Clé Principal</label>
                  <input
                    type="text"
                    placeholder="ex. Mixage Audio Surround 5.1"
                    value={newKeyDeliverable}
                    onChange={(e) => setNewKeyDeliverable(e.target.value)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 font-mono text-pharaoh focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">Description de la Phase</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez l'objectif et la portée de cette phase..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl p-3 font-mono text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 text-pharaoh-muted">
                  Tâches Livrables (Une par ligne)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enregistrer le doublage ADR&#10;Synchroniser les bruits de pas&#10;Exporter le mixage final"
                  value={newDeliverablesRaw}
                  onChange={(e) => setNewDeliverablesRaw(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl p-3 font-mono text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-lapis-border">
                <button
                  type="button"
                  onClick={() => setIsAddingPhase(false)}
                  className="btn-press px-4 py-2 rounded-xl bg-lapis text-pharaoh-muted font-mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-panel hover:bg-panel-hover text-gold-bright border border-gold/50 font-mono text-xs uppercase font-semibold"
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
