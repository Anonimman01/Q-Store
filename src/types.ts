export interface Product {
  id: string; // Used as barcode
  sku: string;
  name: string;
  stock: number;
  price: number;
  unit: 'шт' | 'блок';
  itemsPerBlock?: number;
}

export type TransactionType = 'SALE' | 'RESTOCK';

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  unit?: 'шт' | 'блок';
  piecesCount: number;
  timestamp: string;
  employeeId?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  ownerId?: string;
}

export interface JoinRequest {
  id: string;
  storeId: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
}
