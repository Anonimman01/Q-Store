const fs = require('fs');
const path = require('path');

function findTCalls(dir, keys = new Set()) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findTCalls(fullPath, keys);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = [...content.matchAll(/t\(\s*(['"])(.*?)\1\s*(,\s*[\s\S]*?)?\)/g)];
      for (const m of matches) {
        keys.add(m[2]);
      }
    }
  }
  return keys;
}

const allKeys = Array.from(findTCalls(path.join(__dirname, 'src')));
console.log(JSON.stringify(allKeys, null, 2));
