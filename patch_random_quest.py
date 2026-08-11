import re

with open('src/components/SystemSoloLeveling.tsx', 'r') as f:
    content = f.read()

# Add a function for random quest generation
func_insert_idx = content.find('const handleClaimQuestReward')
if func_insert_idx != -1:
    random_quest_func = """
  const handleGenerateRandomQuest = () => {
    const randomMissions = [
      { title: 'Quête Cachée : Endurance', desc: 'Faire 50 Burpees', unit: 'réps', count: 50 },
      { title: 'Mission Urgente : Savoir', desc: 'Lire 20 pages d\'un livre', unit: 'pages', count: 20 },
      { title: 'Appel du Système : Méditation', desc: 'Méditer 15 minutes en silence', unit: 'min', count: 15 },
      { title: 'Quête d\'Éveil : Hydratation', desc: 'Boire 2 Litres d\'eau', unit: 'L', count: 2 },
      { title: 'Faille Dimensionnelle : Code', desc: 'Résoudre 1 algorithme complexe', unit: 'algo', count: 1 }
    ];
    
    const randomMission = randomMissions[Math.floor(Math.random() * randomMissions.length)];
    
    const newQuest = {
      id: `rq-${Date.now()}`,
      title: randomMission.title,
      description: randomMission.desc,
      category: 'learning' as any,
      targetCount: randomMission.count,
      currentCount: 0,
      unit: randomMission.unit,
      isCompleted: false,
      xpReward: 80 + Math.floor(Math.random() * 50),
      goldReward: 30 + Math.floor(Math.random() * 20),
      iconName: 'Zap'
    };

    onUpdatePlayer(prev => ({
      ...prev,
      dailyQuests: [...prev.dailyQuests, newQuest]
    }));
    
    showSystemMessage("ALERTE : UNE MISSION CACHÉE A ÉTÉ DÉTECTÉE !");
  };
"""
    content = content[:func_insert_idx] + random_quest_func + content[func_insert_idx:]

# Add the button in the UI
old_buttons = r"""              <button
                onClick=\{handleTriggerPenaltyZone\}
                className="px-3\.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-600/60 text-red-300 rounded-xl text-xs font-mono flex items-center gap-1\.5 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-red-500" /> Tester le Châtiment
              </button>"""

new_buttons = """              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateRandomQuest}
                  className="px-3.5 py-2 bg-violet-950/80 hover:bg-violet-900 border border-violet-500/60 text-violet-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                >
                  <Sparkles className="w-4 h-4 text-violet-400" /> Scan Mission
                </button>
                <button
                  onClick={handleTriggerPenaltyZone}
                  className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-600/60 text-red-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Châtiment
                </button>
              </div>"""

content = re.sub(old_buttons, new_buttons, content)

with open('src/components/SystemSoloLeveling.tsx', 'w') as f:
    f.write(content)
