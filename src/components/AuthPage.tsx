import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Package, Store, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

export function AuthPage() {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'admin' | 'employee'>('admin');
  const [storeId, setStoreId] = useState('');

  const handleGoogleLogin = async () => {
    if (mode === 'employee' && !storeId.trim()) {
      setError('Введите ID магазина');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'employee') {
        localStorage.setItem('targetStoreId', storeId.trim());
      } else {
        localStorage.removeItem('targetStoreId');
      }

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при входе');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <Package className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{t('Q-Store')}</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
            Система управления магазином
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-sm sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-zinc-800">
            
            <div className="flex p-1 mb-6 bg-gray-100 dark:bg-zinc-950 rounded-xl">
              <button
                onClick={() => setMode('admin')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex justify-center items-center gap-2",
                  mode === 'admin' ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
                )}
              >
                <Store className="w-4 h-4" />
                Владелец
              </button>
              <button
                onClick={() => setMode('employee')}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex justify-center items-center gap-2",
                  mode === 'employee' ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
                )}
              >
                <User className="w-4 h-4" />
                Сотрудник
              </button>
            </div>

            <div className="space-y-6">
              {mode === 'employee' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    ID магазина
                  </label>
                  <input
                    type="text"
                    required
                    value={storeId}
                    onChange={e => setStoreId(e.target.value)}
                    placeholder="Уникальный ID магазина"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-transparent dark:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none transition-all font-mono text-sm text-gray-900 dark:text-gray-100"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                    Запросите ID у владельца магазина
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-zinc-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                {loading ? 'Загрузка...' : 'Продолжить с Google'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
