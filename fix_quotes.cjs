const fs = require('fs');
const filepath = 'src/lib/translations.ts';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/\\\\'/g, "\\'");
fs.writeFileSync(filepath, content, 'utf8');
