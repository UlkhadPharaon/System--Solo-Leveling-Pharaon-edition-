const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(block\.category === 'sleep' && block\.endTime === '06:30'\) \{[\s\S]*?return block;/;

const replacement = `if (block.category === 'sleep' && block.endTime === '06:30') {
              modified = true;
              return { ...block, endTime: '05:00', durationMinutes: 390 };
            }
            if (block.title.includes('Musculation') && block.startTime === '06:30') {
              modified = true;
              return { ...block, startTime: '05:00', endTime: '05:45' };
            }
            if (block.title.includes('Oratoire') && block.startTime === '07:15') {
              modified = true;
              return { ...block, startTime: '05:45', endTime: '05:55' };
            }
            if (block.title.includes('Visage') && block.startTime === '07:25') {
              modified = true;
              return { ...block, startTime: '05:55', endTime: '06:25' };
            }
            return block;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
