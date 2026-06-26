import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, Package, Search, X, Check, ArrowRightLeft, Minus, Plus, Receipt } from 'lucide-react';
import { Product, TransactionType } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface ScannerViewProps {
  products: Product[];
  onTransaction: (
    productId: string, 
    type: TransactionType, 
    quantity: number,
    newProductDetails?: { name: string; price: number; unit: 'шт' | 'блок', itemsPerBlock?: number },
    transactionUnit?: 'шт' | 'блок',
    itemsPerBlockUpdate?: number
  ) => void;
  initialMode?: TransactionType;
}

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  time: number;
}

export function ScannerView({ products, onTransaction, initialMode = 'SALE' }: ScannerViewProps) {
  const { language, formatCurrency, t } = useLanguage();
  const [mode, setMode] = useState<TransactionType>(initialMode);
  
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [fastScan, setFastScan] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Наличные' | 'Карта' | 'QR/Перевод'>('Наличные');
  
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState<'шт'|'блок'>('шт');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [transactionUnit, setTransactionUnit] = useState<'шт'|'блок'>('шт');
  const [itemsPerBlock, setItemsPerBlock] = useState<number | ''>('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fastScanRef = useRef(fastScan);
  const productsRef = useRef(products);
  const modeRef = useRef(mode);
  const onTransactionRef = useRef(onTransaction);
  const lastScannedRef = useRef<{code: string, time: number} | null>(null);
  const scannedCodeRef = useRef<string | null>(scannedCode);
  const isManualEntryRef = useRef(isManualEntry);

  useEffect(() => { fastScanRef.current = fastScan; }, [fastScan]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { onTransactionRef.current = onTransaction; }, [onTransaction]);
  useEffect(() => { scannedCodeRef.current = scannedCode; }, [scannedCode]);
  useEffect(() => { isManualEntryRef.current = isManualEntry; }, [isManualEntry]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const playErrorBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      osc1.start();
      gain1.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.15);
      
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(120, ctx.currentTime);
          gain2.gain.setValueAtTime(0.3, ctx.currentTime);
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);
          osc2.stop(ctx.currentTime + 0.25);
        } catch (e) {}
      }, 150);
    } catch (e) {}
  };

  useEffect(() => {
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (scannedCodeRef.current || isManualEntryRef.current) {
          return;
        }
        decodedText = decodedText.trim();
        const now = Date.now();
        if (lastScannedRef.current && lastScannedRef.current.code === decodedText && now - lastScannedRef.current.time < 2000) {
          return;
        }
        lastScannedRef.current = { code: decodedText, time: now };

        if (fastScanRef.current) {
          const product = productsRef.current.find(p => p.id === decodedText || p.sku === decodedText);
          
          if (product) {
            let actualUnit = product.unit || 'шт';
            let actualIPB = product.itemsPerBlock || 1;
            
            if (modeRef.current === 'SALE') {
              const partsNeeded = actualUnit === 'блок' ? actualIPB : 1;
              if (product.stock < partsNeeded) {
                playErrorBeep();
                setToastMessage(`❌ Нет на складе: 1x ${product.name} (Остаток: ${product.stock} шт)`);
                setTimeout(() => {
                  setToastMessage(prev => prev ? null : prev);
                }, 3000);
                return;
              }
            }

            onTransactionRef.current(decodedText, modeRef.current, 1, undefined, actualUnit, actualIPB);
            
            if (modeRef.current === 'SALE') {
              setReceiptItems(prev => {
                const existing = prev.find(item => item.id === product.id);
                if (existing) {
                  return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, time: Date.now() } : item);
                } else {
                  return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, time: Date.now() }];
                }
              });
            }

            playBeep();
            setToastMessage(`${modeRef.current === 'SALE' ? 'Продан' : 'Принят'}: 1x ${product.name}`);
            setTimeout(() => {
              setToastMessage(prev => prev ? null : prev); // clear toast after 2s if not overwritten
            }, 2000);
            return;
          } else {
            if (modeRef.current === 'SALE') {
              playErrorBeep();
              setToastMessage(`❌ Товар не найден в базе! Примите на склад.`);
              setTimeout(() => {
                setToastMessage(prev => prev ? null : prev);
              }, 3000);
              return;
            }
          }
        }
        
        setScannedCode(decodedText);
      },
      (error) => {
        // Ignored for UX, standard lib behavior
      }
    );

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, []);

  const scannedProduct = scannedCode ? products.find(p => p.id === scannedCode || p.sku === scannedCode) : null;

  useEffect(() => {
    if (scannedProduct) {
      setTransactionUnit(scannedProduct.unit || 'шт');
      setItemsPerBlock(scannedProduct.itemsPerBlock || '');
    } else {
      setItemsPerBlock('');
    }
  }, [scannedProduct]);

  useEffect(() => {
    if (scannedCode && !scannedProduct) {
      setIsFetchingInfo(true);
      fetch(`https://world.openfoodfacts.org/api/v2/product/${scannedCode}.json`)
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 1 && data.product && data.product.product_name) {
            setNewName(data.product.product_name);
          }
        })
        .catch(err => console.error("Error fetching barcode info:", err))
        .finally(() => setIsFetchingInfo(false));
    }
  }, [scannedCode, scannedProduct]);

  const handleConfirm = () => {
    if (scannedCode) {
      const parsedItemsPerBlock = itemsPerBlock ? Number(itemsPerBlock) : undefined;
      
      if (transactionUnit === 'блок' && !parsedItemsPerBlock) {
         alert('Укажите количество штук в блоке');
         return;
      }

      if (mode === 'SALE') {
        const qty = quantity * (transactionUnit === 'блок' ? (parsedItemsPerBlock || 1) : 1);
        
        if (!scannedProduct) {
          alert('Ошибка: Этого товара нет в базе и на складе! Чтобы продать данный товар, сначала примите его на склад в режиме "Приемка".');
          return;
        }

        if (scannedProduct.stock < qty) {
          alert(`Ошибка: Недостаточно товара на складе! Доступно: ${scannedProduct.stock} шт., требуется списать: ${qty} шт.`);
          return;
        }
      }
      
      if (!scannedProduct) {
        if (!newName.trim()) {
          alert('Пожалуйста, введите название товара');
          return;
        }
        onTransaction(scannedCode, mode, quantity, { name: newName, price: Number(newPrice) || 0, unit: newUnit, itemsPerBlock: parsedItemsPerBlock }, transactionUnit, parsedItemsPerBlock);
        
        if (mode === 'SALE') {
          const finalPrice = Number(newPrice) || 0;
          const finalName = newName.trim();
          const qty = quantity * (transactionUnit === 'блок' ? (parsedItemsPerBlock || 1) : 1);
          setReceiptItems(prev => {
            const existing = prev.find(item => item.id === scannedCode);
            if (existing) {
              return prev.map(item => item.id === scannedCode ? { ...item, quantity: item.quantity + qty, time: Date.now() } : item);
            } else {
              return [...prev, { id: scannedCode, name: finalName, price: finalPrice, quantity: qty, time: Date.now() }];
            }
          });
        }
      } else {
        onTransaction(scannedCode, mode, quantity, undefined, transactionUnit, parsedItemsPerBlock);

        if (mode === 'SALE') {
          const qty = quantity * (transactionUnit === 'блок' ? (parsedItemsPerBlock || 1) : 1);
          setReceiptItems(prev => {
            const existing = prev.find(item => item.id === scannedProduct.id);
            if (existing) {
              return prev.map(item => item.id === scannedProduct.id ? { ...item, quantity: item.quantity + qty, time: Date.now() } : item);
            } else {
              return [...prev, { id: scannedProduct.id, name: scannedProduct.name, price: scannedProduct.price, quantity: qty, time: Date.now() }];
            }
          });
        }
      }
      setScannedCode(null);
      setQuantity(1);
      setNewName('');
      setNewPrice('');
      setNewUnit('шт');
      setItemsPerBlock('');
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedCode(manualCode.trim());
      setIsManualEntry(false);
      setManualCode('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 max-w-2xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6 flex space-x-2 bg-gray-50/50 dark:bg-zinc-900 p-1 rounded-xl border border-gray-100 dark:border-zinc-800">
        <button
          onClick={() => setMode('SALE')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
            mode === 'SALE' ? "bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700 text-black dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >{t('Продажа')}</button>
        <button
          onClick={() => setMode('RESTOCK')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
            mode === 'RESTOCK' ? "bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700 text-black dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {t('Приемка')}
        </button>
      </div>

      <div className={cn("flex-1 flex flex-col items-center relative", (scannedCode || isManualEntry) && "hidden")}>
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-4 duration-300">
            {toastMessage}
          </div>
        )}

        <div className="w-full mb-4 flex justify-between items-center px-1">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={fastScan} 
              onChange={(e) => setFastScan(e.target.checked)} 
              className="w-4 h-4 rounded text-black dark:text-white focus:ring-black dark:focus:ring-white border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800" 
            />
            <span>{t("Непрерывное сканирование (1 шт)")}</span>
          </label>
        </div>

        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
          <div id="reader" className="w-full scanner-container"></div>
        </div>
        
        <button 
          onClick={() => setIsManualEntry(true)}
          className="mt-6 flex items-center text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <Search className="w-4 h-4 mr-2" />
          {t("Ввести штрихкод вручную")}
        </button>
      </div>

      {isManualEntry && !scannedCode && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("Поиск товара")}</h2>
            <button onClick={() => setIsManualEntry(false)} className="p-2 -mr-2 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleManualSearch} className="flex space-x-2">
            <input 
              autoFocus
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder={t("Штрихкод или SKU")}
              className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
            />
            <button type="submit" className="px-6 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium">ОК</button>
          </form>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3 uppercase tracking-wider font-semibold">{t("Все товары в базе")}</p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setScannedCode(p.id)}
                  className="w-full text-left p-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 rounded-xl flex justify-between items-center transition-colors group"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white">{p.name}</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">{p.sku} • {p.id}</div>
                  </div>
                  <div className="text-sm font-medium bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-lg">
                    {p.stock} {p.unit}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {scannedCode && (
        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-300">
          <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {mode === 'SALE' ? t('Продажа') : t('Приемка на склад')}
                </p>
                <h2 className="text-2xl font-bold font-sans text-gray-900 dark:text-gray-100">
                  {scannedProduct ? scannedProduct.name : 'Неизвестный товар'}
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 mt-1 font-mono text-sm">{scannedCode}</p>
              </div>
              <button onClick={() => setScannedCode(null)} className="p-2 -mr-2 -mt-2 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {scannedProduct && (
              <div className="flex items-center space-x-2 mb-8 bg-gray-50 dark:bg-zinc-800 w-fit px-3 py-1.5 rounded-lg border border-gray-100 dark:border-zinc-700">
                <Package className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('В наличии')}: {scannedProduct.stock} {scannedProduct.unit}</span>
              </div>
            )}

            {!scannedProduct && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl mb-6 text-sm text-orange-800 dark:text-orange-400 flex flex-col space-y-3">
                <p>{t('Этот штрихкод отсутствует в базе. Будет создана новая запись.')}</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("Название товара")}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
                  />
                  {isFetchingInfo && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-500 dark:text-orange-400 animate-pulse">
                      Поиск...
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder={t("Цена (RUB)")}
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-zinc-500"
                  />
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value as 'шт'|'блок')}
                    className="w-1/2 px-3 py-2 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-gray-900 dark:text-gray-100"
                  >
                    <option value="шт">{t("Штука")}</option>
                    <option value="блок">{t("Блок")}</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("Единица измерения")}</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setTransactionUnit('шт')}
                  className={cn(
                    "py-3 border rounded-xl font-medium transition-colors text-center cursor-pointer",
                    transactionUnit === 'шт' ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {t("Штуки")}
                </button>
                <button
                  onClick={() => setTransactionUnit('блок')}
                  className={cn(
                    "py-3 border rounded-xl font-medium transition-colors text-center cursor-pointer",
                    transactionUnit === 'блок' ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {t("Блоки")}
                </button>
              </div>
              
              {(transactionUnit === 'блок' || mode === 'RESTOCK') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("Штук в 1 блоке")}</label>
                  <input 
                    type="number" 
                    value={itemsPerBlock}
                    onChange={e => setItemsPerBlock(parseInt(e.target.value) || '')}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100"
                    placeholder={t("Например: 12")}
                  />
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t("Количество")} ({t(transactionUnit)})</label>
              <div className="flex items-center justify-center space-x-6">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-14 h-14 flex items-center justify-center border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 transition-colors shrink-0 shadow-sm"
                >
                  <Minus className="w-6 h-6 text-gray-600 dark:text-zinc-400" />
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center text-5xl font-bold border-none focus:outline-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 bg-transparent"
                />
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-14 h-14 flex items-center justify-center border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 transition-colors shrink-0 shadow-sm"
                >
                  <Plus className="w-6 h-6 text-gray-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>

            <button 
              onClick={handleConfirm}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium text-lg hover:bg-gray-900 dark:hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              <Check className="w-5 h-5 mr-2" />
              {t('Подтвердить')} {mode === 'SALE' ? t('продажу') : t('приемку')}
            </button>
          </div>
        </div>
      )}

      {receiptItems.length > 0 && !showReceipt && mode === 'SALE' && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => setShowReceipt(true)}
            className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-medium shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-transform active:scale-95 animate-in slide-in-from-bottom-4"
          >
            <Receipt className="w-5 h-5" />
            <span>{t('Вывести чек')} ({receiptItems.length})</span>
            <span className="bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded-full text-xs">
              {formatCurrency(receiptItems.reduce((acc, item) => acc + item.price * item.quantity, 0))}
            </span>
          </button>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center text-center relative">
              <div className="w-full">
                <Receipt className="w-8 h-8 mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('Чек продажи')}</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{new Date().toLocaleString()}</p>
              </div>
              <button onClick={() => setShowReceipt(false)} className="absolute right-4 top-4 p-2 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-gray-100 dark:border-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {receiptItems.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="pr-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-gray-500 dark:text-zinc-400">{item.quantity} шт x {formatCurrency(item.price)}</p>
                  </div>
                  <div className="font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex flex-col gap-4">
              <div className="flex space-x-2">
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100"
                >
                  <option value="none">{t("Без скидки")}</option>
                  <option value="percent">{t("Скидка (%)")}</option>
                  <option value="amount">{t("Скидка ({0})", language === "ru" ? "руб." : "so'm")}</option>
                </select>
                {discountType !== 'none' && (
                  <input 
                    type="number" 
                    value={discountValue || ''} 
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="flex-1 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100"
                    placeholder={t("Размер скидки...")}
                    min="0"
                  />
                )}
              </div>
              
              <div className="flex gap-2 bg-white dark:bg-zinc-950 p-1 rounded-xl border border-gray-200 dark:border-zinc-800">
                {(['Наличные', 'Карта', 'QR/Перевод'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      paymentMethod === method ? "bg-black dark:bg-white text-white dark:text-black shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-xl font-bold mt-2 text-gray-900 dark:text-gray-100">
                <span>{t('Итого:')}</span>
                <span>
                  {(() => {
                    const subtotal = receiptItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : (discountType === 'amount' ? discountValue : 0);
                    const finalTotal = Math.max(0, subtotal - discountAmount);
                    return formatCurrency(finalTotal);
                  })()}
                </span>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const printContent = document.createElement('div');
                    const itemsHtml = receiptItems.map(item => `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div>${item.name}<br/><small>${item.quantity} x ${item.price}</small></div>
                        <div>${item.price * item.quantity}</div>
                      </div>
                    `).join('');
                    
                    const subtotal = receiptItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : (discountType === 'amount' ? discountValue : 0);
                    const finalTotal = Math.max(0, subtotal - discountAmount);

                    const discountHtml = discountAmount > 0 ? `
                      <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px;">
                        <span>{t("Скидка")}:</span>
                        <span>-${discountAmount}</span>
                      </div>
                    ` : '';

                    printContent.innerHTML = `
                      <div style="font-family: monospace; width: 300px; padding: 20px; color: black; background: white;">
                        <h2 style="text-align: center; margin-bottom: 20px;">${t('ТОВАРНЫЙ ЧЕК')}</h2>
                        <div style="margin-bottom: 20px; font-size: 12px; text-align: center;">${new Date().toLocaleString()}</div>
                        <div style="border-bottom: 1px dashed #000; margin-bottom: 15px;"></div>
                        ${itemsHtml}
                        <div style="border-bottom: 1px dashed #000; margin-bottom: 15px; margin-top: 15px;"></div>
                        ${discountHtml}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: ${discountAmount > 0 ? '10px' : '0'};">
                          <span>{t('Итого:')}</span>
                          <span>${finalTotal}</span>
                        </div>
                        <div style="margin-top: 15px; font-size: 13px;">
                          ${t('Способ оплаты:')} <span style="float: right;">${t(paymentMethod)}</span>
                        </div>
                        <div style="text-align: center; margin-top: 30px; font-size: 12px;">${t('Спасибо за покупку!')}</div>
                      </div>
                    `;
                    
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`<html><head><title>${t('Печать чека')}</title></head><body style="margin: 0; padding: 0;">`);
                      printWindow.document.write(printContent.innerHTML);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }}
                  className="w-full py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-black dark:text-white rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("Распечатать")}
                </button>
                <button 
                  onClick={() => {
                    setReceiptItems([]);
                    setShowReceipt(false);
                    setDiscountType('none');
                    setDiscountValue(0);
                    setPaymentMethod('Наличные');
                  }}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  {t("Завершить (Новый чек)")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
