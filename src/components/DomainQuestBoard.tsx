/**
 * DomainQuestBoard — the "Quêtes de Domaine" tab section.
 *
 * The generated first quests (LLM or deterministic template) were written to
 * playerProfile.generatedQuests at onboarding but never rendered anywhere. This
 * board surfaces them: each domain's starter quests can be completed for XP/gold
 * and a system log entry, completing the quest loop. Completion flows through
 * the central reducer (lib/progression) which also increments questsCompleted
 * — the counter the narrative campaign gates on.
 */
import React from 'react';
import { motion } from 'motion/react';
import {
  Check, CheckCircle2, Sparkles, Sword, Target, ScrollText, Plus, X,
} from './ui/PharaohIcons';
import { Domain, GeneratedQuest, PlayerProfile } from '../types';
import { applyQuestCompletion } from '../lib/progression';
import { buildTemplateQuests } from '../lib/questGeneration';

interface DomainQuestBoardProps {
  player: PlayerProfile;
  domains: Domain[];
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onQuestCompleted?: () => void; // victory confetti hook
}

const DIFFICULTY_LABEL: Record<GeneratedQuest['difficulty'], string> = {
  easy: 'FACILE',
  medium: 'MOYEN',
  hard: 'ÉPREUVE',
};

const DIFFICULTY_COLOR: Record<GeneratedQuest['difficulty'], string> = {
  easy: 'text-emerald border-emerald/50 bg-emerald/10',
  medium: 'text-sl-gold border-sl-gold/50 bg-sl-gold/10',
  hard: 'text-blood border-blood/50 bg-blood/10',
};

export const DomainQuestBoard: React.FC<DomainQuestBoardProps> = ({
  player,
  domains,
  onUpdatePlayer,
  onQuestCompleted,
}) => {
  const quests: GeneratedQuest[] = Array.isArray(player?.generatedQuests)
    ? player.generatedQuests
    : [];
  const activeQuests = quests.filter((q) => !q.status || q.status === 'active');
  const completedCount = quests.length - activeQuests.length;

  const domainById = new Map<string, Domain>(domains.map((d) => [d.id, d]));

  const handleComplete = (quest: GeneratedQuest) => {
    if (quest.status === 'completed') return;
    onQuestCompleted?.();
    const gold = Math.max(5, Math.round(quest.xpReward / 2));
    onUpdatePlayer((prev) => {
      const nextQuests = (prev?.generatedQuests || []).map((q) =>
        q.id === quest.id
          ? { ...q, status: 'completed' as const, completedAt: new Date().toISOString().slice(0, 10) }
          : q
      );
      // Central reducer (B3): XP/level/rank + questsCompleted++ (narrative gates)
      const { next } = applyQuestCompletion(prev, quest.xpReward, gold, quest.title);
      return {
        ...next,
        generatedQuests: nextQuests,
      };
    });
  };

  const handleAbandon = (quest: GeneratedQuest) => {
    onUpdatePlayer((prev) => ({
      ...prev,
      generatedQuests: (prev?.generatedQuests || []).map((q) =>
        q.id === quest.id ? { ...q, status: 'abandoned' as const } : q
      ),
    }));
  };

  const handleGenerate = () => {
    onUpdatePlayer((prev) => {
      const existing = prev?.generatedQuests || [];
      const active = existing.filter((q) => !q.status || q.status === 'active');
      // Never duplicate currently-active starters; replace only completed/abandoned.
      const keepCompleted = existing.filter((q) => q.status && q.status !== 'active');
      const fresh = buildTemplateQuests(domains);
      return { ...prev, generatedQuests: [...active, ...keepCompleted, ...fresh] };
    });
  };

  if (activeQuests.length === 0) {
    return (
      <div className="bg-sl-primary border border-sl-gold/20 rounded-2xl p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Target className="w-6 h-6 text-sl-gold" />
          <h3 className="font-display text-lg text-pharaoh tracking-widest">QUÊTES DE DOMAINE</h3>
        </div>
        <p className="text-xs text-sl-gold-light/60 italic max-w-md mx-auto">
          {completedCount > 0
            ? 'Toutes les quêtes de démarrage de vos domaines sont accomplies. Le Système peut en générer de nouvelles.'
            : 'Aucune quête de domaine active. Générez vos premières quêtes de démarrage.'}
        </p>
        {domains.length > 0 && (
          <button
            onClick={handleGenerate}
            className="btn-press inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sl-gold/10 border border-sl-gold/40 text-sl-gold hover:bg-sl-gold hover:text-sl-primary text-xs font-display tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" /> GÉNÉRER LES QUÊTES
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-sl-gold/20 pb-3">
        <h2 className="text-xl font-bold text-pharaoh font-display tracking-widest flex items-center gap-2">
          <Sword className="w-6 h-6 text-sl-gold" /> QUÊTES DE DOMAINE
        </h2>
        <span className="font-mono text-[10px] text-sl-gold-light/60 uppercase tracking-widest">
          {activeQuests.length} active{activeQuests.length > 1 ? 's' : ''} · {completedCount} accomplie{completedCount !== 1 ? 's' : ''}
        </span>
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" layout>
        {activeQuests.map((quest) => {
          const domain = domainById.get(quest.domainId);
          return (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sl-primary border border-sl-gold/20 rounded-2xl p-5 flex flex-col gap-3 shadow-gold-sm"
              style={domain ? { borderColor: `${domain.color_accent}55` } : undefined}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 space-y-1.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full font-display text-[9px] tracking-widest border ${DIFFICULTY_COLOR[quest.difficulty]}`}
                  >
                    {DIFFICULTY_LABEL[quest.difficulty]}
                  </span>
                  <h3 className="font-display text-sm font-bold text-pharaoh leading-snug">{quest.title}</h3>
                </div>
                <button
                  onClick={() => handleAbandon(quest)}
                  aria-label="Abandonner cette quête"
                  className="btn-press shrink-0 p-1 rounded-lg text-pharaoh-subtle hover:text-blood hover:bg-blood/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-pharaoh-muted leading-relaxed flex-1">{quest.description}</p>

              {domain && (
                <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: domain.color_accent }}>
                  <Sparkles className="w-3 h-3" />
                  {domain.label}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-sl-gold/10">
                <span className="font-mono text-[11px] text-sl-gold-light/80">
                  +{quest.xpReward} XP · +{Math.max(5, Math.round(quest.xpReward / 2))} Or
                </span>
                <button
                  onClick={() => handleComplete(quest)}
                  className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/15 border border-emerald/40 text-emerald hover:bg-emerald hover:text-inverse text-[10px] font-display tracking-wider transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACCOMPLIR
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
