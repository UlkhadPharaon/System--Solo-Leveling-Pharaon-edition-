import React, { useState } from 'react';
import { NoteItem, SchoolSubject, ProjectPhase, Domain } from '../types';
import { ProjectTimelineView } from './ProjectTimelineView';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Share2,
  Check,
  MapPin
} from './ui/PharaohIcons';

interface NotepadWorkspaceProps {
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  projectPhases: ProjectPhase[];
  onAddPhase: (phase: ProjectPhase) => void;
  onUpdatePhase: (phase: ProjectPhase) => void;
  onDeletePhase: (id: string) => void;
  /** User domains (onboarding v2) — drives note categories & project filters. */
  domains?: Domain[];
}

export const NotepadWorkspace: React.FC<NotepadWorkspaceProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  projectPhases,
  onAddPhase,
  onUpdatePhase,
  onDeletePhase,
  domains = [],
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'timeline'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Note Creation Modal / Inline Editor State
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<string>(
    domains.length > 0 ? `domain:${domains[0].id}` : 'bangre_neo'
  );
  // Category pills/selects come from Domains when they exist (onboarding v2),
  // otherwise from the legacy fixed list.
  const noteCategoryOptions =
    domains.length > 0
      ? [
          ...domains.map((d) => ({ id: `domain:${d.id}` as const, label: d.label })),
          { id: 'general' as const, label: 'Idées' },
        ]
      : [
          { id: 'cinema' as const, label: 'Cinéma' },
          { id: 'bangre_neo' as const, label: 'Bangre Neo' },
          { id: 'school' as const, label: 'Scolaire' },
          { id: 'general' as const, label: 'Idées' },
        ];
  const [editSubject, setEditSubject] = useState<SchoolSubject>('math');
  const [editTags, setEditTags] = useState('Scénario, Cinéma');

  const filteredNotes = notes.filter((note) => {
    const matchesCat = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesQuery =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle) return;

    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title: editTitle,
      content: editContent,
      category: editCategory as NoteItem['category'],
      domainId: editCategory.startsWith('domain:') ? editCategory.slice(7) : undefined,
      schoolSubject: editCategory === 'school' ? editSubject : undefined,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddNote(newNote);
    setActiveNoteId(newNote.id);
    setIsCreating(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleTogglePin = (note: NoteItem) => {
    onUpdateNote({ ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() });
  };

  const handleCopyNote = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportNote = (note: NoteItem) => {
    const blob = new Blob([`${note.title}\n\n${note.content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
  };

  const handleCreateNoteFromPhase = (newNote: NoteItem) => {
    onAddNote(newNote);
    setActiveNoteId(newNote.id);
    setActiveTab('notes');
  };

  return (
    <div className="space-y-6 anim-in">
      {/* Top Banner & Sub-Navigation */}
      <div className="relative overflow-hidden rounded-2xl bg-panel border border-lapis-border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono tracking-wide font-medium bg-emerald/10 text-emerald border border-emerald/40 flex items-center gap-1.5">
                <FileText size={14} color="var(--color-emerald)" />
                Espace Créatif & Académique
              </span>
            </div>
            <h2 className="font-display text-3xl font-light text-pharaoh tracking-wide">
              {activeTab === 'timeline'
                ? 'Feuille de Route & Phases de Projets'
                : 'Coffre à Idées & Éditeur de Scénarios'}
            </h2>
            <p className="text-xs text-pharaoh-muted mt-1">
              {activeTab === 'timeline'
                ? domains.length > 0
                  ? `Planification des étapes multi-phases et livrables pour tes projets : ${domains.map((d) => d.label).join(', ')}.`
                  : 'Planification des étapes multi-phases et livrables pour les projets Cinéma et Bangre Neo Lab.'
                : domains.length > 0
                ? `Notes et idées pour tes domaines : ${domains.map((d) => d.label).join(', ')}.`
                : 'Scénarios de films, spécifications Bangre Neo Lab et fiches de révisions SVT, Maths, PC, Hist-Géo.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Mode Tab Switchers */}
            <div className="flex items-center gap-1 bg-obsidian p-1 rounded-xl border border-lapis-border">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'text-pharaoh-muted hover:text-pharaoh'
                }`}
              >
                <MapPin size={14} color="var(--color-gold)" />
                <span>Feuille de Route</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`btn-press px-3 py-1.5 rounded-xl font-mono text-xs uppercase flex items-center gap-2 transition-all ${
                  activeTab === 'notes'
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'text-pharaoh-muted hover:text-pharaoh'
                }`}
              >
                <FileText size={14} color="var(--color-gold)" />
                <span>Coffre à Notes ({notes.length})</span>
              </button>
            </div>

            {activeTab === 'notes' && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase transition-all"
              >
                <Plus size={16} color="var(--color-gold-bright)" />
                <span>Créer une Note</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeTab === 'timeline' ? (
        <ProjectTimelineView
          phases={projectPhases}
          onAddPhase={onAddPhase}
          onUpdatePhase={onUpdatePhase}
          onDeletePhase={onDeletePhase}
          onCreateNoteFromPhase={handleCreateNoteFromPhase}
          domains={domains}
        />
      ) : (
        /* Main Grid: Sidebar List + Editor */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Note List & Filters */}
        <div className="lg:col-span-4 bg-panel border border-lapis-border rounded-2xl p-4 space-y-4 flex flex-col justify-between hover-lift">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="text-pharaoh-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher dans les notes ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian border border-lapis-border rounded-xl pl-9 pr-3 py-2 text-xs text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Toutes' },
                ...noteCategoryOptions,
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`btn-press px-2.5 py-1 rounded-xl font-mono text-[10px] uppercase transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-panel-gold text-gold-bright border border-gold/50'
                      : 'bg-obsidian text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border border-lapis-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Note Cards List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 no-scrollbar stagger">
              {[...pinnedNotes, ...unpinnedNotes].map((note) => {
                const isSelected = activeNoteId === note.id;

                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 relative group ${
                      isSelected
                        ? 'bg-panel-gold border-gold/50 text-pharaoh shadow-gold'
                        : 'bg-obsidian/60 border-lapis-border hover:border-gold-dim hover-lift text-pharaoh-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display text-sm font-light tracking-wide truncate pr-4">{note.title}</span>
                      {note.isPinned && <Pin size={12} color="var(--color-gold)" className="shrink-0" />}
                    </div>

                    <p className="text-[11px] text-pharaoh-muted line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="font-mono text-[9px] tracking-wide font-medium px-1.5 py-0.5 rounded-xl bg-obsidian text-gold border border-lapis-border">
                        {note.category.replace('_', ' ')}
                      </span>
                      {note.tags.map((tag) => (
                        <span key={tag} className="font-mono text-[9px] opacity-50">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Note Reader & Editor */}
        <div className="lg:col-span-8 bg-panel border border-lapis-border rounded-2xl p-6 flex flex-col justify-between space-y-6 hover-lift">
          {activeNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-lapis-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-obsidian text-gold border border-gold-dim">
                      {activeNote.category.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-pharaoh-subtle">
                      Mis à jour le {new Date(activeNote.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide">{activeNote.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(activeNote)}
                    className={`btn-press p-2 rounded-xl border transition-all ${
                      activeNote.isPinned
                        ? 'bg-panel-gold border-gold/50 text-gold-bright shadow-gold'
                        : 'bg-obsidian border-lapis-border text-pharaoh-muted hover:text-gold hover:border-gold-dim'
                    }`}
                    title="Épingler la note"
                  >
                    <Pin size={16} />
                  </button>

                  <button
                    onClick={() => handleCopyNote(activeNote.content, activeNote.id)}
                    className="btn-press p-2 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted hover:text-gold hover:border-gold-dim transition-all"
                    title="Copier la note"
                  >
                    {copiedId === activeNote.id ? <Check size={16} color="var(--color-emerald)" /> : <Share2 size={16} />}
                  </button>

                  <button
                    onClick={() => handleExportNote(activeNote)}
                    className="btn-press p-2 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-muted hover:text-gold hover:border-gold-dim transition-all"
                    title="Exporter en Markdown"
                  >
                    <Download size={16} />
                  </button>

                  <button
                    onClick={() => onDeleteNote(activeNote.id)}
                    className="btn-press p-2 rounded-xl bg-obsidian border border-lapis-border text-pharaoh-subtle hover:text-blood hover:border-blood/40 transition-all"
                    title="Supprimer la note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Note Body Text */}
              <div className="bg-obsidian border border-lapis-border rounded-xl p-5 font-mono text-xs text-pharaoh leading-relaxed min-h-[300px] whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-pharaoh-subtle space-y-2 py-12">
              <FileText size={40} className="opacity-40" />
              <p className="font-mono text-xs">Sélectionnez une note ou créez-en une nouvelle pour commencer l’édition.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* New Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-lapis border border-gold/50 rounded-2xl max-w-lg w-full p-6 shadow-card-hover space-y-4 anim-pop">
            <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide flex items-center gap-2 border-b border-lapis-border pb-2">
              <Plus size={20} color="var(--color-gold)" />
              Créer une Nouveau Parchemin
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Titre</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Dialogues Scène 2 Scénario / Spécifications API Bangre Neo"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Catégorie de Dossier</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold"
                  >
                    {noteCategoryOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Tags (séparés par virgules)</label>
                  <input
                    type="text"
                    placeholder="Scénario, Cinéma, Dialogue"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-obsidian border border-lapis-border rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-pharaoh-subtle mb-1">Contenu / Notes de Scénario</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Rédigez le brouillon de scénario, l'architecture ou les notes de cours ici..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-obsidian border border-lapis-border rounded-xl p-3 font-mono text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-lapis-border">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="btn-press px-4 py-2 rounded-xl bg-obsidian text-pharaoh-muted border border-lapis-border font-mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase font-semibold"
                >
                  Enregistrer la Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
