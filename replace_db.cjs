const fs = require('fs');
const filepath = 'src/App.tsx';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/ai-studio-87e5e818/g, 'ai-studio-inventorytracker-87e5e818');
fs.writeFileSync(filepath, content, 'utf8');
