import React from 'react';
import { ActiveTab, PlayerProfile } from '../types';
import { 
  Calendar, 
  Target, 
  Clock, 
  Trophy, 
  FileText, 
  Flame, 
  Sparkles,
  Zap,
  Wallet,
  Sliders,
  Crown,
  Dumbbell,
  Download
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streakCount: number;
  playerProfile?: PlayerProfile;
  openAICoach: () => void;
  openFocusTimerQuick: () => void;
  openPersonalizationModal?: () => void;
  openDataManagement?: () => void;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  streakCount,
  playerProfile,
  openAICoach,
  openFocusTimerQuick,
  openPersonalizationModal,
  openDataManagement,
  isOffline,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'system_solo', label: 'SYSTÈME', icon: Crown, highlight: true },
    { id: 'dashboard', label: 'Quêtes', icon: Calendar },
    { id: 'workout', label: 'Entraînement', icon: Dumbbell },
    { id: 'focus_timer', label: 'Focus', icon: Clock },
    { id: 'weekly_targets', label: 'Bilan', icon: Target },
    { id: 'victory_journal', label: 'Hauts Faits', icon: Trophy },
    { id: 'notepad', label: 'Notes', icon: FileText },
    { id: 'budget', label: 'Trésorerie', icon: Wallet },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#051428]/90 backdrop-blur-xl border-b border-cyan-900/30 px-4 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h1 className="sans text-lg md:text-xl font-bold tracking-widest text-white flex items-center gap-2">
                  SYSTEM
                  {isOffline && (
                    <span className="text-[10px] px-2 py-0.5 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full font-mono font-normal">
                      HORS-LIGNE
                    </span>
                  )}
                </h1>
              </div>
            </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Desktop Only Badges */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              {playerProfile && (
                <button
                  onClick={() => setActiveTab('system_solo')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 mono text-xs hover:border-cyan-400 transition-all"
                >
                  <Crown className="w-3.5 h-3.5" />
                  NIV {playerProfile.level}
                </button>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-amber-400 mono text-xs">
                <Flame className="w-3.5 h-3.5" />
                {streakCount} J
              </div>
            </div>

            {openPersonalizationModal && (
              <button
                onClick={openPersonalizationModal}
                className="p-2 md:px-3 md:py-1.5 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden md:inline">Personnaliser</span>
              </button>
            )}
            {openDataManagement && (
              <button
                onClick={openDataManagement}
                className="p-2 md:px-3 md:py-1.5 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Data</span>
              </button>
            )}
            <button
              onClick={openFocusTimerQuick}
              className="p-2 md:px-3 md:py-1.5 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs flex items-center gap-1.5 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden md:inline">Focus</span>
            </button>
            <button
              onClick={openAICoach}
              className="p-2 md:px-3 md:py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Coach</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex sticky top-[60px] z-30 bg-[#051428]/95 backdrop-blur-md border-b border-slate-800/50 px-4 py-2 overflow-x-auto no-scrollbar gap-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? item.highlight
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)] font-medium'
                      : 'bg-slate-800/80 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#051428]/95 backdrop-blur-xl border-t border-cyan-900/30 px-2 py-2 pb-4 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all ${
                isActive
                  ? item.highlight
                    ? 'text-cyan-300'
                    : 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg mb-1 ${isActive ? (item.highlight ? 'bg-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-slate-800') : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? (item.highlight ? 'text-cyan-400' : 'text-white') : 'text-slate-500'}`} />
              </div>
              <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
