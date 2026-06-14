"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "@/providers/TranslationProvider";
import LanguageSwitcherSimple from "@/components/LanguageSwitcherSimple";

export default function HelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: t('pages.helpCenter.categories.all'), icon: "apps" },
    { id: "getting-started", name: t('pages.helpCenter.categories.gettingStarted'), icon: "rocket_launch" },
    { id: "features", name: t('pages.helpCenter.categories.features'), icon: "star" },
    { id: "troubleshooting", name: t('pages.helpCenter.categories.troubleshooting'), icon: "build" },
    { id: "account", name: t('pages.helpCenter.categories.account'), icon: "person" },
  ];

  const faqs = [
    {
      category: "getting-started",
      question: t('pages.helpCenter.faqs.whatIsAstraea.question'),
      answer: t('pages.helpCenter.faqs.whatIsAstraea.answer')
    },
    {
      category: "getting-started",
      question: t('pages.helpCenter.faqs.howToRegister.question'),
      answer: t('pages.helpCenter.faqs.howToRegister.answer')
    },
    {
      category: "features",
      question: t('pages.helpCenter.faqs.mainFeatures.question'),
      answer: t('pages.helpCenter.faqs.mainFeatures.answer')
    },
    {
      category: "features",
      question: t('pages.helpCenter.faqs.accessDashboard.question'),
      answer: t('pages.helpCenter.faqs.accessDashboard.answer')
    },
    {
      category: "features",
      question: t('pages.helpCenter.faqs.realTimeMonitoring.question'),
      answer: t('pages.helpCenter.faqs.realTimeMonitoring.answer')
    },
    {
      category: "troubleshooting",
      question: t('pages.helpCenter.faqs.cannotLogin.question'),
      answer: t('pages.helpCenter.faqs.cannotLogin.answer')
    },
    {
      category: "troubleshooting",
      question: t('pages.helpCenter.faqs.dataNotUpdating.question'),
      answer: t('pages.helpCenter.faqs.dataNotUpdating.answer')
    },
    {
      category: "troubleshooting",
      question: t('pages.helpCenter.faqs.deviceNotDetected.question'),
      answer: t('pages.helpCenter.faqs.deviceNotDetected.answer')
    },
    {
      category: "account",
      question: t('pages.helpCenter.faqs.changeProfile.question'),
      answer: t('pages.helpCenter.faqs.changeProfile.answer')
    },
    {
      category: "account",
      question: t('pages.helpCenter.faqs.changePassword.question'),
      answer: t('pages.helpCenter.faqs.changePassword.answer')
    },
    {
      category: "account",
      question: t('pages.helpCenter.faqs.roleDifference.question'),
      answer: t('pages.helpCenter.faqs.roleDifference.answer')
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const guides = [
    {
      title: t('pages.helpCenter.guides.gettingStarted.title'),
      description: t('pages.helpCenter.guides.gettingStarted.description'),
      icon: "menu_book",
      color: "blue",
      items: t('pages.helpCenter.guides.gettingStarted.items') as string[]
    },
    {
      title: t('pages.helpCenter.guides.trafficManagement.title'),
      description: t('pages.helpCenter.guides.trafficManagement.description'),
      icon: "traffic",
      color: "green",
      items: t('pages.helpCenter.guides.trafficManagement.items') as string[]
    },
    {
      title: t('pages.helpCenter.guides.iotConfig.title'),
      description: t('pages.helpCenter.guides.iotConfig.description'),
      icon: "settings_input_antenna",
      color: "purple",
      items: t('pages.helpCenter.guides.iotConfig.items') as string[]
    },
    {
      title: t('pages.helpCenter.guides.reports.title'),
      description: t('pages.helpCenter.guides.reports.description'),
      icon: "analytics",
      color: "orange",
      items: t('pages.helpCenter.guides.reports.items') as string[]
    },
  ];

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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="material-symbols-outlined text-6xl mb-4">help_center</span>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {t('pages.helpCenter.title')}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {t('pages.helpCenter.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t('pages.helpCenter.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Quick Guides */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {t('pages.helpCenter.quickGuides')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guides.map((guide, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-lg bg-${guide.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined text-${guide.color}-600 text-2xl`}>
                    {guide.icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{guide.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{guide.description}</p>
                <ul className="space-y-1">
                  {guide.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="text-blue-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {t('pages.helpCenter.faq')}
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${
                  activeCategory === category.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.details
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden group"
                >
                  <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-900 flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-600">help</span>
                      {faq.question}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <div className="px-6 pb-4 pt-2 text-slate-700 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                </motion.details>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                <p className="text-slate-500 text-lg">
                  {t('pages.helpCenter.noResults')} "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Contact Support */}
        <section className="mt-16">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 lg:p-12 text-white text-center">
            <span className="material-symbols-outlined text-5xl mb-4">contact_support</span>
            <h2 className="text-3xl font-bold mb-4">{t('pages.helpCenter.contactSupport.title')}</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {t('pages.helpCenter.contactSupport.description')}
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <span className="material-symbols-outlined text-3xl mb-3">email</span>
                <h3 className="font-bold mb-2">{t('pages.helpCenter.contactSupport.email')}</h3>
                <p className="text-sm text-blue-100">{t('pages.helpCenter.contactSupport.emailValue')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <span className="material-symbols-outlined text-3xl mb-3">phone</span>
                <h3 className="font-bold mb-2">{t('pages.helpCenter.contactSupport.phone')}</h3>
                <p className="text-sm text-blue-100">{t('pages.helpCenter.contactSupport.phoneValue')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <span className="material-symbols-outlined text-3xl mb-3">chat</span>
                <h3 className="font-bold mb-2">{t('pages.helpCenter.contactSupport.liveChat')}</h3>
                <p className="text-sm text-blue-100">{t('pages.helpCenter.contactSupport.liveChatValue')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            <span className="material-symbols-outlined">home</span>
            <span>{t('pages.helpCenter.backToHome')}</span>
          </Link>
        </div>
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
