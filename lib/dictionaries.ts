import 'server-only';

const dictionaries = {
  en: () => import('@/messages/en.json').then((module) => module.default),
  id: () => import('@/messages/id.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export const locales: Locale[] = ['en', 'id'];
export const defaultLocale: Locale = 'id';
