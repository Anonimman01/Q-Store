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

const replacementsJSX = [
  'Q-Store', 'Остатки', 'Отмена', 'Удалить', 'шт.', 'блок.', 'и', 'шт', 'блок',
  'Обзор', 'Сканер', 'Склад', 'Расходы', 'Сотрудники', 'Текущий профиль (Тест)',
  'Ваш профиль', 'Администратор', 'Сотрудник (Тест)', 'Режим', 'Тема',
  'Выполняется загрузка...', 'Настройка доступа...', 'Ожидание одобрения',
  'Заявка на присоединение к магазину', 'Проверить статус', 'Выйти',
  'Касса', 'Создание чеков и учет продаж', 'Добавить в чек', 'Количество',
  'Продажа', 'Списание', 'Привоз', 'Корзина', 'Очистить', 'Итого:', 'Вывести чек',
  'Управление остатками и ценами', 'Добавить товар', 'Импорт', 'Название',
  'SKU / Штрихкод', 'Остаток', 'Цена', 'Удалить товар', 'Финансовая сводка',
  'Показатели за все время', 'Выручка', 'Прибыль', 'Мало на складе', 'Закончились',
  'Учет финансовых затрат магазина', 'Новый расход', 'Описание затрат',
  'Добавить расход', 'История расходов', 'Нет записей о расходах',
  'Управление персоналом', 'Новый сотрудник', 'Имя сотрудника',
  'Присоединиться к магазину', 'Отправить запрос', 'Ваши заявки', 'Магазин ID',
  'Статус', 'Ожидает', 'Одобрено', 'Отклонено', 'Заявки на вступление',
  'Принять', 'Отклонить', 'Команда магазина', 'Всего транзакций', 'Общая выручка',
  'Удалить сотрудника', 'Управление магазином', 'Вход для владельцев',
  'Войти (Тестовый Админ)', 'Для сотрудников', 'Вход для работников по ID',
  'Войти (Тестовый Сотрудник)'
];

const replacementsQuotes = [
  'Поиск товара...', 'Товар не найден', 'Выберите товары для добавления в чек',
  'Без скидки', 'Скидка (%)', 'Скидка (UZS)', 'Скидка', 'Поиск по названию, SKU или штрихкоду...',
  'Попробуйте изменить запрос', 'Удаление товара', 'Удаление расхода', 'Удаление профиля сотрудника',
  'Закупка, Аренда...'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip the LanguageContext itself and tests 
  if (file.includes('LanguageContext') || file.includes('translations')) return;

  replacementsJSX.forEach(str => {
    // Exact match in JSX: >String< -> >{t('String')}<
    const regexJSX1 = new RegExp(`>\\s*${str}\\s*<`, 'g');
    content = content.replace(regexJSX1, `>{t('${str}')}<`);
  });

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Text replacing complete');
