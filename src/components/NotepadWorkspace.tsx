import React, { useState } from 'react';
import { NoteItem, SchoolSubject, ProjectPhase } from '../types';
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
} from 'lucide-react';

interface NotepadWorkspaceProps {
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  projectPhases: ProjectPhase[];
  onAddPhase: (phase: ProjectPhase) => void;
  onUpdatePhase: (phase: ProjectPhase) => void;
  onDeletePhase: (id: string) => void;
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
  const [editCategory, setEditCategory] = useState<'bangre_neo' | 'cinema' | 'school' | 'general'>('bangre_neo');
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
      category: editCategory,
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
    <div className="space-y-6">
      {/* Top Banner & Sub-Navigation */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-soft p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-xl text-[10px] mono tracking-wide font-medium bg-cyan-400/10 text-cyan-400 border border-cyan flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 accent-cyan" />
                Espace Créatif & Académique
              </span>
            </div>
            <h2 className="serif text-3xl font-light italic text-white tracking-tight">
              {activeTab === 'timeline'
                ? 'Feuille de Route & Phases de Projets'
                : 'Coffre à Idées & Éditeur de Scénarios'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {activeTab === 'timeline'
                ? 'Planification des étapes multi-phases et livrables pour les projets Cinéma et Bangre Neo Lab.'
                : 'Scénarios de films, spécifications Bangre Neo Lab et fiches de révisions SVT, Maths, PC, Hist-Géo.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Mode Tab Switchers */}
            <div className="flex items-center gap-1 bg-cyan-950/40 p-1 rounded-xl border border-soft">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-xl mono text-xs uppercase flex items-center gap-2 transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-card text-amber-300 border border-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Feuille de Route</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-xl mono text-xs uppercase flex items-center gap-2 transition-all ${
                  activeTab === 'notes'
                    ? 'bg-card text-amber-300 border border-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Coffre à Notes ({notes.length})</span>
              </button>
            </div>

            {activeTab === 'notes' && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase transition-all"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
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
        />
      ) : (
        /* Main Grid: Sidebar List + Editor */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Note List & Filters */}
        <div className="lg:col-span-4 bg-card border border-soft rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher dans les notes ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-cyan-950/40 border border-soft rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'cinema', label: 'Cinéma' },
                { id: 'bangre_neo', label: 'Bangre Neo' },
                { id: 'school', label: 'Scolaire' },
                { id: 'general', label: 'Idées' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl mono text-[10px] uppercase transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-card text-cyan-400 border border-cyan'
                      : 'bg-cyan-950/40 text-slate-400 hover:bg-[#222630] border border-soft'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Note Cards List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
              {[...pinnedNotes, ...unpinnedNotes].map((note) => {
                const isSelected = activeNoteId === note.id;

                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 relative group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan text-white'
                        : 'bg-black/20 border-soft hover:border-soft text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="serif text-sm font-light italic truncate pr-4">{note.title}</span>
                      {note.isPinned && <Pin className="w-3 h-3 text-cyan-400 shrink-0 fill-[#00D4FF]" />}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="mono text-[9px] tracking-wide font-medium px-1.5 py-0.5 rounded-xl bg-black/40 text-cyan-400 border border-soft">
                        {note.category.replace('_', ' ')}
                      </span>
                      {note.tags.map((tag) => (
                        <span key={tag} className="mono text-[9px] opacity-50">
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
        <div className="lg:col-span-8 bg-card border border-soft rounded-xl p-6 flex flex-col justify-between space-y-6">
          {activeNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-soft pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan">
                      {activeNote.category.replace('_', ' ')}
                    </span>
                    <span className="mono text-[10px] opacity-50">
                      Mis à jour le {new Date(activeNote.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h3 className="serif text-2xl font-light italic text-white">{activeNote.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(activeNote)}
                    className={`p-2 rounded-xl border transition-all ${
                      activeNote.isPinned
                        ? 'bg-card border-cyan text-cyan-400'
                        : 'bg-cyan-950/40 border-soft text-slate-400 hover:text-slate-200'
                    }`}
                    title="Épingler la note"
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCopyNote(activeNote.content, activeNote.id)}
                    className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-slate-400 hover:text-slate-200"
                    title="Copier la note"
                  >
                    {copiedId === activeNote.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleExportNote(activeNote)}
                    className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-slate-400 hover:text-slate-200"
                    title="Exporter en Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteNote(activeNote.id)}
                    className="p-2 rounded-xl bg-cyan-950/40 border border-soft text-slate-500 hover:text-red-400"
                    title="Supprimer la note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note Body Text */}
              <div className="bg-cyan-950/40 border border-soft rounded-xl p-5 mono text-xs text-white leading-relaxed min-h-[300px] whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-12">
              <FileText className="w-10 h-10 opacity-40" />
              <p className="mono text-xs">Sélectionnez une note ou créez-en une nouvelle pour commencer l’édition.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* New Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#051428] border border-cyan/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="serif text-2xl font-light italic text-white flex items-center gap-2 border-b border-soft pb-2">
              <Plus className="w-5 h-5 accent-cyan" />
              Créer une Nouveau Parchemin
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Dialogues Scène 2 Scénario / Spécifications API Bangre Neo"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Catégorie de Dossier</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="cinema">Cinéma & Scénario</option>
                    <option value="bangre_neo">Bangre Neo Lab</option>
                    <option value="school">Études Scolaires</option>
                    <option value="general">Idées / Général</option>
                  </select>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase opacity-70 mb-1">Tags (séparés par virgules)</label>
                  <input
                    type="text"
                    placeholder="Scénario, Cinéma, Dialogue"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Contenu / Notes de Scénario</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Rédigez le brouillon de scénario, l'architecture ou les notes de cours ici..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl p-3 mono text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-soft">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-950/40 text-slate-300 mono text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase font-semibold"
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
