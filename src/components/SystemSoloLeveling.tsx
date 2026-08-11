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
  Eye
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

interface SystemSoloLevelingProps {
  player: PlayerProfile;
  dungeons: DungeonBoss[];
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onUpdateDungeons: React.Dispatch<React.SetStateAction<DungeonBoss[]>>;
  onTriggerVictoryConfetti: () => void;
  streakCount: number;
  totalCompletedTasks: number;
}

type SystemTab = 'statut' | 'quetes' | 'donjons' | 'ombres' | 'boutique' | 'logs' | 'personnalisation';

export const SystemSoloLeveling: React.FC<SystemSoloLevelingProps> = ({
  player,
  dungeons,
  onUpdatePlayer,
  onUpdateDungeons,
  onTriggerVictoryConfetti,
  streakCount,
  totalCompletedTasks
}) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('statut');
  const [ariseModalBoss, setAriseModalBoss] = useState<DungeonBoss | null>(null);
  const [ariseSuccess, setAriseSuccess] = useState(false);
  const [shopSuccessMsg, setShopSuccessMsg] = useState<string | null>(null);

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

    // Logic for dungeon combat would go here
    // For now, let's just simulate a victory if it's not defeated
    if (!dungeon.isDefeated) {
      onTriggerVictoryConfetti();
      onUpdateDungeons(prev => prev.map(d => d.id === dungeon.id ? { ...d, isDefeated: true } : d));
      
      onUpdatePlayer(prev => ({
        ...prev,
        xp: prev.xp + dungeon.xpReward,
        gold: prev.gold + dungeon.goldReward,
        logs: [
          {
            id: `log-vic-${Date.now()}`,
            text: `[VICTOIRE] Vous avez exploré ${dungeon.title}. +${dungeon.xpReward} XP, +${dungeon.goldReward} Or.`,
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
    } else {
      showSystemMessage("Ce tombeau est déjà vide.");
    }
  };

  const handleClaimQuestReward = (questId: string) => {
    onUpdatePlayer(prev => {
      const quest = prev.dailyQuests.find(q => q.id === questId);
      if (!quest || quest.isCompleted) return prev;

      const updatedQuests = prev.dailyQuests.map(q => 
        q.id === questId ? { ...q, isCompleted: true, currentCount: q.targetCount } : q
      );

      return {
        ...prev,
        xp: prev.xp + quest.xpReward,
        gold: prev.gold + quest.goldReward,
        dailyQuests: updatedQuests,
        logs: [
          {
            id: `log-quest-${Date.now()}`,
            text: `[MISSION] Récompense obtenue pour « ${quest.title} ».`,
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
            { id: 'boutique', icon: ShoppingCart, label: 'Boutique' },
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
            </motion.div>
          )}

          {/* TAB 2: MISSIONS */}
          {activeTab === 'quetes' && (
            <motion.div 
              key="quetes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-sl-gold/20 pb-4">
                <h2 className="text-xl font-bold text-white font-display tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-sl-gold" /> MISSIONS QUOTIDIENNES
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
              <div className="flex items-center justify-between border-b border-sl-gold/20 pb-4">
                <h2 className="text-xl font-bold text-white font-display tracking-widest flex items-center gap-2">
                  <Skull className="w-6 h-6 text-red-500" /> TOMBEAUX ÉTERNELS
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dungeons.map(dungeon => (
                  <div key={dungeon.id} className="bg-sl-primary border border-sl-gold/20 rounded-3xl overflow-hidden shadow-gold-sm group hover:border-sl-gold/60 transition-all">
                    <div className="h-32 relative overflow-hidden">
                       <img src={dungeon.rank === 'S' ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600' : dungeon.rank === 'A' ? 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-sl-primary to-transparent" />
                       <div className="absolute top-3 right-3">
                          <span className={`text-[10px] font-display px-2 py-0.5 rounded border ${getRankBadgeStyle(dungeon.rank)}`}>
                            RANG {dungeon.rank}
                          </span>
                       </div>
                    </div>
                    <div className="p-5 space-y-4">
                       <div>
                          <h3 className="font-bold text-white font-display text-lg tracking-wide">{dungeon.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-red-400 font-serif italic">
                             <Skull className="w-3.5 h-3.5" /> Boss : {dungeon.bossName}
                          </div>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-display text-sl-gold-light/60">
                          <div className="flex gap-4">
                            <span>REMPLIS : {dungeon.xpReward} XP</span>
                            <span>BUTIN : {dungeon.goldReward} Or</span>
                          </div>
                          {dungeon.isDefeated && (
                            <span className="text-emerald-500 flex items-center gap-1">
                               <CheckCircle2 className="w-3 h-3" /> NETTOYÉ
                            </span>
                          )}
                       </div>
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
                  Configurez l'interface et l'ambiance de votre Système.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-sl-lapis/20 border border-sl-gold/20 rounded-3xl p-6 space-y-6">
                  <h3 className="font-display text-lg text-white border-l-4 border-sl-gold pl-3">Identité Visuelle</h3>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-4 border-sl-gold bg-sl-primary shadow-gold overflow-hidden relative group">
                      <img 
                        src="https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&q=80&w=300" 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white font-display">Pharaon Ulrich</div>
                      <div className="text-xs text-sl-gold font-display tracking-widest mt-1 uppercase">Souverain des Cieux</div>
                    </div>
                  </div>
                </div>

                <div className="bg-sl-lapis/20 border border-sl-gold/20 rounded-3xl p-6 space-y-6">
                   <h3 className="font-display text-lg text-white border-l-4 border-sl-gold pl-3">Ambiance Sonore</h3>
                   <div className="space-y-4">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
    </div>
  );
};
