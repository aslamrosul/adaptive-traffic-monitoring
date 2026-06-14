"use client";

import Link from "next/link";
import { useTranslation } from "@/providers/TranslationProvider";

export default function LandingFooter() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-slate-50 border-t border-slate-200 w-full py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-12 max-w-7xl mx-auto">
        <div>
          <Link href="/" className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              traffic
            </span>
            {t('common.appName')}
          </Link>
          <p className="text-xs text-slate-500">
            © 2024 {t('common.appName')}. {t('common.appDescription')}.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-end gap-6 text-xs">
          <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-900 hover:underline transition-all">
            {t('help.privacyPolicy')}
          </Link>
          <Link href="/terms" className="text-slate-500 hover:text-slate-900 hover:underline transition-all">
            {t('help.termsConditions')}
          </Link>
          <Link href="/help" className="text-slate-500 hover:text-slate-900 hover:underline transition-all">
            {t('help.title')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
