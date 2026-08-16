import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

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

func_insert = content.find('const handleBuyShopItem')
if func_insert != -1:
    content = content[:func_insert] + gacha_func + content[func_insert:]

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
