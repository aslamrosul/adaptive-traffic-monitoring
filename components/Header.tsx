"use client";

import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Header({ title, dateRange }: { title: string; dateRange?: string }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("2023-10-24");
  const [endDate, setEndDate] = useState("2023-10-30");

  const formatDateRange = (start: string, end: string) => {
    const startObj = new Date(start);
    const endObj = new Date(end);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    const startDay = startObj.getDate();
    const startMonth = months[startObj.getMonth()];
    const startYear = startObj.getFullYear();
    
    const endDay = endObj.getDate();
    const endMonth = months[endObj.getMonth()];
    const endYear = endObj.getFullYear();
    
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  };

  const handleApplyDate = () => {
    setShowDatePicker(false);
    toast.success(`Periode diubah: ${formatDateRange(startDate, endDate)}`);
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-header px-8 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="font-headline font-extrabold text-xl tracking-tight text-slate-900">
          {title}
        </h2>
        <SearchBar />
      </div>

      <div className="flex items-center gap-4">
        {dateRange && (
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 border border-outline-variant/20 hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
              <span className="text-xs font-semibold text-slate-700">
                {formatDateRange(startDate, endDate)}
              </span>
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50"
                >
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Pilih Rentang Tanggal</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tanggal Akhir
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApplyDate}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 transition-all"
                    >
                      Terapkan
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <NotificationDropdown />
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors active:scale-95">
          <span className="material-symbols-outlined">sensors</span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}
