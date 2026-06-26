const fs = require('fs');
const execSync = require('child_process').execSync;

const out = execSync("grep -rhIo \"t('[^']*')\" src/ || true").toString();
const matches = [...out.matchAll(/t\('([^']+)'\)/g)].map(m => m[1]);
const unique = [...new Set(matches)];

const translations = {
  "Приемка на склад": "Omborga qabul qilish",
  "В наличии": "Mavjud",
  "Этот штрихкод отсутствует в базе. Будет создана новая запись.": "Bu shtrixkod bazada yo'q. Yangi yozuv yaratiladi.",
  "Название товара": "Tovar nomi",
  "Поиск": "Qidirish",
  "Цена (RUB)": "Narx (RUB)",
  "Штука": "Dona",
  "Блок": "Blok",
  "Штуки": "Dona",
  "Блоки": "Bloklar",
  "Единица измерения": "O'lchov birligi",
  "Штук в 1 блоке": "1 blokdagi donalar soni",
  "Например: 12": "Masalan: 12",
  "Количество": "Miqdori",
  "Подтвердить": "Tasdiqlash",
  "продажу": "sotuvni",
  "приемку": "qabulni",
  "Чек продажи": "Sotuv cheki",
  "Размер скидки...": "Chegirma miqdori...",
  "ТОВАРНЫЙ ЧЕК": "TOVAR CHEKI",
  "Способ оплаты:": "To'lov usuli:",
  "Спасибо за покупку!": "Xaridingiz uchun rahmat!",
  "Распечатать": "Chop etish",
  "Завершить (Новый чек)": "Yakunlash (Yangi chek)",
  "Наличные": "Naqd",
  "Карта": "Karta",
  "QR/Перевод": "QR/O'tkazma",
  "Загрузка...": "Yuklanmoqda...",
  "Демо-доступ (Владелец)": "Demo-kirish (Egasi)"
};

unique.forEach(key => {
  if (!translations[key]) {
    translations[key] = key;
  }
});

const content = `export const translations: Record<string, string> = ${JSON.stringify(translations, null, 2)};\n`;
fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
