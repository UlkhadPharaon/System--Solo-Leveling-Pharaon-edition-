import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, X, Cloud } from 'lucide-react';
import { cloudSync, SyncState } from '../lib/supabaseSync';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEYS = [
  'aura_personalization', 'aura_day_schedules', 'aura_category_targets', 'aura_subject_goals',
  'aura_victory_logs', 'aura_notes', 'aura_focus_sessions', 'aura_transactions',
  'aura_budget_buckets', 'aura_savings_goals', 'aura_streak_records', 'aura_project_phases',
  'aura_player_profile', 'aura_dungeons', 'aura_workout_routines',
  'aura_completed_workout_sessions', 'aura_personal_records', 'aura_body_metrics',
  'aura_onboarding_completed', 'aura_system_initialized', 'aura_daily_streak',
  'aura_domains', 'aura_habit_checks', 'aura_onboarding_version'
];

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncEnabled, setSyncEnabled] = useState(cloudSync.isEnabled());
  const [syncState, setSyncState] = useState<SyncState>(cloudSync.getState());
  const [, forceRender] = useState(0);

  useEffect(() => {
    return cloudSync.subscribe((state) => {
      setSyncState(state);
      setSyncEnabled(cloudSync.isEnabled());
      forceRender((n) => n + 1);
    });
  }, []);

  const exportData = () => {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const saved = localStorage.getItem(key);
      if (saved) data[key] = JSON.parse(saved);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        Object.keys(content).forEach(key => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(content[key]));
          }
        });
        window.location.reload();
      } catch (err) {
        alert('Erreur lors de l\'importation : format JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    if (window.confirm("⚠️ Attention : Êtes-vous sûr de vouloir réinitialiser toutes vos données et effacer toute votre progression (streaks, succès, niveau, quêtes) pour repartir sur une base complètement vierge ?")) {
      STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#051428] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Gestion des Données</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300 text-sm">
          Exportez vos données pour les sauvegarder, importez une sauvegarde, ou réinitialisez complètement l'application pour repartir à zéro.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={exportData}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 transition-all"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs">Exporter</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 hover:border-slate-600 transition-all"
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs">Importer</span>
          </button>
        </div>

        {/* Cloud Sync Section */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" />
                Synchronisation Nuage
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Sauvegarde automatique de votre progression (Supabase).
              </p>
            </div>
            <button
              onClick={() => {
                cloudSync.setEnabled(!syncEnabled);
              }}
              className={`btn-press shrink-0 px-3 py-2 rounded-xl mono text-[10px] font-bold border transition-all ${
                syncEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/50 border-slate-700 text-slate-400'
              }`}
            >
              {syncEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="mono text-[10px] text-slate-500">
              {syncState.message}
              {syncState.lastSyncAt ? ` • ${new Date(syncState.lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            <button
              onClick={() => cloudSync.flush()}
              className="btn-press px-3 py-1.5 rounded-xl mono text-[10px] bg-cyan-950/40 border border-cyan/40 text-cyan-300"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={resetAllData}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-950/70 hover:border-red-500 transition-all text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Réinitialiser & Vider toutes les données</span>
          </button>
        </div>

        <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
      </div>
    </div>
  );
};

