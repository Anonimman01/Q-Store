/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { ScannerView } from './components/ScannerView';
import { ExpensesView } from './components/ExpensesView';
import { EmployeesView } from './components/EmployeesView';
import { CalculatorWidget } from './components/CalculatorWidget';
import { AuthPage } from './components/AuthPage';
import { Product, Transaction, TransactionType, Expense, Employee } from './types';
import { LayoutDashboard, Package, ScanLine, Wallet, Shield, User, Users, LogOut, Clock, Moon, Sun, DollarSign } from 'lucide-react';
import { cn } from './lib/utils';
import { useStoreData } from './hooks/useStoreData';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { useLanguage, LanguageCode } from './lib/LanguageContext';
import { DemoSetup } from './components/DemoSetup';

type Tab = 'dashboard' | 'inventory' | 'scanner' | 'expenses' | 'employees';
type Role = 'admin' | 'employee' | 'employee_pending';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

function useTheme() {
  const [isDark, setIsDark] = useLocalStorage('theme-dark', false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [storeInfo, setStoreInfo] = useState<{ownerId: string, role: Role, employeeId?: string} | null>(null);

  // Intercept /demo route
  if (window.location.pathname === '/demo') {
    return <DemoSetup />;
  }

  // Initialize theme globally
  useTheme();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        const targetStoreId = localStorage.getItem('targetStoreId');
        
        let foundEmployeeDoc = false;
        let empOwnerId = '';
        let empId = '';

        if (u.email) {
          try {
            const dbRef = getFirestore(auth.app, "ai-studio-inventorytracker-87e5e818-df94-48b7-b048-ee98b323b596");
            const empDoc = await getDoc(doc(dbRef, 'employees', u.email.toLowerCase()));
            if (empDoc.exists()) {
              foundEmployeeDoc = true;
              empOwnerId = empDoc.data().ownerId;
              empId = empDoc.id;
            }
          } catch (e) {
            console.error("Failed to fetch employee record by email", e);
          }
        }
        
        if (!foundEmployeeDoc) {
          try {
            const dbRef = getFirestore(auth.app, "ai-studio-inventorytracker-87e5e818-df94-48b7-b048-ee98b323b596");
            const empDocUid = await getDoc(doc(dbRef, 'employees', u.uid));
            if (empDocUid.exists()) {
              foundEmployeeDoc = true;
              empOwnerId = empDocUid.data().ownerId;
              empId = empDocUid.id;
            }
          } catch (e) {
             console.error("Failed to fetch employee record by uid", e);
          }
        }

        if (foundEmployeeDoc) {
          setStoreInfo({
            ownerId: empOwnerId,
            role: 'employee',
            employeeId: empId
          });
          localStorage.removeItem('targetStoreId');
          return;
        }

        if (targetStoreId) {
          // Send automatic join request
          try {
            const dbRef = getFirestore(auth.app, "ai-studio-inventorytracker-87e5e818-df94-48b7-b048-ee98b323b596");
            const reqRef = doc(collection(dbRef, 'joinRequests'));
            await setDoc(reqRef, {
              id: reqRef.id,
              storeId: targetStoreId,
              userId: u.uid,
              userEmail: u.email || '',
              userName: u.displayName || u.email || t('Сотрудник'),
              status: 'pending'
            });
          } catch (e) {
            console.error("Failed to create automatic join request", e);
          }
          
          setStoreInfo({ ownerId: targetStoreId, role: 'employee_pending' });
          localStorage.removeItem('targetStoreId');
          return;
        }

        setStoreInfo({ ownerId: u.uid, role: 'admin' });
      } else {
        setStoreInfo(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">{t('Выполняется загрузка...')}</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!storeInfo) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">{t('Настройка доступа...')}</div>;
  }

  if (storeInfo.role === 'employee_pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6 text-gray-900 dark:text-gray-100">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('Ожидание одобрения')}</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
            {t("Заявка на присоединение к магазину")} <b>{storeInfo.ownerId}</b> {t("отправлена. Пожалуйста, подождите, пока владелец одобрит ваш запрос.")}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-xl font-medium mb-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >{t('Проверить статус')}</button>
          <button 
            onClick={() => signOut(auth)}
            className="text-gray-500 dark:text-zinc-400 text-sm hover:text-gray-800 dark:hover:text-zinc-300 font-medium transition-colors"
          >{t('Выйти')}</button>
        </div>
      </div>
    );
  }

  return <StoreApp user={user} storeInfo={storeInfo} />;
}

function StoreApp({ user, storeInfo }: { user: FirebaseUser, storeInfo: {ownerId: string, role: Role, employeeId?: string} }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [roleOverride, setRoleOverride] = useState<Role | null>(null);
  const actualRole = storeInfo.role;
  const role = roleOverride || actualRole;
  const [scannerInitialMode, setScannerInitialMode] = useState<TransactionType>('SALE');
  const { language, setLanguage, t } = useLanguage();
  
  const {
    products, setProducts, addProduct, deleteProduct, updateProductsBulk,
    transactions, addTransaction, addTransactionsBulk,
    expenses, addExpense, deleteExpense,
    employees, addEmployee, deleteEmployee,
    joinRequests, myJoinRequests, addJoinRequest, updateJoinRequestStatus
  } = useStoreData(storeInfo.ownerId, user.uid);
  
  const [currentEmployeeId, setCurrentEmployeeId] = useLocalStorage<string | null>('pos_current_employee', 'emp-1');
  const finalEmployeeId = actualRole === 'employee' ? storeInfo.employeeId : currentEmployeeId;
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDark, setIsDark] = useTheme();

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
  };

  const handleTransaction = (
    productId: string, 
    type: TransactionType, 
    quantity: number, 
    newProductDetails?: { name: string; price: number; unit: 'шт' | 'блок', itemsPerBlock?: number },
    transactionUnit?: 'шт' | 'блок',
    itemsPerBlockUpdate?: number
  ) => {
    // Check if product exists
    let activeProduct = products.find(p => p.id === productId || p.sku === productId);
    
    // If it's a completely new barcode, create it with details if provided
    if (!activeProduct) {
      activeProduct = {
        id: productId,
        sku: `NEW-${productId.substring(0, 4)}`,
        name: newProductDetails?.name || `${t('Новый товар')} (${productId})`,
        stock: 0,
        price: newProductDetails?.price || 0,
        unit: newProductDetails?.unit || 'шт',
        itemsPerBlock: newProductDetails?.itemsPerBlock || itemsPerBlockUpdate || undefined
      };
      
      // Async add product to firebase
      addProduct(activeProduct);
    }

    const targetId = activeProduct.id;
    const currentItemsPerBlock = itemsPerBlockUpdate || activeProduct.itemsPerBlock || 1;
    const piecesChanged = transactionUnit === 'блок' ? quantity * currentItemsPerBlock : quantity;

    // Update stock
    const newStock = type === 'SALE' ? Math.max(0, activeProduct.stock - piecesChanged) : activeProduct.stock + piecesChanged;
    
    setProducts(targetId, {
      itemsPerBlock: itemsPerBlockUpdate ? itemsPerBlockUpdate : activeProduct.itemsPerBlock,
      stock: newStock
    });

    // Record transaction
    const newTx: Omit<Transaction, 'ownerId'> = {
      id: Math.random().toString(36).substring(7),
      productId: targetId,
      type,
      quantity,
      unit: transactionUnit,
      piecesCount: piecesChanged,
      timestamp: new Date().toISOString(),
      employeeId: role === 'employee' && finalEmployeeId ? finalEmployeeId : undefined
    };
    
    addTransaction(newTx as Transaction);
  };

  const handleImport = async (importedProducts: Product[], importedTransactions?: Transaction[]) => {
    let added = 0;
    let updated = 0;
    
    const productsToUpdate: any[] = [];
    
    for (const ip of importedProducts) {
      const existingProduct = products.find(p => p.id === ip.id || p.sku === ip.sku);
      if (existingProduct) {
        productsToUpdate.push({ id: existingProduct.id, ...ip });
        updated++;
      } else {
        await addProduct(ip);
        added++;
      }
    }
    
    if (productsToUpdate.length > 0) {
      await updateProductsBulk(productsToUpdate);
    }

    if (importedTransactions && importedTransactions.length > 0) {
      await addTransactionsBulk(importedTransactions);
    }
    
    return { added, updated };
  };

  const allTabs = [
    { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard, adminOnly: true },
    { id: 'scanner', label: 'Сканер', icon: ScanLine, adminOnly: false },
    { id: 'inventory', label: 'Склад', icon: Package, adminOnly: false },
    { id: 'expenses', label: 'Расходы', icon: Wallet, adminOnly: true },
    { id: 'employees', label: 'Сотрудники', icon: Users, adminOnly: true },
  ] as const;

  const tabs = allTabs.filter(tab => role === 'admin' || !tab.adminOnly);

  useEffect(() => {
    if (role === 'employee' && allTabs.find(t => t.id === activeTab)?.adminOnly) {
      setActiveTab('scanner');
    }
  }, [role, activeTab]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Top Header (only visible on mobile) */}
      <div className="md:hidden flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h2 className="text-lg font-bold tracking-tight">{t('Q-Store')}<span className="text-xs text-gray-500 font-normal uppercase tracking-widest ml-1">{t('Остатки')}</span></h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            {language === 'uz' ? 'UZ' : 'RU'}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-300">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => signOut(auth)} className="p-1.5 text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-300">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-h-screen fixed left-0 top-0 pt-6 transition-colors duration-200">
        <div className="px-6 mb-8 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t('Q-Store')}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{t('Остатки')}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setIsDark(!isDark)} className="text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-300">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-300">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {(['uz', 'ru'] as const).map(c => (
              <button
                key={c.toUpperCase()}
                onClick={() => setLanguage(c)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                  language === c 
                    ? "bg-black text-white dark:bg-white dark:text-black" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'scanner') setScannerInitialMode('SALE');
                setActiveTab(tab.id);
              }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                activeTab === tab.id 
                  ? "bg-black text-white dark:bg-white dark:text-black" 
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white dark:text-black" : "text-gray-400 dark:text-zinc-500")} />
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
          {actualRole === 'admin' && role === 'employee' && (
            <div className="px-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-2">{t('Текущий профиль (Тест)')}</label>
              <select
                value={currentEmployeeId || ''}
                onChange={(e) => setCurrentEmployeeId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white block p-2.5"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}
          {actualRole === 'employee' && role === 'employee' && (
            <div className="px-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-2">{t('Ваш профиль')}</label>
              <div className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg p-2.5 truncate">
                {employees.find(e => e.id === storeInfo.employeeId)?.name || storeInfo.employeeId}
              </div>
            </div>
          )}
          {actualRole === 'admin' && (
            <button
              onClick={() => setRoleOverride(role === 'admin' ? 'employee' : 'admin')}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm border",
                role === 'admin' 
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
              )}
            >
              <div className="flex items-center space-x-3">
                {role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                <span>{role === 'admin' ? t('Администратор') : t('Сотрудник (Тест)')}</span>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 relative min-h-screen pb-20 md:pb-0 pt-4 md:pt-8 bg-white dark:bg-zinc-950 transition-colors duration-200">
        {activeTab === 'dashboard' && <Dashboard products={products} transactions={transactions} expenses={expenses} />}
        {activeTab === 'inventory' && <Inventory products={products} onAddNew={() => { setScannerInitialMode('RESTOCK'); setActiveTab('scanner'); }} onImport={handleImport} onDeleteProduct={handleDeleteProduct} readOnly={role === 'employee'} />}
        {activeTab === 'scanner' && <ScannerView products={products} onTransaction={handleTransaction} initialMode={scannerInitialMode} />}
        {activeTab === 'expenses' && <ExpensesView expenses={expenses} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />}
        {activeTab === 'employees' && <EmployeesView 
          employees={employees} 
          onAddEmployee={addEmployee} 
          onDeleteEmployee={deleteEmployee} 
          transactions={transactions} 
          products={products}
          storeInfo={storeInfo}
          user={user}
          joinRequests={joinRequests}
          myJoinRequests={myJoinRequests}
          onAddJoinRequest={addJoinRequest}
          onUpdateJoinRequest={updateJoinRequestStatus}
        />}
        
        {/* Calculator Widget */}
        <CalculatorWidget isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} onOpen={() => setIsCalculatorOpen(true)} />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'scanner') setScannerInitialMode('SALE');
                setActiveTab(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                activeTab === tab.id ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              <tab.icon className={cn(
                "w-6 h-6 transition-transform",
                activeTab === tab.id ? "scale-110" : ""
              )} />
              <span className="text-[10px] font-medium tracking-wide">{t(tab.label)}</span>
            </button>
          ))}
          {actualRole === 'admin' && (
            <button
              onClick={() => setRoleOverride(role === 'admin' ? 'employee' : 'admin')}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                role === 'admin' ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              {role === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
              <span className="text-[10px] font-medium tracking-wide">{t('Режим')}</span>
            </button>
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            <span className="text-[10px] font-medium tracking-wide">{t('Тема')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
