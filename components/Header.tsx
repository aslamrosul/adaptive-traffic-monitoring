"use client";

import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

interface HeaderProps {
  title: string;
  dateRange?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ title, dateRange, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
    <header className="sticky top-0 z-30 w-full h-16 glass-header px-4 lg:px-8 flex justify-between items-center shadow-sm">
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-white z-[60] flex items-center px-4 gap-2"
          >
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1">
              <SearchBar isMobile autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        {/* Mobile Toggle Button & Logo */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors flex-shrink-0"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-xl">
              {isSidebarOpen ? "close" : "menu"}
            </span>
          </button>
          <Link href="/" className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-blue-800 tracking-tighter font-headline truncate hover:text-blue-600 transition-colors cursor-pointer">
              Aerial Command
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <p className="text-[10px] text-slate-500 font-medium">IoT: Terhubung</p>
            </div>
          </Link>
        </div>

        {/* Desktop Title */}
        <h2 className="hidden lg:block font-headline font-extrabold text-xl tracking-tight text-slate-900 truncate">
          {title}
        </h2>
        
        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 max-w-md">
          <SearchBar />
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>

        {dateRange && (
          <>
            {/* Desktop Date Picker */}
            <div className="relative hidden sm:block">
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

            {/* Mobile Date Picker Button */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Pilih Tanggal"
            >
              <span className="material-symbols-outlined">calendar_today</span>
            </button>

            {/* Mobile Date Picker Modal */}
            <AnimatePresence>
              {showDatePicker && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDatePicker(false)}
                    className="sm:hidden fixed inset-0 bg-black/50 z-40"
                  />
                  
                  {/* Modal */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="sm:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 p-4 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-900">Pilih Rentang Tanggal</h3>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                          Tanggal Mulai
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                          Tanggal Akhir
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      {/* Preview */}
                      <div className="bg-slate-50 rounded-lg p-3 mt-4">
                        <p className="text-xs text-slate-500 font-semibold mb-1">PREVIEW</p>
                        <p className="text-sm font-bold text-slate-900">
                          {formatDateRange(startDate, endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-base transition-colors border border-slate-200"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleApplyDate}
                        className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold text-base hover:brightness-110 transition-all"
                      >
                        Terapkan
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
        
        <NotificationDropdown />
        <button className="hidden sm:flex p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors active:scale-95">
          <span className="material-symbols-outlined">sensors</span>
        </button>
        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-2"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}
