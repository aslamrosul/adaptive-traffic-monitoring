'use client';

import { useTranslation } from '@/providers/TranslationProvider';

/**
 * Simple translation hook
 * Usage: const t = useT();
 * Then: t('common.save') or t('dashboard.title')
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}

/**
 * Get current locale
 * Usage: const locale = useLocale();
 */
export function useLocale() {
  const { locale } = useTranslation();
  return locale;
}

/**
 * Change locale
 * Usage: const changeLocale = useChangeLocale();
 * Then: changeLocale('en') or changeLocale('id')
 */
export function useChangeLocale() {
  const { setLocale } = useTranslation();
  return setLocale;
}
