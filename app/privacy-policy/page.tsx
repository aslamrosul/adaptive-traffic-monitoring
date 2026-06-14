"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/providers/TranslationProvider";
import LanguageSwitcherSimple from "@/components/LanguageSwitcherSimple";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  // Helper function to safely get array from translation
  const getTranslationArray = (key: string): string[] => {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900 flex items-center gap-2">
            <Image src="/logo.png" alt={t('common.appName')} width={36} height={36} />
            <span>{t('common.appName')}</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcherSimple variant="light" />
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>{t('common.back')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {t('pages.privacyPolicy.title')}
            </h1>
            <p className="text-slate-600 text-lg">
              {t('pages.privacyPolicy.lastUpdated')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 lg:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">policy</span>
                {t('pages.privacyPolicy.introduction.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.privacyPolicy.introduction.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">data_usage</span>
                {t('pages.privacyPolicy.dataCollection.title')}
              </h2>
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">1. {t('pages.privacyPolicy.dataCollection.accountInfo')}</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {getTranslationArray('pages.privacyPolicy.dataCollection.accountItems').map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">2. {t('pages.privacyPolicy.dataCollection.usageData')}</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {getTranslationArray('pages.privacyPolicy.dataCollection.usageItems').map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">3. {t('pages.privacyPolicy.dataCollection.trafficData')}</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {getTranslationArray('pages.privacyPolicy.dataCollection.trafficItems').map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">check_circle</span>
                {t('pages.privacyPolicy.dataUsage.title')}
              </h2>
              <ul className="space-y-3 text-slate-700">
                {getTranslationArray('pages.privacyPolicy.dataUsage.items').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600 flex-shrink-0">done</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">shield</span>
                {t('pages.privacyPolicy.dataSecurity.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                {t('pages.privacyPolicy.dataSecurity.description')}
              </p>
              <ul className="space-y-2 text-slate-700 ml-4">
                {getTranslationArray('pages.privacyPolicy.dataSecurity.items').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">share</span>
                {t('pages.privacyPolicy.dataSharing.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.privacyPolicy.dataSharing.description')}
              </p>
              <ul className="space-y-2 text-slate-700 ml-4 mt-3">
                {getTranslationArray('pages.privacyPolicy.dataSharing.items').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">person_check</span>
                {t('pages.privacyPolicy.userRights.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                {t('pages.privacyPolicy.userRights.description')}
              </p>
              <ul className="space-y-2 text-slate-700 ml-4">
                {getTranslationArray('pages.privacyPolicy.userRights.items').map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">cookie</span>
                {t('pages.privacyPolicy.cookies.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.privacyPolicy.cookies.description')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">update</span>
                {t('pages.privacyPolicy.policyChanges.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.privacyPolicy.policyChanges.description')}
              </p>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">contact_support</span>
                {t('pages.privacyPolicy.contact.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                {t('pages.privacyPolicy.contact.description')}
              </p>
              <div className="space-y-2 text-slate-700">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">email</span>
                  <span>{t('pages.privacyPolicy.contact.email')}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">phone</span>
                  <span>{t('pages.privacyPolicy.contact.phone')}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">location_on</span>
                  <span>{t('pages.privacyPolicy.contact.address')}</span>
                </p>
              </div>
            </section>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              <span className="material-symbols-outlined">home</span>
              <span>{t('pages.privacyPolicy.backToHome')}</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">
          <p>© 2024 {t('common.appName')}. {t('common.appDescription')}.</p>
        </div>
      </footer>
    </div>
  );
}
