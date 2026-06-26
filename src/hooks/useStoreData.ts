import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product, Transaction, Expense, Employee } from '../types';

export function useStoreData(uid: string | undefined, currentUserUid?: string | undefined) {
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => newObj[key] === undefined && delete newObj[key]);
    return newObj;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [myJoinRequests, setMyJoinRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    const qProducts = query(collection(db, 'products'), where('ownerId', '==', uid));
    const unProducts = onSnapshot(qProducts, snapshot => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, error => {
      console.error("Products snapshot error:", error);
    });

    const qTransactions = query(collection(db, 'transactions'), where('ownerId', '==', uid));
    const unTransactions = onSnapshot(qTransactions, snapshot => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, error => {
      console.error("Transactions snapshot error:", error);
    });

    const qExpenses = query(collection(db, 'expenses'), where('ownerId', '==', uid));
    const unExpenses = onSnapshot(qExpenses, snapshot => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, error => {
      console.error("Expenses snapshot error:", error);
    });

    const qEmployees = query(collection(db, 'employees'), where('ownerId', '==', uid));
    const unEmployees = onSnapshot(qEmployees, snapshot => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, error => {
      console.error("Employees snapshot error:", error);
    });

    let unJoinRequests = () => {};
    if (currentUserUid === uid) {
      const qJoinRequests = query(collection(db, 'joinRequests'), where('storeId', '==', uid));
      unJoinRequests = onSnapshot(qJoinRequests, snapshot => {
        setJoinRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }, error => {
        console.error("JoinRequests snapshot error:", error);
      });
    }

    let unMyJoinRequests = () => {};
    if (currentUserUid) {
      const qMyJoinRequests = query(collection(db, 'joinRequests'), where('userId', '==', currentUserUid));
      unMyJoinRequests = onSnapshot(qMyJoinRequests, snapshot => {
        setMyJoinRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }, error => {
        console.error("MyJoinRequests snapshot error:", error);
      });
    }

    return () => {
      unProducts();
      unTransactions();
      unExpenses();
      unEmployees();
      unJoinRequests();
      unMyJoinRequests();
    };
  }, [uid, currentUserUid]);

  const addProduct = async (product: Omit<Product, 'ownerId'>) => {
    if (!uid) return;
    await setDoc(doc(db, 'products', product.id), sanitize({ ...product, ownerId: uid }));
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'products', id), sanitize(data));
  };

  const deleteProduct = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'products', id));
  };

  const addTransaction = async (transaction: Omit<Transaction, 'ownerId'>) => {
    if (!uid) return;
    await setDoc(doc(db, 'transactions', transaction.id), sanitize({ ...transaction, ownerId: uid }));
  };

  const addTransactionsBulk = async (newTransactions: Omit<Transaction, 'ownerId'>[]) => {
    if (!uid) return;
    const batch = writeBatch(db);
    newTransactions.forEach(t => {
      const docRef = doc(db, 'transactions', t.id);
      batch.set(docRef, sanitize({ ...t, ownerId: uid }));
    });
    await batch.commit();
  };
  
  const updateProductsBulk = async (updatedProducts: Partial<Product> & {id: string}[]) => {
     if (!uid) return;
     const batch = writeBatch(db);
     updatedProducts.forEach(p => {
       const docRef = doc(db, 'products', p.id);
       batch.update(docRef, sanitize(p));
     });
     await batch.commit();
  };

  const addExpense = async (expense: Omit<Expense, 'ownerId'>) => {
    if (!uid) return;
    await setDoc(doc(db, 'expenses', expense.id), sanitize({ ...expense, ownerId: uid }));
  };

  const deleteExpense = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'expenses', id));
  };

  const addEmployee = async (employee: Omit<Employee, 'ownerId'>) => {
    if (!uid) return;
    await setDoc(doc(db, 'employees', employee.id), sanitize({ ...employee, ownerId: uid }));
  };

  const deleteEmployee = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'employees', id));
  };

  const addJoinRequest = async (storeId: string, email: string, name: string) => {
    if (!currentUserUid) return;
    const reqRef = doc(collection(db, 'joinRequests'));
    await setDoc(reqRef, sanitize({
      id: reqRef.id,
      storeId,
      userId: currentUserUid,
      userEmail: email,
      userName: name,
      status: 'pending'
    }));
  };

  const updateJoinRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'joinRequests', requestId), sanitize({ status }));
  };

  return {
    products, setProducts: updateProduct, addProduct, deleteProduct, updateProductsBulk,
    transactions, addTransaction, addTransactionsBulk,
    expenses, addExpense, deleteExpense,
    employees, addEmployee, deleteEmployee,
    joinRequests, myJoinRequests, addJoinRequest, updateJoinRequestStatus
  };
}
