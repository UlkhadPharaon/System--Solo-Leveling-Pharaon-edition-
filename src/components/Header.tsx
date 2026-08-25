import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, PlayerProfile } from '../types';
import {
  Crown, Sword, Shield, Orb, Portal,
  Dumbbell, Film, GraduationCap, Code, BookOpen, Briefcase, Wallet, Users, Flame,
  Target, Trophy, FileText, Calendar, Clock, Zap, Sparkles, Plus, Settings, Trash,
  ArrowLeft, ChevronDown, Eye, EyeOff, Star, Skull, Dragon, Wolf, Grid,
  HelpCircle, Moon, Sun,
  type PharaohIcon
} from './ui/PharaohIcons';
import { RankBadgeInline, getRankFromXP, RANK_DEFINITIONS } from './ui/RankBadge';
import { motion, AnimatePresence } from 'motion/react';
import { useActiveFocusSession, activeFocusRemainingMs } from '../lib/activeFocusSession';
import { playSfx } from '../lib/sfx';
import { getStoredTheme, applyTheme, type Theme } from '../lib/theme';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streakCount: number;
  playerProfile?: PlayerProfile;
  personalization?: { hunterTitle?: string; dailyQuote?: string };
  openAICoach: () => void;
  openFocusTimerQuick: () => void;
  openPersonalizationModal?: () => void;
  openDataManagement?: () => void;
  /** Re-opens the "Comment ça marche ?" tour overlay at any time. */
  openHelp?: () => void;
  isOffline?: boolean;
  showWorkoutTab?: boolean;
  totalXP?: number;
}

/**
 * Live countdown pill for the running focus session (#1 UX audit). Visible on
 * every breakpoint so the user always knows their timer is still ticking
 * somewhere else in the app — one tap jumps back to it.
 */
const FocusSessionPill: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const session = useActiveFocusSession();
  const [, forceTick] = useState(0);
  const running = session != null && session.pausedRemainingMs == null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!session) return null;

  const remaining = activeFocusRemainingMs(session);
  const mm = Math.floor(remaining / 60000).toString().padStart(2, '0');
  const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');

  return (
    <motion.button
      onClick={onClick}
      className={`btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs tabular-nums border transition-all ${
        running
          ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
          : 'bg-panel text-pharaoh-muted border-lapis-border hover:bg-panel-hover'
      }`}
      title={running ? 'Session Focus en cours — cliquez pour y retourner' : 'Session Focus en pause'}
      aria-label={`Session Focus — ${mm}:${ss} ${running ? 'restantes' : '(en pause)'}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Clock size={14} className={running ? 'anim-glow' : ''} />
      <span>{mm}:{ss}</span>
      {!running && <span className="text-[10px] uppercase text-pharaoh-subtle">pause</span>}
    </motion.button>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  streakCount,
  playerProfile,
  personalization,
  openAICoach,
  openFocusTimerQuick,
  openPersonalizationModal,
  openDataManagement,
  openHelp,
  isOffline,
  showWorkoutTab = true,
  totalXP = 0,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // Theme state mirrors the DOM attribute set before first paint (main.tsx).
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const toggleDarkLight = () => {
    playSfx('ui-tap', 0.5);
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };
  // Ticking header clock (inlined — was the separate <LiveClock/> that could
  // not shrink and overflowed narrow phones).
  const [clockNow, setClockNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close the user menu on outside click/tap — it is now the primary mobile
  // entry point for quick actions, so a stuck-open dropdown is high-visibility.
  useEffect(() => {
    if (!showUserMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showUserMenu]);

  // Same outside-tap dismissal for the mobile "Plus" nav sheet.
  useEffect(() => {
    if (!showMoreNav) return;
    const onPointerDown = (e: PointerEvent) => {
      if (moreNavRef.current && !moreNavRef.current.contains(e.target as Node)) {
        setShowMoreNav(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showMoreNav]);

  const rank = playerProfile ? getRankFromXP(totalXP) : 'E';
  const rankInfo = RANK_DEFINITIONS[rank];

  const navItems: { id: ActiveTab; label: string; icon: PharaohIcon; highlight?: boolean; domainColor?: string }[] = [
    { id: 'system_solo', label: 'SYSTÈME', icon: Crown, highlight: true, domainColor: rankInfo.color },
    { id: 'dashboard', label: 'Quêtes', icon: Calendar, domainColor: '#1D6FA5' },
    ...(showWorkoutTab ? [{ id: 'workout' as ActiveTab, label: 'Entraînement', icon: Dumbbell, domainColor: '#C0392B' }] : []),
    { id: 'focus_timer', label: 'Focus', icon: Clock, domainColor: '#7B3FE4' },
    { id: 'weekly_targets', label: 'Bilan', icon: Target, domainColor: '#2FA57A' },
    { id: 'victory_journal', label: 'Hauts Faits', icon: Trophy, domainColor: '#D4A81E' },
    { id: 'notepad', label: 'Notes', icon: FileText, domainColor: '#C94277' },
    { id: 'budget', label: 'Trésorerie', icon: Wallet, domainColor: '#1E8A49' },
  ];

  // Mobile bottom bar: 4 primary destinations + raised central FAB (Focus —
  // THE daily ritual), rest behind "Plus".
  // BUGFIX (2026-08-25, "extra Focus button"): selection used FIXED INDEXES
  // (0,1,3,4). With showWorkoutTab=true index 3 is `focus_timer`, so the bar
  // rendered the regular Focus chip right next to the Focus FAB — a duplicate
  // button. Select by ID instead, and keep focus_timer out of both lists:
  // the raised FAB is its one and only entry point in the bar.
  const PRIMARY_IDS: ActiveTab[] = ['system_solo', 'dashboard', 'workout', 'weekly_targets'];
  const primaryNavItems = navItems.filter((item) => PRIMARY_IDS.includes(item.id));
  const moreNavItems = navItems.filter(
    (item) => !PRIMARY_IDS.includes(item.id) && item.id !== 'focus_timer'
  ); // Hauts Faits, Notes, Trésorerie
  const activeTabInMore = moreNavItems.some((item) => item.id === activeTab);

  const actionButtons = [
    { icon: Clock, label: 'Focus', onClick: openFocusTimerQuick, variant: 'ghost' as const },
    { icon: Sparkles, label: 'Coach IA', onClick: openAICoach, variant: 'primary' as const },
    ...(openPersonalizationModal ? [{ icon: Settings, label: 'Personnaliser', onClick: openPersonalizationModal, variant: 'ghost' as const }] : []),
    ...(openDataManagement ? [{ icon: Trash, label: 'Données', onClick: openDataManagement, variant: 'danger' as const }] : []),
  ];

  return (
    <>
      {/* Top Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-obsidian/95 backdrop-blur-xl border-b border-lapis-border shadow-card' : 'bg-obsidian/80 backdrop-blur-lg'
        } px-3 py-3 sm:px-4`}
      >
        {/* This row previously could NOT shrink (flex-shrink-0 both sides +
            ~430px of content) → the whole document scrolled sideways on every
            phone. Brand now shrinks/truncates, secondary actions hide <sm. */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Brand / System Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <motion.div
              className="relative flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-panel-gold flex items-center justify-center shadow-gold relative overflow-hidden">
                <img src="/logo.webp" alt="Logo Ka Rise" className="w-full h-full object-cover anim-float" width={40} height={40} />
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent" />
              </div>
              {/* Rank indicator dot */}
              {playerProfile && (
                <motion.span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-obsidian shadow-card"
                  style={{ background: rankInfo.color, boxShadow: `0 0 12px ${rankInfo.glowColor}` }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="font-display font-bold text-[9px] text-inverse" style={{ color: rankInfo.color === '#1F2937' ? '#F0EDE5' : '#1A1510' }}>
                    {rank === 'Pharaoh' ? 'P' : rank === 'ShadowMonarch' ? 'S' : rank === 'DragonKnight' ? 'D' : rank === 'WolfPack' ? 'W' : rank}
                  </span>
                </motion.span>
              )}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-base sm:text-lg md:text-xl font-light tracking-widest text-gradient-gold truncate">
                KA RISE
              </h1>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-pharaoh-subtle font-mono min-w-0">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isOffline ? 'var(--color-blood)' : 'var(--color-emerald)' }}
                  animate={{ opacity: isOffline ? [1, 0.4, 1] : 1 }}
                  transition={{ duration: isOffline ? 1.5 : 0 }}
                />
                {/* Full date+clock only ≥sm — "sam. 22 août • 20:14:38"
                    overflowed a 320px header and re-widened the row. */}
                <span className="hidden sm:inline font-mono tabular-nums truncate min-w-0">
                  {clockNow.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} • {clockNow.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="sm:hidden font-mono tabular-nums">
                  {clockNow.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isOffline && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blood/10 border border-blood/40 text-blood font-mono text-[9px] shrink-0">
                    HORS-LIGNE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Rank & Streak Badges (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {playerProfile && (
              <RankBadgeInline rank={rank} size="sm" showLabel />
            )}
            <motion.div
              className="bg-panel px-4 py-2 rounded-xl border border-gold-dim hover-lift hover-glow"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Flame size={16} style={{ color: 'var(--color-blood)', filter: 'drop-shadow(0 0 4px var(--color-blood-glow))' }} />
                <span className="font-mono tabular-nums text-gold-bright font-medium">{streakCount}</span>
                <span className="text-pharaoh-subtle text-[10px] uppercase tracking-wider">JOURS</span>
              </div>
            </motion.div>
            {personalization?.hunterTitle && (
              <motion.div
                className="bg-panel-gold px-4 py-2 rounded-xl font-display text-[10px] tracking-wider text-gold-bright"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {personalization.hunterTitle}
              </motion.div>
            )}
          </div>

          {/* Right: Action Buttons + User Menu — shrink-safe, never pushes
              the layout wider than the viewport. */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
            {/* Live focus-session countdown (#1) — always visible, taps back to the timer */}
            <FocusSessionPill onClick={openFocusTimerQuick} />

            {/* Dark / Light theme toggle — visible on every breakpoint */}
            <motion.button
              onClick={toggleDarkLight}
              aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
              title={theme === 'dark' ? 'Thème clair (Papyrus)' : 'Thème sombre (Obsidienne)'}
              className="btn-press p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-panel border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-gold transition-all"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Help / "Comment ça marche ?" — re-opens the first-visit tour */}
            {openHelp && (
              <motion.button
                onClick={openHelp}
                aria-label="Comment ça marche ?"
                title="Comment ça marche ?"
                className="btn-press p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-panel border border-lapis-border text-pharaoh-muted hover:bg-panel-hover hover:text-gold transition-all"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <HelpCircle size={18} />
              </motion.button>
            )}

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {actionButtons.map((btn, i) => (
                <motion.button
                  key={btn.label}
                  onClick={btn.onClick}
                  aria-label={btn.label}
                  className={`btn-press flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl text-sm font-medium transition-all ${
                    btn.variant === 'primary'
                      ? 'bg-panel-gold text-gold-bright hover:shadow-gold border-gold/50'
                      : btn.variant === 'danger'
                      ? 'bg-blood/10 text-blood hover:bg-blood/20 border-blood/30'
                      : 'bg-panel text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh border-lapis-border'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <btn.icon size={18} />
                  <span className="hidden md:inline">{btn.label}</span>
                </motion.button>
              ))}
            </div>

            {/* User Menu Dropdown */}
            {playerProfile && (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="Menu utilisateur"
                  aria-expanded={showUserMenu}
                  className="btn-press flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-panel border-lapis-border hover:bg-panel-hover transition-all group min-w-0"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-8 h-8 rounded-xl bg-panel-gold flex items-center justify-center shadow-gold relative">
                    <Crown size={18} color="var(--color-gold-bright)" />
                    {rankInfo.badgeImage && (
                      <img
                        src={rankInfo.badgeImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-20"
                        style={{ filter: `drop-shadow(0 0 4px ${rankInfo.glowColor})` }}
                      />
                    )}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="font-display text-sm font-light text-gold-bright truncate">{playerProfile.title || 'Hunter'}</p>
                    <p className="text-[10px] text-pharaoh-subtle font-mono">NIV {playerProfile.level || 1} • {totalXP.toLocaleString()} XP</p>
                  </div>
                  <ChevronDown size={16} className="text-pharaoh-muted group-hover:text-gold transition-colors" />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-56 md:w-64 bg-panel border border-lapis-border rounded-2xl shadow-card-hover overflow-hidden py-2"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-3 border-b border-lapis-border">
                        <p className="font-display text-sm text-gold-bright truncate">{playerProfile.title || 'Hunter'}</p>
                        <p className="text-xs text-pharaoh-subtle font-mono">{rankInfo.label} • NIV {playerProfile.level || 1}</p>
                      </div>
                      <div className="px-3 py-2 space-y-1">
                        <RankBadgeInline rank={rank} size="md" showLabel className="mx-auto" />
                        <div className="h-px bg-lapis-border my-2" />
                        {/* Quick actions — duplicated here because the header
                            button row is hidden below `sm`, which previously
                            made Coach IA & Focus unreachable on phones
                            (#2 UX audit). */}
                        <button
                          onClick={() => { setShowUserMenu(false); openAICoach(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh transition-all"
                        >
                          <Sparkles size={18} />
                          <span>Coach IA</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); openFocusTimerQuick(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh transition-all"
                        >
                          <Clock size={18} />
                          <span>Minuteur Focus</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); openHelp?.(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh transition-all"
                        >
                          <HelpCircle size={18} />
                          <span>Comment ça marche ?</span>
                        </button>
                        <div className="h-px bg-lapis-border my-2 sm:hidden" />
                        <button
                          onClick={() => { setShowUserMenu(false); setActiveTab('system_solo'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh transition-all"
                        >
                          <Sword size={18} />
                          <span>Profil Système</span>
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); openPersonalizationModal?.(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-pharaoh-muted hover:bg-panel-hover hover:text-pharaoh transition-all"
                        >
                          <Settings size={18} />
                          <span>Personnalisation</span>
                        </button>
                        {openDataManagement && (
                          <button
                            onClick={() => { setShowUserMenu(false); openDataManagement(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-blood hover:bg-blood/10 transition-all"
                          >
                            <Trash size={18} />
                            <span>Données & Reset</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="btn-press p-2.5 md:hidden min-h-[44px] min-w-[44px] rounded-xl bg-panel border-lapis-border hover:bg-panel-hover transition-all"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={showUserMenu}
            >
              <Sword size={22} color="var(--color-gold)" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Bar */}
      <nav className="hidden lg:flex sticky top-[66px] z-30 bg-obsidian/80 backdrop-blur-xl border-b border-lapis-border/50 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`btn-press relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap group ${
                  isActive
                    ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold'
                    : 'text-pharaoh-muted hover:text-pharaoh hover:bg-panel-hover border-lapis-border/50'
                }`}
                style={{
                  color: isActive ? item.domainColor : undefined,
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    className={`transition-all ${
                      isActive ? 'anim-glow' : 'group-hover:scale-110'
                    }`}
                    style={{
                      color: isActive ? item.domainColor : undefined,
                      filter: isActive ? `drop-shadow(0 0 8px ${item.domainColor}88)` : undefined,
                    }}
                  />
                  {isActive && (
                    <motion.span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      style={{ background: item.domainColor, boxShadow: `0 0 6px ${item.domainColor}` }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className="font-display tracking-wide">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation — 4 primary destinations + a "Plus" sheet.
          Previously all 8 items were fixed side by side (8 × min-w-72px ≈ 576px
          on a ~390px screen), squeezing icons and labels into unreadable chips. */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur-xl border-t border-lapis-border/50 px-1.5 py-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] safe-bottom"
        ref={moreNavRef}
      >
        <AnimatePresence>
          {showMoreNav && moreNavItems.length > 0 && (
            <motion.div
              className="absolute bottom-full left-2 right-2 mb-3 rounded-2xl bg-panel border border-lapis-border shadow-card-hover overflow-hidden"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <div className="grid grid-cols-2 gap-1 p-2">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setShowMoreNav(false); }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive ? 'bg-panel-gold text-gold-bright' : 'text-pharaoh-muted hover:bg-panel-hover'
                      }`}
                    >
                      <span
                        className="p-2 rounded-lg bg-panel shrink-0"
                        style={{ color: item.domainColor }}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-stretch gap-1">
          {primaryNavItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
            {/* Raised central FAB after the 2nd item — the Focus ritual. */}
            {i === 2 && (
              <motion.button
                onClick={() => { playSfx('system-popup', 0.8); openFocusTimerQuick(); }}
                aria-label="Session Focus — le rituel quotidien"
                className="btn-press relative flex flex-col items-center justify-center flex-1 min-w-0 px-1 -mt-6"
                whileTap={{ scale: 0.92 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dim border-2 border-gold-bright shadow-gold-lg flex items-center justify-center text-inverse">
                  <Clock size={26} />
                </div>
                <span className="text-[10px] font-display font-bold tracking-widest mt-0.5" style={{ color: 'var(--color-gold-bright)' }}>
                  FOCUS
                </span>
              </motion.button>
            )}
              <motion.button
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`btn-press flex flex-col items-center justify-center flex-1 min-w-0 min-h-[52px] px-1 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-gold-bright' : 'text-pharaoh-subtle hover:text-pharaoh'
                }`}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <div className={`relative p-2 rounded-lg mb-1 ${isActive ? 'bg-panel-gold shadow-gold' : ''}`}>
                  <Icon
                    size={20}
                    style={{ color: isActive ? item.domainColor : undefined }}
                  />
                  {isActive && (
                    <motion.span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ background: item.domainColor }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium tracking-wide truncate w-full text-center ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </motion.button>
              </React.Fragment>
            );
          })}

          {moreNavItems.length > 0 && (
            <motion.button
              onClick={() => setShowMoreNav(!showMoreNav)}
              aria-label="Plus de sections"
              aria-expanded={showMoreNav}
              aria-current={activeTabInMore ? 'page' : undefined}
              className={`btn-press flex flex-col items-center justify-center flex-1 min-w-0 min-h-[52px] px-1 py-1.5 rounded-xl transition-all ${
                showMoreNav || activeTabInMore ? 'text-gold-bright' : 'text-pharaoh-subtle hover:text-pharaoh'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`relative p-2 rounded-lg mb-1 ${showMoreNav || activeTabInMore ? 'bg-panel-gold shadow-gold' : ''}`}>
                <Grid size={20} />
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${showMoreNav || activeTabInMore ? 'opacity-100' : 'opacity-70'}`}>
                Plus
              </span>
            </motion.button>
          )}
        </div>
      </nav>
    </>
  );
};