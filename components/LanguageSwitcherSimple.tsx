'use client';

import { useTranslation } from '@/providers/TranslationProvider';

interface LanguageSwitcherSimpleProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcherSimple({
  variant = 'dark',
}: LanguageSwitcherSimpleProps) {
  const { locale, setLocale } = useTranslation();

  const isId = locale === 'id';

  const toggleLocale = () => {
    setLocale(isId ? 'en' : 'id');
  };

  const variantStyles =
    variant === 'light'
      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
      : 'text-white bg-white/20 backdrop-blur-sm hover:bg-white/30';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${variantStyles}`}
      title={isId ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <img
        src={isId ? '/flags/id.png' : '/flags/gb.png'}
        alt={isId ? 'Indonesia' : 'English'}
        className="h-4 w-5 rounded-sm object-cover"
      />

      <span>{isId ? 'ID' : 'EN'}</span>
    </button>
  );
}