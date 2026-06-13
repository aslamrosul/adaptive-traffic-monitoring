'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Messages = Record<string, any>;

export function useClientTranslations() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Messages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const locale = pathname.startsWith('/en') ? 'en' : 'id';

  useEffect(() => {
    setIsLoading(true);
    import(`@/messages/${locale}.json`)
      .then((module) => {
        setMessages(module.default);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load translations:', error);
        setIsLoading(false);
      });
  }, [locale]);

  return { messages, locale, isLoading };
}
