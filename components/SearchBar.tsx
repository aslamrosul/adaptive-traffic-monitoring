"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Data simpangan untuk pencarian
const intersections = [
  { id: 1, name: "Simpangan Sarinah", location: "Jakarta Pusat", status: "PADAT" },
  { id: 2, name: "Bundaran HI", location: "Jakarta Pusat", status: "LANCAR" },
  { id: 3, name: "Slipi Jaya", location: "Jakarta Barat", status: "RAMAI" },
  { id: 4, name: "Kelapa Gading", location: "Jakarta Utara", status: "LANCAR" },
  { id: 5, name: "Taman Mini", location: "Jakarta Timur", status: "LANCAR" },
  { id: 6, name: "Blok M", location: "Jakarta Selatan", status: "RAMAI" },
  { id: 7, name: "Senayan", location: "Jakarta Pusat", status: "LANCAR" },
  { id: 8, name: "Kuningan", location: "Jakarta Selatan", status: "PADAT" },
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState(intersections);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredResults(intersections);
    } else {
      const filtered = intersections.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectIntersection = (id: number, name: string) => {
    setQuery(name);
    setShowResults(false);
    router.push(`/persimpangan/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PADAT":
        return "bg-red-100 text-red-700";
      case "RAMAI":
        return "bg-yellow-100 text-yellow-700";
      case "LANCAR":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div ref={searchRef} className="relative hidden md:block">
      <div className="flex items-center bg-slate-100 rounded-full px-4 py-1.5 gap-2 border border-outline-variant/10 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
        <input
          className="bg-transparent border-none focus:ring-0 text-sm font-label w-48 text-on-surface-variant placeholder:text-slate-400 outline-none"
          placeholder="Cari simpangan..."
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowResults(false);
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {filteredResults.length} Simpangan Ditemukan
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectIntersection(item.id, item.name)}
                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">
                          traffic
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">
                    search_off
                  </span>
                  <p className="text-sm text-slate-500">Simpangan tidak ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Coba kata kunci lain
                  </p>
                </div>
              )}
            </div>

            {filteredResults.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => {
                    router.push("/persimpangan");
                    setShowResults(false);
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Lihat Semua Simpangan →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
