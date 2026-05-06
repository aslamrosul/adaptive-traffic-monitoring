"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTrafficStore } from "@/lib/store";

interface SearchBarProps {
  isMobile?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({ isMobile = false, autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { intersections, fetchIntersections, isLoading } = useTrafficStore();

  // Fetch intersections on mount
  useEffect(() => {
    if (intersections.length === 0) {
      fetchIntersections();
    }
  }, [intersections.length, fetchIntersections]);

  // Auto focus for mobile
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter results based on query
  useEffect(() => {
    if (query.trim() === "") {
      setFilteredResults([]);
      setShowResults(false);
    } else {
      const filtered = intersections.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          (item.address && item.address.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredResults(filtered);
      setShowResults(true);
    }
  }, [query, intersections]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectIntersection = (id: string, name: string) => {
    setQuery(name);
    setShowResults(false);
    router.push(`/persimpangan/${id}`);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('padat') || statusLower.includes('macet')) {
      return "bg-red-100 text-red-700";
    } else if (statusLower.includes('ramai') || statusLower.includes('sedang')) {
      return "bg-yellow-100 text-yellow-700";
    } else if (statusLower.includes('lancar')) {
      return "bg-green-100 text-green-700";
    }
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className={`flex items-center rounded-full px-4 gap-2 border transition-all ${
        isMobile 
          ? 'bg-white border-slate-300 focus-within:ring-2 focus-within:ring-primary/20 shadow-lg py-1' 
          : 'bg-white/20 backdrop-blur-sm border-white/30 focus-within:ring-2 focus-within:ring-white/50 py-1'
      }`}>
        <span className={`material-symbols-outlined text-sm ${isMobile ? 'text-slate-600' : 'text-white'}`}>search</span>
        <input
          ref={inputRef}
          className={`bg-transparent border-none focus:ring-0 text-sm font-label outline-none w-full ${
            isMobile 
              ? 'text-slate-900 placeholder:text-slate-400' 
              : 'text-white placeholder:text-white/60'
          }`}
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
            className={`transition-colors flex-shrink-0 ${
              isMobile 
                ? 'text-slate-400 hover:text-slate-600' 
                : 'text-white/60 hover:text-white'
            }`}
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
            className={`absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] ${
              isMobile ? "left-0 right-0" : "left-0 right-0"
            }`}
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isLoading ? 'Mencari...' : `${filteredResults.length} Simpangan Ditemukan`}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-slate-500">Memuat data...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectIntersection(item.id, item.name)}
                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm">
                          traffic
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{item.address || 'Jakarta'}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status || 'AKTIF'}
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
              <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200">
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
