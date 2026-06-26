const fs = require('fs');
const filepath = 'src/lib/translations.ts';
let content = fs.readFileSync(filepath, 'utf8');

const lines = content.split('\\n');
const seen = new Set();
const newLines = [];

for (const line of lines) {
  const match = line.match(/^\\s*'([^']+)':/);
  if (match) {
    const key = match[1];
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
  }
  newLines.push(line);
}

fs.writeFileSync(filepath, newLines.join('\\n'), 'utf8');
