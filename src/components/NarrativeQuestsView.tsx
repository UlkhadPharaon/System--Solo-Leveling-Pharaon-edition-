import React from 'react';
import { ScrollText, Play, CheckCircle2, Award, Shield, Sparkles, Crown, Sword, Star, Zap, Flame } from './ui/PharaohIcons';
import { motion } from 'motion/react';
import { PlayerProfile } from '../types';
import { calculateLevelProgression, getRankAndClassForLevel } from '../lib/utils';

interface NarrativeChapter {
  id: string;
  chapter: number;
  title: string;
  lore: string;
  objectives: {
    id: string;
    text: string;
    check: (player: PlayerProfile) => boolean;
  }[];
  xpReward: number;
  goldReward: number;
  unlockedItemReward?: { name: string; type: string; statBonus: string; id: string };
}

const CHAPTERS: NarrativeChapter[] = [
  {
    id: 'prologue',
    chapter: 1,
    title: 'L\'Éveil du Chasseur',
    lore: 'Dans les ténèbres de l\'oubli, une lueur perce le voile. Le Système vous a choisi, non par hasard, mais par nécessité. Votre âme, forgée dans l\'épreuve, doit maintenant s\'élever au-dessus du commun. Chaque quête accomplie est une pierre ajoutée à votre pyramide. Le trône attend celui qui ose le gravir.',
    objectives: [
      { id: 'p1', text: 'Compléter votre première quête quotidienne', check: (p) => p.questsCompleted >= 1 },
      { id: 'p2', text: 'Atteindre le niveau 5', check: (p) => p.level >= 5 },
      { id: 'p3', text: 'Accumuler 500 XP total', check: (p) => p.totalXP >= 500 },
    ],
    xpReward: 500,
    goldReward: 100,
    unlockedItemReward: { name: 'Lame de l\'Aube', type: 'weapon', statBonus: '+10% XP par quête', id: 'dawn_blade' },
  },
  {
    id: 'trial',
    chapter: 2,
    title: 'L\'Épreuve des Sables',
    lore: 'Le désert ne pardonne pas l\'hésitation. Les vents du changement balaient les fondations fragiles. Seuls ceux qui persistent, qui transforment chaque obstacle en marche, méritent de voir l\'horizon. Votre discipline est votre boussole ; votre volonté, votre eau.',
    objectives: [
      { id: 't1', text: 'Maintenir une série de 7 jours', check: (p) => p.streakDays >= 7 },
      { id: 't2', text: 'Compléter 10 quêtes au total', check: (p) => p.questsCompleted >= 10 },
      { id: 't3', text: 'Atteindre le niveau 15', check: (p) => p.level >= 15 },
      { id: 't4', text: 'Dépenser 1000 Or en améliorations', check: (p) => p.goldSpent >= 1000 },
    ],
    xpReward: 1500,
    goldReward: 500,
    unlockedItemReward: { name: 'Amulette de Maât', type: 'accessory', statBonus: 'Réduit la pénalité d\'échec de 25%', id: 'maat_amulet' },
  },
  {
    id: 'ascension',
    chapter: 3,
    title: 'L\'Ascension du Pharaon',
    lore: 'Au sommet de la pyramide, l\'air se fait rare. Les ombres des anciens rois observent votre progression. Vous ne marchez plus sur le sable ; vous marchez sur l\'histoire. Chaque décret accompli résonne dans l\'éternité. Le Système reconnaît maintenant votre autorité.',
    objectives: [
      { id: 'a1', text: 'Atteindre le niveau 30', check: (p) => p.level >= 30 },
      { id: 'a2', text: 'Compléter 50 quêtes au total', check: (p) => p.questsCompleted >= 50 },
      { id: 'a3', text: 'Maintenir une série de 30 jours', check: (p) => p.streakDays >= 30 },
      { id: 'a4', text: 'Accumuler 25 000 XP total', check: (p) => p.totalXP >= 25000 },
      { id: 'a5', text: 'Débloquer 5 objets légendaires', check: (p) => p.unlockedItems?.length >= 5 },
    ],
    xpReward: 5000,
    goldReward: 2000,
    unlockedItemReward: { name: 'Couronne de Rê', type: 'crown', statBonus: 'Double l\'or des quêtes quotidiennes', id: 're_crown' },
  },
];

interface NarrativeQuestsViewProps {
  player: PlayerProfile;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const NarrativeQuestsView: React.FC<NarrativeQuestsViewProps> = ({ player, onUpdatePlayer }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = React.useState(() => {
    const saved = localStorage.getItem('narrative_chapter_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  const activeChapter = CHAPTERS[currentChapterIndex];

  if (!player) return null;

  const handleClaimChapterReward = () => {
    const chapter = CHAPTERS[currentChapterIndex];
    if (!chapter) return;

    onUpdatePlayer((prev) => ({
      ...prev,
      totalXP: prev.totalXP + chapter.xpReward,
      gold: prev.gold + chapter.goldReward,
      unlockedItems: chapter.unlockedItemReward
        ? [...(prev.unlockedItems || []), { ...chapter.unlockedItemReward, unlockedAt: Date.now() }]
        : prev.unlockedItems,
    }));

    if (currentChapterIndex < CHAPTERS.length - 1) {
      setCurrentChapterIndex((i) => {
        const next = i + 1;
        localStorage.setItem('narrative_chapter_index', next.toString());
        return next;
      });
    }
  };

  if (!activeChapter) {
    return (
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-panel border border-lapis-border p-8 md:p-12 text-center shadow-card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="deco-corner deco-corner--tl" />
          <div className="deco-corner deco-corner--br" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-panel-gold">
            <Crown size={32} color="var(--color-gold)" className="anim-float" />
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-gradient-gold">
            Tous les Chapitres Accomplis
          </h3>
          <p className="text-pharaoh-subtle max-w-lg">
            Vous avez gravi tous les échelons. Le trône est vôtre. De nouvelles chroniques seront écrites...
          </p>
          <div className="flex gap-4 mt-4">
            <span className="px-4 py-2 rounded-xl font-mono text-xs bg-panel-gold text-gold-bright">
              +{player.totalXP.toLocaleString()} XP Total
            </span>
            <span className="px-4 py-2 rounded-xl font-mono text-xs bg-panel-gold text-gold-bright">
              {player.level} Niveau
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  const progressCount = activeChapter.objectives.filter((obj) => obj.check(player)).length;
  const progressPercent = (progressCount / activeChapter.objectives.length) * 100;
  const isComplete = progressPercent === 100;

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-panel border border-lapis-border p-4 md:p-8 shadow-card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="deco-corner deco-corner--tl" style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }} />
        <div className="deco-corner deco-corner--br" style={{ background: 'radial-gradient(circle, var(--color-amethyst) 0%, transparent 70%)' }} />
      </div>

      {/* Scanline effect */}
      <div className="deco-scanline" />

      <div className="relative z-10 space-y-4 md:space-y-6">
        {/* Header Info */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-lapis-border/50 pb-3 md:pb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="min-w-0">
            <span className="inline-block text-[11px] text-gold font-display tracking-widest uppercase bg-panel-gold px-3 py-1 rounded-full">
              CHRONIQUE ROYALE — CHAPITRE {activeChapter.chapter}
            </span>
            <h3 className="font-display text-lg md:text-2xl font-bold text-gradient-gold tracking-wide mt-2 truncate">
              {activeChapter.title}
            </h3>
          </div>

          {/* Chapter progress */}
          <div className="w-full md:w-56 space-y-1 shrink-0">
            <div className="flex justify-between text-[10px] font-mono text-pharaoh-subtle">
              <span>DÉCRETS ACCOMPLIS</span>
              <span className="tabular-nums">{progressCount} / {activeChapter.objectives.length}</span>
            </div>
            <div className="w-full h-2 bg-obsidian rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #1E8A49, #1E8A49CC)'
                    : 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
                  boxShadow: isComplete ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(212,168,30,0.6)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </motion.div>

        {/* Narrative Scroll / Lore Panel */}
        <motion.div
          className="relative bg-obsidian/50 border border-lapis-border p-4 md:p-6 rounded-2xl italic font-display text-pharaoh-muted text-sm leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute top-3 right-3 text-gold/20">
            <ScrollText size={20} className="anim-rotate-slow" />
          </div>
          <p>"{activeChapter.lore}"</p>
        </motion.div>

        {/* Current Objectives Checklist */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-display text-[11px] uppercase tracking-widest text-gold-bright">DÉCRETS DE L'EMPIRE :</h4>
          <div className="space-y-2.5">
            {activeChapter.objectives.map((obj, idx) => {
              const completed = obj.check(player);
              const Icon = completed ? CheckCircle2 : Flame;

              return (
                <motion.div
                  key={obj.id}
                  className={`relative overflow-hidden rounded-xl p-3 md:p-4 flex items-center justify-between gap-3 transition-all ${
                    completed
                      ? 'bg-emerald/10 border-emerald/30 text-emerald'
                      : 'bg-panel border-lapis-border text-pharaoh'
                  }`}
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-5">
                    <div className="deco-corner deco-corner--tl" style={{ background: `radial-gradient(circle, ${completed ? '#1E8A49' : 'var(--color-gold)'} 0%, transparent 70%)` }} />
                  </div>

                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-pharaoh-subtle w-7 shrink-0 text-right">0{idx + 1}.</span>
                    <span className="font-display text-sm leading-relaxed flex-1 min-w-0">{obj.text}</span>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 shrink-0">
                    {completed ? (
                      <motion.span
                        className="px-2.5 md:px-3 py-1.5 rounded-full font-mono text-[10px] font-medium bg-emerald/20 text-emerald border border-emerald/40 flex items-center gap-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 * idx, type: 'spring', stiffness: 260, damping: 20 }}
                      >
                        <CheckCircle2 size={14} />
                        ACCOMPLI
                      </motion.span>
                    ) : (
                      <motion.span
                        className="px-2.5 md:px-3 py-1.5 rounded-full font-mono text-[10px] font-medium bg-blood/20 text-blood border border-blood/40"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Flame size={12} className="anim-float" />
                        EN COURS
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Chapter Rewards Footer */}
        <motion.div
          className="pt-4 md:pt-6 border-t border-lapis-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-gold-bright">Butins de Complétion du Chapitre :</span>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-xl font-mono text-xs font-medium bg-panel-gold text-gold-bright flex items-center gap-1">
                <Star size={12} />
                +{activeChapter.xpReward.toLocaleString()} XP
              </span>
              <span className="px-3 py-1.5 rounded-xl font-mono text-xs font-medium bg-panel-gold text-gold-bright flex items-center gap-1">
                <Sparkles size={12} />
                +{activeChapter.goldReward.toLocaleString()} Or
              </span>
              {activeChapter.unlockedItemReward && (
                <span className="px-3 py-1.5 rounded-xl font-mono text-xs font-medium bg-emerald/20 text-emerald border border-emerald/40 flex items-center gap-1">
                  <Award size={12} />
                  {activeChapter.unlockedItemReward.name}
                </span>
              )}
            </div>
          </div>

          <motion.button
            onClick={handleClaimChapterReward}
            disabled={!isComplete}
            className={`btn-press w-full md:w-auto px-5 md:px-8 py-3 md:py-3.5 rounded-xl font-display text-xs tracking-widest uppercase transition-all ${
              isComplete
                ? 'bg-panel-gold text-gold-bright border-gold/50 shadow-gold flex items-center justify-center gap-2'
                : 'bg-panel text-pharaoh-subtle border-lapis-border cursor-not-allowed opacity-60 flex items-center justify-center gap-2'
            }`}
            whileHover={{ scale: isComplete ? 1.02 : 1 }}
            whileTap={{ scale: isComplete ? 0.98 : 1 }}
            animate={{ boxShadow: isComplete ? '0 0 30px rgba(212,168,30,0.5)' : 'none' }}
            transition={{ duration: 1.5, repeat: isComplete ? Infinity : 0 }}
          >
            {isComplete ? (
              <>
                <Sword size={16} className="anim-float" />
                RÉCLAMER LE TRÔNE
              </>
            ) : (
              <>
                <Shield size={16} />
                {progressCount}/{activeChapter.objectives.length} Décrets Requis
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};