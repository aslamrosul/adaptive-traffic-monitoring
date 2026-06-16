'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

type Messages = Record<string, any>;

interface TranslationContextType {
  messages: Messages | null;
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Preload messages to avoid dynamic imports
const messagesCache: Record<string, Messages> = {};

export function TranslationProvider({ children }: { children: ReactNode }) {
  // Read locale from cookie immediately during initialization
  const getInitialLocale = () => {
    if (typeof window === 'undefined') return 'id';
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    return savedLocale || 'id';
  };

  const [locale, setLocaleState] = useState<string>(getInitialLocale);
  const [messages, setMessages] = useState<Messages | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages when locale changes
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      
      // Check cache first
      if (messagesCache[locale]) {
        setMessages(messagesCache[locale]);
        setIsLoading(false);
        return;
      }

      try {
        const module = await import(`@/messages/${locale}.json`);
        messagesCache[locale] = module.default;
        setMessages(module.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to ID if failed
        if (locale !== 'id') {
          try {
            const fallback = await import(`@/messages/id.json`);
            messagesCache['id'] = fallback.default;
            setMessages(fallback.default);
          } catch (fallbackError) {
            console.error('Failed to load fallback translations:', fallbackError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadMessages();
  }, [locale]);

  const setLocale = useCallback((newLocale: string) => {
    if (newLocale === locale) return; // Prevent unnecessary updates
    
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Force reload page to ensure all components update
    // This prevents "stuck" translations
    window.location.reload();
  }, [locale]);

  const t = useCallback((key: string): string => {
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
  }, [messages]);

  const contextValue = useMemo(() => ({
    messages,
    locale,
    setLocale,
    t,
    isLoading
  }), [messages, locale, setLocale, t, isLoading]);

  return (
    <TranslationContext.Provider value={contextValue}>
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
