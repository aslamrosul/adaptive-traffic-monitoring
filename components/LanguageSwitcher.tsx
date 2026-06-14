'use client';

import { useState } from 'react';
import { useTranslation } from '@/providers/TranslationProvider';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  {
    code: 'id',
    label: 'ID',
    name: 'Indonesia',
    flag: '/flags/id.png',
  },
  {
    code: 'en',
    label: 'EN',
    name: 'English',
    flag: '/flags/gb.png',
  },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage =
    languages.find((language) => language.code === locale) || languages[0];

  const handleChangeLanguage = (code: string) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-600" />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <img
          src={currentLanguage.flag}
          alt={currentLanguage.name}
          className="h-4 w-5 rounded-sm object-cover"
        />

        <span>{currentLanguage.label}</span>

        <ChevronDown className="h-3 w-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => handleChangeLanguage(language.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 ${
                locale === language.code
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : 'text-slate-700'
              }`}
            >
              <img
                src={language.flag}
                alt={language.name}
                className="h-4 w-5 rounded-sm object-cover"
              />

              <span>{language.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}