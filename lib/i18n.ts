import { useTranslations } from 'next-intl';

export { useTranslations };

// Helper untuk mendapatkan translations di server components  
export { getTranslations } from 'next-intl/server';

// Locale type
export type Locale = 'en' | 'id';

// Dictionary helper for Next.js 16 native approach
export { getDictionary, hasLocale, locales, defaultLocale } from './dictionaries';
