import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_state = r"""  const \[playerProfile, setPlayerProfile\] = useState<PlayerProfile>\(\(\) => \{
    const saved = localStorage\.getItem\('aura_player_profile'\);
    return saved \? JSON\.parse\(saved\) : INITIAL_PLAYER_PROFILE;
  \}\);"""

new_state = """  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('aura_player_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_PLAYER_PROFILE,
        ...parsed,
        shadows: parsed.shadows || [],
        dailyQuests: parsed.dailyQuests || INITIAL_PLAYER_PROFILE.dailyQuests,
        penaltyQuest: parsed.penaltyQuest || INITIAL_PLAYER_PROFILE.penaltyQuest,
        unlockedDungeons: parsed.unlockedDungeons || INITIAL_PLAYER_PROFILE.unlockedDungeons,
        logs: parsed.logs || INITIAL_PLAYER_PROFILE.logs,
        inventory: parsed.inventory || INITIAL_PLAYER_PROFILE.inventory,
      };
    }
    return INITIAL_PLAYER_PROFILE;
  });"""

content = re.sub(old_state, new_state, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
