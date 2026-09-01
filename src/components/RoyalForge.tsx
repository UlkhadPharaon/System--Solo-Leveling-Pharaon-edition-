import React, { useState } from 'react';
import { Hammer, Sword, Shield, Layers, Sparkles, Check, AlertTriangle } from './ui/PharaohIcons';
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
  const [forgeError, setForgeError] = useState<string | null>(null);
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
      setForgeError("Or insuffisant dans les coffres de la dynastie !");
      setTimeout(() => setForgeError(null), 4000);
      return;
    }

    // Check materials
    const missingMaterial = craft.materialsRequired.find(req => getMaterialQty(req.materialId) < req.quantity);
    if (missingMaterial) {
      setForgeError(`Matériaux manquants : Il vous faut plus de ${missingMaterial.name}.`);
      setTimeout(() => setForgeError(null), 4000);
      return;
    }
    setForgeError(null);

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
        goldSpent: (prev?.goldSpent || 0) + craft.goldCost, // narrative ch.2 gate
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
    <div className="space-y-8 anim-in">
      {/* Dynamic Resource Panel */}
      <div className="bg-panel border border-lapis-border rounded-2xl p-6">
        {forgeError && (
          <div className="mb-4 text-blood bg-blood/10 border border-blood/40 rounded-xl px-3 py-2 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {forgeError}
          </div>
        )}
        <h3 className="text-xs font-bold text-pharaoh font-display tracking-widest uppercase mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold" /> Vos Réserves de Matériaux Sacrés
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          {[
            { id: 'm_lapis', name: 'Lapis Pur Divin', color: 'bg-sapphire', text: 'Bleu Sacré' },
            { id: 'm_gold', name: 'Éclat d’Or Royal', color: 'bg-gold', text: 'Métal Pur' },
            { id: 'm_linen', name: 'Tissu Sacré d’Osiris', color: 'bg-gold-bright', text: 'Lin d’Embaumement' },
            { id: 'm_rune', name: 'Rune runique sacrée', color: 'bg-amethyst', text: 'Pierre d’Âme' }
          ].map(mat => {
            const qty = getMaterialQty(mat.id);
            return (
              <div key={mat.id} className="bg-obsidian-elevated border border-gold-dim/40 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden hover-lift transition-all">
                <div className={`w-3.5 h-3.5 rounded-full ${mat.color} shrink-0`} />
                <div>
                  <div className="font-mono text-[10px] text-gold leading-none mb-1">{mat.name}</div>
                  <div className="text-lg font-bold text-pharaoh font-mono leading-none">{qty} <span className="text-xs text-pharaoh-subtle">pcs</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crafting Options */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2 border-b border-gold-dim pb-3">
          <Hammer className="w-5 h-5 text-gold" /> FORGER DES RELIQUES ANCIENNES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
          {CRAFTABLE_ITEMS.map(craft => {
            const canAffordGold = currentGold >= craft.goldCost;
            const hasMaterials = craft.materialsRequired.every(req => getMaterialQty(req.materialId) >= req.quantity);
            const isCraftable = canAffordGold && hasMaterials;

            return (
              <div key={craft.id} className="bg-panel border border-gold-dim rounded-2xl p-5 flex flex-col justify-between group hover:border-gold/40 hover-lift transition-all relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-pharaoh text-base tracking-wide">{craft.name}</h4>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/30">
                        RANG {craft.rarity} - {craft.type === 'weapon' ? 'ARME' : 'ARMURE'}
                      </span>
                    </div>
                    {/* Stat Bonuses */}
                    <div className="text-right">
                      {Object.entries(craft.statBonus).map(([stat, val]) => (
                        <div key={stat} className="font-mono text-xs text-emerald font-bold">
                          +{val} {stat.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-pharaoh-muted italic leading-relaxed">{craft.description}</p>

                  {/* Blueprint cost display */}
                  <div className="py-2.5 border-t border-b border-gold-dim/40 space-y-1.5">
                    <div className="font-mono text-[9px] text-gold tracking-widest">INGRÉDIENTS NÉCESSAIRES :</div>
                    <div className="flex flex-wrap gap-3">
                      {craft.materialsRequired.map(req => {
                        const held = getMaterialQty(req.materialId);
                        const met = held >= req.quantity;
                        return (
                          <div key={req.materialId} className={`font-mono text-[10px] flex items-center gap-1 ${met ? 'text-emerald' : 'text-blood'}`}>
                            {req.name} ({held}/{req.quantity})
                          </div>
                        );
                      })}
                      <div className={`font-mono text-[10px] flex items-center gap-1 ${canAffordGold ? 'text-emerald' : 'text-blood'}`}>
                        Coût : {craft.goldCost} Or
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-1">
                  <button
                    onClick={() => handleCraft(craft)}
                    disabled={!isCraftable}
                    className={`btn-press w-full py-2.5 rounded-xl font-display text-xs tracking-widest transition-all ${
                      isCraftable
                        ? 'bg-gold text-obsidian hover:scale-[1.02] shadow-gold'
                        : 'bg-obsidian-elevated text-pharaoh-subtle border border-lapis-border cursor-not-allowed'
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
        <h3 className="font-display text-base font-bold text-pharaoh tracking-widest uppercase flex items-center gap-2 border-b border-gold-dim pb-3">
          <Sword className="w-5 h-5 text-gold" /> VOS ARMES & ARMURES DANS LE SYSTÈME
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {forgedInventory.map(item => (
            <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              item.isEquipped 
                ? 'bg-lapis/40 border-gold shadow-gold' 
                : 'bg-obsidian-elevated border-gold-dim/40 hover:border-gold/30 hover-lift'
            }`}>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-pharaoh text-sm">{item.name}</span>
                  {item.isEquipped && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald/20 text-emerald font-mono text-[9px] flex items-center gap-0.5 border border-emerald/30">
                      <Check className="w-2.5 h-2.5" /> ÉQUIPÉ
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-gold uppercase tracking-wider">{item.type === 'weapon' ? 'Arme' : 'Armure'}</div>
                <div className="text-xs text-pharaoh-muted italic mb-2">{item.description}</div>
                {/* Stat displays */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.statBonus && Object.entries(item.statBonus).map(([stat, val]) => (
                    <span key={stat} className="px-2 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/30 font-mono text-[9px] font-bold">
                      +{val} {stat.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {item.isEquipped ? (
                  <button
                    onClick={() => handleUnequip(item.id, item.type as any)}
                    className="btn-press w-full py-1.5 bg-blood/20 hover:bg-blood/40 text-blood border border-blood/40 hover:border-blood/60 rounded-xl font-display text-[10px] tracking-widest transition-all"
                  >
                    DÉSÉQUIPER
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(item.id, item.type as any)}
                    className="btn-press w-full py-1.5 bg-gold text-obsidian rounded-xl font-display text-[10px] tracking-widest hover:scale-105 transition-all shadow-gold"
                  >
                    ÉQUIPER SUR LE PHARAON
                  </button>
                )}
              </div>
            </div>
          ))}
          {forgedInventory.length === 0 && (
            <div className="col-span-full rounded-2xl border border-lapis-border bg-obsidian-elevated/40 px-6 py-10 text-center space-y-2">
              <Hammer className="w-8 h-8 mx-auto text-gold-dim" />
              <p className="font-display text-base text-pharaoh">Aucune relique forgée</p>
              <p className="text-xs text-pharaoh-subtle italic max-w-sm mx-auto">
                Vous ne possédez aucune relique forgée pour le moment. Rassemblez des ingrédients dans les tombes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
