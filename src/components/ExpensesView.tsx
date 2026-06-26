import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Calendar, Receipt, Wallet } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useLanguage } from '../lib/LanguageContext';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'ownerId'>) => void;
  onDeleteExpense: (id: string) => void;
}

export function ExpensesView({ expenses, onAddExpense, onDeleteExpense }: ExpensesViewProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<{id: string, description: string} | null>(null);
  const { language, formatCurrency, t } = useLanguage();

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const newExpense: Omit<Expense, 'ownerId'> = {
      id: Math.random().toString(36).substring(7),
      description: description.trim(),
      amount: parseFloat(amount),
      timestamp: new Date().toISOString()
    };

    onAddExpense(newExpense);
    setDescription('');
    setAmount('');
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('Расходы')}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">{t('Учет финансовых затрат магазина')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleAddExpense} className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col space-y-4">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{t('Новый расход')}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{t('Описание затрат')}</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t("Закупка, Аренда...")}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{t("Сумма ({0})", language === "ru" ? "руб." : "so'm")}</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Добавить расход')}</span>
            </button>
          </form>
          
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400 rounded-3xl p-6">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t("Всего расходов:")}</span>
              <span className="text-xl font-bold">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Receipt className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <span>{t('История расходов')}</span>
            </h3>
            
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('Нет записей о расходах')}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t("Добавьте первый расход с помощью формы.")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100/50 dark:hover:bg-zinc-800 transition-colors group">
                    <div className="flex items-center space-x-4 pr-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{expense.description}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(expense.timestamp).toLocaleString('ru-RU')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right whitespace-nowrap">
                        <div className="font-medium text-red-600 dark:text-red-400">
                          - {formatCurrency(expense.amount)}
                        </div>
                      </div>
                      <button 
                        onClick={() => setExpenseToDelete({ id: expense.id, description: expense.description })}
                        className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        title={t("Удаление расхода")}
        message={t('Вы уверены, что хотите удалить этот расход: "{0}"? Эта операция необратима.', expenseToDelete?.description)}
        onConfirm={() => {
          if (expenseToDelete) {
            onDeleteExpense(expenseToDelete.id);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}
