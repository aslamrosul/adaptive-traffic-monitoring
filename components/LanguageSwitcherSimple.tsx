'use client';

import { useTranslation } from '@/providers/TranslationProvider';
import { useState } from 'react';

interface LanguageSwitcherSimpleProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcherSimple({
  variant = 'dark',
}: LanguageSwitcherSimpleProps) {
  const { locale, setLocale } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const isId = locale === 'id';

  const toggleLocale = () => {
    if (isChanging) return; // Prevent double clicks
    
    setIsChanging(true);
    setLocale(isId ? 'en' : 'id');
    // setLocale will trigger page reload, no need to reset isChanging
  };

  const variantStyles =
    variant === 'light'
      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
      : 'text-white bg-white/20 backdrop-blur-sm hover:bg-white/30';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isChanging}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait ${variantStyles}`}
      title={isId ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      {isChanging ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>...</span>
        </>
      ) : (
        <>
          <img
            src={isId ? '/flags/id.png' : '/flags/gb.png'}
            alt={isId ? 'Indonesia' : 'English'}
            className="h-4 w-5 rounded-sm object-cover"
          />
          <span>{isId ? 'ID' : 'EN'}</span>
        </>
      )}
    </button>
  );
}
