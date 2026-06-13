'use client';

import { useTranslation } from '@/providers/TranslationProvider';

export default function LanguageSwitcherSimple() {
  const { locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'id' ? 'en' : 'id');
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <span className="text-base">{locale === 'id' ? '🇮🇩' : '🇬🇧'}</span>
      <span>{locale === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
