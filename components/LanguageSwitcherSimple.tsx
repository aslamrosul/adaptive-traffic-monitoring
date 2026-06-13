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
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors"
      title={locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <span className="text-base">{locale === 'id' ? '🇮🇩' : '🇬🇧'}</span>
      <span>{locale === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
