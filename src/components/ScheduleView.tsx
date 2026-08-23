import React, { useState, useEffect } from 'react';
import { RoutineBlock, Category, DayOfWeek, UserPersonalization , Domain } from '../types';
import { getCategoryStyle, formatMinutes } from '../lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2,
  Dumbbell, 
  Mic, 
  Sparkles, 
  Code, 
  Film, 
  GraduationCap, 
  Briefcase, 
  Utensils, 
  BookOpen, 
  Moon, 
  Smile,
  Zap,
  Filter,
  Calendar,
  Sliders
} from './ui/PharaohIcons';

interface ScheduleViewProps {
  blocks: RoutineBlock[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  personalization: UserPersonalization;
  domains?: Domain[];
  onToggleComplete: (id: string, evt?: React.MouseEvent) => void;
  onAddBlock: (block: RoutineBlock) => void;
  onEditBlock: (block: RoutineBlock) => void;
  onDeleteBlock: (id: string) => void;
  onStartFocusSession: (category: Category) => void;
  openPersonalizationModal?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  blocks,
  selectedDay,
  onSelectDay,
  personalization,
  onToggleComplete,
  domains = [],
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onStartFocusSession,
  openPersonalizationModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Today name
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const dayNameInFrench: Record<DayOfWeek, string> = {
    Monday: 'Lundi',
    Tuesday: 'Mardi',
    Wednesday: 'Mercredi',
    Thursday: 'Jeudi',
    Friday: 'Vendredi',
    Saturday: 'Samedi',
    Sunday: 'Dimanche',
  };

  // New Block Form State
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newCategory, setNewCategory] = useState<Category>('bangre_neo');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Dumbbell': return Dumbbell;
      case 'Mic': return Mic;
      case 'Sparkles': return Sparkles;
      case 'Code': return Code;
      case 'Film': return Film;
      case 'GraduationCap': return GraduationCap;
      case 'Briefcase': return Briefcase;
      case 'Utensils': return Utensils;
      case 'BookOpen': return BookOpen;
      case 'Moon': return Moon;
      default: return Smile;
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'routine') return b.category === 'morning_routine' || b.category === 'sleep';
    return b.category === filterCategory;
  });

  const completedCount = blocks.filter((b) => b.isCompleted).length;
  const progressPercent = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(null);

  const openAddModal = () => {
    setEditingBlock(null);
    setNewTitle('');
    setNewStartTime('14:00');
    setNewEndTime('15:00');
    setNewCategory('bangre_neo');
    setNewDescription('');
    setShowAddModal(true);
  };

  const openEditModal = (block: RoutineBlock) => {
    setEditingBlock(block);
    setNewTitle(block.title);
    setNewStartTime(block.startTime);
    setNewEndTime(block.endTime);
    setNewCategory(block.category);
    setNewDescription(block.description);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    // Calculate duration in minutes
    const [sh, sm] = newStartTime.split(':').map(Number);
    const [eh, em] = newEndTime.split(':').map(Number);
    const duration = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));

    if (editingBlock) {
      onEditBlock({
        ...editingBlock,
        title: newTitle,
        startTime: newStartTime,
        endTime: newEndTime,
        durationMinutes: duration,
        category: newCategory,
        description: newDescription,
        iconName: newCategory === 'bangre_neo' ? 'Code' : newCategory === 'cinema' ? 'Film' : 'BookOpen',
      });
    } else {
      const newBlock: RoutineBlock = {
        id: 'custom-' + Date.now(),
        title: newTitle,
        startTime: newStartTime,
        endTime: newEndTime,
        durationMinutes: duration,
        category: newCategory,
        description: newDescription || 'Bloc d’emploi du temps personnalisé',
        isCompleted: false,
        tagline: 'Bloc Personnalisé',
        iconName: newCategory === 'bangre_neo' ? 'Code' : newCategory === 'cinema' ? 'Film' : 'BookOpen',
      };
      onAddBlock(newBlock);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Hero with Personalization Context */}
      <div className="relative overflow-hidden rounded-xl bg-panel border border-lapis p-4 md:p-6 space-y-6 hover-lift transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide font-medium bg-gold/10 text-gold border border-gold/40 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-gold" />
                Programme du {dayNameInFrench[selectedDay]}
              </span>
              {selectedDay === todayName && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold bg-gold text-obsidian">
                  Aujourd’hui
                </span>
              )}
              <span className="text-xs font-mono opacity-60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gold" />
                Heure : <strong className="text-pharaoh font-normal">{currentTimeStr}</strong>
              </span>
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-light text-pharaoh tracking-wide text-gradient-gold">
              Panneau des Quêtes (Système) • {personalization.userName}
            </h2>
            <p className="text-xs text-pharaoh-muted mt-2 max-w-2xl leading-relaxed">
              {personalization.userTagline} • Programme structuré pour le <strong>{dayNameInFrench[selectedDay]}</strong>.
            </p>
          </div>

          {/* Progress gauge card & Personalize Button */}
          <div className="flex flex-col items-end gap-3">
            <div className="bg-lapis/40 border border-lapis rounded-xl p-4 min-w-[210px] w-full flex flex-col items-center justify-center text-center">
              <div className="font-mono text-[10px] tracking-wide font-medium opacity-60 mb-1">
                Complété ({dayNameInFrench[selectedDay]})
              </div>
              <div className="font-display text-4xl font-light tracking-wide text-shimmer">
                {progressPercent}%
              </div>
              <p className="font-mono text-[10px] opacity-60 mt-1">
                {completedCount} / {blocks.length} blocs validés
              </p>
              <div className="w-full bg-obsidian rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-gold-dim via-gold to-gold-bright h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {openPersonalizationModal && (
              <button
                onClick={openPersonalizationModal}
                className="btn-press w-full py-2 px-3 rounded-xl bg-panel hover:bg-panel-gold text-gold border border-gold-dim hover:border-gold font-mono text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-gold" />
                <span>Personnaliser le Programme & Projets</span>
              </button>
            )}
          </div>
        </div>

        {/* Day-of-Week Selector Tabs */}
        <div className="relative z-10 pt-4 border-t border-lapis">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-wide font-medium text-gold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Sélectionner le jour d’emploi du temps :
            </span>
          </div>

          {/* 7-day selector: grid on mobile so every day gets an equal cell
              (a scroll rail squeezed 7 pills and clipped "Aujourd'hui"),
              roomy scroll rail from sm up. */}
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 pb-2">
            {daysList.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = todayName === day;

              return (
                <button
                  key={day}
                  onClick={() => onSelectDay(day)}
                  aria-pressed={isSelected}
                  className={`btn-press min-h-[44px] px-2 py-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-panel-gold border-gold text-gold-bright shadow-gold font-semibold'
                      : 'bg-obsidian/40 border-lapis hover:border-gold/40 text-pharaoh-muted hover:text-pharaoh'
                  }`}
                >
                  <span className="font-mono text-[11px] tracking-wide font-medium truncate max-w-full">
                    {dayNameInFrench[day]}
                  </span>
                  {isToday && (
                    <span className="font-mono text-[8px] uppercase tracking-wide text-gold mt-0.5 whitespace-nowrap">
                      • Aujourd’hui
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Stage Banner for Cinema & Bangre Neo Lab — legacy profile only */}
        <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 ${domains.length > 0 ? 'hidden' : ''}`}>
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-gold/20 to-transparent border border-gold/40 border-l-4 border-l-gold flex items-center gap-3 hover-lift transition-all">
            <div className="p-2 rounded-xl bg-gold/20 border border-gold/40 text-gold-bright">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[9px] tracking-wide font-medium text-gold font-semibold">Étape Cinéma Active</span>
              <h4 className="font-display text-xs font-light text-pharaoh tracking-wide">{personalization.cinemaProject.title}</h4>
              <p className="font-mono text-[10px] text-gold/70">{personalization.cinemaProject.currentStage}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amethyst/20 to-transparent border border-amethyst/40 border-l-4 border-l-amethyst flex items-center gap-3 hover-lift transition-all">
            <div className="p-2 rounded-xl bg-amethyst/20 border border-amethyst/40 text-amethyst">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[9px] tracking-wide font-medium text-amethyst font-semibold">Focus Bangre Neo Lab</span>
              <h4 className="font-display text-xs font-light text-pharaoh tracking-wide">{personalization.bangreLab.projectName}</h4>
              <p className="font-mono text-[10px] text-amethyst/70">{personalization.bangreLab.currentStage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Quick Habit Check Bar — hidden on a blank (fresh) schedule:
          these quick toggles only make sense once the user has blocks. */}
      {blocks.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { 
            id: 'b2', 
            name: '45m Musculation', 
            sub: personalization.workoutFocusByDay[selectedDay] || 'Routine Sportive du Matin', 
            icon: Dumbbell 
          },
          { id: 'b3', name: '10m Art Oratoire', sub: 'Pratique de la Diction', icon: Mic },
          { id: 'b4', name: '30m Soins & Bain', sub: 'Nettoyage du visage & Bain', icon: Sparkles },
          { id: 'b6', name: '12h00 Déjeuner', sub: 'Pause Repas de Mi-Journée', icon: Utensils },
        ].map((habit) => {
          const block = blocks.find((b) => b.id === habit.id);
          const isDone = block?.isCompleted;
          const Icon = habit.icon;
          const style = getCategoryStyle('morning_routine');

          return (
            <button
              key={habit.id}
              onClick={() => block && onToggleComplete(block.id)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group hover-lift ${
                isDone
                  ? 'bg-emerald/20 border-emerald/60 text-pharaoh'
                  : 'bg-panel border-lapis hover:border-emerald/40 text-pharaoh-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl border whitespace-nowrap ${style.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-tight text-pharaoh uppercase">{habit.name}</h4>
                  <p className="font-mono text-[10px] opacity-60 mt-0.5">{habit.sub}</p>
                </div>
              </div>

              <div>
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald" />
                ) : (
                  <Circle className="w-5 h-5 text-pharaoh-subtle group-hover:text-pharaoh-muted" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      )}

      {/* Filter and Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-b border-lapis pb-4">
        {/* Chips wrap instead of a squeezed scroll rail — overlap-proof at
            every width (beta screenshot: labels printed over each other). */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="font-mono text-[10px] tracking-wide font-medium opacity-60 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtrer :
          </span>
          {(domains.length > 0
            ? [
                { id: 'all', label: 'Tout', cat: 'personal' as Category },
                ...domains.map((d) => ({ id: `dom:${d.id}`, label: d.label, cat: `dom:${d.id}` as Category })),
                { id: 'must_do_work', label: 'Travail Incontournable', cat: 'must_do_work' as Category },
              ]
            : [
                { id: 'all', label: 'Tout', cat: 'personal' as Category },
                { id: 'routine', label: 'Routine & Santé', cat: 'morning_routine' as Category },
                { id: 'bangre_neo', label: 'Bangre Neo Lab', cat: 'bangre_neo' as Category },
                { id: 'cinema', label: 'Cinéma & Films', cat: 'cinema' as Category },
                { id: 'school', label: 'Études Scolaires', cat: 'school' as Category },
                { id: 'must_do_work', label: 'Travail Incontournable', cat: 'must_do_work' as Category },
              ]
          ).map((catItem) => {
            const catStyle = getCategoryStyle(catItem.cat);
            const isSelected = filterCategory === catItem.id;

            return (
              <button
                key={catItem.id}
                onClick={() => setFilterCategory(catItem.id)}
                aria-pressed={isSelected}
                className={`btn-press tap-compact px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase transition-all whitespace-nowrap border ${
                  isSelected
                    ? catStyle.activeFilterBg
                    : 'bg-panel text-pharaoh-muted hover:text-pharaoh border-lapis'
                }`}
              >
                {catItem.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={openAddModal}
          className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs transition-all self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Nouvelle Quête</span>
        </button>
      </div>

      {/* Schedule Timeline Grid */}
      <div className="space-y-3 stagger">
        {filteredBlocks.map((block) => {
          const style = getCategoryStyle(block.category, block.schoolSubject);
          const IconComponent = getIconComponent(block.iconName);

          // Check if current time falls within this block
          const [sh, sm] = block.startTime.split(':').map(Number);
          const [eh, em] = block.endTime.split(':').map(Number);
          const [ch, cm] = currentTimeStr ? currentTimeStr.split(':').map(Number) : [0, 0];
          const startMins = sh * 60 + sm;
          const endMins = eh * 60 + em;
          const currMins = ch * 60 + cm;
          const isActiveNow = currMins >= startMins && currMins < endMins;

          return (
            <div
              key={block.id}
              className={`relative overflow-hidden rounded-xl border transition-all duration-200 p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover-lift anim-in ${
                isActiveNow
                  ? `${style.cardBg} border-gold ${style.borderLeft} shadow-glow-gold`
                  : block.isCompleted
                  ? 'bg-obsidian-elevated/30 border-lapis opacity-60'
                  : `${style.cardBg} ${style.borderLeft}`
              }`}
            >
              <div className="flex items-start md:items-center gap-4">


                {/* Icon box with Category color accent */}
                <div className={`p-2.5 rounded-xl border hidden sm:flex items-center justify-center ${style.iconBg}`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Details */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-xl border ${style.badgeBg}`}>
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className="font-mono text-[10px] opacity-60">
                      ({formatMinutes(block.durationMinutes)})
                    </span>
                    <span className={`font-mono text-[10px] tracking-wide font-medium px-2 py-0.5 rounded-xl border ${style.accentTagBg}`}>
                      {style.label}
                    </span>
                    {isActiveNow && (
                      <span className="font-mono text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-xl bg-gold text-obsidian">
                        En cours
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm md:text-base font-semibold ${block.isCompleted ? 'text-pharaoh-subtle line-through' : 'text-pharaoh'}`}>
                    {block.title}
                  </h3>
                  <p className="text-xs text-pharaoh-muted mt-0.5 leading-relaxed">
                    {block.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-lapis w-full md:w-auto justify-end">
                {/* Mark Complete */}
                <button
                  onClick={(e) => onToggleComplete(block.id, e)}
                  className={`btn-press p-1.5 rounded-xl transition-all ${
                    block.isCompleted
                      ? 'text-emerald bg-emerald/10 hover:bg-emerald/20'
                      : 'text-pharaoh-subtle hover:text-emerald hover:bg-emerald/10'
                  }`}
                  title={block.isCompleted ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                  aria-label={block.isCompleted ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                >
                  {block.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>

                {/* Start Focus Timer for this category */}
                <button
                  onClick={() => onStartFocusSession(block.category)}
                  className="btn-press px-3 py-1.5 rounded-xl bg-panel hover:bg-panel-gold text-pharaoh border border-lapis hover:border-gold font-mono text-xs flex items-center gap-1.5 transition-all"
                  title="Lancer le minuteur Pomodoro"
                >
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span>Entrer en Donjon</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditModal(block)}
                  className="btn-press p-1.5 rounded-xl text-pharaoh-subtle hover:text-sapphire hover:bg-sapphire/10 transition-all"
                  title="Modifier ce bloc"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete if custom */}
                {block.id.startsWith('custom-') && (
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="btn-press p-1.5 rounded-xl text-pharaoh-subtle hover:text-blood hover:bg-blood/10 transition-all"
                    title="Supprimer ce bloc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty schedule / filter state */}
      {filteredBlocks.length === 0 && (
        <div className="bg-panel border border-lapis-border rounded-xl p-10 text-center space-y-3 hover-lift">
          <Calendar className="w-10 h-10 mx-auto text-pharaoh-subtle" />
          <h3 className="font-display text-lg font-medium text-pharaoh tracking-wide">
            {blocks.length === 0 ? 'Aucune quête planifiée' : 'Aucune quête ne correspond au filtre'}
          </h3>
          <p className="text-xs text-pharaoh-muted max-w-md mx-auto leading-relaxed">
            {blocks.length === 0
              ? 'Construisez votre premier emploi du temps : ajoutez une quête avec le bouton « Nouvelle Quête », ou laissez l’éveil du Système définir vos domaines.'
              : 'Ajustez votre filtre pour retrouver vos blocs.'}
          </p>
        </div>
      )}

      {/* Add Custom Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-panel border border-gold/50 rounded-2xl max-w-md w-full p-6 shadow-card-hover space-y-4 my-8">
            <h3 className="font-display text-2xl font-light text-pharaoh tracking-wide flex items-center gap-2 border-b border-lapis pb-3">
              <Plus className="w-5 h-5 text-gold" />
              Nouvelle Quête Personnalisée
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] tracking-wide font-medium opacity-70 mb-1">Titre du Bloc</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Révisions Mathématiques Calcul Intégral"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] tracking-wide font-medium opacity-70 mb-1">Heure de Début</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wide font-medium opacity-70 mb-1">Heure de Fin</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wide font-medium opacity-70 mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Category)}
                  className="w-full bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                >
                  {domains.length > 0
                    ? domains.map((d) => (
                        <option key={d.id} value={`dom:${d.id}`}>{d.label} ({d.weekly_time_budget ?? '-'}h/sem)</option>
                      ))
                    : (
                      <>
                        <option value="bangre_neo">Bangre Neo Lab (Objectif 15-20h)</option>
                        <option value="cinema">Cinéma & Films (Objectif 10-15h)</option>
                        <option value="school">Études Scolaires (Objectif 5-10h)</option>
                      </>
                    )}
                  <option value="must_do_work">Travail Incontournable</option>
                  <option value="morning_routine">Routine Matinale</option>
                  <option value="learning">Lecture / Podcast / Apprentissage</option>
                  <option value="personal">Personnel / Repos</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wide font-medium opacity-70 mb-1">Description / Objectif</label>
                <textarea
                  rows={2}
                  placeholder="Détails ou résultat spécifique visé pour cette session..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-pharaoh focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-lapis">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-press px-4 py-2 rounded-xl bg-panel hover:bg-panel-hover text-pharaoh-muted font-mono text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs font-semibold"
                >
                  Enregistrer le Bloc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
