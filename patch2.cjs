const fs = require('fs');
let code = fs.readFileSync('src/data/defaultData.ts', 'utf8');

// Replace in INITIAL_ROUTINE_BLOCKS
code = code.replace(/startTime: '06:30',\s*endTime: '07:15'/g, "startTime: '05:00',\n    endTime: '05:45'");
code = code.replace(/startTime: '07:15',\s*endTime: '07:25'/g, "startTime: '05:45',\n    endTime: '05:55'");
code = code.replace(/startTime: '07:25',\s*endTime: '07:55'/g, "startTime: '05:55',\n    endTime: '06:25'");

fs.writeFileSync('src/data/defaultData.ts', code);
