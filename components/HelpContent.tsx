"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    category: "Umum",
    questions: [
      {
        q: "Apa itu Aerial Command?",
        a: "Aerial Command adalah sistem manajemen lalu lintas cerdas yang menggunakan IoT dan AI untuk mengoptimalkan aliran kendaraan di persimpangan.",
      },
      {
        q: "Bagaimana cara mengakses dashboard?",
        a: "Login menggunakan kredensial Anda, kemudian Anda akan diarahkan ke dashboard utama yang menampilkan statistik real-time.",
      },
    ],
  },
  {
    category: "Fitur",
    questions: [
      {
        q: "Bagaimana cara melihat detail simpangan?",
        a: "Klik pada card simpangan di dashboard atau gunakan search bar untuk mencari simpangan tertentu.",
      },
      {
        q: "Apa itu Manual Override?",
        a: "Manual Override memungkinkan operator mengambil alih kontrol lampu lalu lintas secara manual saat kondisi darurat.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        q: "Sensor IoT tidak terhubung, apa yang harus dilakukan?",
        a: "Periksa koneksi internet, restart perangkat IoT, dan pastikan firmware sudah update. Jika masalah berlanjut, hubungi tim teknis.",
      },
      {
        q: "Data tidak update real-time?",
        a: "Refresh halaman browser Anda. Jika masalah berlanjut, periksa pengaturan interval pengambilan data di menu Pengaturan > IoT & Sensor.",
      },
    ],
  },
];

const guides = [
  {
    title: "Panduan Memulai",
    description: "Pelajari dasar-dasar menggunakan Aerial Command",
    icon: "rocket_launch",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Video Tutorial",
    description: "Tonton video panduan lengkap",
    icon: "play_circle",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "API Documentation",
    description: "Dokumentasi lengkap untuk developer",
    icon: "code",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Hubungi Support",
    description: "Tim kami siap membantu 24/7",
    icon: "support_agent",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function HelpContent() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Pertanyaan yang Sering Diajukan
        </h2>
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
                {category.questions.map((faq, qIdx) => {
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
                        <span className="font-semibold text-slate-900">{faq.q}</span>
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
                          <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
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
