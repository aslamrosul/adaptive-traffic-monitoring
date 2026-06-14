"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/providers/TranslationProvider";
import LanguageSwitcherSimple from "@/components/LanguageSwitcherSimple";

export default function TermsPage() {
  const { t } = useTranslation();

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
              {t('pages.terms.title')}
            </h1>
            <p className="text-slate-600 text-lg">
              {t('pages.terms.lastUpdated')}
            </p>
          </div>

          {/* Content Sections */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 lg:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">description</span>
                {t('pages.terms.acceptance.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.terms.acceptance.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">description</span>
                {t('pages.terms.definitions.title')}
              </h2>
              <div className="space-y-3 text-slate-700">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">{t('pages.terms.definitions.service')}</p>
                  <p className="text-sm">{t('pages.terms.definitions.serviceDesc')}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">{t('pages.terms.definitions.user')}</p>
                  <p className="text-sm">{t('pages.terms.definitions.userDesc')}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">{t('pages.terms.definitions.content')}</p>
                  <p className="text-sm">{t('pages.terms.definitions.contentDesc')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">account_circle</span>
                {t('pages.terms.userAccount.title')}
              </h2>
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('pages.terms.userAccount.registration')}</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('pages.terms.userAccount.registrationItems') as string[]).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('pages.terms.userAccount.security')}</h3>
                  <p>{t('pages.terms.userAccount.securityDesc')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">gavel</span>
                {t('pages.terms.serviceUsage.title')}
              </h2>
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-600">{t('pages.terms.serviceUsage.permitted')}</h3>
                  <ul className="space-y-2">
                    {(t('pages.terms.serviceUsage.permittedItems') as string[]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-600 text-sm flex-shrink-0">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-600">{t('pages.terms.serviceUsage.prohibited')}</h3>
                  <ul className="space-y-2">
                    {(t('pages.terms.serviceUsage.prohibitedItems') as string[]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-600 text-sm flex-shrink-0">cancel</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">copyright</span>
                {t('pages.terms.intellectualProperty.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                {t('pages.terms.intellectualProperty.description')}
              </p>
              <ul className="space-y-2 text-slate-700 ml-4">
                {(t('pages.terms.intellectualProperty.items') as string[]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">cloud_off</span>
                {t('pages.terms.serviceAvailability.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.terms.serviceAvailability.description')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">verified_user</span>
                {t('pages.terms.liability.title')}
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-3 text-slate-700">
                <p className="font-semibold text-yellow-900">{t('pages.terms.liability.warning')}</p>
                <ul className="space-y-2 text-sm">
                  {(t('pages.terms.liability.items') as string[]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-600">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">cancel</span>
                {t('pages.terms.termination.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                {t('pages.terms.termination.description')}
              </p>
              <ul className="space-y-2 text-slate-700 ml-4">
                {(t('pages.terms.termination.items') as string[]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">update</span>
                {t('pages.terms.changes.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.terms.changes.description')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">balance</span>
                {t('pages.terms.law.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {t('pages.terms.law.description')}
              </p>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">contact_support</span>
                {t('pages.terms.contact.title')}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                {t('pages.terms.contact.description')}
              </p>
              <div className="space-y-2 text-slate-700">
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">email</span>
                  <span>{t('pages.terms.contact.email')}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">phone</span>
                  <span>{t('pages.terms.contact.phone')}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">location_on</span>
                  <span>{t('pages.terms.contact.address')}</span>
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
              <span>{t('pages.terms.backToHome')}</span>
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
