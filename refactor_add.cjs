const fs = require('fs');
const path = require('path');

const fileInv = path.join(__dirname, 'src/components/Inventory.tsx');
let inv = fs.readFileSync(fileInv, 'utf8');
inv = inv.replace('Управление остатками и номенклатурой ({products.length} позиций)', '{t("Управление остатками и номенклатурой ({0} позиций)", products.length)}');
inv = inv.replace('<span>Экспорт</span>', '<span>{t("Экспорт")}</span>');
inv = inv.replace('<span>Новый товар</span>', '<span>{t("Новый товар")}</span>');
inv = inv.replace('placeholder="Поиск по названию, SKU или штрихкоду..."', 'placeholder={t("Поиск по названию, SKU или штрихкоду...")}');
inv = inv.replace('>Товар не найден<', '>{t("Товар не найден")}<');
inv = inv.replace('>Попробуйте изменить запрос<', '>{t("Попробуйте изменить запрос")}<');
inv = inv.replace('title="Удалить товар"', 'title={t("Удалить товар")}');
inv = inv.replace('title="Удаление товара"', 'title={t("Удаление товара")}');
fs.writeFileSync(fileInv, inv, 'utf8');

const fileExp = path.join(__dirname, 'src/components/ExpensesView.tsx');
let exp = fs.readFileSync(fileExp, 'utf8');
exp = exp.replace('placeholder="Закупка, Аренда..."', 'placeholder={t("Закупка, Аренда...")}');
exp = exp.replace('Сумма (UZS)', '{t("Сумма ({0})", language === "ru" ? "RUB" : "UZS")}');
exp = exp.replace('>Всего расходов:<', '>{t("Всего расходов:")}<');
exp = exp.replace('>Добавьте первый расход с помощью формы.<', '>{t("Добавьте первый расход с помощью формы.")}<');
exp = exp.replace('title="Удаление расхода"', 'title={t("Удаление расхода")}');
fs.writeFileSync(fileExp, exp, 'utf8');

const fileEmp = path.join(__dirname, 'src/components/EmployeesView.tsx');
let emp = fs.readFileSync(fileEmp, 'utf8');
emp = emp.replace('<span>Заявки на присоединение</span>', '<span>{t("Заявки на присоединение")}</span>');
emp = emp.replace('<span>Одобрить</span>', '<span>{t("Одобрить")}</span>');
emp = emp.replace('title="Удаление профиля сотрудника"', 'title={t("Удаление профиля сотрудника")}');
fs.writeFileSync(fileEmp, emp, 'utf8');

const fileScanner = path.join(__dirname, 'src/components/ScannerView.tsx');
let scan = fs.readFileSync(fileScanner, 'utf8');
scan = scan.replace('Скидка (UZS)', '{t("Скидка ({0})", language === "ru" ? "RUB" : "UZS")}');
scan = scan.replace('placeholder="Поиск товара..."', 'placeholder={t("Поиск товара...")}');
scan = scan.replace('>Товар не найден<', '>{t("Товар не найден")}<');
scan = scan.replace('>Выберите товары для добавления в чек<', '>{t("Выберите товары для добавления в чек")}<');
scan = scan.replace('>Без скидки<', '>{t("Без скидки")}<');
scan = scan.replace('>Скидка (%)<', '>{t("Скидка (%)")}<');
fs.writeFileSync(fileScanner, scan, 'utf8');

console.log('Fixed additional strings');
