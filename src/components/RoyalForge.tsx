import React from 'react';
import { Hammer, Sword, Shield, Package, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { PlayerProfile, SystemItem, HunterRank } from '../types';

interface RoyalForgeProps {
  player: PlayerProfile;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

interface CraftableItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  rarity: HunterRank;
  description: string;
  statBonus: Record<string, number>;
  materialsRequired: { materialId: string; name: string; quantity: number }[];
  goldCost: number;
}

const CRAFTABLE_ITEMS: CraftableItem[] = [
  {
    id: 'w_scepter',
    name: 'Sceptre Sacré d’Anubis',
    type: 'weapon',
    rarity: 'A',
    description: 'Une relique imprégnée d’énergie funéraire augmentant grandement l’intelligence et la perception.',
    statBonus: { intelligence: 10, perception: 5 },
    materialsRequired: [
      { materialId: 'm_gold', name: 'Éclat d’Or Royal', quantity: 3 },
      { materialId: 'm_rune', name: 'Rune runique sacrée', quantity: 1 }
    ],
    goldCost: 800
  },
  {
    id: 'w_khepesh',
    name: 'Khépesh Solaire de Râ',
    type: 'weapon',
    rarity: 'S',
    description: 'Le sabre courbe forgé dans la fournaise céleste. Offre une force destructrice et une agilité vive.',
    statBonus: { force: 15, agilite: 8 },
    materialsRequired: [
      { materialId: 'm_lapis', name: 'Lapis Pur Divin', quantity: 4 },
      { materialId: 'm_gold', name: 'Éclat d’Or Royal', quantity: 4 }
    ],
    goldCost: 1500
  },
  {
    id: 'a_shroud',
    name: 'Linceul Doré des Rois',
    type: 'armor',
    rarity: 'A',
    description: 'Bandes de lin divin tissées d’or pour protéger des pires assauts tout en restant agile.',
    statBonus: { vitalite: 12, agilite: 6 },
    materialsRequired: [
      { materialId: 'm_linen', name: 'Tissu Sacré d’Osiris', quantity: 3 },
      { materialId: 'm_gold', name: 'Éclat d’Or Royal', quantity: 2 }
    ],
    goldCost: 600
  },
  {
    id: 'a_plate',
    name: 'Plastron Souverain d’Osiris',
    type: 'armor',
    rarity: 'S',
    description: 'L’armure impénétrable du souverain de l’au-delà. Octroie une vitalité infinie.',
    statBonus: { vitalite: 25, force: 8 },
    materialsRequired: [
      { materialId: 'm_linen', name: 'Tissu Sacré d’Osiris', quantity: 5 },
      { materialId: 'm_lapis', name: 'Lapis Pur Divin', quantity: 5 }
    ],
    goldCost: 1800
  }
];

export const RoyalForge: React.FC<RoyalForgeProps> = ({ player, onUpdatePlayer }) => {
  if (!player) return null;
  // Extract crafting materials currently in player's inventory
  const getMaterialQty = (matId: string) => {
    const item = (player?.inventory || []).find(i => i.id === matId);
    return item ? (item.quantity || 0) : 0;
  };

  const currentGold = player?.gold || 0;

  const handleCraft = (craft: CraftableItem) => {
    // Check gold
    if (currentGold < craft.goldCost) {
      alert("Or insuffisant dans les coffres de la dynastie !");
      return;
    }

    // Check materials
    const missingMaterial = craft.materialsRequired.find(req => getMaterialQty(req.materialId) < req.quantity);
    if (missingMaterial) {
      alert(`Matériaux manquants : Il vous faut plus de ${missingMaterial.name}.`);
      return;
    }

    // Process crafting
    onUpdatePlayer(prev => {
      // Deduct materials
      const prevInv = prev?.inventory || [];
      const updatedInventory = prevInv.map(item => {
        const cost = craft.materialsRequired.find(req => req.materialId === item.id);
        if (cost) {
          return { ...item, quantity: (item.quantity || 1) - cost.quantity };
        }
        return item;
      }).filter(item => (item.quantity || 0) > 0 || item.type !== 'material'); // keep placeholders if needed but remove depleted ones

      // Add newly crafted weapon/armor to inventory
      const newItem: SystemItem = {
        id: `crafted-${Date.now()}`,
        name: craft.name,
        type: craft.type,
        rarity: craft.rarity,
        description: craft.description,
        statBonus: craft.statBonus,
        goldValue: craft.goldCost,
        iconName: craft.type === 'weapon' ? 'Sword' : 'Shield',
        quantity: 1,
        isEquipped: false
      };

      updatedInventory.push(newItem);

      const log = {
        id: `craft-log-${Date.now()}`,
        text: `[FORGE ROYALE] Craft réussi de « ${craft.name} ». -${craft.goldCost} Or consommé.`,
        type: 'loot' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      return {
        ...prev,
        gold: (prev?.gold || 0) - craft.goldCost,
        inventory: updatedInventory,
        logs: [log, ...(prev?.logs || [])]
      };
    });
  };

  const handleEquip = (itemId: string, type: 'weapon' | 'armor') => {
    onUpdatePlayer(prev => {
      const prevInv = prev?.inventory || [];
      const updatedInventory = prevInv.map(item => {
        if (item.type === type) {
          // Unequip all items of the same type, equip the targeted one
          return { ...item, isEquipped: item.id === itemId };
        }
        return item;
      });

      const equippedItem = prevInv.find(i => i.id === itemId);
      const equippedWeaponId = type === 'weapon' ? itemId : prev?.equippedWeaponId;
      const equippedArmorId = type === 'armor' ? itemId : prev?.equippedArmorId;

      const log = {
        id: `equip-log-${Date.now()}`,
        text: `[ÉQUIPEMENT] Vous avez équipé « ${equippedItem?.name} ». Vos attributs divins augmentent.`,
        type: 'xp' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      return {
        ...prev,
        inventory: updatedInventory,
        equippedWeaponId,
        equippedArmorId,
        logs: [log, ...(prev?.logs || [])]
      };
    });
  };

  const handleUnequip = (itemId: string, type: 'weapon' | 'armor') => {
    onUpdatePlayer(prev => {
      const prevInv = prev?.inventory || [];
      const updatedInventory = prevInv.map(item => {
        if (item.id === itemId) {
          return { ...item, isEquipped: false };
        }
        return item;
      });

      const equippedWeaponId = type === 'weapon' ? undefined : prev?.equippedWeaponId;
      const equippedArmorId = type === 'armor' ? undefined : prev?.equippedArmorId;

      return {
        ...prev,
        inventory: updatedInventory,
        equippedWeaponId,
        equippedArmorId,
      };
    });
  };

  // List crafted items in player inventory
  const forgedInventory = (player?.inventory || []).filter(i => i.type === 'weapon' || i.type === 'armor');

  return (
    <div className="space-y-8">
      {/* Dynamic Resource Panel */}
      <div className="bg-sl-lapis/20 border border-sl-gold/15 rounded-3xl p-6">
        <h3 className="text-xs font-bold text-white font-display tracking-widest uppercase mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-sl-gold" /> Vos Réserves de Matériaux Sacrés
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'm_lapis', name: 'Lapis Pur Divin', color: 'bg-blue-600', text: 'Bleu Sacré' },
            { id: 'm_gold', name: 'Éclat d’Or Royal', color: 'bg-yellow-500', text: 'Métal Pur' },
            { id: 'm_linen', name: 'Tissu Sacré d’Osiris', color: 'bg-amber-100', text: 'Lin d’Embaumement' },
            { id: 'm_rune', name: 'Rune runique sacrée', color: 'bg-purple-500', text: 'Pierre d’Âme' }
          ].map(mat => {
            const qty = getMaterialQty(mat.id);
            return (
              <div key={mat.id} className="bg-sl-primary/40 border border-sl-gold/10 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                <div className={`w-3.5 h-3.5 rounded-full ${mat.color} shrink-0`} />
                <div>
                  <div className="text-[10px] text-sl-gold font-display leading-none mb-1">{mat.name}</div>
                  <div className="text-lg font-bold text-white font-mono leading-none">{qty} <span className="text-xs text-slate-500">pcs</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crafting Options */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-white font-display tracking-widest uppercase flex items-center gap-2 border-b border-sl-gold/15 pb-3">
          <Hammer className="w-5 h-5 text-sl-gold" /> FORGER DES RELIQUES ANCIENNES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CRAFTABLE_ITEMS.map(craft => {
            const canAffordGold = currentGold >= craft.goldCost;
            const hasMaterials = craft.materialsRequired.every(req => getMaterialQty(req.materialId) >= req.quantity);
            const isCraftable = canAffordGold && hasMaterials;

            return (
              <div key={craft.id} className="bg-sl-primary/60 border border-sl-gold/15 rounded-3xl p-5 flex flex-col justify-between group hover:border-sl-gold/40 transition-all relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white font-display text-md tracking-wide">{craft.name}</h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-sl-gold/10 text-sl-gold border border-sl-gold/30 font-display">
                        RANG {craft.rarity} - {craft.type === 'weapon' ? 'ARME' : 'ARMURE'}
                      </span>
                    </div>
                    {/* Stat Bonuses */}
                    <div className="text-right">
                      {Object.entries(craft.statBonus).map(([stat, val]) => (
                        <div key={stat} className="text-xs text-emerald-400 font-mono font-bold">
                          +{val} {stat.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-serif italic leading-relaxed">{craft.description}</p>

                  {/* Blueprint cost display */}
                  <div className="py-2.5 border-t border-b border-sl-gold/10 space-y-1.5">
                    <div className="text-[9px] text-sl-gold font-display tracking-widest">INGRÉDIENTS NÉCESSAIRES :</div>
                    <div className="flex flex-wrap gap-3">
                      {craft.materialsRequired.map(req => {
                        const held = getMaterialQty(req.materialId);
                        const met = held >= req.quantity;
                        return (
                          <div key={req.materialId} className={`text-[10px] flex items-center gap-1 ${met ? 'text-emerald-400' : 'text-red-400'} font-mono`}>
                            {req.name} ({held}/{req.quantity})
                          </div>
                        );
                      })}
                      <div className={`text-[10px] flex items-center gap-1 ${canAffordGold ? 'text-emerald-400' : 'text-red-400'} font-mono`}>
                        Coût : {craft.goldCost} Or
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-1">
                  <button
                    onClick={() => handleCraft(craft)}
                    disabled={!isCraftable}
                    className={`w-full py-2.5 rounded-xl font-display text-xs tracking-widest transition-all ${
                      isCraftable
                        ? 'bg-sl-gold text-sl-primary hover:scale-[1.02] shadow-gold'
                        : 'bg-sl-primary/30 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    FORGER LA RELIQUE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment Inventory Manager */}
      <div className="space-y-4 pt-4">
        <h3 className="text-md font-bold text-white font-display tracking-widest uppercase flex items-center gap-2 border-b border-sl-gold/15 pb-3">
          <Sword className="w-5 h-5 text-sl-gold" /> VOS ARMES & ARMURES DANS LE SYSTÈME
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forgedInventory.map(item => (
            <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              item.isEquipped 
                ? 'bg-sl-lapis/40 border-sl-gold shadow-gold-sm' 
                : 'bg-sl-primary/40 border-sl-gold/10 hover:border-sl-gold/30'
            }`}>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white font-display text-sm">{item.name}</span>
                  {item.isEquipped && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-display flex items-center gap-0.5 border border-emerald-500/30">
                      <Check className="w-2.5 h-2.5" /> ÉQUIPÉ
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-sl-gold font-display uppercase tracking-wider">{item.type === 'weapon' ? 'Arme' : 'Armure'}</div>
                <div className="text-xs text-slate-400 font-serif italic mb-2">{item.description}</div>
                {/* Stat displays */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.statBonus && Object.entries(item.statBonus).map(([stat, val]) => (
                    <span key={stat} className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-mono text-[9px] font-bold">
                      +{val} {stat.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {item.isEquipped ? (
                  <button
                    onClick={() => handleUnequip(item.id, item.type as any)}
                    className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 hover:border-red-500/40 rounded-xl font-display text-[10px] tracking-widest transition-all"
                  >
                    DÉSÉQUIPER
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(item.id, item.type as any)}
                    className="w-full py-1.5 bg-sl-gold text-sl-primary rounded-xl font-display text-[10px] tracking-widest hover:scale-105 transition-all shadow-gold-sm"
                  >
                    ÉQUIPER SUR LE PHARAON
                  </button>
                )}
              </div>
            </div>
          ))}
          {forgedInventory.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-600 italic text-xs">
              Vous ne possédez aucune relique forgée pour le moment. Rassemblez des ingrédients dans les tombes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
