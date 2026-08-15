import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Add logic for random box
gacha_func = """
  const handleOpenLootBox = () => {
    if (player.gold < 100) {
      setShopSuccessMsg("Or insuffisant pour ouvrir une boîte.");
      setTimeout(() => setShopSuccessMsg(null), 3000);
      return;
    }
    
    // Deduct gold
    onUpdatePlayer(prev => ({ ...prev, gold: prev.gold - 100 }));
    
    const rng = Math.random();
    let prize = "";
    if (rng < 0.1) {
      // Epic
      prize = "Clé de Donjon de Rang A";
      onUpdatePlayer(prev => ({
        ...prev,
        inventory: [...prev.inventory, {
          id: `loot-key-${Date.now()}`, name: prize, type: 'key', rarity: 'A', description: 'Ouvre un donjon mortel.', goldValue: 500, iconName: 'Key', quantity: 1
        }]
      }));
    } else if (rng < 0.4) {
      // Rare
      prize = "Élixir de Force (+5 STR)";
      onUpdatePlayer(prev => ({
        ...prev,
        attributes: { ...prev.attributes, force: prev.attributes.force + 5 }
      }));
    } else if (rng < 0.7) {
      // Uncommon
      prize = "Potion de Soin Majeure (HP Max)";
      onUpdatePlayer(prev => ({
        ...prev,
        hp: prev.maxHp
      }));
    } else {
      // Common / Fail
      prize = "Bandeau Déchiré (Rien d'utile)";
    }
    
    setShopSuccessMsg(`BOÎTE OUVERTE ! Vous avez obtenu : ${prize}`);
    setTimeout(() => setShopSuccessMsg(null), 5000);
    showSystemMessage(`Récompense acquise : ${prize}`);
  };
"""

func_insert = content.find('const handleBuyItem')
if func_insert != -1:
    content = content[:func_insert] + gacha_func + content[func_insert:]

# Add UI for Loot box
old_shop_header = r"""            <div className="space-y-3">
              \{shopItems\.map\(\(item\) => \("""

new_shop_header = """            {/* Loot Box Gacha */}
            <div className="bg-violet-950/40 border border-violet-500/50 rounded-xl p-4 flex flex-col items-center text-center gap-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
               <div>
                 <h4 className="font-bold text-violet-300 text-sm flex items-center justify-center gap-2">
                   <Sparkles className="w-5 h-5 text-violet-400" /> BOÎTE ALÉATOIRE DU SYSTÈME
                 </h4>
                 <p className="text-[10px] text-violet-200/60 mt-1 uppercase tracking-widest">
                   Peut contenir des élixirs de stats, des clés de donjon, ou de l'équipement rare.
                 </p>
               </div>
               <button
                 onClick={handleOpenLootBox}
                 className="px-6 py-2 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500 text-amber-300 font-bold font-mono text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"
               >
                 <Coins className="w-4 h-4" /> OUVRIR POUR 100 OR
               </button>
            </div>
            
            <div className="space-y-3">
              {shopItems.map((item) => ("""

content = re.sub(old_shop_header, new_shop_header, content)

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
