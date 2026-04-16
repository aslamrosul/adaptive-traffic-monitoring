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
    <div className="space-y-8">
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold font-headline mb-2">
          Ada yang bisa kami bantu?
        </h1>
        <p className="text-blue-100 mb-6">
          Cari jawaban atau jelajahi panduan kami
        </p>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bantuan..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>
      </motion.div>

      {/* Quick Guides */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Panduan Cepat</h2>
        {isLoadingGuides ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {guides.map((guide, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-lg ${guide.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{guide.icon}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{guide.title}</h3>
                <p className="text-sm text-slate-500">{guide.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Pertanyaan yang Sering Diajukan
        </h2>
        {isLoadingFaqs ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {faqs.map((category, catIdx) => (
              <motion.div
                key={catIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.1 }}
              >
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">folder</span>
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.questions.map((faq: any, qIdx: number) => {
                    const index = `${catIdx}-${qIdx}`;
                    const isOpen = openIndex === index;
                    
                    return (
                      <div
                        key={qIdx}
                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                        >
                          <span className="font-semibold text-slate-900">{faq.question}</span>
                          <span
                            className={`material-symbols-outlined transition-transform ${
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
                            className="px-6 pb-4"
                          >
                            <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
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
        className="bg-slate-50 rounded-2xl p-8 text-center"
      >
        <span className="material-symbols-outlined text-5xl text-primary mb-4 inline-block">
          headset_mic
        </span>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Masih butuh bantuan?
        </h3>
        <p className="text-slate-600 mb-6">
          Tim support kami siap membantu Anda 24/7
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Chat dengan Support
          </button>
          <button className="px-6 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors">
            Email Support
          </button>
        </div>
      </motion.div>
    </div>
  );
}
