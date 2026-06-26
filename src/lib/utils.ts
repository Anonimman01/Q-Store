import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStock(stock: number, itemsPerBlock: number | undefined, t: (key: string, ...args: any[]) => string): string {
  if (!itemsPerBlock || itemsPerBlock <= 1) return t("{0} шт.", stock);
  const blocks = Math.floor(stock / itemsPerBlock);
  const pieces = stock % itemsPerBlock;
  if (blocks === 0) return t("{0} шт.", pieces);
  if (pieces === 0) return t("{0} блок.", blocks);
  return t("{0} блок. и {1} шт.", blocks, pieces);
}
