const { execSync } = require('child_process');
try {
  execSync('git checkout -- src/lib/translations.ts');
  console.log('Restored');
} catch (e) {
  console.error(e.message);
}
