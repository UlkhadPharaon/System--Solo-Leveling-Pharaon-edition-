import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_state = r"""  const \[dungeons, setDungeons\] = useState<DungeonBoss\[\]>\(\(\) => \{
    const saved = localStorage\.getItem\('aura_dungeons'\);
    return saved \? JSON\.parse\(saved\) : INITIAL_DUNGEONS;
  \}\);"""

new_state = """  const [dungeons, setDungeons] = useState<DungeonBoss[]>(() => {
    const saved = localStorage.getItem('aura_dungeons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
         // Optionally merge with INITIAL_DUNGEONS or just return parsed
         return parsed;
      }
    }
    return INITIAL_DUNGEONS;
  });"""

content = re.sub(old_state, new_state, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
