import { Product, Transaction } from './types';

export const initialProducts: Product[] = [
  { id: '123456789012', sku: 'SKU-001', name: 'Ноутбук 14"', stock: 12, price: 120000, unit: 'шт' },
  { id: '987654321098', sku: 'SKU-002', name: 'Кофе в зернах (1кг)', stock: 45, price: 1500, unit: 'шт' },
  { id: '456123789012', sku: 'SKU-003', name: 'Бумага А4 (Снегурочка)', stock: 120, price: 400, unit: 'блок' },
  { id: '111222333444', sku: 'SKU-004', name: 'Энергетический напиток', stock: 350, price: 120, unit: 'шт' },
  { id: '222333444555', sku: 'SKU-005', name: 'Беспроводная мышь', stock: 8, price: 1800, unit: 'шт' },
  { id: '333444555666', sku: 'SKU-006', name: 'Клавиатура механика', stock: 5, price: 4500, unit: 'шт' },
];

export const initialTransactions: Transaction[] = [
  { id: 'tx1', productId: '123456789012', type: 'SALE', quantity: 1, unit: 'шт', piecesCount: 1, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx2', productId: '456123789012', type: 'RESTOCK', quantity: 50, unit: 'блок', piecesCount: 50, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx3', productId: '987654321098', type: 'SALE', quantity: 2, unit: 'шт', piecesCount: 2, timestamp: new Date(Date.now() - 7200000).toISOString() },
];
