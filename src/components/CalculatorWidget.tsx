import React, { useState, useEffect, useRef } from 'react';
import { Calculator as CalcIcon, X, Delete } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface CalculatorWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function CalculatorWidget({ isOpen, onClose, onOpen }: CalculatorWidgetProps) {
  const { t } = useLanguage();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);
  
  const handleNum = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOp = (op: string) => {
    setEquation(equation + display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    try {
      // safe eval alternative for simple calculator
      const calcStr = (equation + display).replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + calcStr)();
      
      const formattedResult = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(4)).toString();
      setDisplay(formattedResult);
      setEquation('');
      setIsNewNumber(true);
    } catch {
      setDisplay('Error');
      setEquation('');
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    if (isNewNumber) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onOpen}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-transform active:scale-95 z-50"
        title={t("Калькулятор")}
      >
        <CalcIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-72 bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
          <CalcIcon className="w-4 h-4" />
          <span className="font-semibold text-sm">{t("Калькулятор")}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 mb-4 text-right">
          <div className="text-gray-400 dark:text-zinc-500 h-5 text-sm truncate">{equation}</div>
          <div className="text-3xl font-mono tracking-tight font-medium overflow-hidden text-ellipsis text-gray-900 dark:text-gray-100">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={handleClear} className="col-span-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">AC</button>
          <button onClick={handleDelete} className="py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            <Delete className="w-4 h-4" />
          </button>
          <button onClick={() => handleOp('/')} className="py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">÷</button>

          <button onClick={() => handleNum('7')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">7</button>
          <button onClick={() => handleNum('8')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">8</button>
          <button onClick={() => handleNum('9')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">9</button>
          <button onClick={() => handleOp('*')} className="py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">×</button>

          <button onClick={() => handleNum('4')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">4</button>
          <button onClick={() => handleNum('5')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">5</button>
          <button onClick={() => handleNum('6')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">6</button>
          <button onClick={() => handleOp('-')} className="py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">-</button>

          <button onClick={() => handleNum('1')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">1</button>
          <button onClick={() => handleNum('2')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">2</button>
          <button onClick={() => handleNum('3')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">3</button>
          <button onClick={() => handleOp('+')} className="py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">+</button>

          <button onClick={() => handleNum('0')} className="col-span-2 py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">0</button>
          <button onClick={() => handleNum('.')} className="py-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 font-mono text-lg transition-colors">.</button>
          <button onClick={handleEqual} className="py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">=</button>
        </div>
      </div>
    </div>
  );
}
