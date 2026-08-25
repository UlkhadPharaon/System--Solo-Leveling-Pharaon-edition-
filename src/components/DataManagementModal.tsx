import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, X, Cloud, Shield } from './ui/PharaohIcons';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { cloudSync, SyncState } from '../lib/supabaseSync';
import {
  captureSafetySnapshot,
  getSafetySnapshotInfo,
  restoreSafetySnapshot,
  requestDurableStorage,
  type SnapshotInfo,
} from '../lib/dataSafety';
import { isDiskBackupSupported, chooseBackupDirectory, writeBackupNow } from '../lib/diskBackup';

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

  const [exportDone, setExportDone] = useState(false);

  // Safety-net state: one rolling snapshot + UI info. Refreshed every time the
  // modal opens so the banner never shows a stale timestamp. The durable
  // storage request is also (re-)issued here — it needs no user gesture and
  // protects months of local progress against silent browser eviction.
  const [snapshotInfo, setSnapshotInfo] = useState<SnapshotInfo | null>(null);
  const [snapshotFailed, setSnapshotFailed] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  // F5b — Disk auto-backup (Chromium only): pick a folder once, backups then
  // happen silently every few days AND on demand via "Sauvegarder maintenant".
  const [diskBackupOn, setDiskBackupOn] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSnapshotInfo(getSafetySnapshotInfo());
      setSnapshotFailed(false);
      setDiskBackupOn(isDiskBackupSupported());
      requestDurableStorage();
    }
  }, [isOpen]);

  const handleChooseBackupDir = async () => {
    const ok = await chooseBackupDirectory();
    setBackupFeedback(ok ? 'Sauvegardes automatiques activées pour ce dossier.' : 'Aucun dossier sélectionné.');
    setTimeout(() => setBackupFeedback(null), 4000);
  };

  const handleBackupNow = async () => {
    const res = await writeBackupNow();
    setBackupFeedback(res.ok ? `✓ ${res.fileName} écrite.` : 'Échec : configurez d\'abord un dossier.');
    setTimeout(() => setBackupFeedback(null), 4000);
  };

  /** Capture before ANY destructive action; surfaces quota failures. */
  const guardDestructiveAction = (reason: string): boolean => {
    const ok = captureSafetySnapshot(reason);
    if (!ok) setSnapshotFailed(true);
    return ok;
  };

  const exportData = () => {
    // Capture EVERY aura_* key dynamically — a hardcoded list silently drops
    // any key added later (it already missed aura_daily_quest_reset).
    const data: Record<string, any> = {
      _meta: {
        app: 'pharaoh-system',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
      },
    };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('aura_')) continue;
      try {
        data[key] = JSON.parse(localStorage.getItem(key) as string);
      } catch {
        data[key] = localStorage.getItem(key); // raw string fallback
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 4000);
  };

  const [confirmImport, setConfirmImport] = useState<{ content: Record<string, any>; keys: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        // Validate shape before touching localStorage.
        if (!content || typeof content !== 'object' || content._meta?.app !== 'pharaoh-system') {
          setImportError("Fichier invalide : ce n'est pas une sauvegarde du Système.");
          return;
        }
        const keys = Object.keys(content).filter((k) => k.startsWith('aura_'));
        if (keys.length === 0) {
          setImportError('Sauvegarde vide : aucune donnée aura_* trouvée.');
          return;
        }
        // Stage for confirmation — importing OVERWRITES all current data.
        setConfirmImport({ content, keys: keys.length });
      } catch (err) {
        setImportError('Erreur lors de la lecture : format JSON invalide.');
      }
    };
    reader.readAsText(file);
    // Reset the input so selecting the same file again still fires onChange.
    event.target.value = '';
  };

  const applyImport = (content: Record<string, any>) => {
    Object.keys(content).forEach((key) => {
      if (key.startsWith('aura_')) {
        localStorage.setItem(key, typeof content[key] === 'string' ? content[key] : JSON.stringify(content[key]));
      }
    });
    window.location.reload();
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const resetAllData = () => {
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-glass-strong rounded-2xl p-6 w-full max-w-md shadow-card-hover space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-light tracking-wide text-gradient-gold">Gestion des Données</h2>
          <button onClick={onClose} className="btn-press p-2 rounded-xl hover:bg-gold/10 text-pharaoh-muted hover:text-pharaoh transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-pharaoh-muted text-sm">
          Exportez vos données pour les sauvegarder, importez une sauvegarde, ou réinitialisez complètement l'application pour repartir à zéro.
        </p>

        {exportDone && (
          <p className="text-emerald text-[11px] font-mono flex items-center gap-1.5" role="status">
            ✓ Sauvegarde téléchargée.
          </p>
        )}
        {importError && (
          <p className="text-blood text-[11px] font-mono" role="alert">{importError}</p>
        )}
        {snapshotFailed && (
          <p className="text-blood text-[11px] font-mono" role="alert">
            ⚠ Instantané de secours impossible (stockage saturé) — exportez un fichier avant de continuer.
          </p>
        )}

        {/* Safety-net banner — restore point for destructive operations. */}
        {snapshotInfo && (
          <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold text-pharaoh flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald shrink-0" />
                Point de restauration disponible
              </p>
              <button
                onClick={() => setConfirmRestore(true)}
                className="btn-press shrink-0 px-3 py-1.5 rounded-xl font-mono text-[10px] bg-emerald/20 border border-emerald/40 text-emerald hover:bg-emerald/30 transition-all"
              >
                RESTAURER
              </button>
            </div>
            <p className="font-mono text-[10px] text-pharaoh-subtle">
              État du {new Date(snapshotInfo.capturedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · capturé {snapshotInfo.reason.toLowerCase()} · {snapshotInfo.keyCount} sections.
            </p>
          </div>
        )}

        {/* F5b — Disk auto-backup: durable history beyond the rolling snapshot */}
        {diskBackupOn && (
          <div className="rounded-xl border border-sapphire/40 bg-sapphire/5 p-3 space-y-2">
            <p className="text-xs font-semibold text-pharaoh">Sauvegarde Disque Automatique</p>
            <p className="font-mono text-[10px] text-pharaoh-subtle">
              Choisissez un dossier : une copie JSON complète y sera écrite tous les 3 jours, sans action.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleChooseBackupDir}
                className="btn-press px-3 py-1.5 rounded-xl font-mono text-[10px] bg-sapphire/20 border border-sapphire/50 text-sapphire hover:bg-sapphire/30 transition-all"
              >
                CHOISIR UN DOSSIER
              </button>
              <button
                onClick={handleBackupNow}
                className="btn-press px-3 py-1.5 rounded-xl font-mono text-[10px] bg-gold/10 border border-gold/40 text-gold-bright hover:bg-gold/20 transition-all"
              >
                SAUVEGARDER MAINTENANT
              </button>
            </div>
            {backupFeedback && <p className="font-mono text-[10px] text-emerald" role="status">{backupFeedback}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={exportData}
            className="btn-press hover-lift flex flex-col items-center gap-2 p-4 rounded-xl bg-gold/10 border border-gold/40 text-gold-bright hover:border-gold transition-all"
          >
            <Download className="w-6 h-6" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Exporter</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-press hover-lift flex flex-col items-center gap-2 p-4 rounded-xl bg-lapis/40 border border-lapis text-pharaoh-muted hover:border-gold hover:text-pharaoh transition-all"
          >
            <Upload className="w-6 h-6" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Importer</span>
          </button>
        </div>

        {/* Cloud Sync Section */}
        <div className="pt-2 border-t border-lapis space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-pharaoh flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sapphire" />
                Synchronisation Nuage
              </p>
              <p className="text-[10px] text-pharaoh-subtle mt-0.5">
                Sauvegarde automatique de votre progression (Supabase).
              </p>
            </div>
            <button
              onClick={() => {
                cloudSync.setEnabled(!syncEnabled);
              }}
              className={`btn-press shrink-0 px-3 py-2 rounded-xl font-mono text-[10px] font-bold border transition-all ${
                syncEnabled
                  ? 'bg-emerald/20 border-emerald/40 text-emerald'
                  : 'bg-lapis/40 border-lapis text-pharaoh-muted'
              }`}
            >
              {syncEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-pharaoh-subtle">
              {syncState.message}
              {syncState.lastSyncAt ? ` • ${new Date(syncState.lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            <button
              onClick={() => cloudSync.flush()}
              className="btn-press px-3 py-1.5 rounded-xl font-mono text-[10px] bg-gold/10 border border-gold/40 text-gold-bright hover:bg-gold/20 transition-all"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-lapis">
          <button
            onClick={() => setConfirmReset(true)}
            className="btn-press w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blood/10 border border-blood/40 text-blood hover:bg-blood/20 hover:border-blood transition-all text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Réinitialiser & Vider toutes les données</span>
          </button>
        </div>

        {/* Full reset guard — the most destructive action in the app gets the
            same ConfirmDialog treatment as simple record deletes. A snapshot
            is captured first so the wipe is always reversible. */}
        <ConfirmDialog
          isOpen={confirmReset}
          title="Tout réinitialiser ?"
          message="Toute votre progression (streaks, succès, niveau, quêtes, notes, budget) sera définitivement effacée pour repartir d'une base vierge. Un point de restauration sera créé juste avant l'effacement."
          confirmLabel="Tout effacer"
          cancelLabel="Annuler"
          onConfirm={() => {
            guardDestructiveAction('avant une réinitialisation complète');
            resetAllData();
          }}
          onCancel={() => setConfirmReset(false)}
        />

        {/* Import overwrite guard — importing replaces ALL current data,
            so it gets the same confirmation treatment as a full reset.
            A snapshot is captured first so a bad import can be undone. */}
        <ConfirmDialog
          isOpen={!!confirmImport}
          title="Importer cette sauvegarde ?"
          message={`Vos données actuelles seront remplacées par celles du fichier (${confirmImport?.keys ?? 0} sections sauvegardées). Un point de restauration sera créé juste avant le remplacement.`}
          confirmLabel="Remplacer mes données"
          cancelLabel="Annuler"
          onConfirm={() => {
            if (confirmImport) {
              guardDestructiveAction("avant l'import d'une sauvegarde");
              applyImport(confirmImport.content);
            }
            setConfirmImport(null);
          }}
          onCancel={() => setConfirmImport(null)}
        />

        {/* Restore guard — restoring replaces current state with the snapshot,
            itself captured before a destructive op; confirm symmetrically. */}
        <ConfirmDialog
          isOpen={confirmRestore}
          title="Restaurer ce point ?"
          message={`L'état actuel sera remplacé par celui capturé ${snapshotInfo?.reason.toLowerCase() ?? ''} (${snapshotInfo ? new Date(snapshotInfo.capturedAt).toLocaleString('fr-FR') : ''}). Cette action est irréversible.`}
          confirmLabel="Restaurer mes données"
          cancelLabel="Annuler"
          onConfirm={() => {
            if (restoreSafetySnapshot()) {
              window.location.reload();
            } else {
              setSnapshotFailed(true);
            }
            setConfirmRestore(false);
          }}
          onCancel={() => setConfirmRestore(false)}
        />

        <input type="file" ref={fileInputRef} onChange={importData} accept=".json,application/json" className="hidden" />
      </div>
    </div>
  );
};
