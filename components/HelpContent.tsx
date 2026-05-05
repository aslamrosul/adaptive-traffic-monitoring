"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function HelpContent() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [faqs, setFaqs] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);

  useEffect(() => {
    fetchFaqs();
    fetchGuides();
  }, []);

  const fetchFaqs = async () => {
    try {
      setIsLoadingFaqs(true);
      const response = await fetch("/api/help/faqs");
      const result = await response.json();

      if (result.success) {
        setFaqs(result.data);
      } else {
        toast.error("Gagal memuat FAQ");
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Gagal memuat FAQ");
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  const fetchGuides = async () => {
    try {
      setIsLoadingGuides(true);
      const response = await fetch("/api/help/guides");
      const result = await response.json();

      if (result.success) {
        // Map guides to match component structure
        const mappedGuides = result.data.map((guide: any) => ({
          title: guide.title,
          description: guide.description,
          icon: guide.icon,
          color: guide.color,
        }));
        setGuides(mappedGuides);
      } else {
        toast.error("Gagal memuat panduan");
      }
    } catch (error) {
      console.error("Error fetching guides:", error);
      toast.error("Gagal memuat panduan");
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const toggleFAQ = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 lg:space-y-8 overflow-x-hidden">
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-blue-600 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-white"
      >
        <h1 className="text-xl lg:text-3xl font-bold font-headline mb-1 lg:mb-2 break-words">
          Ada yang bisa kami bantu?
        </h1>
        <p className="text-blue-100 mb-3 lg:mb-6 text-sm lg:text-base">
          Cari jawaban atau jelajahi panduan kami
        </p>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg lg:text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bantuan..."
            className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-2 lg:py-3 rounded-lg lg:rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300 outline-none text-sm lg:text-base"
          />
        </div>
      </motion.div>

      {/* Quick Guides */}
      <div className="overflow-x-hidden">
        <h2 className="text-base lg:text-xl font-bold text-slate-900 mb-3 lg:mb-4 truncate">Panduan Cepat</h2>
        {isLoadingGuides ? (
          <div className="flex items-center justify-center py-8 lg:py-12">
            <div className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {guides.map((guide, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
              >
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg ${guide.color} flex items-center justify-center mb-2 lg:mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-xl lg:text-2xl">{guide.icon}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-0.5 lg:mb-1 text-sm lg:text-base truncate">{guide.title}</h3>
                <p className="text-xs lg:text-sm text-slate-500 break-words line-clamp-2">{guide.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div className="overflow-x-hidden">
        <h2 className="text-base lg:text-xl font-bold text-slate-900 mb-3 lg:mb-4 break-words">
          Pertanyaan yang Sering Diajukan
        </h2>
        {isLoadingFaqs ? (
          <div className="flex items-center justify-center py-8 lg:py-12">
            <div className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {faqs.map((category, catIdx) => (
              <motion.div
                key={catIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.1 }}
                className="overflow-hidden"
              >
                <h3 className="font-bold text-primary mb-2 lg:mb-3 flex items-center gap-1.5 lg:gap-2 text-sm lg:text-base">
                  <span className="material-symbols-outlined text-xs lg:text-sm">folder</span>
                  <span className="truncate">{category.category}</span>
                </h3>
                <div className="space-y-1.5 lg:space-y-2">
                  {category.questions.map((faq: any, qIdx: number) => {
                    const index = `${catIdx}-${qIdx}`;
                    const isOpen = openIndex === index;
                    
                    return (
                      <div
                        key={qIdx}
                        className="bg-white rounded-lg lg:rounded-xl shadow-sm overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full px-3 lg:px-6 py-2 lg:py-4 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left"
                        >
                          <span className="font-semibold text-slate-900 text-xs lg:text-base break-words flex-1">{faq.question}</span>
                          <span
                            className={`material-symbols-outlined transition-transform text-lg lg:text-xl flex-shrink-0 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            expand_more
                          </span>
                        </button>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 lg:px-6 pb-2 lg:pb-4"
                          >
                            <p className="text-slate-600 leading-relaxed text-xs lg:text-base break-words">{faq.answer}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-center overflow-x-hidden"
      >
        <span className="material-symbols-outlined text-4xl lg:text-5xl text-primary mb-2 lg:mb-4 inline-block">
          headset_mic
        </span>
        <h3 className="text-base lg:text-xl font-bold text-slate-900 mb-1 lg:mb-2 break-words">
          Masih butuh bantuan?
        </h3>
        <p className="text-slate-600 mb-4 lg:mb-6 text-sm lg:text-base break-words">
          Tim support kami siap membantu Anda 24/7
        </p>
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 justify-center">
          <button className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-primary text-white rounded-lg lg:rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm lg:text-base">
            Chat dengan Support
          </button>
          <button className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 border border-slate-300 rounded-lg lg:rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors text-sm lg:text-base">
            Email Support
          </button>
        </div>
      </motion.div>
    </div>
  );
}
