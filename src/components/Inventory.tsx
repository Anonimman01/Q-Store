import React, { useState, useRef } from 'react';
import { Product, Transaction } from '../types';
import { Search, Plus, Filter, Package, Upload, Trash2 } from 'lucide-react';
import { formatStock } from '../lib/utils';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from './ConfirmDialog';
import { useLanguage } from '../lib/LanguageContext';

interface InventoryProps {
  products: Product[];
  onAddNew: () => void;
  onImport?: (products: Product[], transactions?: Transaction[]) => Promise<{ added: number, updated: number }> | { added: number, updated: number };
  onDeleteProduct?: (productId: string) => void;
  readOnly?: boolean;
}

export function Inventory({ products, onAddNew, onImport, onDeleteProduct, readOnly }: InventoryProps) {
  const [search, setSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<{id: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatCurrency, t } = useLanguage();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search)
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Assume the first sheet contains products
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const findKey = (row: any, kList: string[]) => {
           const keys = Object.keys(row);
           for (const k of kList) {
             const found = keys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
             if (found) return row[found];
           }
           return undefined;
        };

        const importedProducts: Product[] = data.map(row => {
          const id = findKey(row, ['штрихкод', 'barcode', 'id']);
          const sku = findKey(row, ['артикул', 'sku']);
          const name = findKey(row, ['название', 'name', 'товар', 'наименование']);
          const stock = findKey(row, ['остаток', 'stock', 'количество', 'кол-во']);
          const price = findKey(row, ['цена', 'price']);
          const unit = findKey(row, ['единица', 'unit', 'ед. изм.', 'ед']);
          const itemsPerBlock = findKey(row, ['штук в блоке', 'itemsperblock']);

          return {
            id: id?.toString() || Math.random().toString().substring(2, 12),
            sku: sku?.toString() || `IMP-${Math.random().toString().substring(2, 6)}`,
            name: name?.toString() || t('Без названия'),
            stock: parseInt(stock, 10) || 0,
            price: parseFloat(price) || 0,
            unit: (unit?.toString().toLowerCase().includes('блок')) ? 'блок' : 'шт',
            itemsPerBlock: parseInt(itemsPerBlock, 10) || undefined,
          };
        });
        
        // Check for transactions sheet
        let importedTransactions: Transaction[] = [];
        const txSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('продаж') || n.toLowerCase().includes('транзакц') || n.toLowerCase().includes('transaction'));
        if (txSheetName) {
           const txWs = wb.Sheets[txSheetName];
           const txData = XLSX.utils.sheet_to_json<any>(txWs);
           importedTransactions = txData.map(row => ({
              id: findKey(row, ['id'])?.toString() || Math.random().toString(36).substring(7),
              productId: findKey(row, ['штрихкод товара', 'штрихкод', 'productid'])?.toString() || 'unknown',
              type: (findKey(row, ['тип', 'type'])?.toString().toLowerCase() === 'приемка' || findKey(row, ['тип', 'type'])?.toString().toLowerCase() === 'restock') ? 'RESTOCK' : 'SALE',
              quantity: parseInt(findKey(row, ['количество', 'quantity']), 10) || 1,
              unit: (findKey(row, ['единица', 'unit'])?.toString().toLowerCase().includes('блок')) ? 'блок' : 'шт',
              piecesCount: parseInt(findKey(row, ['штук всего', 'piecescount']), 10) || 1,
              timestamp: findKey(row, ['дата', 'date']) || new Date().toISOString()
           }));
        }

        const runImport = async () => {
          const result = await onImport(importedProducts, importedTransactions);
            let toastMsg = t('Успешно обработано: {0} товаров.', importedProducts.length) + '\n' +
              t('Добавлено новых: {0}', result?.added || 0) + '\n' +
              t('Обновлено существующих: {0}', result?.updated || 0);
            if (importedTransactions.length > 0) {
              toastMsg += '\n' + t('Импортировано транзакций: {0}', importedTransactions.length);
            }
            alert(toastMsg);
        };
        runImport();
      } catch (err) {
        console.error("Error parsing file:", err);
        alert('Ошибка при чтении файла');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const wsData = products.map(p => ({
      'Штрихкод': p.id,
      'Артикул': p.sku,
      'Название': p.name,
      'Остаток': p.stock,
      'Цена': p.price,
      'Единица': p.unit,
      'Штук в блоке': p.itemsPerBlock || ''
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Склад");
    XLSX.writeFile(wb, "inventory.xlsx");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('Склад')}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">{t("Управление остатками и номенклатурой ({0} позиций)", products.length)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={handleExport}
                className="flex items-center justify-center space-x-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <span>{t("Экспорт")}</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{t('Импорт')}</span>
              </button>
              <button onClick={onAddNew} className="flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                <Plus className="w-4 h-4" />
                <span>{t("Новый товар")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex space-x-2 bg-white dark:bg-zinc-950 sticky top-0 z-10 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
          <input 
            type="text"
            placeholder={t("Поиск по названию, SKU или штрихкоду...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
          />
        </div>
        <button className="px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-zinc-600 mb-4" />
            <p className="text-gray-500 dark:text-zinc-400 font-medium text-lg">{t("Товар не найден")}</p>
            <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">{t("Попробуйте изменить запрос")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('Название')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('SKU / Штрихкод')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-right">{t('Остаток')}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-right">{t('Цена')}</th>
                  {!readOnly && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-right"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-500 dark:text-zinc-400">{product.sku}</div>
                      <div className="text-xs font-mono text-gray-400 dark:text-zinc-500">{product.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium border ${
                        product.stock === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30' :
                        product.stock <= 10 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30' :
                        'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-zinc-700'
                      }`}>
                        {formatStock(product.stock, product.itemsPerBlock, t)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.price)}
                    </td>
                    {!readOnly && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => setProductToDelete({ id: product.id, name: product.name })}
                          className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          title={t("Удалить товар")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!productToDelete}
        title={t("Удаление товара")}
        message={t('Вы уверены, что хотите удалить товар "{0}"? Эта операция необратима и повлияет на историю транзакций.', productToDelete?.name)}
        onConfirm={() => {
          if (productToDelete && onDeleteProduct) {
            onDeleteProduct(productToDelete.id);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
