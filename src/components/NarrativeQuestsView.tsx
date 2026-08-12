import React from 'react';
import { ScrollText, Play, CheckCircle2, Award, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PlayerProfile } from '../types';

interface NarrativeQuestsViewProps {
  player: PlayerProfile;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

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
    id: 'chap_1',
    chapter: 1,
    title: 'L’Éveil de la Pyramide des Ombres',
    lore: 'Vous vous réveillez au plus profond d’un temple oublié sous les dunes de Thèbes. Une inscription brille en hiéroglyphes : « L’esprit du roi s’éveille par la discipline ». Pour réclamer votre trône, vous devez réveiller votre énergie interne.',
    objectives: [
      {
        id: 'obj_1_1',
        text: 'S’entraîner ou compléter un bloc d’activité (Missions accomplies au total >= 3)',
        check: (player) => player.logs.length >= 3
      },
      {
        id: 'obj_1_2',
        text: 'Posséder une arme ou une armure de la Forge dans l’inventaire',
        check: (player) => player.inventory.some(i => i.type === 'weapon' || i.type === 'armor')
      },
      {
        id: 'obj_1_3',
        text: 'Allouer au moins 3 points d’attribut dans vos statistiques',
        check: (player) => {
          const stats = player.attributes;
          return (stats.force + stats.vitalite + stats.agilite + stats.intelligence + stats.perception) >= 53; // base is 10 each, total 50. plus 3 is 53.
        }
      }
    ],
    xpReward: 500,
    goldReward: 1000,
    unlockedItemReward: { id: 'm_lapis_gift', name: '3x Lapis Pur Divin', type: 'material', statBonus: 'Matériau de Forge de Rang S' }
  },
  {
    id: 'chap_2',
    chapter: 2,
    title: 'L’Armée Silencieuse d’Osiris',
    lore: 'La voix mystique du Système vous chuchote que les rois défunts de l’ancienne Égypte ne sont pas morts ; ils attendent vos ordres sous forme d’ombres. Pour étendre votre influence divine, vous devez ressusciter vos premiers gardiens de pierre.',
    objectives: [
      {
        id: 'obj_2_1',
        text: 'Invoquer et posséder au moins 2 Ombres dans votre Armée Divine',
        check: (player) => player.shadows.length >= 2
      },
      {
        id: 'obj_2_2',
        text: 'Atteindre le Niveau 8 ou plus',
        check: (player) => player.level >= 8
      },
      {
        id: 'obj_2_3',
        text: 'Explorer et nettoyer un Donjon Tombeau',
        check: (player) => player.logs.some(l => l.text.includes('[VICTOIRE] Vous avez exploré'))
      }
    ],
    xpReward: 1200,
    goldReward: 2500,
    unlockedItemReward: { id: 'm_rune_gift', name: '2x Rune sacrée runique', type: 'material', statBonus: 'Matériau de Forge légendaire' }
  },
  {
    id: 'chap_3',
    chapter: 3,
    title: 'L’Ascension du Souverain de Râ',
    lore: 'Le Tombeau suprême est à portée de main. Mais pour prétendre au titre de Pharaon Ultime des Ombres, vous devez affronter le spectre de Ramsès Maudit et prouver votre valeur absolue.',
    objectives: [
      {
        id: 'obj_3_1',
        text: 'Invoquer le général suprême ou atteindre 4 ombres',
        check: (player) => player.shadows.length >= 4
      },
      {
        id: 'obj_3_2',
        text: 'Équiper à la fois une arme et une armure de la Forge Royale',
        check: (player) => player.inventory.filter(i => i.isEquipped).length >= 2
      },
      {
        id: 'obj_3_3',
        text: 'Atteindre le Niveau 12 ou supérieur',
        check: (player) => player.level >= 12
      }
    ],
    xpReward: 3000,
    goldReward: 5000,
    unlockedItemReward: { id: 'w_staff', name: 'Bâton Stellaire de Râ', type: 'weapon', statBonus: '+25 INT, +15 PER' }
  }
];

export const NarrativeQuestsView: React.FC<NarrativeQuestsViewProps> = ({ player, onUpdatePlayer }) => {
  // Find current active chapter based on player's story progress (stored in a custom field or derived)
  // Let's store story chapter index in player profile or fallback to local storage
  const [currentChapterIndex, setCurrentChapterIndex] = React.useState(() => {
    const saved = localStorage.getItem('pharaoh_narrative_chapter');
    return saved ? parseInt(saved, 10) : 0;
  });

  const activeChapter = CHAPTERS[currentChapterIndex];

  const handleClaimChapterReward = () => {
    if (!activeChapter) return;

    // Check if all objectives are completed
    const allCompleted = activeChapter.objectives.every(obj => obj.check(player));
    if (!allCompleted) {
      alert("Vous n'avez pas encore rempli tous les décrets de ce chapitre !");
      return;
    }

    // Process rewards
    onUpdatePlayer(prev => {
      let newXp = prev.xp + activeChapter.xpReward;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let leveledUp = false;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        leveledUp = true;
      }

      // Add item reward if any
      const updatedInv = [...prev.inventory];
      if (activeChapter.unlockedItemReward) {
        const matId = activeChapter.unlockedItemReward.id;
        const exists = updatedInv.find(i => i.id === matId);
        if (exists) {
          exists.quantity = (exists.quantity || 1) + 3; // add 3 of material
        } else {
          updatedInv.push({
            id: matId,
            name: activeChapter.unlockedItemReward.name,
            type: activeChapter.unlockedItemReward.type as any,
            rarity: 'S',
            description: activeChapter.unlockedItemReward.statBonus,
            goldValue: 1000,
            iconName: 'Package',
            quantity: 3
          });
        }
      }

      const log = {
        id: `story-log-${Date.now()}`,
        text: `[HISTOIRE] Chapitre ${activeChapter.chapter} complété ! Récompenses divines réclamées.`,
        type: 'loot' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: leveledUp ? prev.attributePoints + 5 : prev.attributePoints,
        inventory: updatedInv,
        logs: [log, ...prev.logs]
      };
    });

    // Advance chapter
    if (currentChapterIndex < CHAPTERS.length - 1) {
      const nextIndex = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIndex);
      localStorage.setItem('pharaoh_narrative_chapter', nextIndex.toString());
      alert(`FÉLICITATIONS ! Chapitre ${activeChapter.chapter} complété. Vous débloquez le Chapitre ${nextIndex + 1}.`);
    } else {
      alert("INCROYABLE ! Vous avez complété toutes les chroniques du Pharaon Suprême ! Votre héritage est scellé pour l'éternité.");
    }
  };

  if (!activeChapter) {
    return (
      <div className="bg-sl-lapis/20 border border-sl-gold/15 rounded-3xl p-8 text-center space-y-4">
        <Award className="w-16 h-16 text-sl-gold mx-auto animate-pulse" />
        <h3 className="font-bold text-white font-display text-xl tracking-widest uppercase">ÉPOPÉE COMPLÉTÉE</h3>
        <p className="text-slate-400 font-serif italic max-w-md mx-auto">
          Vous possédez toutes les ombres et les trésors de l'Égypte ancienne. Vous régnez désormais au sommet des cieux comme le Souverain Immortel des Ombres.
        </p>
      </div>
    );
  }

  const progressCount = activeChapter.objectives.filter(obj => obj.check(player)).length;
  const progressPercent = (progressCount / activeChapter.objectives.length) * 100;

  return (
    <div className="bg-sl-lapis/10 border border-sl-gold/15 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-gold-sm">
      {/* Absolute Decorative Icon */}
      <ScrollText className="absolute -right-6 -bottom-6 w-48 h-48 text-sl-gold/5 rotate-12 pointer-events-none" />

      <div className="space-y-6 relative z-10">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sl-gold/15 pb-4">
          <div>
            <span className="text-[10px] text-sl-gold font-display tracking-widest uppercase bg-sl-gold/10 px-3 py-1 rounded-full border border-sl-gold/20">
              CHRONIQUE ROYALE - CHAPITRE {activeChapter.chapter}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white font-display tracking-wide mt-2">
              {activeChapter.title}
            </h3>
          </div>
          {/* Chapter progress bar */}
          <div className="w-full md:w-48 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>DÉCRETS ACCOMPLIS</span>
              <span>{progressCount} / {activeChapter.objectives.length}</span>
            </div>
            <div className="w-full h-2 bg-sl-primary/60 rounded-full overflow-hidden border border-sl-gold/20">
              <div 
                className="h-full bg-gradient-to-r from-sl-gold-dark to-sl-gold-light transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Narrative Scroll / Lore Panel */}
        <div className="bg-sl-primary/40 border border-sl-gold/10 p-5 rounded-2xl italic font-serif text-slate-300 text-sm leading-relaxed relative">
          <div className="absolute top-2 right-2 text-sl-gold/20"><ScrollText className="w-5 h-5" /></div>
          "{activeChapter.lore}"
        </div>

        {/* Current Objectives Checklist */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-sl-gold font-display tracking-widest uppercase">DÉCRETS DE L'EMPIRE :</h4>
          <div className="space-y-3">
            {activeChapter.objectives.map((obj, idx) => {
              const completed = obj.check(player);
              return (
                <div 
                  key={obj.id} 
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    completed 
                      ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300' 
                      : 'bg-sl-primary/60 border-sl-gold/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold opacity-60">0{idx + 1}.</span>
                    <span className="text-xs font-serif leading-relaxed">{obj.text}</span>
                  </div>
                  {completed ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-display text-[9px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACCOMPLI
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-display text-[9px] font-bold">
                      EN COURS
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chapter Rewards Footer */}
        <div className="pt-6 border-t border-sl-gold/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] text-sl-gold font-display uppercase tracking-wider">Butins de Complétion du Chapitre :</span>
            <div className="flex flex-wrap gap-4">
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1 bg-sl-gold/5 px-2.5 py-1 rounded border border-sl-gold/20">
                +{activeChapter.xpReward} XP
              </span>
              <span className="text-xs font-bold font-mono text-white flex items-center gap-1 bg-sl-gold/5 px-2.5 py-1 rounded border border-sl-gold/20">
                +{activeChapter.goldReward} Or
              </span>
              {activeChapter.unlockedItemReward && (
                <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> {activeChapter.unlockedItemReward.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleClaimChapterReward}
            disabled={progressPercent < 100}
            className={`px-8 py-3 rounded-xl font-display text-xs tracking-widest uppercase transition-all shadow-gold ${
              progressPercent === 100
                ? 'bg-sl-gold text-sl-primary hover:scale-105'
                : 'bg-sl-primary/40 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            RÉCLAMER LE TRÔNE du Chapitre
          </button>
        </div>
      </div>
    </div>
  );
};
