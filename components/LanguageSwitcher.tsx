'use client';

import { useTranslation } from '@/providers/TranslationProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-600" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="text-sm bg-transparent border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="id">🇮🇩 ID</option>
        <option value="en">🇬🇧 EN</option>
      </select>
    </div>
  );
}
