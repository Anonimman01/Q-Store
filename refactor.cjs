const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

const files = findFiles(directoryPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace CurrencyProvider with LanguageProvider
  content = content.replace(/CurrencyProvider/g, 'LanguageProvider');
  
  // Replace useCurrency with useLanguage
  content = content.replace(/useCurrency/g, 'useLanguage');
  
  // Replace CurrencyContext with LanguageContext
  content = content.replace(/CurrencyContext/g, 'LanguageContext');
  
  // Replace currency with language (for destructured and state vars, case sensitive usually okay for this context)
  // Careful with formatting
  content = content.replace(/const \{ currency, setCurrency \}/g, 'const { language, setLanguage, t }');
  content = content.replace(/const \{ currency, formatCurrency \}/g, 'const { language, formatCurrency, t }');
  content = content.replace(/const \{ formatCurrency \}/g, 'const { formatCurrency, t }');
  content = content.replace(/setCurrency\((.*?)\)/g, 'setLanguage($1)');
  
  // For the App.tsx switch
  content = content.replace(/currency === 'UZS' \? 'RUB' : 'UZS'/g, "language === 'uz' ? 'ru' : 'uz'");
  content = content.replace(/currency === 'UZS' \? 'UZS' : 'RUB'/g, "language === 'uz' ? 'UZ' : 'RU'");
  content = content.replace(/\(\['UZS', 'RUB'\] as const\)/g, "(['uz', 'ru'] as const)");
  content = content.replace(/currency === c/g, "language === c");
  content = content.replace(/\{c\}/g, "{c.toUpperCase()}"); // To display UZ RU
  
  // App.tsx
  content = content.replace(/const \{ language, setLanguage \} = useLanguage\(\);/g, 'const { language, setLanguage, t } = useLanguage();');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Refactoring complete');
