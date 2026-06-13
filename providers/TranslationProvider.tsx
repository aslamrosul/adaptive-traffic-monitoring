'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Messages = Record<string, any>;

interface TranslationContextType {
  messages: Messages | null;
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>('id');
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'id';
    
    setLocaleState(savedLocale);
  }, []);

  useEffect(() => {
    import(`@/messages/${locale}.json`)
      .then((module) => setMessages(module.default))
      .catch((error) => console.error('Failed to load translations:', error));
  }, [locale]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
  };

  const t = (key: string): string => {
    if (!messages) return key;

    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ messages, locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
