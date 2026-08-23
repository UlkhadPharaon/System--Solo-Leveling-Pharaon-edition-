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
  Bell,
  BellOff,
  Clock,
  AlertTriangle,
  Volume2,
  CheckCircle as CheckIcon,
  AlertTriangle as AlertIcon,
  Globe,
  Hourglass,
  ArrowRight,
} from './ui/PharaohIcons';
import { requestPermission, subscribeToPush, getSubscriptionStatus, sendPushViaServer, urlBase64ToUint8Array } from '../lib/pushNotifications';

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

  // ── Push Subscription Status ─────────────────────────────────────────────
  const [pushStatus, setPushStatus] = useState<'checking' | 'subscribed' | 'unsubscribed' | 'error' | null>(
    null
  );
  const [pushSubscribedToggles, setPushSubscribedToggles] = useState<Record<string, boolean>>({
    notifyScheduleStart: personalization.notifyScheduleStart ?? true,
    notifyFocusComplete: personalization.notifyFocusComplete ?? true,
    notifyStreakWarning: personalization.notifyStreakWarning ?? true,
    notifyDailyBonus: personalization.notifyDailyBonus ?? true,
    notifyLevelUp: personalization.notifyLevelUp ?? true,
    notifyRitualNudge: personalization.notifyRitualNudge ?? true,
  });
  const [pushSubscribeReady, setPushSubscribeReady] = useState(false);

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
      notifyScheduleStart: pushSubscribedToggles.notifyScheduleStart,
      notifyFocusComplete: pushSubscribedToggles.notifyFocusComplete,
      notifyStreakWarning: pushSubscribedToggles.notifyStreakWarning,
      notifyDailyBonus: pushSubscribedToggles.notifyDailyBonus,
      notifyLevelUp: pushSubscribedToggles.notifyLevelUp,
      notifyRitualNudge: pushSubscribedToggles.notifyRitualNudge,
      notifyStreakRescue: pushSubscribedToggles.notifyStreakRescue ?? false,
      questReminderHour: personalization.questReminderHour ?? 19,
      morningBriefingEnabled: pushSubscribedToggles.notifyMorningBriefing ?? false,
      dailyBonusReminderHour: personalization.dailyBonusReminderHour ?? 8,
      ritualNudgeHour: personalization.ritualNudgeHour ?? 7,
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

      // N1 — create the web-push subscription NOW so server pushes reach
      // this phone even with the app closed (the missing piece before).
      if (Notification.permission === 'granted') {
        try {
          const sub = await subscribeToPush();
          if (!sub) console.warn('[push] subscription failed after enable');
        } catch (e) {
          console.warn('[push] subscribe error', e);
        }
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const [pushBusy, setPushBusy] = useState(false);

  /**
   * N1 — REAL push test. The old implementation used `new Notification()`,
   * which Android Chrome silently blocks unless the tab is foreground AND
   * not installed as PWA. The reliable path on phones is Web Push through
   * the server: ensure a push subscription exists, then POST /api/push/send.
   */
  const handleTriggerTestNotification = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setTestNotificationFeedback('Notifications non supportées sur ce navigateur.');
      return;
    }
    setPushBusy(true);
    try {
      // 1. Permission
      let perm = Notification.permission;
      if (perm === 'default') perm = await requestPermission();
      setPermissionStatus(perm);
      if (perm !== 'granted') {
        setTestNotificationFeedback(
          perm === 'denied'
            ? 'Notifications bloquées : autorisez-les dans les paramètres du site (icône 🔒 à côté de l\'URL).'
            : 'Permission refusée.'
        );
        return;
      }

      // 2. Ensure a real push subscription exists and is known to the server.
      const sub = await subscribeToPush();
      if (!sub) {
        setTestNotificationFeedback('Impossible de créer l\'abonnement push. Rechargez la page et réessayez.');
        return;
      }

      // 3. Send THROUGH the server (reaches the phone even app closed).
      const ok = await sendPushViaServer({
        title: 'Système : Test Réussi ⚡',
        body: `Les alertes sont actives ! Vous serez notifié ${notificationLeadMinutes} min avant vos sessions.`,
        tag: 'test-push',
        url: '/',
        icon: '/icon-192.png',
        data: {},
      });

      setTestNotificationFeedback(
        ok
          ? '✅ Push envoyé par le serveur — vérifiez votre écran (même verrouillé).'
          : '❌ Le serveur n\'a pas pu délivrer le push. Vérifiez que VAPID est configuré côté serveur.'
      );
    } finally {
      setPushBusy(false);
      setTimeout(() => setTestNotificationFeedback(null), 8000);
    }
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-panel border border-gold rounded-xl max-w-4xl w-full max-h-[96dvh] p-4 sm:p-6 md:p-8 shadow-2xl space-y-6 my-0 sm:my-8 text-xs overflow-x-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-lapis pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-panel-gold border border-gold/40 text-gold-bright">
              <Sliders className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-light text-white tracking-wide text-gradient-gold">
                Personnalisation du Programme & Feuille de Route
              </h2>
              <p className="text-pharaoh-muted mt-0.5">
                Personnalisez votre nom, le projet Cinéma actif, le module Bangre Neo Lab et le programme académique.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-press p-2 rounded-xl bg-panel hover:bg-panel-hover text-pharaoh-muted hover:text-gold-bright border border-lapis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-lapis pb-3 no-scrollbar -mx-1 px-1">
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
                className={`btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs tracking-wide font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-panel-gold text-gold-bright border border-gold/50 shadow-gold font-medium'
                    : 'bg-panel text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border border-lapis'
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
            <div className="bg-lapis/40 p-4 rounded-xl border border-lapis space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Votre Nom Complet</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Slogan de Vision Personnelle</label>
                <input
                  type="text"
                  value={userTagline}
                  onChange={(e) => setUserTagline(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Titre de Chasseur (affiché à côté de votre niveau)</label>
                <input
                  type="text"
                  placeholder="ex. L'Ombre d'Osiris, Le Bâtisseur Éternel…"
                  value={hunterTitle}
                  onChange={(e) => setHunterTitle(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Devise Personnelle (mot du Système chaque matin)</label>
                <input
                  type="text"
                  placeholder="ex. La discipline est mon trône."
                  value={dailyQuote}
                  onChange={(e) => setDailyQuote(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs"
                />
              </div>
            </div>

            {/* Session Notification Settings Panel */}
            <div className="bg-lapis/40 p-4 md:p-5 rounded-xl border border-gold/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lapis pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${notificationsEnabled ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-obsidian/40 border-lapis text-pharaoh-subtle'}`}>
                    {notificationsEnabled ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-light text-white tracking-wide flex items-center gap-2">
                      Alertes de Début de Session Quotidienne
                      {notificationsEnabled && (
                        <span className="font-mono text-[9px] tracking-wide font-medium px-2 py-0.5 rounded-xl bg-gold/20 border border-gold/40 text-gold-bright font-medium">
                          Actif
                        </span>
                      )}
                    </h3>
                    <p className="text-pharaoh-muted text-[11px] mt-0.5">
                      Recevez des notifications de bureau avant le début de vos sessions d'étude ou de travail.
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleNotificationSwitch}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationsEnabled ? 'bg-gold' : 'bg-lapis-light'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-obsidian shadow ring-0 transition duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {notificationsEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block font-mono text-[10px] uppercase opacity-70 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        Délai d'Alerte
                      </label>
                      <select
                        value={notificationLeadMinutes}
                        onChange={(e) => setNotificationLeadMinutes(Number(e.target.value))}
                        className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs font-mono"
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
                        disabled={pushBusy}
                        className="btn-press w-full sm:w-auto px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold border border-gold/50 text-gold-bright font-mono text-xs tracking-wide font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${pushBusy ? 'animate-pulse' : ''}`} />
                        {pushBusy ? 'Envoi en cours…' : 'Envoyer une Notification Test'}
                      </button>
                    </div>
                  </div>

                  {/* Browser Permission Status Message */}
                  {permissionStatus === 'denied' && (
                    <div className="p-2.5 rounded-xl bg-blood/20 border border-blood/40 text-red-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-blood flex-shrink-0" />
                      <span>
                        Les notifications sont actuellement bloquées dans vos paramètres de navigateur. Veuillez les autoriser.
                      </span>
                    </div>
                  )}

                  {permissionStatus === 'granted' && (
                    <div className="p-2.5 rounded-xl bg-emerald/20 border border-emerald/40 text-emerald text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald flex-shrink-0" />
                      <span>
                        Les notifications du navigateur sont autorisées. Les alertes se déclencheront automatiquement.
                      </span>
                    </div>
                  )}

                  {testNotificationFeedback && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-gold/20 to-transparent border border-gold/40 text-gold-bright text-[11px] font-mono">
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
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Titre du Film / Scénario</label>
                <input
                  type="text"
                  value={cinemaTitle}
                  onChange={(e) => setCinemaTitle(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Genre & Style</label>
                <input
                  type="text"
                  value={cinemaGenre}
                  onChange={(e) => setCinemaGenre(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Étape Active de Production</label>
              <input
                type="text"
                value={cinemaStage}
                onChange={(e) => setCinemaStage(e.target.value)}
                placeholder="ex : Étape 2 : Rédaction Scène 4 & Storyboard"
                className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Synopsis & Vision Créative</label>
              <textarea
                rows={2}
                value={cinemaSynopsis}
                onChange={(e) => setCinemaSynopsis(e.target.value)}
                className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl p-3 text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Milestones List */}
            <div className="bg-lapis/40 border border-lapis rounded-xl p-4 space-y-3">
              <h4 className="font-display text-base font-light text-white tracking-wide">Jalons Cinéma & Feuille de Route de Production</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cinemaMilestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-obsidian/40 border border-lapis">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => handleToggleCinemaMilestone(m.id)}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                        ) : (
                          <Circle className="w-4 h-4 text-pharaoh-subtle" />
                        )}
                      </button>
                      <span className={`text-xs ${m.isCompleted ? 'line-through opacity-50' : 'text-white'}`}>
                        {m.title}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-pharaoh-muted">
                        {m.stageName}
                      </span>
                    </div>

                    <button onClick={() => handleDeleteCinemaMilestone(m.id)} className="text-pharaoh-subtle hover:text-blood">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone */}
              <div className="flex items-center gap-2 pt-2 border-t border-lapis">
                <input
                  type="text"
                  placeholder="Titre du nouveau jalon..."
                  value={newCinemaMsTitle}
                  onChange={(e) => setNewCinemaMsTitle(e.target.value)}
                  className="flex-1 bg-obsidian/40 border border-lapis rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Étape (ex : Tournage)"
                  value={newCinemaMsStage}
                  onChange={(e) => setNewCinemaMsStage(e.target.value)}
                  className="w-32 bg-obsidian/40 border border-lapis rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCinemaMilestone}
                  className="btn-press px-3 py-1.5 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs"
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
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Nom du Projet Bangre Neo</label>
                <input
                  type="text"
                  value={bangreProject}
                  onChange={(e) => setBangreProject(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Module d'Ingénierie Prioritaire</label>
                <input
                  type="text"
                  value={bangreModule}
                  onChange={(e) => setBangreModule(e.target.value)}
                  className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Étape Active d'Ingénierie</label>
              <input
                type="text"
                value={bangreStage}
                onChange={(e) => setBangreStage(e.target.value)}
                placeholder="ex : Étape 3 : Synchro Hors-Ligne & Middleware LocalStorage"
                className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase opacity-70 mb-1">Objectif d'Architecture & Spécifications</label>
              <textarea
                rows={2}
                value={bangreGoal}
                onChange={(e) => setBangreGoal(e.target.value)}
                className="w-full min-w-0 bg-obsidian/40 border border-lapis rounded-xl p-3 text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Milestones List */}
            <div className="bg-lapis/40 border border-lapis rounded-xl p-4 space-y-3">
              <h4 className="font-display text-base font-light text-white tracking-wide">Jalons d'Ingénierie Bangre Neo Lab</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bangreMilestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-obsidian/40 border border-lapis">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => handleToggleBangreMilestone(m.id)}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                        ) : (
                          <Circle className="w-4 h-4 text-pharaoh-subtle" />
                        )}
                      </button>
                      <span className={`text-xs ${m.isCompleted ? 'line-through opacity-50' : 'text-white'}`}>
                        {m.title}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-pharaoh-muted">
                        {m.stageName}
                      </span>
                    </div>

                    <button onClick={() => handleDeleteBangreMilestone(m.id)} className="text-pharaoh-subtle hover:text-blood">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Milestone */}
              <div className="flex items-center gap-2 pt-2 border-t border-lapis">
                <input
                  type="text"
                  placeholder="Titre du nouveau jalon..."
                  value={newBangreMsTitle}
                  onChange={(e) => setNewBangreMsTitle(e.target.value)}
                  className="flex-1 bg-obsidian/40 border border-lapis rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Étape (ex : Moteur Principal)"
                  value={newBangreMsStage}
                  onChange={(e) => setNewBangreMsStage(e.target.value)}
                  className="w-32 bg-obsidian/40 border border-lapis rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddBangreMilestone}
                  className="btn-press px-3 py-1.5 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs"
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
            <div className="flex items-center justify-between border-b border-lapis pb-2">
              <h4 className="font-display text-lg font-light text-white tracking-wide">
                Programme Académique & Suivi des Chapitres
              </h4>
              <span className="font-mono text-[10px] text-gold uppercase bg-gold/10 px-2.5 py-1 rounded-xl border border-gold/40">
                {lessons.length} Cours Actifs Enregistrés
              </span>
            </div>

            {/* Lessons List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lessons.map((les) => (
                <div key={les.id} className="p-3 rounded-xl bg-lapis/40 border border-lapis flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-xl border ${
                        les.subject === 'svt' ? 'bg-emerald/20 text-emerald border-emerald/60' :
                        les.subject === 'math' ? 'bg-sapphire/20 text-sapphire border-sapphire/60' :
                        les.subject === 'pc' ? 'bg-amethyst/20 text-amethyst border-amethyst/60' :
                        'bg-gold/20 text-gold border-gold/60'
                      }`}>
                        {les.subject.toUpperCase()}
                      </span>
                      <h5 className="font-display text-sm font-light text-white tracking-wide">{les.title}</h5>
                    </div>
                    <p className="font-mono text-[10px] opacity-60">{les.chapter}</p>
                    {les.targetExamDate && (
                      <span className="font-mono text-[9px] opacity-50 block mt-0.5">Cible Examen : {les.targetExamDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Selector */}
                    <select
                      value={les.status}
                      onChange={(e) => handleUpdateLessonStatus(les.id, e.target.value as LessonStatus)}
                      className="bg-obsidian/40 border border-lapis rounded-xl px-2 py-1 text-xs text-white focus:outline-none font-mono"
                    >
                      <option value="not_started">Non commencé</option>
                      <option value="in_progress">En cours</option>
                      <option value="mastered">Maîtrisé ✨</option>
                    </select>

                    <button
                      onClick={() => handleDeleteLesson(les.id)}
                      className="btn-press p-1 rounded-xl text-pharaoh-subtle hover:text-blood transition-all"
                      title="Supprimer le cours"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Lesson Form */}
            <div className="bg-lapis/40 border border-lapis rounded-xl p-4 space-y-3">
              <h5 className="font-mono text-[10px] tracking-wide font-medium text-gold">Ajouter un Cours Académique</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newLesSubject}
                  onChange={(e) => setNewLesSubject(e.target.value as SchoolSubject)}
                  className="bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
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
                  className="bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Chapitre ou Thème"
                  value={newLesChapter}
                  onChange={(e) => setNewLesChapter(e.target.value)}
                  className="bg-obsidian/40 border border-lapis rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  type="date"
                  value={newLesExamDate}
                  onChange={(e) => setNewLesExamDate(e.target.value)}
                  className="bg-obsidian/40 border border-lapis rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />

                <button
                  type="button"
                  onClick={handleAddLesson}
                  className="btn-press px-4 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase"
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
            <h4 className="font-display text-base font-light text-white tracking-wide">
              Entraînement Matinal & Élocution Personnalisés par Jour de la Semaine
            </h4>

            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center gap-3 bg-lapis/40 p-3 rounded-xl border border-lapis">
                  <span className="font-mono text-xs font-semibold text-gold w-28 uppercase">
                    {dayTranslations[day] || day}
                  </span>
                  <input
                    type="text"
                    value={workoutFocus[day] || ''}
                    onChange={(e) => setWorkoutFocus({ ...workoutFocus, [day]: e.target.value })}
                    className="flex-1 bg-obsidian/40 border border-lapis rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-lapis">
          <button
            onClick={onClose}
            className="btn-press px-5 py-2 rounded-xl bg-panel hover:bg-panel-hover text-pharaoh-muted font-mono text-xs uppercase"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveAll}
            className="btn-press px-6 py-2 rounded-xl bg-panel-gold hover:shadow-gold text-gold-bright border border-gold/50 font-mono text-xs uppercase font-bold tracking-wider"
          >
            Enregistrer Toutes les Modifications
          </button>
        </div>
      </div>
    </div>
  );
};
