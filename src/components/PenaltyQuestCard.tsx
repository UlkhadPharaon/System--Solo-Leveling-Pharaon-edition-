/**
 * PenaltyQuestCard — active "Quête de Châtiment" UI.
 *
 * When daily quests were left incomplete at midnight, the engine activates a
 * penalty with a grace deadline. This card renders the reason, a live countdown
 * to the deadline, and the make-up tasks that can cancel it ("absolution").
 */
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Flame, Zap } from './ui/PharaohIcons';
import { PlayerProfile } from '../types';

interface PenaltyQuestCardProps {
  player: PlayerProfile;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onAbsolved?: () => void;
}

export function useCountdown(deadlineAt?: string): number {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineAt) return 0;
    return Math.max(0, new Date(deadlineAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!deadlineAt) return;
    const tick = () =>
      setRemaining(Math.max(0, new Date(deadlineAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineAt]);

  return remaining;
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'EXPIRÉE';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${m}m ${pad(s)}s`;
}

export const PenaltyQuestCard: React.FC<PenaltyQuestCardProps> = ({
  player,
  onUpdatePlayer,
  onAbsolved,
}) => {
  const penalty = player?.penaltyQuest;
  const isActive = !!(penalty && penalty.isActive && !penalty.resolved);
  const remaining = useCountdown(penalty?.deadlineAt);

  if (!isActive) return null;

  const allDone = penalty.tasks.every((t) => t.isCompleted);
  const expired = remaining <= 0;

  const handleProgressTask = (taskId: string) => {
    onUpdatePlayer((prev) => {
      if (!prev?.penaltyQuest) return prev;
      const tasks = (prev.penaltyQuest.tasks || []).map((t) =>
        t.id === taskId
          ? { ...t, current: Math.min(t.target, t.current + 1), isCompleted: t.current + 1 >= t.target }
          : t
      );
      return { ...prev, penaltyQuest: { ...prev.penaltyQuest, tasks } };
    });
  };

  const handleAbsolve = () => {
    onAbsolved?.();
    onUpdatePlayer((prev) => ({
      ...prev,
      penaltyQuest: {
        ...INACTIVE_PENALTY,
        ...(prev?.penaltyQuest ? { tasks: (prev.penaltyQuest.tasks || []).map((t) => ({ ...t, isCompleted: t.current >= t.target })) } : {}),
      },
      logs: [
        {
          id: `log-absolve-${Date.now()}`,
          text: '[PÉNALITÉ] Châtiment annulé : toutes les tâches de rattrapage accomplies. Intégrité restaurée.',
          type: 'quest',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...(prev?.logs || []),
      ],
    }));
  };

  return (
    <div className="rounded-2xl border border-blood/40 bg-blood/5 overflow-hidden shadow-gold-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-blood/30 bg-blood/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blood animate-pulse" />
          <span className="font-display font-bold text-pharaoh text-sm tracking-widest uppercase">
            {penalty.title || 'QUÊTE DE CHÂTIMENT'}
          </span>
        </div>
        <div
          className="font-mono text-xs text-blood bg-blood/10 border border-blood/40 px-2 py-1 rounded flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" /> {formatRemaining(remaining)}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-pharaoh-muted">
          {penalty.description}
          <span className="block mt-1 italic text-blood/80">Raison : {penalty.reason}</span>
        </p>

        {!allDone && !expired && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {penalty.tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                  task.isCompleted
                    ? 'border-emerald/40 bg-emerald/10'
                    : 'border-lapis/40 bg-lapis/10'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-pharaoh font-medium leading-tight">{task.title}</p>
                  <p className="font-mono text-[10px] text-pharaoh-muted">
                    {task.current} / {task.target} {task.unit}
                  </p>
                </div>
                {!task.isCompleted ? (
                  <button
                    onClick={() => handleProgressTask(task.id)}
                    className="btn-press shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-blood/15 border border-blood/50 text-blood hover:bg-blood hover:text-inverse text-[10px] font-display tracking-wider transition-all"
                  >
                    +1
                  </button>
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {allDone && !expired && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-emerald flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Toutes les tâches de rattrapage accomplies.
            </p>
            <button
              onClick={handleAbsolve}
              className="btn-press inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald/20 border border-emerald/40 text-emerald hover:bg-emerald hover:text-inverse text-[11px] font-display tracking-wider transition-all"
            >
              <Zap className="w-4 h-4" /> ABSOLUTION
            </button>
          </div>
        )}

        {expired && (
          <p className="text-xs text-blood flex items-center gap-2">
            <Flame className="w-4 h-4 animate-pulse" /> Le délai de grâce est écoulé — le châtiment va être appliqué par le Système.
          </p>
        )}
      </div>
    </div>
  );
};

const INACTIVE_PENALTY: NonNullable<PlayerProfile['penaltyQuest']> = {
  isActive: false,
  title: 'QUÊTE DE CHÂTIMENT',
  description: 'Aucune pénalité active.',
  reason: 'Aucun manquement',
  timeRemainingSeconds: 0,
  hpPenalty: 0,
  xpPenalty: 0,
  tasks: [],
  resolved: true,
};