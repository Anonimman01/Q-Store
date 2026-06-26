const fs = require('fs');
const filepath = 'src/components/ScannerView.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const replacements = [
  ["{mode === 'SALE' ? 'Продажа' : 'Приемка на склад'}", "{mode === 'SALE' ? t('Продажа') : t('Приемка на склад')}"],
  ["В наличии: {scannedProduct.stock}", "{t('В наличии')}: {scannedProduct.stock}"],
  ["Этот штрихкод отсутствует в базе. Будет создана новая запись.", "{t('Этот штрихкод отсутствует в базе. Будет создана новая запись.')}"],
  ['placeholder="Название товара"', 'placeholder={t("Название товара")}'],
  [">Поиск...<", ">{t('Поиск')}<"],
  ['placeholder="Цена (₽)"', 'placeholder={t("Цена (RUB)")}'],
  ['<option value="шт">Штука</option>', '<option value="шт">{t("Штука")}</option>'],
  ['<option value="блок">Блок</option>', '<option value="блок">{t("Блок")}</option>'],
  ['Единица измерения</label>', '{t("Единица измерения")}</label>'],
  ['>Штуки<', '>{t("Штуки")}<'],
  ['>Блоки<', '>{t("Блоки")}<'],
  ['Штук в 1 блоке</label>', '{t("Штук в 1 блоке")}</label>'],
  ['placeholder="Например: 12"', 'placeholder={t("Например: 12")}'],
  ['Количество ({transactionUnit})</label>', '{t("Количество")} ({t(transactionUnit)})</label>'],
  ["Подтвердить {mode === 'SALE' ? 'продажу' : 'приемку'}", "{t('Подтвердить')} {mode === 'SALE' ? t('продажу') : t('приемку')}"],
  [">Вывести чек (", ">{t('Вывести чек')} ("],
  [">Чек продажи<", ">{t('Чек продажи')}<"],
  ["> шт x <", "> {t('шт')} x <"],
  ['placeholder="Размер скидки..."', 'placeholder={t("Размер скидки...")}'],
  ['>Скидка:<', '>{t("Скидка")}:<'],
  ['ТОВАРНЫЙ ЧЕК', "${t('ТОВАРНЫЙ ЧЕК')}"],
  [">ИТОГ:<", ">{t('Итого:')}<"],
  ['Способ оплаты:', "${t('Способ оплаты:')}"],
  ['Спасибо за покупку!', "${t('Спасибо за покупку!')}"],
  ['>Распечатать<', '>{t("Распечатать")}<'],
  ['>Завершить (Новый чек)<', '>{t("Завершить (Новый чек)")}<']
];

for (const [search, replace] of replacements) {
  content = content.replace(search, replace);
}

content = content.replace("<span>{method}</span>", "<span>{t(method)}</span>");
content = content.replace("${paymentMethod}", "${t(paymentMethod)}");

fs.writeFileSync(filepath, content, 'utf8');
