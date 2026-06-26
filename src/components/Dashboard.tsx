import React, { useMemo } from 'react';
import { Product, Transaction, Expense } from '../types';
import { Package, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Download, Wallet, CreditCard, Banknote } from 'lucide-react';
import { cn, formatStock } from '../lib/utils';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useLanguage } from '../lib/LanguageContext';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  expenses?: Expense[];
}

export function Dashboard({ products, transactions, expenses = [] }: DashboardProps) {
  const { language, formatCurrency, t } = useLanguage();
  const sales = transactions.filter(t => t.type === 'SALE');
  const revenue = sales.reduce((acc, t) => {
    const product = products.find(p => p.id === t.productId || p.sku === t.productId);
    return acc + (product ? product.price * t.quantity : 0);
  }, 0);

  const itemsSold = sales.reduce((acc, t) => acc + t.quantity, 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const handleExportTransactions = () => {
    const wsData = transactions.map(t => {
      const product = products.find(p => p.id === t.productId || p.sku === t.productId);
      return {
        'Местное время': new Date(t.timestamp).toLocaleString('ru-RU'),
        'Тип операции': t.type === 'SALE' ? 'Продажа' : 'Приемка',
        'Штрихкод/Артикул': t.productId,
        'Название товара': product ? product.name : 'Удаленный товар',
        'Единица': t.unit || 'шт',
        'Введенное количество': t.quantity,
        'Сумма/Эквивалент штук': t.piecesCount,
        [`Цена/Сумма (${language === 'ru' ? 'руб.' : "so'm"})`]: product && t.type === 'SALE' ? product.price * (t.unit === 'блок' ? (t.piecesCount / t.quantity) * t.quantity : t.quantity) : 0
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "История операций");
    XLSX.writeFile(wb, "transactions-history.xlsx");
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = revenue - totalExpenses;

  // Prepare chart data (Sales grouped by day)
  const chartData = useMemo(() => {
    const salesByDay: Record<string, number> = {};
    
    // Default to last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
      salesByDay[dateStr] = 0;
    }

    sales.forEach(t => {
      const d = new Date(t.timestamp);
      const dateStr = d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
      if (salesByDay[dateStr] !== undefined) {
        const product = products.find(p => p.id === t.productId || p.sku === t.productId);
        if (product) {
          salesByDay[dateStr] += product.price * t.quantity;
        }
      }
    });

    return Object.entries(salesByDay).map(([date, amount]) => ({
      date,
      Выручка: amount
    }));
  }, [sales, products]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('Обзор панель')}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">{t('Ключевые показатели бизнеса в реальном времени')}</p>
        </div>
        <button 
          onClick={handleExportTransactions}
          className="flex items-center justify-center space-x-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t('Выгрузить продажи')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-black dark:text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">{t('Выручка')}</p>
            <h3 className="text-2xl lg:text-3xl font-bold font-sans tracking-tight text-gray-900 dark:text-gray-100">{formatCurrency(revenue)}</h3>
          </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Wallet className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">{t('Расходы')}</p>
            <h3 className="text-2xl lg:text-3xl font-bold font-sans tracking-tight text-gray-900 dark:text-gray-100">{formatCurrency(totalExpenses)}</h3>
          </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <TrendingUp className={`w-5 h-5 ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">{t('Чистая прибыль')}</p>
            <h3 className={`text-2xl lg:text-3xl font-bold font-sans tracking-tight ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netProfit)}
            </h3>
          </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-1">{t('Заканчивается (товары)')}</p>
            <h3 className="text-2xl lg:text-3xl font-bold font-sans tracking-tight text-red-600 dark:text-red-400">
              {lowStockProducts.length + outOfStockProducts.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col">
        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">{t('Выручка за последние 7 дней')}</h2>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [formatCurrency(value), t('Выручка')]}
              />
              <Line 
                type="monotone" 
                dataKey="Выручка" 
                stroke="#000000" 
                strokeWidth={3}
                dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('Последние операции')}</h2>
          <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-zinc-400">{t('Нет недавних операций')}</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {transactions.slice().reverse().slice(0, 5).map(tx => {
                  const product = products.find(p => p.id === tx.productId || p.sku === tx.productId);
                  const isSale = tx.type === 'SALE';
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isSale ? "bg-gray-100 dark:bg-zinc-800" : "bg-black dark:bg-white text-white dark:text-black"
                        )}>
                          {isSale ? <ArrowDownRight className="w-5 h-5 text-gray-600 dark:text-zinc-400" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{product?.name || `Неизвестный: ${tx.productId}`}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t(isSale ? 'Продажа' : 'Приемка')}</p>
                        </div>
                      </div>
                      <div className={cn("font-semibold text-sm", isSale ? "text-gray-900 dark:text-gray-100" : "text-emerald-600 dark:text-emerald-400")}>
                        {isSale ? '-' : '+'}{tx.quantity} {t(product?.unit || 'шт')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
           <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('Низкий остаток')}</h2>
           <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-zinc-400">{t('Все товары в достаточном количестве')}</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {[...outOfStockProducts, ...lowStockProducts].map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        p.stock === 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30"
                      )}>
                        {t('Остаток')}: {formatStock(p.stock, p.itemsPerBlock, t)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
           </div>
        </div>
      </div>
    </div>
  );
}
