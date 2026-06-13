"use client";

import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import SearchBar from "./SearchBar";
import LanguageSwitcherSimple from "./LanguageSwitcherSimple";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import type { ConnectionState } from "@/lib/hooks/useSignalR";

interface HeaderProps {
  title: string;
  dateRange?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  connectionState?: ConnectionState;
  isConnected?: boolean;
}

export default function Header({ 
  title, 
  dateRange, 
  onToggleSidebar, 
  isSidebarOpen,
  connectionState = 'disconnected',
  isConnected = false,
}: HeaderProps) {
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

  // Get connection status config
  const getConnectionConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: 'wifi',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-400',
          text: 'Real-time',
          subtext: 'Connected',
          animate: true,
        };
      case 'connecting':
        return {
          icon: 'sync',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          text: 'Connecting',
          subtext: 'Please wait',
          animate: true,
        };
      case 'reconnecting':
        return {
          icon: 'sync',
          color: 'text-orange-400',
          bgColor: 'bg-orange-400',
          text: 'Reconnecting',
          subtext: 'Restoring',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: 'wifi_off',
          color: 'text-slate-400',
          bgColor: 'bg-slate-400',
          text: 'Offline',
          subtext: 'Polling mode',
          animate: false,
        };
    }
  };

  const connectionConfig = getConnectionConfig();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg flex justify-between items-center lg:fixed lg:left-0 lg:right-0">
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <>
            {/* Backdrop - Click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSearch(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-[90]"
            />
            
            {/* Search Bar Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 z-[100] flex items-center px-3 gap-2 shadow-lg"
            >
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex-1">
                <SearchBar isMobile autoFocus />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0 px-3 lg:px-3">
        {/* Toggle Button - Mobile Only */}
        <motion.button
          onClick={onToggleSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="lg:hidden w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-all flex-shrink-0 backdrop-blur-sm"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-xl">
            menu
          </span>
        </motion.button>

        {/* Desktop: Only Toggle Button in Navbar */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={onToggleSidebar}
            className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Logo + ASTRAEA - Replace Title */}
        <Link href="/dashboard" className="flex items-center gap-1 md:gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-7 md:w-8 h-7 md:h-8 relative flex-shrink-0">
            <Image
              src="/logo.png"
              alt="ASTRAEA Logo"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
          <h2 className="font-headline font-extrabold text-sm md:text-lg tracking-tight text-white drop-shadow-md">
            ASTRAEA
          </h2>
        </Link>
        
        {/* Desktop Search Bar - Responsive */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto px-4">
          <SearchBar />
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2 px-3 lg:px-6">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
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
                className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 border border-white/30 hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-sm text-white">calendar_today</span>
                <span className="text-xs font-semibold text-white">
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
              className="sm:hidden p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
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
                    className="sm:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto"
                  >
                    {/* Handle Bar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-xl text-slate-900">Pilih Rentang Tanggal</h3>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          📅 Tanggal Mulai
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          📅 Tanggal Akhir
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Preview */}
                      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-4 mt-6 border border-blue-100">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">📊 Preview Periode</p>
                        <p className="text-base font-bold text-slate-900">
                          {formatDateRange(startDate, endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pb-4">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="flex-1 px-4 py-4 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-base transition-colors border-2 border-slate-200"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleApplyDate}
                        className="flex-1 px-4 py-4 bg-primary text-white rounded-xl font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-primary/30"
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
        
        {/* Real-time Connection Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
          <motion.div
            animate={connectionConfig.animate ? { 
              scale: [1, 1.2, 1],
              rotate: connectionState === 'connecting' || connectionState === 'reconnecting' ? [0, 360] : [0, 10, -10, 0]
            } : {}}
            transition={{ 
              repeat: connectionConfig.animate ? Infinity : 0, 
              duration: connectionState === 'connecting' || connectionState === 'reconnecting' ? 2 : 3,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <span className={`material-symbols-outlined ${connectionConfig.color} text-lg`}>
              {connectionConfig.icon}
            </span>
            {connectionConfig.animate && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`absolute inset-0 ${connectionConfig.bgColor} rounded-full blur-md opacity-50`}
              />
            )}
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/80 font-semibold leading-none">
              {connectionConfig.text}
            </span>
            <span className="text-xs text-white font-bold leading-none mt-0.5">
              {connectionConfig.subtext}
            </span>
          </div>
        </div>
        
        <div className="hidden sm:block h-8 w-[1px] bg-white/30 mx-2"></div>
        <LanguageSwitcherSimple />
        <div className="hidden sm:block h-8 w-[1px] bg-white/30 mx-2"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}
