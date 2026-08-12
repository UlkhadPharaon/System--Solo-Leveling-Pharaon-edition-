import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Skull, 
  Crown, 
  ShoppingCart, 
  History, 
  Settings, 
  Sword, 
  Shield, 
  Coins, 
  Package, 
  Award, 
  Flame, 
  AlertTriangle, 
  Plus, 
  Camera, 
  Music, 
  Play, 
  Lock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Heart,
  Zap,
  Brain,
  Eye,
  Trophy,
  Hammer,
  Clock,
  Timer,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlayerProfile, 
  HunterRank, 
  AttributeKey, 
  SystemItem, 
  DungeonBoss, 
  ShadowSoldier,
  SystemLog
} from '../types';
import { PharaohAvatarCustomizer } from './PharaohAvatarCustomizer';
import { RoyalForge } from './RoyalForge';
import { ShadowSynergiesList } from './ShadowSynergiesList';
import { AnubisCharts } from './AnubisCharts';
import { NarrativeQuestsView } from './NarrativeQuestsView';
import { DungeonTimer } from './DungeonTimer';
import { WorldLeaderboardView } from './WorldLeaderboardView';

const LIFE_IMPROVEMENT_CHALLENGES = [
  {
    id: 'lic-1',
    title: "Portail Mystique : Briseur de Timidité (Rang C)",
    bossName: "Le Messager d'Outre-Tombe - Héraclius",
    rank: "C" as const,
    maxHp: 5000,
    currentHp: 5000,
    attackPower: 120,
    description: "Les ombres du doute et du silence paralysent votre communication sociale. Pour refermer cette porte, engagez-vous sur la voie de l’éloquence.",
    lifeImprovementGoal: "Aborder 1 parfait inconnu dans la rue ou à un café pour lui demander poliment l'heure ou un conseil de direction, et maintenir 1 minute de conversation.",
    xpReward: 3500,
    goldReward: 2000,
    keyRequiredId: 'key-c',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Héraclius l'Éloquent",
    shadowQuote: "« Ma parole et mes ombres de persuasion s'unissent pour servir le nouveau Pharaon ! »",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 'lic-2',
    title: "Portail Mystique : Souverain du Focus (Rang A)",
    bossName: "L'Architecte Royal - Sénènmout",
    rank: "A" as const,
    maxHp: 12000,
    currentHp: 12000,
    attackPower: 300,
    description: "Les flux incessants de notifications parasitent votre esprit impérial. Érigez une pyramide de productivité pure.",
    lifeImprovementGoal: "Compléter 3 heures cumulées d'études intensives ou d'écriture de projet sans aucune distraction, téléphone totalement éteint dans une autre pièce.",
    xpReward: 8000,
    goldReward: 5000,
    keyRequiredId: 'key-a',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Sénènmout le Bâtisseur",
    shadowQuote: "« Vos plans de conquête et de développement personnel sont parfaitement échafaudés, mon Roi. »",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 'lic-3',
    title: "Portail Mystique : Volonté d'Osiris (Rang B)",
    bossName: "Général d'Élite - Ounas",
    rank: "B" as const,
    maxHp: 8000,
    currentHp: 8000,
    attackPower: 200,
    description: "Un roi faible ne peut dompter les ombres. Relevez un défi de résilience physique et de force mentale pure.",
    lifeImprovementGoal: "Faire 100 squats, 100 pompes, et terminer par une douche glacée totale de 3 minutes sans eau chaude.",
    xpReward: 5500,
    goldReward: 3500,
    keyRequiredId: 'key-b',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Ounas le Maréchal d'Ombre",
    shadowQuote: "« Ma force brute est à votre service. J'écraserai quiconque se dresse contre votre discipline. »",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 'lic-4',
    title: "Portail Mystique : Étoile Circadienne (Rang E)",
    bossName: "Gardien de la Nuit - Nephtys",
    rank: "E" as const,
    maxHp: 1500,
    currentHp: 1500,
    attackPower: 40,
    description: "La fatigue est l'ennemi de la lucidité divine. Préparez votre corps pour les combats de demain.",
    lifeImprovementGoal: "Éteindre TOUS vos écrans (téléphone, ordinateur, TV) à 21h30 ce soir et lire un livre physique jusqu'à vous endormir pour 8 heures de sommeil continu.",
    xpReward: 1500,
    goldReward: 800,
    keyRequiredId: 'key-e',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Nephtys l'Ombre Stellaire",
    shadowQuote: "« Vos songes sont sous ma protection divine, mon Pharaon. Reposez-vous en paix. »",
    imageUrl: "https://images.unsplash.com/photo-1511295742364-92767fa62d9f?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 'lic-5',
    title: "Portail Mystique : Hydratation d'Anubis (Rang D)",
    bossName: "Le Pourvoyeur d'Eau Sacrée - Hâpy",
    rank: "D" as const,
    maxHp: 3000,
    currentHp: 3000,
    attackPower: 70,
    description: "Nettoyez votre organisme des toxines du sucre. Purifiez votre corps avec l'eau de la sagesse.",
    lifeImprovementGoal: "Boire un minimum de 2,5 litres d'eau plate aujourd'hui et interdire totalement tout sucre raffiné ou soda.",
    xpReward: 2200,
    goldReward: 1200,
    keyRequiredId: 'key-d',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Hâpy le Torrent d'Ombre",
    shadowQuote: "« L'énergie coule désormais dans vos veines comme la crue impériale du Nil ! »",
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 'lic-6',
    title: "Portail Mystique : Temple de la Sagesse (Rang C)",
    bossName: "Le Conservateur de Thèbes - Philopator",
    rank: "C" as const,
    maxHp: 4500,
    currentHp: 4500,
    attackPower: 110,
    description: "Un esprit non cultivé est un royaume vulnérable. Armez votre esprit avec la sagesse des maîtres.",
    lifeImprovementGoal: "Lire attentivement 30 pages complètes d'un livre de non-fiction (développement personnel, psychologie ou business).",
    xpReward: 3800,
    goldReward: 1800,
    keyRequiredId: 'key-c',
    keyRequiredName: 'Libre accès divin (Aucune clé requise pour les portails de vie)',
    shadowName: "Philopator le Sage",
    shadowQuote: "« Les manuscrits anciens confirment votre destinée divine, mon Souverain. »",
    imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
  }
];

const PortalCountdown: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("EXPIRÉ");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return (
    <span className="text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded font-mono text-[9px] flex items-center gap-1 animate-pulse">
      <Clock className="w-3 h-3" /> RESTANT : {timeLeft}
    </span>
  );
};

interface SystemSoloLevelingProps {
  player: PlayerProfile;
  dungeons: DungeonBoss[];
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onUpdateDungeons: React.Dispatch<React.SetStateAction<DungeonBoss[]>>;
  onTriggerVictoryConfetti: () => void;
  streakCount: number;
  totalCompletedTasks: number;
  onOpenDataManagement?: () => void;
}

type SystemTab = 'statut' | 'quetes' | 'donjons' | 'ombres' | 'forge' | 'boutique' | 'logs' | 'personnalisation' | 'leaderboard';

export const SystemSoloLeveling: React.FC<SystemSoloLevelingProps> = ({
  player,
  dungeons,
  onUpdatePlayer,
  onUpdateDungeons,
  onTriggerVictoryConfetti,
  streakCount,
  totalCompletedTasks,
  onOpenDataManagement
}) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('statut');
  const [ariseModalBoss, setAriseModalBoss] = useState<DungeonBoss | null>(null);
  const [ariseSuccess, setAriseSuccess] = useState(false);
  const [shopSuccessMsg, setShopSuccessMsg] = useState<string | null>(null);
  const [activeDungeonTimerBoss, setActiveDungeonTimerBoss] = useState<DungeonBoss | null>(null);
  const [confirmDungeonChallengeBoss, setConfirmDungeonChallengeBoss] = useState<DungeonBoss | null>(null);

  const handleDetectMysticGate = () => {
    if (player.mp < 20) {
      setShopSuccessMsg("Énergie magique (MP) insuffisante ! Consomme 20 MP. Veuillez acheter une Potion de Mana dans la boutique.");
      setTimeout(() => setShopSuccessMsg(null), 5000);
      return;
    }

    // Deduct 20 MP from player
    onUpdatePlayer(prev => ({
      ...prev,
      mp: Math.max(0, prev.mp - 20)
    }));

    // Choose random challenge
    const randomIndex = Math.floor(Math.random() * LIFE_IMPROVEMENT_CHALLENGES.length);
    const template = LIFE_IMPROVEMENT_CHALLENGES[randomIndex];

    const newId = `dun-mystic-${template.id}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    const newDungeon: DungeonBoss = {
      ...template,
      id: newId,
      isLimitedTime: true,
      expiresAt: expiresAt,
      isDefeated: false,
    };

    onUpdateDungeons(prev => {
      const nowTime = new Date().getTime();
      const filtered = prev.filter(d => {
        if (d.isLimitedTime && d.expiresAt) {
          const exp = new Date(d.expiresAt).getTime();
          return exp > nowTime || d.isDefeated;
        }
        return true;
      });
      return [...filtered, newDungeon];
    });

    onUpdatePlayer(prev => ({
      ...prev,
      logs: [
        {
          id: `log-detect-${Date.now()}`,
          text: `[DÉTECTION] Porte dimensionnelle détectée : « ${template.title} » s'est ouverte dans votre zone !`,
          type: 'shadow',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.logs
      ]
    }));

    setShopSuccessMsg(`PORTE DÉTECTÉE ! « ${template.title} » est ouverte pendant 24h !`);
    setTimeout(() => setShopSuccessMsg(null), 6000);
  };

  const handleConfirmDungeonChallenge = (dungeonId: string) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (!dungeon) return;

    onTriggerVictoryConfetti();
    
    // Mark as defeated
    onUpdateDungeons(prev => prev.map(d => d.id === dungeonId ? { ...d, isDefeated: true } : d));

    onUpdatePlayer(prev => {
      let newXp = prev.xp + dungeon.xpReward;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let newAp = prev.attributePoints;
      let leveledUp = false;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        newAp += 5;
        leveledUp = true;
      }

      const log: SystemLog = {
        id: `log-lic-complete-${Date.now()}`,
        text: `[DÉFI SURMONTÉ] Félicitations ! Défi accompli : « ${dungeon.title} ». Vous gagnez +${dungeon.xpReward} XP et +${dungeon.goldReward} Or !`,
        type: 'loot',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: newAp,
        gold: prev.gold + dungeon.goldReward,
        logs: [log, ...prev.logs]
      };
    });

    // If extractable, open the ARISE modal immediately so they can claim their shadow soldier!
    if (dungeon.shadowName) {
      setTimeout(() => {
        setAriseModalBoss(dungeon);
      }, 1000);
    }

    setConfirmDungeonChallengeBoss(null);
  };

  const showSystemMessage = (text: string) => {
    // Logic to show a system-wide notification if available
    console.log(`[SYSTEM] ${text}`);
  };

  const getRankBadgeStyle = (rank: HunterRank) => {
    switch (rank) {
      case 'E':
        return 'border-slate-600 text-slate-400 bg-sl-primary/60 font-display';
      case 'D':
        return 'border-emerald-700 text-emerald-500 bg-emerald-950/40 font-display';
      case 'C':
        return 'border-sl-gold/30 text-sl-gold-light/60 bg-sl-lapis/40 font-display';
      case 'B':
        return 'border-sl-gold/50 text-sl-gold-light/80 bg-sl-lapis/60 font-display';
      case 'A':
        return 'border-sl-gold text-sl-gold bg-sl-lapis/80 shadow-gold-sm font-display';
      case 'S':
        return 'border-red-600 text-red-500 bg-red-950/80 shadow-[0_0_22px_rgba(239,68,68,0.4)] animate-pulse font-display';
      case 'Pharaon':
        return 'border-sl-gold-light text-sl-gold-light bg-sl-lapis/90 shadow-gold animate-pulse font-display tracking-widest';
      default:
        return 'border-slate-500 text-slate-300 font-display';
    }
  };

  const handleAllocateAttribute = (attrKey: AttributeKey) => {
    if (player.attributePoints <= 0) return;

    onUpdatePlayer((prev) => {
      const newAttr = { ...prev.attributes, [attrKey]: prev.attributes[attrKey] + 1 };
      const newHpMax = 100 + newAttr.vitalite * 15;
      const newMpMax = 50 + newAttr.intelligence * 10;

      return {
        ...prev,
        attributes: newAttr,
        attributePoints: prev.attributePoints - 1,
        maxHp: newHpMax,
        maxMp: newMpMax,
        logs: [
          {
            id: `log-${Date.now()}`,
            text: `[SYSTEM] Point attribué à ${attrKey.toUpperCase()}.`,
            type: 'xp',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs,
        ],
      };
    });
  };

  const handleBuyShopItem = (item: SystemItem) => {
    if (player.gold < item.goldValue) {
      showSystemMessage('Or insuffisant dans vos coffres du Système !');
      return;
    }

    onUpdatePlayer((prev) => {
      const existing = prev.inventory.find((i) => i.name === item.name);
      let updatedInv = [...prev.inventory];

      if (existing) {
        updatedInv = updatedInv.map((i) =>
          i.name === item.name ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      } else {
        updatedInv.push({ ...item, quantity: 1, id: `inv-${Date.now()}` });
      }

      return {
        ...prev,
        gold: prev.gold - item.goldValue,
        inventory: updatedInv,
        logs: [
          {
            id: `log-buy-${Date.now()}`,
            text: `[ACHAT AU SYSTÈME] Achat de « ${item.name} » pour ${item.goldValue} Or.`,
            type: 'loot',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs,
        ],
      };
    });

    setShopSuccessMsg(`Acheté : ${item.name}`);
    setTimeout(() => setShopSuccessMsg(null), 3000);
  };

  const handleUsePotion = (item: SystemItem) => {
    onUpdatePlayer((prev) => {
      const newHp = Math.min(prev.maxHp, prev.hp + (item.hpRestore || 0));
      const newMp = Math.min(prev.maxMp, prev.mp + (item.mpRestore || 0));

      const updatedInv = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            const qty = (i.quantity || 1) - 1;
            return qty > 0 ? { ...i, quantity: qty } : null;
          }
          return i;
        })
        .filter(Boolean) as SystemItem[];

      return {
        ...prev,
        hp: newHp,
        mp: newMp,
        inventory: updatedInv,
        logs: [
          {
            id: `log-potion-${Date.now()}`,
            text: `[SYSTÈME] Consommation de « ${item.name} ».`,
            type: 'loot',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs,
        ],
      };
    });
  };

  const handleOpenLootBox = () => {
    if (player.gold < 100) {
      setShopSuccessMsg("Or insuffisant pour ouvrir une boîte.");
      setTimeout(() => setShopSuccessMsg(null), 3000);
      return;
    }
    
    onUpdatePlayer(prev => ({ ...prev, gold: prev.gold - 100 }));
    
    const rng = Math.random();
    let prize = "";
    if (rng < 0.1) {
      prize = "Clé de Donjon de Rang A";
      onUpdatePlayer(prev => ({
        ...prev,
        inventory: [...prev.inventory, {
          id: `loot-key-${Date.now()}`, name: prize, type: 'key', rarity: 'A', description: 'Ouvre un donjon mortel.', goldValue: 500, iconName: 'Key', quantity: 1
        }]
      }));
    } else if (rng < 0.4) {
      prize = "Élixir de Force (+5 STR)";
      onUpdatePlayer(prev => ({
        ...prev,
        attributes: { ...prev.attributes, force: prev.attributes.force + 5 }
      }));
    } else if (rng < 0.7) {
      prize = "Potion de Soin Majeure (HP Max)";
      onUpdatePlayer(prev => ({
        ...prev,
        hp: prev.maxHp
      }));
    } else {
      prize = "Bandeau Déchiré (Rien d'utile)";
    }
    
    setShopSuccessMsg(`BOÎTE OUVERTE ! Vous avez obtenu : ${prize}`);
    setTimeout(() => setShopSuccessMsg(null), 5000);
  };

  const handlePerformArise = () => {
    if (!ariseModalBoss) return;
    
    setAriseSuccess(true);
    setTimeout(() => {
      onUpdatePlayer(prev => ({
        ...prev,
        shadows: [
          ...prev.shadows,
          {
            id: `shadow-${Date.now()}`,
            name: ariseModalBoss.shadowName || ariseModalBoss.bossName,
            rank: ariseModalBoss.rank,
            power: Math.floor(ariseModalBoss.attackPower * 1.5),
            iconName: 'Crown',
            quote: ariseModalBoss.shadowQuote || 'À vos ordres.',
            description: 'Guerrier éternel ressuscité par le Pharaon.',
            extractedAt: new Date().toLocaleDateString('fr-FR')
          }
        ],
        logs: [
          {
            id: `log-arise-${Date.now()}`,
            text: `[ÉVEIL] « ${ariseModalBoss.shadowName || ariseModalBoss.bossName} » a été extrait avec succès.`,
            type: 'shadow',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs
        ]
      }));
      setAriseModalBoss(null);
      setAriseSuccess(false);
    }, 2000);
  };

  const handleEnterDungeon = (dungeon: DungeonBoss) => {
    // Check if player has the key
    const hasKey = player.inventory.some(item => item.id === dungeon.keyRequiredId || item.name.includes(dungeon.rank));
    if (!hasKey) {
      showSystemMessage(`Accès refusé ! Vous devez posséder : ${dungeon.keyRequiredName}`);
      return;
    }

    if (dungeon.isDefeated) {
      showSystemMessage("Ce tombeau est déjà vide.");
      return;
    }

    // Launch focus timer dungeon clearance
    setActiveDungeonTimerBoss(dungeon);
  };

  const handleDungeonTimerComplete = (dungeonId: string) => {
    const dungeon = dungeons.find(d => d.id === dungeonId);
    if (!dungeon) return;

    onTriggerVictoryConfetti();
    onUpdateDungeons(prev => prev.map(d => d.id === dungeonId ? { ...d, isDefeated: true } : d));
    
    onUpdatePlayer(prev => ({
      ...prev,
      xp: prev.xp + dungeon.xpReward,
      gold: prev.gold + dungeon.goldReward,
      logs: [
        {
          id: `log-vic-${Date.now()}`,
          text: `[DONJON] Vous avez conquis ${dungeon.title} après une séance de concentration intense ! +${dungeon.xpReward} XP, +${dungeon.goldReward} Or.`,
          type: 'loot',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.logs
      ]
    }));

    if (dungeon.shadowExtractable) {
      setAriseModalBoss(dungeon);
    } else {
      showSystemMessage(`DONJON NETTOYÉ !`);
    }
    setActiveDungeonTimerBoss(null);
  };

  const handleUpdateQuestProgress = (questId: string, amount: number) => {
    onUpdatePlayer(prev => {
      const updatedQuests = prev.dailyQuests.map(q => {
        if (q.id === questId) {
          const newCount = Math.min(q.targetCount, q.currentCount + amount);
          return { ...q, currentCount: newCount };
        }
        return q;
      });
      return { ...prev, dailyQuests: updatedQuests };
    });
  };

  const handleCompleteQuestInstantly = (questId: string) => {
    onUpdatePlayer(prev => {
      const updatedQuests = prev.dailyQuests.map(q => {
        if (q.id === questId) {
          return { ...q, currentCount: q.targetCount };
        }
        return q;
      });
      return { ...prev, dailyQuests: updatedQuests };
    });
  };

  const handleClaimQuestReward = (questId: string) => {
    onUpdatePlayer(prev => {
      const quest = prev.dailyQuests.find(q => q.id === questId);
      if (!quest || quest.isCompleted) return prev;

      const updatedQuests = prev.dailyQuests.map(q => 
        q.id === questId ? { ...q, isCompleted: true, currentCount: q.targetCount } : q
      );

      let newXp = prev.xp + quest.xpReward;
      let newLevel = prev.level;
      let newXpNext = prev.xpToNextLevel;
      let newAp = prev.attributePoints;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
        newAp += 5;
      }

      if (newLevel > prev.level) {
        onTriggerVictoryConfetti();
      }

      onTriggerVictoryConfetti();

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpNext,
        attributePoints: newAp,
        gold: prev.gold + quest.goldReward,
        dailyQuests: updatedQuests,
        logs: [
          {
            id: `log-quest-${Date.now()}`,
            text: `[MISSION] Récompense obtenue pour « ${quest.title} » : +${quest.xpReward} XP, +${quest.goldReward} Or.`,
            type: 'xp',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.logs
        ]
      };
    });
  };

  const shopItems: SystemItem[] = [
    { id: 'p1', name: 'Potion de Soin Mineure', type: 'potion', rarity: 'E', description: 'Restaure 30 HP.', hpRestore: 30, goldValue: 50, iconName: 'Heart' },
    { id: 'p2', name: 'Potion de Mana Mineure', type: 'potion', rarity: 'E', description: 'Restaure 20 MP.', mpRestore: 20, goldValue: 50, iconName: 'Zap' },
    { id: 'p3', name: 'Élixir de Vie du Nil', type: 'potion', rarity: 'B', description: 'Restaure 100 HP.', hpRestore: 100, goldValue: 200, iconName: 'Heart' },
  ];

  return (
    <div className="bg-[#070b14] min-h-screen text-slate-200 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-sl-primary border-b border-sl-gold/30 p-4 md:p-6 sticky top-0 z-40 backdrop-blur-md bg-sl-primary/95">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-sl-lapis border-2 border-sl-gold flex items-center justify-center font-display text-sl-gold font-bold text-2xl shadow-gold animate-pulse">
                {player.level}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-sl-gold text-sl-primary text-[8px] font-display font-bold px-1.5 py-0.5 rounded border border-sl-primary shadow-lg">
                NIVEAU
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-white font-display tracking-widest">{player.title}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-display ${getRankBadgeStyle(player.rank)}`}>
                  RANG {player.rank}
                </span>
              </div>
              <p className="text-xs text-sl-gold-light/60 font-serif italic tracking-wide">
                Classe : <span className="text-sl-gold font-display not-italic">{player.hunterClass}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-red-400 font-display">SANTÉ (HP)</span>
                <span>{player.hp} / {player.maxHp}</span>
              </div>
              <div className="w-full h-2.5 bg-sl-primary/60 rounded-full overflow-hidden border border-sl-gold/30">
                <div 
                  className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (player.hp / player.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-sl-gold font-display">ÉNERGIE (MP)</span>
                <span>{player.mp} / {player.maxMp}</span>
              </div>
              <div className="w-full h-2.5 bg-sl-primary/60 rounded-full overflow-hidden border border-sl-gold/30">
                <div 
                  className="h-full bg-gradient-to-r from-sl-gold-dark via-sl-gold to-sl-gold-light transition-all duration-300"
                  style={{ width: `${Math.min(100, (player.mp / player.maxMp) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-sl-gold/10 flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'statut', icon: Activity, label: 'Statut' },
            { id: 'quetes', icon: CheckCircle2, label: 'Missions' },
            { id: 'donjons', icon: Skull, label: 'Donjons' },
            { id: 'ombres', icon: Crown, label: 'Armée Divine' },
            { id: 'forge', icon: Hammer, label: 'Forge Royale' },
            { id: 'boutique', icon: ShoppingCart, label: 'Boutique' },
            { id: 'leaderboard', icon: Trophy, label: 'Classement' },
            { id: 'logs', icon: History, label: 'Journal' },
            { id: 'personnalisation', icon: Settings, label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SystemTab)}
              className={`px-4 py-2 text-xs whitespace-nowrap flex items-center gap-2 transition-all font-display rounded-lg border ${
                activeTab === tab.id
                  ? 'bg-sl-gold text-sl-primary border-sl-gold shadow-gold-sm font-bold scale-105'
                  : 'text-sl-gold-light/60 hover:text-sl-gold border-sl-gold/10 hover:border-sl-gold/30'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {shopSuccessMsg && (
          <div className="mb-6 p-4 bg-gradient-to-r from-sl-gold-dark/40 to-sl-lapis/80 border-2 border-sl-gold/80 text-white font-display font-bold text-center text-xs tracking-wider rounded-2xl shadow-gold flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-sl-gold animate-bounce" />
            <span>{shopSuccessMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* TAB 1: STATUT */}
          {activeTab === 'statut' && (
            <motion.div 
              key="statut"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-sl-gold/20 pb-3">
                  <h2 className="text-xl font-bold text-white font-display tracking-widest flex items-center gap-2">
                    <Activity className="w-6 h-6 text-sl-gold" /> CAPACITÉS DIVINES
                  </h2>
                  <div className="bg-sl-gold/10 px-3 py-1.5 rounded-xl border border-sl-gold/40 text-sl-gold text-xs font-display flex items-center gap-2 shadow-gold-sm">
                    Points Disponibles : <strong className="text-white text-sm">{player.attributePoints}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'force', label: 'FORCE', icon: Sword, desc: 'Augmente les dégâts physiques.' },
                    { key: 'vitalite', label: 'VITALITÉ', icon: Heart, desc: 'Augmente les points de vie max.' },
                    { key: 'agilite', label: 'AGILITÉ', icon: Zap, desc: 'Améliore la vitesse et l’esquive.' },
                    { key: 'intelligence', label: 'INTELLIGENCE', icon: Brain, desc: 'Augmente le mana max.' },
                    { key: 'perception', label: 'PERCEPTION', icon: Eye, desc: 'Détecte les pièges et les trésors.' },
                  ].map((attr) => (
                    <div key={attr.key} className="bg-sl-primary/60 border border-sl-gold/10 rounded-2xl p-5 flex items-center justify-between group hover:border-sl-gold/40 transition-all shadow-lg hover:shadow-gold-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-sl-lapis/40 rounded-xl text-sl-gold group-hover:scale-110 transition-transform">
                          <attr.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] text-sl-gold font-display tracking-widest">{attr.label}</div>
                          <div className="text-2xl font-bold text-white font-mono">{player.attributes[attr.key as AttributeKey]}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAllocateAttribute(attr.key as AttributeKey)}
                        disabled={player.attributePoints <= 0}
                        className="p-2 bg-sl-gold text-sl-primary rounded-lg disabled:opacity-20 disabled:grayscale transition-all hover:scale-110 active:scale-95 shadow-gold-sm"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Badges Section */}
                <div className="space-y-6 pt-6">
                  <h2 className="text-md font-bold text-white flex items-center gap-2 border-b border-sl-gold/20 pb-3 font-display uppercase tracking-widest">
                    <Award className="w-5 h-5 text-sl-gold" /> Badges de Gloire
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {player.badges.map(badgeId => (
                       <div key={badgeId} className="p-4 bg-sl-gold/10 border border-sl-gold rounded-2xl flex flex-col items-center text-center gap-2 shadow-gold-sm animate-in zoom-in-50">
                          <Award className="w-10 h-10 text-sl-gold animate-pulse" />
                          <div className="text-[10px] font-display text-white">{badgeId}</div>
                       </div>
                     ))}
                     {player.badges.length === 0 && (
                       <div className="col-span-full text-center py-6 text-slate-600 italic text-xs">
                         Aucun badge débloqué pour le moment.
                       </div>
                     )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-md font-bold text-white font-display border-b border-sl-gold/20 pb-3">ÉQUIPEMENT ÉQUIPÉ</h2>
                <div className="space-y-4">
                   <div className="p-4 bg-sl-lapis/20 border border-sl-gold/10 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Sword className="w-5 h-5 text-sl-gold" />
                         <div>
                            <div className="text-[10px] text-sl-gold-light/60">ARME</div>
                            <div className="text-sm font-bold text-white">Lame de Khéops</div>
                         </div>
                      </div>
                      <div className="text-sl-gold font-mono text-xs">+15 ATK</div>
                   </div>
                   <div className="p-4 bg-sl-lapis/20 border border-sl-gold/10 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Shield className="w-5 h-5 text-sl-gold" />
                         <div>
                            <div className="text-[10px] text-sl-gold-light/60">ARMURE</div>
                            <div className="text-sm font-bold text-white">Égide d'Osiris</div>
                         </div>
                      </div>
                      <div className="text-sl-gold font-mono text-xs">+20 DEF</div>
                   </div>
                </div>
              </div>

              {/* Anubis Progress Analytics Graphs */}
              <div className="lg:col-span-3 mt-8 border-t border-sl-gold/15 pt-8">
                <AnubisCharts />
              </div>
            </motion.div>
          )}

          {/* TAB 2: MISSIONS */}
          {activeTab === 'quetes' && (
            <motion.div 
              key="quetes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Story Narrative Campaign Quests */}
              <NarrativeQuestsView player={player} onUpdatePlayer={onUpdatePlayer} />

              <div className="flex items-center justify-between border-b border-sl-gold/20 pb-4 pt-4">
                <h2 className="text-xl font-bold text-white font-display tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-sl-gold" /> MISSIONS QUOTIDIENNES DU SYSTÈME
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {player.dailyQuests.map((quest) => (
                  <div key={quest.id} className="bg-sl-primary border border-sl-gold/20 rounded-2xl p-5 flex flex-col gap-4 shadow-gold-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-sl-lapis/40 ${quest.isCompleted ? 'text-emerald-400' : 'text-sl-gold'}`}>
                            <CheckCircle2 className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="font-bold text-white font-display text-sm uppercase tracking-wider">{quest.title}</h3>
                            <p className="text-[10px] text-sl-gold-light/60 italic font-serif">{quest.description}</p>
                         </div>
                      </div>
                      {quest.isCompleted && (
                        <span className="text-[10px] font-display text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">TERMINÉ</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        <span>Progression</span>
                        <span>{quest.currentCount} / {quest.targetCount} {quest.unit}</span>
                      </div>
                      <div className="w-full h-2 bg-sl-lapis/40 rounded-full overflow-hidden border border-sl-gold/10">
                        <div 
                          className={`h-full transition-all duration-500 ${quest.isCompleted ? 'bg-emerald-500' : 'bg-sl-gold'}`}
                          style={{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }}
                        />
                      </div>
                      
                      {!quest.isCompleted && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="text-[9px] text-slate-500 font-display">AJOUTER :</span>
                          <button 
                            onClick={() => handleUpdateQuestProgress(quest.id, quest.unit === 'km' ? 1 : 10)}
                            className="px-2 py-0.5 bg-sl-gold/5 border border-sl-gold/20 text-sl-gold hover:bg-sl-gold hover:text-sl-primary text-[9px] font-mono rounded transition-all"
                          >
                            +{quest.unit === 'km' ? '1' : '10'}
                          </button>
                          <button 
                            onClick={() => handleUpdateQuestProgress(quest.id, quest.unit === 'km' ? 5 : 25)}
                            className="px-2 py-0.5 bg-sl-gold/5 border border-sl-gold/20 text-sl-gold hover:bg-sl-gold hover:text-sl-primary text-[9px] font-mono rounded transition-all"
                          >
                            +{quest.unit === 'km' ? '5' : '25'}
                          </button>
                          <button 
                            onClick={() => handleCompleteQuestInstantly(quest.id)}
                            className="ml-auto px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[9px] font-display rounded transition-all"
                          >
                            Remplir Direct
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-sl-gold/10">
                       <div className="flex gap-4">
                          <span className="text-[10px] font-display text-sl-gold flex items-center gap-1">
                             <TrendingUp className="w-3 h-3" /> +{quest.xpReward} XP
                          </span>
                          <span className="text-[10px] font-display text-sl-gold flex items-center gap-1">
                             <Coins className="w-3 h-3" /> +{quest.goldReward} Or
                          </span>
                       </div>
                       {!quest.isCompleted && quest.currentCount >= quest.targetCount && (
                         <button 
                           onClick={() => handleClaimQuestReward(quest.id)}
                           className="px-3 py-1 bg-sl-gold text-sl-primary rounded-lg font-display text-[10px] animate-pulse"
                         >
                           RÉCLAMER
                         </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: DONJONS */}
          {activeTab === 'donjons' && (
            <motion.div 
              key="donjons"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Portal Detection System Header banner */}
              <div className="bg-gradient-to-r from-sl-lapis/60 via-sl-primary/90 to-sl-lapis/60 border border-sl-gold/30 rounded-3xl p-6 relative overflow-hidden group shadow-gold-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sl-gold/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className="p-1.5 bg-sl-gold/15 rounded-lg border border-sl-gold/30">
                        <Timer className="w-5 h-5 text-sl-gold animate-pulse" />
                      </div>
                      <h3 className="text-md font-bold text-white font-display tracking-widest uppercase">
                        Radar de Portes Dimensionnelles
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      L'énergie mystique s'accumule. Utilisez <strong className="text-sl-gold">20 points d'énergie (MP)</strong> pour forcer la détection d'une porte dimensionnelle de vie réelle à durée limitée (24h) et obtenir des récompenses colossales et de fidèles soldats d'ombres !
                    </p>
                    <div className="text-[10px] text-sl-gold-light/60 font-mono tracking-wide">
                      Votre Énergie : <span className="text-white font-bold">{player.mp} / {player.maxMp} MP</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDetectMysticGate}
                    disabled={player.mp < 20}
                    className="px-6 py-3 bg-sl-gold text-sl-primary font-display font-bold text-xs tracking-widest rounded-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shadow-gold whitespace-nowrap"
                  >
                    DÉTECTER UNE PORTE (-20 MP)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-sl-gold/20 pb-4">
                <h2 className="text-xl font-bold text-white font-display tracking-widest flex items-center gap-2">
                  <Skull className="w-6 h-6 text-red-500" /> TOMBEAUX & PORTES ÉTABLIS
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dungeons.map(dungeon => (
                  <div key={dungeon.id} className="bg-sl-primary border border-sl-gold/20 rounded-3xl overflow-hidden shadow-gold-sm group hover:border-sl-gold/60 transition-all flex flex-col justify-between">
                    <div>
                      <div className="h-36 relative overflow-hidden">
                        <img 
                          src={dungeon.imageUrl || 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=600'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-sl-primary to-transparent" />
                        <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2">
                          {dungeon.isLimitedTime && dungeon.expiresAt && !dungeon.isDefeated && (
                            <PortalCountdown expiresAt={dungeon.expiresAt} />
                          )}
                          <span className={`text-[10px] font-display px-2 py-0.5 rounded border ${getRankBadgeStyle(dungeon.rank)}`}>
                            RANG {dungeon.rank}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-white font-display text-lg tracking-wide leading-tight">{dungeon.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-red-400 font-serif italic mt-1">
                            <Skull className="w-3.5 h-3.5" /> Boss : {dungeon.bossName}
                          </div>
                        </div>

                        {dungeon.lifeImprovementGoal && (
                          <div className="bg-sl-gold/5 border border-sl-gold/25 rounded-2xl p-4 space-y-2 shadow-inner">
                            <span className="text-[10px] font-display text-sl-gold font-bold flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5" /> Défi d'amélioration de vie :
                            </span>
                            <p className="text-xs text-slate-100 font-medium leading-relaxed">
                              {dungeon.lifeImprovementGoal}
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                              Objectif : {dungeon.description}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] font-display text-sl-gold-light/60 pt-2 border-t border-sl-gold/5">
                          <div className="flex gap-4">
                            <span>REMPLIS : {dungeon.xpReward} XP</span>
                            <span>BUTIN : {dungeon.goldReward} Or</span>
                          </div>
                          {dungeon.isDefeated && (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3 fill-emerald-950 text-emerald-400" /> NETTOYÉ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      {dungeon.lifeImprovementGoal ? (
                        <div className="space-y-2">
                          {!dungeon.isDefeated ? (
                            <button 
                              onClick={() => setConfirmDungeonChallengeBoss(dungeon)}
                              className="w-full py-2.5 rounded-xl font-display text-xs tracking-widest bg-gradient-to-r from-sl-gold-dark via-sl-gold to-sl-gold-light text-sl-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-gold font-bold flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 fill-current" /> VALIDER LA RÉUSSITE DU DÉFI
                            </button>
                          ) : (
                            <div className="w-full py-2 text-center rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-xs font-display tracking-widest uppercase font-bold">
                              DÉFI ACCOMPLI AVEC SUCCÈS
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEnterDungeon(dungeon)}
                          className={`w-full py-2.5 rounded-xl font-display text-sm tracking-widest transition-all border ${
                            dungeon.isDefeated 
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500' 
                            : 'bg-sl-gold/10 border-sl-gold text-sl-gold hover:bg-sl-gold hover:text-sl-primary'
                          }`}
                        >
                          {dungeon.isDefeated ? 'EXPLORÉ' : 'PÉNÉTRER LE TOMBEAU'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ARMÉE DIVINE */}
          {activeTab === 'ombres' && (
            <motion.div 
              key="ombres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-sl-gold/20 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                    <Crown className="w-5 h-5 text-sl-gold" /> ARMÉE DIVINE DU PHARAON
                  </h2>
                  <p className="text-xs text-sl-gold-light/60 mt-1 italic font-serif">Vos serviteurs éternels attendent vos ordres.</p>
                </div>
                <div className="font-display text-xs text-sl-gold-light bg-sl-lapis/80 border border-sl-gold/40 px-3 py-1.5 rounded-xl shadow-gold-sm">
                  Guerriers Éveillés : <strong className="text-sl-gold font-mono">{player.shadows.length}</strong>
                </div>
              </div>

              {player.shadows.length === 0 ? (
                <div className="text-center py-20 bg-sl-lapis/10 rounded-3xl border border-sl-gold/10">
                   <Crown className="w-16 h-16 text-slate-800 mx-auto mb-4 opacity-30" />
                   <p className="text-slate-500 font-serif italic">Aucune essence n'a encore été éveilleé.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {player.shadows.map(shadow => (
                    <div key={shadow.id} className="bg-sl-primary border border-sl-gold/20 rounded-2xl p-5 space-y-4 shadow-gold-sm hover:border-sl-gold/60 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-display px-2 py-0.5 rounded bg-sl-lapis border border-sl-gold/40 text-sl-gold">
                          RANG {shadow.rank}
                        </span>
                        <span className="text-xs font-mono text-amber-500">POUVOIR: {shadow.power}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white font-display">{shadow.name}</h3>
                      <p className="text-xs text-sl-gold-light/60 italic font-serif leading-relaxed">« {shadow.quote} »</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Shadow Synergies List */}
              <div className="border-t border-sl-gold/15 pt-8 mt-10">
                <ShadowSynergiesList player={player} />
              </div>
            </motion.div>
          )}

          {/* TAB 5: BOUTIQUE */}
          {activeTab === 'boutique' && (
            <motion.div 
              key="boutique"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                 <h2 className="text-xl font-bold text-white font-display border-b border-sl-gold/20 pb-3 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-sl-gold" /> BOUTIQUE DU SYSTÈME
                 </h2>
                 <div className="space-y-4">
                    {shopItems.map(item => (
                      <div key={item.id} className="p-4 bg-sl-primary/60 border border-sl-gold/10 rounded-2xl flex items-center justify-between group hover:border-sl-gold/40 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-sl-lapis/40 rounded-xl text-sl-gold">
                               <Package className="w-5 h-5" />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-white font-display">{item.name}</div>
                               <div className="text-[10px] text-sl-gold-light/60 italic font-serif">{item.description}</div>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleBuyShopItem(item)}
                           className="px-4 py-2 bg-sl-gold/10 hover:bg-sl-gold text-sl-gold hover:text-sl-primary border border-sl-gold rounded-xl font-display text-xs transition-all flex items-center gap-2"
                         >
                            <Coins className="w-4 h-4" /> {item.goldValue}
                         </button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 <h2 className="text-xl font-bold text-white font-display border-b border-sl-gold/20 pb-3 flex items-center gap-2">
                    <Package className="w-6 h-6 text-sl-gold" /> VOTRE INVENTAIRE
                 </h2>
                 <div className="space-y-3">
                    {player.inventory.map(item => (
                      <div key={item.id} className="p-4 bg-sl-lapis/10 border border-sl-gold/5 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="text-sl-gold/60">
                               <Package className="w-4 h-4" />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-white font-display">{item.name} {item.quantity! > 1 && `(x${item.quantity})`}</div>
                               <div className="text-[10px] text-slate-500 italic">{item.description}</div>
                            </div>
                         </div>
                         {item.type === 'potion' && (
                           <button 
                             onClick={() => handleUsePotion(item)}
                             className="px-3 py-1.5 bg-sl-gold/10 text-sl-gold border border-sl-gold rounded-lg font-display text-[10px] hover:bg-sl-gold/20 transition-all"
                           >
                              UTILISER
                           </button>
                         )}
                      </div>
                    ))}
                    {player.inventory.length === 0 && (
                      <div className="text-center py-10 text-slate-600 italic text-xs font-serif">
                         L'inventaire royal est vide.
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: JOURNAL */}
          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-white font-display border-b border-sl-gold/20 pb-3 flex items-center gap-2">
                 <History className="w-6 h-6 text-sl-gold" /> CHRONIQUES DU SYSTÈME
              </h2>
              <div className="space-y-2">
                 {player.logs.map(log => (
                   <div key={log.id} className="p-3 bg-sl-primary/40 border border-sl-gold/5 rounded-xl flex items-center justify-between font-mono text-[10px]">
                      <div className="flex items-center gap-3">
                         <span className={`px-2 py-0.5 rounded ${log.type === 'xp' ? 'bg-emerald-950 text-emerald-400' : log.type === 'level' ? 'bg-sl-gold/20 text-sl-gold' : 'bg-slate-900 text-slate-500'}`}>
                            {log.type.toUpperCase()}
                         </span>
                         <span className="text-slate-300">{log.text}</span>
                      </div>
                      <span className="text-slate-600 font-display">{log.timestamp}</span>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}

          {/* TAB 7: PERSONNALISATION */}
          {activeTab === 'personnalisation' && (
            <motion.div 
              key="personnalisation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="border-b border-sl-gold/20 pb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display">
                  <Settings className="w-8 h-8 text-sl-gold" /> SALLE DU TRÔNE DIVIN
                </h2>
                <p className="text-sm text-sl-gold-light/60 mt-1 italic font-serif">
                  Configurez l'interface et personnalisez l'aura de votre Pharaon divin.
                </p>
              </div>

              <PharaohAvatarCustomizer 
                customization={player.avatar || { skinTone: '#D4AF37', auraColor: 'cyan', crownType: 'none', eyeColor: '#00F0FF' }}
                equippedWeaponName={player.inventory.find(i => i.id === player.equippedWeaponId)?.name}
                equippedArmorName={player.inventory.find(i => i.id === player.equippedArmorId)?.name}
                onUpdateCustomization={(update) => {
                  onUpdatePlayer(prev => ({
                    ...prev,
                    avatar: {
                      ...(prev.avatar || { skinTone: '#D4AF37', auraColor: 'cyan', crownType: 'none', eyeColor: '#00F0FF' }),
                      ...update
                    }
                  }));
                }}
              />

              {/* Sound Ambiance Section */}
              <div className="bg-sl-lapis/20 border border-sl-gold/20 rounded-3xl p-6 mt-8 space-y-6">
                 <h3 className="font-display text-lg text-white border-l-4 border-sl-gold pl-3 flex items-center gap-2">
                   <Music className="w-5 h-5 text-sl-gold" /> Ambiance Sonore du Temple
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { name: 'Sables du Temps', desc: 'Thème Principal', active: true },
                     { name: 'Mystère du Nil', desc: 'Ambiance Calme', active: false },
                     { name: 'Bataille de Gizeh', desc: 'Musique de Combat', active: false },
                   ].map((music, i) => (
                     <div key={i} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${music.active ? 'bg-sl-gold/20 border-sl-gold shadow-gold-sm' : 'bg-sl-primary border-sl-gold/5 opacity-50'}`}>
                       <div className="flex items-center gap-3">
                         <Music className={`w-5 h-5 ${music.active ? 'text-sl-gold' : 'text-slate-500'}`} />
                         <div>
                           <div className="text-sm font-bold text-white font-display">{music.name}</div>
                           <div className="text-[10px] text-slate-500 font-serif">{music.desc}</div>
                         </div>
                       </div>
                       <button className={`p-2 rounded-full ${music.active ? 'bg-sl-gold text-sl-primary' : 'bg-slate-800 text-slate-500'}`}>
                         {music.active ? <Play className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
                       </button>
                     </div>
                   ))}
                 </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: FORGE ROYALE */}
          {activeTab === 'forge' && (
            <motion.div
              key="forge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <RoyalForge player={player} onUpdatePlayer={onUpdatePlayer} />
            </motion.div>
          )}

          {/* TAB 9: LEADERBOARD CLASSEMENT */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <WorldLeaderboardView player={player} isOffline={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DUNGEON FOCUS TIMER OVERLAY */}
      {activeDungeonTimerBoss && (
        <DungeonTimer 
          dungeon={activeDungeonTimerBoss}
          onComplete={handleDungeonTimerComplete}
          onCancel={() => setActiveDungeonTimerBoss(null)}
        />
      )}

      {/* REVIS MODAL */}
      {ariseModalBoss && (
        <div className="fixed inset-0 z-50 bg-sl-primary/95 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-sl-primary border-4 border-sl-gold rounded-[3rem] max-w-md w-full p-8 text-center space-y-8 shadow-gold-lg overflow-hidden relative"
          >
            <Crown className="w-20 h-20 text-sl-gold mx-auto animate-bounce" />
            <h2 className="text-3xl font-bold text-white font-display tracking-widest uppercase">Éveil Divin</h2>
            <p className="text-sm text-sl-gold-light/80 italic font-serif leading-relaxed">
              La dépouille du Gardien <strong className="text-sl-gold font-display">{ariseModalBoss.bossName}</strong> attend votre souffle de vie.
            </p>
            <button
              onClick={handlePerformArise}
              disabled={ariseSuccess}
              className="w-full py-5 bg-sl-gold text-sl-primary font-bold font-display text-2xl tracking-[0.3em] rounded-2xl shadow-gold hover:scale-105 active:scale-95 transition-all"
            >
              {ariseSuccess ? 'SUCCÈS' : 'REVIS !'}
            </button>
          </motion.div>
        </div>
      )}

      {/* CONFIRM REAL CHALLENGE MODAL */}
      {confirmDungeonChallengeBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-sl-primary border-2 border-sl-gold max-w-lg w-full rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-gold"
          >
            {/* Decorative Background Aura */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sl-gold/10 to-transparent pointer-events-none" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="w-16 h-16 bg-sl-gold/10 border-2 border-sl-gold rounded-2xl flex items-center justify-center mx-auto shadow-gold-sm">
                <Skull className="w-8 h-8 text-sl-gold animate-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-display text-white tracking-widest uppercase">
                SERMENT DE DISCIPLINE
              </h3>
              <p className="text-xs text-sl-gold-light italic font-serif">
                « Devant la Balance de Maât, le vrai souverain reste loyal envers lui-même. »
              </p>
            </div>

            <div className="bg-sl-lapis/40 border border-sl-gold/20 rounded-2xl p-5 space-y-3 relative z-10">
              <div className="text-[10px] font-display text-sl-gold tracking-widest uppercase">Épreuve active :</div>
              <h4 className="font-bold text-white text-md font-display leading-snug">{confirmDungeonChallengeBoss.title}</h4>
              <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium">
                {confirmDungeonChallengeBoss.lifeImprovementGoal}
              </p>
              <div className="text-[10px] text-slate-400 font-sans italic mt-1 bg-sl-primary/50 p-2 rounded-lg border border-sl-gold/15">
                <strong>Objectif de vie :</strong> {confirmDungeonChallengeBoss.description}
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 max-w-sm mx-auto relative z-10 leading-relaxed">
              En prêtant serment, vous certifiez de manière intègre avoir relevé ce défi d'amélioration personnelle dans votre vie réelle aujourd'hui.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
              <button
                onClick={() => setConfirmDungeonChallengeBoss(null)}
                className="flex-1 py-3 border border-slate-700 hover:border-slate-500 rounded-xl font-display text-xs text-slate-400 transition-all uppercase tracking-widest"
              >
                Y travailler encore
              </button>
              <button
                onClick={() => handleConfirmDungeonChallenge(confirmDungeonChallengeBoss.id)}
                className="flex-1 py-3 bg-gradient-to-r from-sl-gold-dark to-sl-gold text-sl-primary hover:scale-105 active:scale-95 rounded-xl font-display text-xs font-bold transition-all shadow-gold uppercase tracking-widest"
              >
                Je le jure, Défi Réussi !
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
