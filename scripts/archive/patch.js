const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const migrationHook = `
  // Migration for waking up at 5:00 instead of 6:30
  useEffect(() => {
    setDaySchedules(prevSchedules => {
      let modified = false;
      const nextSchedules = { ...prevSchedules };
      
      for (const day in nextSchedules) {
        nextSchedules[day] = nextSchedules[day].map(block => {
          if (block.category === 'sleep' && block.endTime === '06:30') {
            modified = true;
            return { ...block, endTime: '05:00', durationMinutes: 390 };
          }
          return block;
        });
      }
      
      return modified ? nextSchedules : prevSchedules;
    });
  }, []);
`;

code = code.replace(
  "const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, RoutineBlock[]>>(() => {",
  migrationHook + "\n  const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, RoutineBlock[]>>(() => {"
);

fs.writeFileSync('src/App.tsx', code);
