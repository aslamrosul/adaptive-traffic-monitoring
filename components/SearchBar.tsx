"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  isMobile?: boolean;
  autoFocus?: boolean;
}

interface SearchResult {
  id: string;
  type: "intersection" | "device" | "user";
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  status?: string;
}

export default function SearchBar({
  isMobile = false,
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const closeWhenClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", closeWhenClickOutside);

    return () => {
      document.removeEventListener("mousedown", closeWhenClickOutside);
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setShowResults(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setShowResults(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            cache: "no-store",
          }
        );

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(json.error || "Pencarian gagal");
        }

        setResults(json.data || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.title);
    setShowResults(false);
    router.push(result.href);
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    if (type === "intersection") return "Persimpangan";
    if (type === "device") return "Perangkat IoT";
    return "Pengguna";
  };

  const getStatusClass = (status?: string) => {
    const value = String(status || "").toLowerCase();

    if (value === "active" || value === "online") {
      return "bg-green-100 text-green-700";
    }

    if (value === "maintenance") {
      return "bg-orange-100 text-orange-700";
    }

    if (value === "inactive" || value === "offline") {
      return "bg-red-100 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div
        className={`flex items-center rounded-full px-4 gap-2 border transition-all ${
          isMobile
            ? "bg-white border-slate-300 focus-within:ring-2 focus-within:ring-primary/20 shadow-lg py-1"
            : "bg-white/20 backdrop-blur-sm border-white/30 focus-within:ring-2 focus-within:ring-white/50 py-1"
        }`}
      >
        <span
          className={`material-symbols-outlined text-sm ${
            isMobile ? "text-slate-600" : "text-white"
          }`}
        >
          search
        </span>

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setShowResults(true);
            }
          }}
          className={`bg-transparent border-none focus:ring-0 text-sm outline-none w-full ${
            isMobile
              ? "text-slate-900 placeholder:text-slate-400"
              : "text-white placeholder:text-white/60"
          }`}
          placeholder="Cari simpangan, device, atau pengguna..."
          type="text"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className={
              isMobile
                ? "text-slate-400 hover:text-slate-600"
                : "text-white/60 hover:text-white"
            }
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] ${
              isMobile
                ? "left-0 right-0 w-full"
                : "left-0 w-[460px] max-w-[90vw]"
            }`}
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isLoading
                  ? "Mencari..."
                  : `${results.length} hasil ditemukan`}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Mencari data...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">
                          {result.icon}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary truncate">
                          {result.title}
                        </p>

                        <p className="text-xs text-slate-500 truncate">
                          {getTypeLabel(result.type)} • {result.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusClass(
                        result.status
                      )}`}
                    >
                      {result.status || result.type}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">
                    search_off
                  </span>

                  <p className="text-sm text-slate-500 mt-2">
                    Data tidak ditemukan
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}