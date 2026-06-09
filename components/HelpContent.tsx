"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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

      const response = await fetch("/api/help/faqs", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setFaqs(result.data || []);
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

      const response = await fetch("/api/help/guides", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setGuides(result.data || []);
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

  const filteredGuides = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return guides;

    return guides.filter((guide: any) => {
      return (
        String(guide.title || "").toLowerCase().includes(query) ||
        String(guide.description || "").toLowerCase().includes(query)
      );
    });
  }, [guides, searchQuery]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return faqs;

    return faqs
      .map((category: any) => {
        const categoryMatch = String(category.category || "")
          .toLowerCase()
          .includes(query);

        const questions = (category.questions || []).filter((faq: any) => {
          return (
            categoryMatch ||
            String(faq.question || "").toLowerCase().includes(query) ||
            String(faq.answer || "").toLowerCase().includes(query)
          );
        });

        return {
          ...category,
          questions,
        };
      })
      .filter((category: any) => category.questions.length > 0);
  }, [faqs, searchQuery]);

  const toggleFAQ = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleChatSupport = () => {
    window.open(
      "https://wa.me/6285601534193?text=Halo%20admin%2C%20saya%20butuh%20bantuan%20terkait%20Aerial%20Command",
      "_blank",
    );
  };

  const handleEmailSupport = () => {
    window.location.href =
      "mailto:support@aerialcommand.id?subject=Bantuan%20Aerial%20Command";
  };

  return (
    <div className="space-y-4 overflow-x-hidden lg:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-br from-primary to-blue-600 p-4 text-white lg:rounded-2xl lg:p-8"
      >
        <h1 className="mb-1 break-words font-headline text-xl font-bold lg:mb-2 lg:text-3xl">
          Ada yang bisa kami bantu?
        </h1>

        <p className="mb-3 text-sm text-blue-100 lg:mb-6 lg:text-base">
          Cari jawaban, panduan penggunaan, atau hubungi support.
        </p>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 lg:left-4 lg:text-xl">
            search
          </span>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari bantuan, FAQ, MQTT, IoT, dashboard..."
            className="w-full rounded-lg bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300 lg:rounded-xl lg:py-3 lg:pl-12 lg:pr-4 lg:text-base"
          />
        </div>
      </motion.div>

      <div>
        <h2 className="mb-3 truncate text-base font-bold text-slate-900 lg:mb-4 lg:text-xl">
          Panduan Cepat
        </h2>

        {isLoadingGuides ? (
          <Loading />
        ) : filteredGuides.length === 0 ? (
          <Empty text="Panduan tidak ditemukan." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {filteredGuides.map((guide: any, idx: number) => (
              <motion.div
                key={`${guide.title}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer overflow-hidden rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md lg:rounded-xl lg:p-6"
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg lg:mb-4 lg:h-12 lg:w-12 ${
                    guide.color || "bg-blue-100 text-blue-600"
                  } transition-transform group-hover:scale-110`}
                >
                  <span className="material-symbols-outlined text-xl lg:text-2xl">
                    {guide.icon || "article"}
                  </span>
                </div>

                <h3 className="mb-0.5 truncate text-sm font-bold text-slate-900 lg:mb-1 lg:text-base">
                  {guide.title}
                </h3>

                <p className="line-clamp-2 break-words text-xs text-slate-500 lg:text-sm">
                  {guide.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 break-words text-base font-bold text-slate-900 lg:mb-4 lg:text-xl">
          Pertanyaan yang Sering Diajukan
        </h2>

        {isLoadingFaqs ? (
          <Loading />
        ) : filteredFaqs.length === 0 ? (
          <Empty text="FAQ tidak ditemukan." />
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {filteredFaqs.map((category: any, catIdx: number) => (
              <motion.div
                key={`${category.category}-${catIdx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.05 }}
                className="overflow-hidden"
              >
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-primary lg:mb-3 lg:gap-2 lg:text-base">
                  <span className="material-symbols-outlined text-xs lg:text-sm">
                    folder
                  </span>
                  <span className="truncate">{category.category}</span>
                </h3>

                <div className="space-y-1.5 lg:space-y-2">
                  {(category.questions || []).map((faq: any, qIdx: number) => {
                    const index = `${catIdx}-${qIdx}`;
                    const isOpen = openIndex === index;

                    return (
                      <div
                        key={`${faq.question}-${qIdx}`}
                        className="overflow-hidden rounded-lg bg-white shadow-sm lg:rounded-xl"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFAQ(index)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 lg:px-6 lg:py-4"
                        >
                          <span className="flex-1 break-words text-xs font-semibold text-slate-900 lg:text-base">
                            {faq.question}
                          </span>

                          <span
                            className={`material-symbols-outlined flex-shrink-0 text-lg transition-transform lg:text-xl ${
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
                            className="px-3 pb-2 lg:px-6 lg:pb-4"
                          >
                            <p className="break-words text-xs leading-relaxed text-slate-600 lg:text-base">
                              {faq.answer}
                            </p>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-x-hidden rounded-xl bg-slate-50 p-4 text-center lg:rounded-2xl lg:p-8"
      >
        <span className="material-symbols-outlined mb-2 inline-block text-4xl text-primary lg:mb-4 lg:text-5xl">
          headset_mic
        </span>

        <h3 className="mb-1 break-words text-base font-bold text-slate-900 lg:mb-2 lg:text-xl">
          Masih butuh bantuan?
        </h3>

        <p className="mb-4 break-words text-sm text-slate-600 lg:mb-6 lg:text-base">
          Hubungi support untuk masalah login, MQTT, IoT, atau dashboard.
        </p>

        <div className="flex flex-col justify-center gap-2 sm:flex-row lg:gap-4">
          <button
            type="button"
            onClick={handleChatSupport}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto lg:rounded-xl lg:px-6 lg:py-3 lg:text-base"
          >
            Chat dengan Support
          </button>

          <button
            type="button"
            onClick={handleEmailSupport}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white sm:w-auto lg:rounded-xl lg:px-6 lg:py-3 lg:text-base"
          >
            Email Support
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-8 lg:py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent lg:h-8 lg:w-8" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-white p-8 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}