const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const \[daySchedules, setDaySchedules\] = useState<Record<DayOfWeek, RoutineBlock\[\]>>\(\(\) => \{[\s\S]*?\}\);/;

const replacement = `const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, RoutineBlock[]>>(() => {
    const saved = localStorage.getItem('aura_day_schedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let modified = false;
        for (const day in parsed) {
          parsed[day] = parsed[day].map((block: any) => {
            if (block.category === 'sleep' && block.endTime === '06:30') {
              modified = true;
              return { ...block, endTime: '05:00', durationMinutes: 390 };
            }
            return block;
          });
        }
        if (modified) {
          localStorage.setItem('aura_day_schedules', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }
    return INITIAL_DAY_SCHEDULES;
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
