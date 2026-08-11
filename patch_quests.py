import re

with open('src/data/defaultData.ts', 'r') as f:
    content = f.read()

old_quests = r"""  dailyQuests: \[.*?  \],
  penaltyQuest: \{"""

new_quests = """  dailyQuests: [
    {
      id: 'dq-1',
      title: 'Préparation Physique (Pompes)',
      description: 'Faire 100 Pompes.',
      category: 'morning_routine',
      targetCount: 100,
      currentCount: 0,
      unit: 'réps',
      isCompleted: false,
      xpReward: 50,
      goldReward: 20,
      iconName: 'Dumbbell',
    },
    {
      id: 'dq-2',
      title: 'Préparation Physique (Abdos)',
      description: 'Faire 100 Abdos.',
      category: 'morning_routine',
      targetCount: 100,
      currentCount: 0,
      unit: 'réps',
      isCompleted: false,
      xpReward: 50,
      goldReward: 20,
      iconName: 'Dumbbell',
    },
    {
      id: 'dq-3',
      title: 'Préparation Physique (Squats)',
      description: 'Faire 100 Squats.',
      category: 'morning_routine',
      targetCount: 100,
      currentCount: 0,
      unit: 'réps',
      isCompleted: false,
      xpReward: 50,
      goldReward: 20,
      iconName: 'Dumbbell',
    },
    {
      id: 'dq-4',
      title: 'Préparation Physique (Course)',
      description: 'Courir 10 km.',
      category: 'morning_routine',
      targetCount: 10,
      currentCount: 0,
      unit: 'km',
      isCompleted: false,
      xpReward: 100,
      goldReward: 40,
      iconName: 'Zap',
    },
  ],
  penaltyQuest: {"""

content = re.sub(old_quests, new_quests, content, flags=re.DOTALL)

with open('src/data/defaultData.ts', 'w') as f:
    f.write(content)
