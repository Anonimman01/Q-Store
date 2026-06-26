import React, { useState } from 'react';
import { Employee, Transaction, Product, JoinRequest } from '../types';
import { Users, Plus, Trash2, Award, User, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useLanguage } from '../lib/LanguageContext';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'ownerId'>) => void;
  onDeleteEmployee: (id: string) => void;
  transactions: Transaction[];
  products: Product[];
  storeInfo: {ownerId: string, role: string, employeeId?: string};
  user: any;
  joinRequests: JoinRequest[];
  myJoinRequests: JoinRequest[];
  onAddJoinRequest: (storeId: string, email: string, name: string) => void;
  onUpdateJoinRequest: (id: string, status: 'approved' | 'rejected') => void;
}

export function EmployeesView({ 
  employees, onAddEmployee, onDeleteEmployee, transactions, products, 
  storeInfo, user, joinRequests, myJoinRequests, onAddJoinRequest, onUpdateJoinRequest 
}: EmployeesViewProps) {
  const { formatCurrency, t } = useLanguage();
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [joinStoreId, setJoinStoreId] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, name: string} | null>(null);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;

    onAddEmployee({ 
      id: newEmployeeEmail.trim() ? newEmployeeEmail.trim().toLowerCase() : ('emp-' + Math.random().toString(36).substring(7)), 
      name: newEmployeeName.trim(),
      email: newEmployeeEmail.trim().toLowerCase() || undefined
    });
    setNewEmployeeName('');
    setNewEmployeeEmail('');
  };

  const handleJoinStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinStoreId.trim()) return;
    onAddJoinRequest(joinStoreId.trim(), user.email || '', user.displayName || user.email || 'Новый сотрудник');
    setJoinStoreId('');
  };

  const handleApproveRequest = (req: JoinRequest) => {
    onAddEmployee({
      id: req.userEmail.trim() ? req.userEmail.trim().toLowerCase() : req.userId,
      name: req.userName,
      email: req.userEmail.trim().toLowerCase() || undefined
    });
    onUpdateJoinRequest(req.id, 'approved');
  };

  const getEmployeeStats = (empId: string) => {
    const defaultEmployeeId = employees[0]?.id;
    // Map missing employee IDs slightly defensively if missing
    
    const empTransactions = transactions.filter(t => t.employeeId === empId || (!t.employeeId && empId === defaultEmployeeId));
    
    let totalSalesValue = 0;
    let itemsSold = 0;

    empTransactions.forEach(t => {
      if (t.type === 'SALE') {
        const product = products.find(p => p.id === t.productId || p.sku === t.productId);
        if (product) {
          totalSalesValue += product.price * (t.unit === 'блок' ? (t.piecesCount / t.quantity) * t.quantity : t.quantity);
          itemsSold += t.piecesCount;
        }
      }
    });

    return { totalSalesValue, itemsSold };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('Сотрудники')}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">{t("Управление персоналом и показатели продаж")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {storeInfo.role === 'admin' && (
            <form onSubmit={handleAddEmployee} className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col space-y-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{t("Новый профиль")}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{t("ФИО сотрудника")}</label>
                <input
                  type="text"
                  required
                  value={newEmployeeName}
                  onChange={e => setNewEmployeeName(e.target.value)}
                  placeholder={t("Иван Иванов")}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{t("Email для входа (необязательно)")}</label>
                <input
                  type="email"
                  value={newEmployeeEmail}
                  onChange={e => setNewEmployeeEmail(e.target.value)}
                  placeholder="employee@gmail.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t("Добавить")}</span>
              </button>
            </form>
          )}

          {storeInfo.role === 'admin' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col mt-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{t("Ваш ID магазина")}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">{t("Уникальный код для приглашения сотрудников")}</p>
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 flex justify-between items-center break-all">
                <code className="text-sm font-mono text-gray-800 dark:text-zinc-300 font-bold">{storeInfo.ownerId}</code>
              </div>
            </div>
          )}

          {storeInfo.role === 'employee' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6 flex flex-col space-y-4 mt-6">
              <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">{t("Присоединиться к магазину")}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">{t("Введите код магазина владельца, чтобы отправить запрос на добавление вас как сотрудника.")}</p>
              <form onSubmit={handleJoinStore} className="flex flex-col space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={joinStoreId}
                    onChange={e => setJoinStoreId(e.target.value)}
                    placeholder={t("ID магазина")}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black px-4 py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                >
                  <span>{t("Отправить заявку")}</span>
                </button>
              </form>
              
              {myJoinRequests.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 mt-2 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3">{t('Ваши заявки')}</h4>
                  {myJoinRequests.map(req => (
                    <div key={req.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl">
                      <div className="truncate pr-2">
                        <span className="font-mono text-xs text-gray-900 dark:text-gray-100">{req.storeId.substring(0, 8)}...</span>
                      </div>
                      <div>
                        {req.status === 'pending' && <span className="text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs font-medium">{t('Ожидает')}</span>}
                        {req.status === 'approved' && <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-medium">{t("Одобрен")}</span>}
                        {req.status === 'rejected' && <span className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-medium">{t("Отклонен")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Users className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <span>{t("Показатели сотрудников")}</span>
            </h3>
            
            <div className="space-y-3">
              {employees.map(employee => {
                const stats = getEmployeeStats(employee.id);
                return (
                  <div key={employee.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100/50 dark:hover:bg-zinc-800 transition-colors gap-4 group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-lg group-hover:text-black dark:group-hover:text-white transition-colors">{employee.name}</p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">ID: {employee.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-start sm:self-auto ml-16 sm:ml-0">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("Продано товаров")}</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{stats.itemsSold} {t("шт")}.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('Общая выручка')}</p>
                        <p className="font-bold text-green-600 dark:text-green-500">
                          {formatCurrency(stats.totalSalesValue)}
                        </p>
                      </div>
                      {storeInfo.role === 'admin' && (
                        <button 
                          onClick={() => setEmployeeToDelete({ id: employee.id, name: employee.name })}
                          className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0"
                          title={t("Удалить сотрудника")}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {employees.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Нет сотрудников</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Добавьте профиль сотрудника слева.</p>
                </div>
              )}
            </div>
            
            {storeInfo.role === 'admin' && joinRequests.filter(r => r.status === 'pending').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <span>{t("Заявки на присоединение")}</span>
                </h3>
                <div className="space-y-3">
                  {joinRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-yellow-50 truncate text-lg">{req.userName}</p>
                        <p className="text-sm text-gray-600 dark:text-yellow-200 mt-0.5">{req.userEmail}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleApproveRequest(req)}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{t("Одобрить")}</span>
                        </button>
                        <button 
                          onClick={() => onUpdateJoinRequest(req.id, 'rejected')}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-sm font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{t('Отклонить')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!employeeToDelete}
        title={t("Удаление профиля сотрудника")}
        message={`Вы уверены, что хотите удалить сотрудника "${employeeToDelete?.name}"? Он потеряет доступ к магазину, но его история транзакций сохранится.`}
        onConfirm={() => {
          if (employeeToDelete) {
            onDeleteEmployee(employeeToDelete.id);
          }
        }}
        onCancel={() => setEmployeeToDelete(null)}
      />
    </div>
  );
}
