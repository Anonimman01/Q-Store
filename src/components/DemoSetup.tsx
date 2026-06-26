import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export function DemoSetup() {
  const [status, setStatus] = useState('Checking auth...');
  const [error, setError] = useState('');

  useEffect(() => {
    const setupDemo = async () => {
      try {
        // Wait a brief moment for auth state to initialize if it hasn't
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = auth.currentUser;
        if (!user) {
          setError('Для создания демо-данных сначала войдите в систему (на главной странице через Google), а затем перейдите по ссылке /demo');
          return;
        }

        const uid = user.uid;
        setStatus('Generating 1000 products...');
        
        // Products
        const products = [];
        for (let i = 1; i <= 1000; i++) {
          products.push({
            id: `prod_${i}`,
            name: `Товар ${i}`,
            sku: `10000${i}`,
            price: Math.floor(Math.random() * 10000) + 100,
            stock: Math.floor(Math.random() * 100) + 10,
            unit: 'шт',
            itemsPerBlock: 1
          });
        }

        // Employees
        setStatus('Creating 4 employees...');
        const employees = [
          { id: 'emp_1', name: 'Алексей (Кассир)', role: 'employee', status: 'approved' },
          { id: 'emp_2', name: 'Мария (Менеджер)', role: 'employee', status: 'approved' },
          { id: 'emp_3', name: 'Иван (Продавец)', role: 'employee', status: 'approved' },
          { id: 'emp_4', name: 'Ольга (Склад)', role: 'employee', status: 'approved' },
        ];

        // Transactions
        setStatus('Generating daily sales...');
        const transactions = [];
        const now = Date.now();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        // About 1500 transactions over 30 days (50/day)
        for (let i = 0; i < 1500; i++) {
          const emp = employees[Math.floor(Math.random() * employees.length)];
          const prod = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 5) + 1;
          const isSale = Math.random() > 0.2; // 80% sales, 20% restock
          const timestamp = now - Math.floor(Math.random() * thirtyDaysInMs);

          transactions.push({
            id: `tx_${i}`,
            productId: prod.id,
            type: isSale ? 'SALE' : 'RESTOCK',
            quantity: qty,
            unit: 'шт',
            piecesCount: qty,
            timestamp,
            employeeId: emp.id
          });
        }

        setStatus('Saving to database (this may take a moment)...');
        
        // Firestore batch limits to 500 writes, so chunk it
        const chunks = [];
        let currentChunk: any[] = [];
        
        const addToChunk = (ref: any, data: any) => {
          if (currentChunk.length === 490) {
            chunks.push(currentChunk);
            currentChunk = [];
          }
          currentChunk.push({ ref, data });
        };

        // User setup
        addToChunk(doc(db, 'users', uid), { role: 'admin' });

        // Add products
        products.forEach(p => {
          addToChunk(doc(db, 'products', `${uid}_${p.id}`), { ...p, ownerId: uid, id: `${uid}_${p.id}` });
        });

        // Add employees
        employees.forEach(e => {
          addToChunk(doc(db, 'employees', `${uid}_${e.id}`), { ...e, ownerId: uid, email: `${e.id}@qstore.app` });
        });

        // Add transactions
        transactions.forEach(t => {
          addToChunk(doc(db, 'transactions', `${uid}_${t.id}`), { 
            ...t, 
            ownerId: uid, 
            id: `${uid}_${t.id}`, 
            productId: `${uid}_${t.productId}`,
            employeeId: `${uid}_${t.employeeId}` 
          });
        });

        chunks.push(currentChunk);

        for (let i = 0; i < chunks.length; i++) {
          const batch = writeBatch(db);
          chunks[i].forEach((op: any) => {
            batch.set(op.ref, op.data);
          });
          await batch.commit();
          setStatus(`Saving chunk ${i + 1} of ${chunks.length}...`);
        }

        setStatus('Demo setup complete! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);

      } catch (err: any) {
        setError(err.message || 'Error setting up demo');
      }
    };

    setupDemo();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
      <div className="p-8 bg-white dark:bg-zinc-900 shadow rounded-xl max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4">Настройка Демо</h2>
        {error ? (
          <p className="text-red-500 text-sm font-medium">{error}</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">{status}</p>
        )}
      </div>
    </div>
  );
}
