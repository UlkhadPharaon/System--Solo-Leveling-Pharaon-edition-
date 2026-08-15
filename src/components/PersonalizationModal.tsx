import React, { useState } from 'react';
import { 
  UserPersonalization, 
  AcademicLesson, 
  ProjectMilestone, 
  SchoolSubject, 
  LessonStatus
} from '../types';
import { 
  User, 
  Sliders, 
  Film, 
  Code, 
  GraduationCap, 
  Dumbbell, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  X, 
  GraduationCap as BookOpen,
  Bell,
  BellOff,
  Clock,
  AlertTriangle,
  Volume2
} from 'lucide-react';

interface PersonalizationModalProps {
  isOpen: boolean;
  personalization: UserPersonalization;
  onUpdatePersonalization: (updated: UserPersonalization) => void;
  onClose: () => void;
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  isOpen,
  personalization,
  onUpdatePersonalization,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'cinema' | 'bangre' | 'syllabus' | 'fitness'>('profile');

  // Local editable copies
  const [userName, setUserName] = useState(personalization.userName);
  const [userTagline, setUserTagline] = useState(personalization.userTagline);
  const [hunterTitle, setHunterTitle] = useState(personalization.hunterTitle || '');
  const [dailyQuote, setDailyQuote] = useState(personalization.dailyQuote || '');
  const [workoutFocus, setWorkoutFocus] = useState<Record<string, string>>({ ...personalization.workoutFocusByDay });

  // Notifications Local State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    personalization.notificationsEnabled ?? false
  );
  const [notificationLeadMinutes, setNotificationLeadMinutes] = useState<number>(
    personalization.notificationLeadMinutes ?? 5
  );
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Cinema Project Local State
  const [cinemaTitle, setCinemaTitle] = useState(personalization.cinemaProject.title);
  const [cinemaGenre, setCinemaGenre] = useState(personalization.cinemaProject.genre);
  const [cinemaStage, setCinemaStage] = useState(personalization.cinemaProject.currentStage);
  const [cinemaSynopsis, setCinemaSynopsis] = useState(personalization.cinemaProject.synopsis);
  const [cinemaMilestones, setCinemaMilestones] = useState<ProjectMilestone[]>([...personalization.cinemaProject.milestones]);
  const [newCinemaMsTitle, setNewCinemaMsTitle] = useState('');
  const [newCinemaMsStage, setNewCinemaMsStage] = useState('Rédaction Scénario');

  // Bangre Neo Lab Local State
  const [bangreProject, setBangreProject] = useState(personalization.bangreLab.projectName);
  const [bangreModule, setBangreModule] = useState(personalization.bangreLab.focusModule);
  const [bangreStage, setBangreStage] = useState(personalization.bangreLab.currentStage);
  const [bangreGoal, setBangreGoal] = useState(personalization.bangreLab.architectureGoal);
  const [bangreMilestones, setBangreMilestones] = useState<ProjectMilestone[]>([...personalization.bangreLab.milestones]);
  const [newBangreMsTitle, setNewBangreMsTitle] = useState('');
  const [newBangreMsStage, setNewBangreMsStage] = useState('Moteur Principal');

  // Lessons Syllabus Local State
  const [lessons, setLessons] = useState<AcademicLesson[]>([...personalization.lessons]);
  const [newLesSubject, setNewLesSubject] = useState<SchoolSubject>('math');
  const [newLesTitle, setNewLesTitle] = useState('');
  const [newLesChapter, setNewLesChapter] = useState('');
  const [newLesExamDate, setNewLesExamDate] = useState('');

  // Handle Save All
  const handleSaveAll = () => {
    const updated: UserPersonalization = {
      userName,
      userTagline,
      hunterTitle: hunterTitle.trim() || undefined,
      dailyQuote: dailyQuote.trim() || undefined,
      notificationsEnabled,
      notificationLeadMinutes,
      workoutFocusByDay: workoutFocus,
      cinemaProject: {
        title: cinemaTitle,
        genre: cinemaGenre,
        currentStage: cinemaStage,
        synopsis: cinemaSynopsis,
        milestones: cinemaMilestones,
      },
      bangreLab: {
        projectName: bangreProject,
        focusModule: bangreModule,
        currentStage: bangreStage,
        architectureGoal: bangreGoal,
        milestones: bangreMilestones,
      },
      lessons: lessons,
    };

    onUpdatePersonalization(updated);
    onClose();
  };

  const handleToggleNotificationSwitch = async () => {
    if (!notificationsEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const res = await Notification.requestPermission();
          setPermissionStatus(res);
          if (res === 'granted' || res === 'denied') {
            setNotificationsEnabled(true);
          }
        } else {
          setNotificationsEnabled(true);
        }
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleTriggerTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setTestNotificationFeedback('Les notifications du navigateur ne sont pas prises en charge dans cette fenêtre.');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification('Test Alerte Aura 🔔', {
          body: `Alertes de début de session actives ! Vous serez notifié ${notificationLeadMinutes} minutes avant vos blocs d'étude et de travail.`,
          icon: '/favicon.ico',
        });
        setTestNotificationFeedback('Notification test envoyée ! Vérifiez votre écran.');
      } catch (err) {
        setTestNotificationFeedback('Notification déclenchée avec succès.');
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((res) => {
        setPermissionStatus(res);
        if (res === 'granted') {
          try {
            new Notification('Test Alerte Aura 🔔', {
              body: `Alertes de début de session actives ! Vous serez notifié ${notificationLeadMinutes} minutes avant vos blocs.`,
            });
          } catch (err) {}
          setTestNotificationFeedback('Permission accordée & alerte test envoyée !');
        } else {
          setTestNotificationFeedback('Permission de notification non accordée.');
        }
      });
    } else {
      setTestNotificationFeedback('Les notifications sont bloquées dans vos paramètres de navigateur.');
    }

    setTimeout(() => {
      setTestNotificationFeedback(null);
    }, 4500);
  };

  // Cinema Milestone Handlers
  const handleToggleCinemaMilestone = (id: string) => {
    setCinemaMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isCompleted: !m.isCompleted } : m))
    );
  };

  const handleAddCinemaMilestone = () => {
    if (!newCinemaMsTitle) return;
    const newMs: ProjectMilestone = {
      id: 'cm-' + Date.now(),
      title: newCinemaMsTitle,
      stageName: newCinemaMsStage,
      isCompleted: false,
    };
    setCinemaMilestones((prev) => [...prev, newMs]);
    setNewCinemaMsTitle('');
  };

  const handleDeleteCinemaMilestone = (id: string) => {
    setCinemaMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Bangre Neo Milestone Handlers
  const handleToggleBangreMilestone = (id: string) => {
    setBangreMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isCompleted: !m.isCompleted } : m))
    );
  };

  const handleAddBangreMilestone = () => {
    if (!newBangreMsTitle) return;
    const newMs: ProjectMilestone = {
      id: 'bm-' + Date.now(),
      title: newBangreMsTitle,
      stageName: newBangreMsStage,
      isCompleted: false,
    };
    setBangreMilestones((prev) => [...prev, newMs]);
    setNewBangreMsTitle('');
  };

  const handleDeleteBangreMilestone = (id: string) => {
    setBangreMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Syllabus Lesson Handlers
  const handleAddLesson = () => {
    if (!newLesTitle) return;
    const newLes: AcademicLesson = {
      id: 'les-' + Date.now(),
      subject: newLesSubject,
      title: newLesTitle,
      chapter: newLesChapter || 'Chapitre Général',
      status: 'not_started',
      targetExamDate: newLesExamDate || undefined,
    };
    setLessons((prev) => [...prev, newLes]);
    setNewLesTitle('');
    setNewLesChapter('');
    setNewLesExamDate('');
  };

  const handleUpdateLessonStatus = (id: string, status: LessonStatus) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  };

  const handleDeleteLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const dayTranslations: Record<string, string> = {
    Monday: 'Lundi',
    Tuesday: 'Mardi',
    Wednesday: 'Mercredi',
    Thursday: 'Jeudi',
    Friday: 'Vendredi',
    Saturday: 'Samedi',
    Sunday: 'Dimanche',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#051428] border border-cyan rounded-xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-soft text-cyan-400">
              <Sliders className="w-5 h-5 accent-cyan" />
            </div>
            <div>
              <h2 className="serif text-2xl md:text-3xl font-light italic text-white">
                Personnalisation du Programme & Feuille de Route
              </h2>
              <p className="text-slate-400 mt-0.5">
                Personnalisez votre nom, le projet Cinéma actif, le module Bangre Neo Lab et le programme académique.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-soft pb-3 no-scrollbar">
          {[
            { id: 'profile', label: 'Identité & Vision', icon: User },
            { id: 'cinema', label: 'Projet Cinéma & Scénario', icon: Film },
            { id: 'bangre', label: 'Projet Bangre Neo Lab', icon: Code },
            { id: 'syllabus', label: "Programme d'Études & Cours", icon: GraduationCap },
            { id: 'fitness', label: 'Entraînement Quotidien', icon: Dumbbell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl mono text-xs tracking-wide font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-card text-cyan-400 border border-cyan font-medium'
                    : 'bg-cyan-950/40 text-slate-400 hover:text-slate-200 border border-soft'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile & Identity */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-cyan-950/40 p-4 rounded-xl border border-soft space-y-3">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Votre Nom Complet</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-black/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Slogan de Vision Personnelle</label>
                <input
                  type="text"
                  value={userTagline}
                  onChange={(e) => setUserTagline(e.target.value)}
                  className="w-full bg-black/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre de Chasseur (affiché à côté de votre niveau)</label>
                <input
                  type="text"
                  placeholder="ex. L'Ombre d'Osiris, Le Bâtisseur Éternel…"
                  value={hunterTitle}
                  onChange={(e) => setHunterTitle(e.target.value)}
                  className="w-full bg-black/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Devise Personnelle (mot du Système chaque matin)</label>
                <input
                  type="text"
                  placeholder="ex. La discipline est mon trône."
                  value={dailyQuote}
                  onChange={(e) => setDailyQuote(e.target.value)}
                  className="w-full bg-black/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs"
                />
              </div>
            </div>

            {/* Session Notification Settings Panel */}
            <div className="bg-cyan-950/40 p-4 md:p-5 rounded-xl border border-cyan/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-soft pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${notificationsEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/40 border-soft text-slate-500'}`}>
                    {notificationsEnabled ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="serif text-base font-light italic text-white flex items-center gap-2">
                      Alertes de Début de Session Quotidienne
                      {notificationsEnabled && (
                        <span className="mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium">
                          Actif
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Recevez des notifications de bureau avant le début de vos sessions d'étude ou de travail.
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleNotificationSwitch}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationsEnabled ? 'bg-cyan-400' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {notificationsEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block mono text-[10px] uppercase opacity-70 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Délai d'Alerte
                      </label>
                      <select
                        value={notificationLeadMinutes}
                        onChange={(e) => setNotificationLeadMinutes(Number(e.target.value))}
                        className="w-full bg-black/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan text-xs mono"
                      >
                        <option value={2}>2 minutes avant la session</option>
                        <option value={5}>5 minutes avant la session (Recommandé)</option>
                        <option value={10}>10 minutes avant la session</option>
                        <option value={15}>15 minutes avant la session</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end sm:pt-4">
                      <button
                        type="button"
                        onClick={handleTriggerTestNotification}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card hover:bg-card-hover border border-cyan text-cyan-400 mono text-xs tracking-wide font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Envoyer une Notification Test
                      </button>
                    </div>
                  </div>

                  {/* Browser Permission Status Message */}
                  {permissionStatus === 'denied' && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>
                        Les notifications sont actuellement bloquées dans vos paramètres de navigateur. Veuillez les autoriser.
                      </span>
                    </div>
                  )}

                  {permissionStatus === 'granted' && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        Les notifications du navigateur sont autorisées. Les alertes se déclencheront automatiquement.
                      </span>
                    </div>
                  )}

                  {testNotificationFeedback && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-[11px] mono">
                      {testNotificationFeedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cinema Project */}
        {activeTab === 'cinema' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Titre du Film / Scénario</label>
                <input
                  type="text"
                  value={cinemaTitle}
                  onChange={(e) => setCinemaTitle(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Genre & Style</label>
                <input
                  type="text"
                  value={cinemaGenre}
                  onChange={(e) => setCinemaGenre(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block mono text-[10px] uppercase opacity-70 mb-1">Étape Active de Production</label>
              <input
                type="text"
                value={cinemaStage}
                onChange={(e) => setCinemaStage(e.target.value)}
                placeholder="ex : Étape 2 : Rédaction Scène 4 & Storyboard"
                className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block mono text-[10px] uppercase opacity-70 mb-1">Synopsis & Vision Créative</label>
              <textarea
                rows={2}
                value={cinemaSynopsis}
                onChange={(e) => setCinemaSynopsis(e.target.value)}
                className="w-full bg-cyan-950/40 border border-soft rounded-xl p-3 text-white focus:outline-none focus:border-cyan"
              />
            </div>

            {/* Milestones List */}
            <div className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3">
              <h4 className="serif text-base font-light italic text-white">Jalons Cinéma & Feuille de Route de Production</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cinemaMilestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-soft">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => handleToggleCinemaMilestone(m.id)}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 accent-cyan" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className={`text-xs ${m.isCompleted ? 'line-through opacity-50' : 'text-white'}`}>
                        {m.title}
                      </span>
                      <span className="mono text-[9px] uppercase px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-slate-400">
                        {m.stageName}
                      </span>
                    </div>

                    <button onClick={() => handleDeleteCinemaMilestone(m.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone */}
              <div className="flex items-center gap-2 pt-2 border-t border-soft">
                <input
                  type="text"
                  placeholder="Titre du nouveau jalon..."
                  value={newCinemaMsTitle}
                  onChange={(e) => setNewCinemaMsTitle(e.target.value)}
                  className="flex-1 bg-black/40 border border-soft rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Étape (ex : Tournage)"
                  value={newCinemaMsStage}
                  onChange={(e) => setNewCinemaMsStage(e.target.value)}
                  className="w-32 bg-black/40 border border-soft rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCinemaMilestone}
                  className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bangre Neo Lab */}
        {activeTab === 'bangre' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Nom du Projet Bangre Neo</label>
                <input
                  type="text"
                  value={bangreProject}
                  onChange={(e) => setBangreProject(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block mono text-[10px] uppercase opacity-70 mb-1">Module d'Ingénierie Prioritaire</label>
                <input
                  type="text"
                  value={bangreModule}
                  onChange={(e) => setBangreModule(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block mono text-[10px] uppercase opacity-70 mb-1">Étape Active d'Ingénierie</label>
              <input
                type="text"
                value={bangreStage}
                onChange={(e) => setBangreStage(e.target.value)}
                placeholder="ex : Étape 3 : Synchro Hors-Ligne & Middleware LocalStorage"
                className="w-full bg-cyan-950/40 border border-soft rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block mono text-[10px] uppercase opacity-70 mb-1">Objectif d'Architecture & Spécifications</label>
              <textarea
                rows={2}
                value={bangreGoal}
                onChange={(e) => setBangreGoal(e.target.value)}
                className="w-full bg-cyan-950/40 border border-soft rounded-xl p-3 text-white focus:outline-none focus:border-cyan"
              />
            </div>

            {/* Milestones List */}
            <div className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3">
              <h4 className="serif text-base font-light italic text-white">Jalons d'Ingénierie Bangre Neo Lab</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bangreMilestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-soft">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => handleToggleBangreMilestone(m.id)}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 accent-cyan" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className={`text-xs ${m.isCompleted ? 'line-through opacity-50' : 'text-white'}`}>
                        {m.title}
                      </span>
                      <span className="mono text-[9px] uppercase px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-slate-400">
                        {m.stageName}
                      </span>
                    </div>

                    <button onClick={() => handleDeleteBangreMilestone(m.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone */}
              <div className="flex items-center gap-2 pt-2 border-t border-soft">
                <input
                  type="text"
                  placeholder="Titre du nouveau jalon..."
                  value={newBangreMsTitle}
                  onChange={(e) => setNewBangreMsTitle(e.target.value)}
                  className="flex-1 bg-black/40 border border-soft rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Étape (ex : Moteur Principal)"
                  value={newBangreMsStage}
                  onChange={(e) => setNewBangreMsStage(e.target.value)}
                  className="w-32 bg-black/40 border border-soft rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddBangreMilestone}
                  className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Syllabus & Academic Lessons */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-soft pb-2">
              <h4 className="serif text-lg font-light italic text-white">
                Programme Académique & Suivi des Chapitres
              </h4>
              <span className="mono text-[10px] text-cyan-400 uppercase bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan">
                {lessons.length} Cours Actifs Enregistrés
              </span>
            </div>

            {/* Lessons List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lessons.map((les) => (
                <div key={les.id} className="p-3 rounded-xl bg-cyan-950/40 border border-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`mono text-[9px] uppercase px-2 py-0.5 rounded-xl border ${
                        les.subject === 'svt' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' :
                        les.subject === 'math' ? 'bg-blue-950/40 text-blue-400 border-blue-800' :
                        les.subject === 'pc' ? 'bg-purple-950/40 text-purple-400 border-purple-800' :
                        'bg-amber-950/40 text-amber-400 border-amber-800'
                      }`}>
                        {les.subject.toUpperCase()}
                      </span>
                      <h5 className="serif text-sm font-light italic text-white">{les.title}</h5>
                    </div>
                    <p className="mono text-[10px] opacity-60">{les.chapter}</p>
                    {les.targetExamDate && (
                      <span className="mono text-[9px] opacity-50 block mt-0.5">Cible Examen : {les.targetExamDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Selector */}
                    <select
                      value={les.status}
                      onChange={(e) => handleUpdateLessonStatus(les.id, e.target.value as LessonStatus)}
                      className="bg-black/40 border border-soft rounded-xl px-2 py-1 text-xs text-white focus:outline-none mono"
                    >
                      <option value="not_started">Non commencé</option>
                      <option value="in_progress">En cours</option>
                      <option value="mastered">Maîtrisé ✨</option>
                    </select>

                    <button
                      onClick={() => handleDeleteLesson(les.id)}
                      className="p-1 rounded-xl text-slate-500 hover:text-rose-400 transition-all"
                      title="Supprimer le cours"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Lesson Form */}
            <div className="bg-cyan-950/40 border border-soft rounded-xl p-4 space-y-3">
              <h5 className="mono text-[10px] tracking-wide font-medium text-cyan-400">Ajouter un Cours Académique</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newLesSubject}
                  onChange={(e) => setNewLesSubject(e.target.value as SchoolSubject)}
                  className="bg-black/40 border border-soft rounded-xl px-3 py-2 text-xs text-white focus:outline-none mono"
                >
                  <option value="svt">SVT (Biologie)</option>
                  <option value="math">Mathématiques</option>
                  <option value="pc">Physique-Chimie (PC)</option>
                  <option value="hist_geo">Histoire & Géographie</option>
                </select>

                <input
                  type="text"
                  placeholder="Titre du cours (ex: Dérivées & Intégrales)"
                  value={newLesTitle}
                  onChange={(e) => setNewLesTitle(e.target.value)}
                  className="bg-black/40 border border-soft rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Chapitre ou Thème"
                  value={newLesChapter}
                  onChange={(e) => setNewLesChapter(e.target.value)}
                  className="bg-black/40 border border-soft rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="date"
                  value={newLesExamDate}
                  onChange={(e) => setNewLesExamDate(e.target.value)}
                  className="bg-black/40 border border-soft rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none mono"
                />

                <button
                  type="button"
                  onClick={handleAddLesson}
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase"
                >
                  Ajouter le Cours au Programme
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Workout Focus By Day */}
        {activeTab === 'fitness' && (
          <div className="space-y-4">
            <h4 className="serif text-base font-light italic text-white">
              Entraînement Matinal & Élocution Personnalisés par Jour de la Semaine
            </h4>

            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center gap-3 bg-cyan-950/40 p-3 rounded-xl border border-soft">
                  <span className="mono text-xs font-semibold text-cyan-400 w-28 uppercase">
                    {dayTranslations[day] || day}
                  </span>
                  <input
                    type="text"
                    value={workoutFocus[day] || ''}
                    onChange={(e) => setWorkoutFocus({ ...workoutFocus, [day]: e.target.value })}
                    className="flex-1 bg-black/40 border border-soft rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-soft">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-950/40 hover:bg-[#222630] text-slate-300 mono text-xs uppercase"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2 rounded-xl bg-card hover:bg-card-hover text-cyan-400 border border-cyan mono text-xs uppercase font-bold tracking-wider"
          >
            Enregistrer Toutes les Modifications
          </button>
        </div>
      </div>
    </div>
  );
};
