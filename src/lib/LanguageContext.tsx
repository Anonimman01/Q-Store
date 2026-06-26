import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from './translations';

export type LanguageCode = 'ru' | 'uz';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  formatCurrency: (amount: number) => string;
  t: (text: string, ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('language') as LanguageCode) || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (text: string, ...args: any[]) => {
    let translated = text;
    if (language === 'uz' && translations[text]) {
      translated = translations[text];
    }
    
    // Replace arguments if any
    if (args.length > 0) {
      args.forEach((arg, index) => {
        translated = translated.replace(`{${index}}`, String(arg));
      });
    }
    return translated;
  };

  const formatCurrency = (amount: number) => {
    const formattedNum = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
      minimumFractionDigits: 0
    }).format(amount);
    
    return language === 'ru' ? `${formattedNum} руб.` : `${formattedNum} so'm`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, formatCurrency, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
