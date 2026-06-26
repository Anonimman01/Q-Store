const fs = require('fs');
const filepath = 'src/lib/translations.ts';
let content = fs.readFileSync(filepath, 'utf8');

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
  "QR/Перевод": "QR/O'tkazma"
};

const lines = content.trim().split('\\n');
lines.pop(); // remove '};'
for (const [key, value] of Object.entries(translations)) {
  lines[lines.length - 1] += ',';
  lines.push(`  "${key}": "${value.replace(/'/g, "\\'")}"`);
}
lines.push('};\n');

fs.writeFileSync(filepath, lines.join('\\n'), 'utf8');
