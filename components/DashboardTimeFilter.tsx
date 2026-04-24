"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

export type TimeRange = "today" | "yesterday" | "7days" | "30days" | "custom";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DashboardTimeFilterProps {
  onFilterChange: (range: TimeRange, dates?: DateRange) => void;
  currentRange: TimeRange;
}

export default function DashboardTimeFilter({ onFilterChange, currentRange }: DashboardTimeFilterProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filters = [
    { id: "today" as TimeRange, label: "Hari Ini", icon: "today" },
    { id: "yesterday" as TimeRange, label: "Kemarin", icon: "history" },
    { id: "7days" as TimeRange, label: "7 Hari", icon: "date_range" },
    { id: "30days" as TimeRange, label: "30 Hari", icon: "calendar_month" },
    { id: "custom" as TimeRange, label: "Custom", icon: "tune" },
  ];

  const handleQuickFilter = (range: TimeRange) => {
    if (range === "custom") {
      setShowCustomPicker(true);
    } else {
      onFilterChange(range);
      toast.success(`Filter diubah: ${filters.find(f => f.id === range)?.label}`);
    }
  };

  const handleApplyCustom = () => {
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
      return;
    }

    onFilterChange("custom", { startDate, endDate });
    setShowCustomPicker(false);
    
    const start = new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const end = new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    toast.success(`Filter custom: ${start} - ${end}`);
  };

  const getDateRangeText = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (currentRange) {
      case "today":
        return today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      case "yesterday":
        return yesterday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      case "7days":
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        return `${week.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
      case "30days":
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        return `${month.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
      case "custom":
        const start = new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const end = new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return `${start} - ${end}`;
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-200"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title & Date Range */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">filter_alt</span>
            <h3 className="font-headline font-bold text-slate-900">Filter Periode</h3>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {getDateRangeText()}
          </p>
        </div>

        {/* Right: Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${
                currentRange === filter.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="material-symbols-outlined text-base lg:text-lg">
                {filter.icon}
              </span>
              <span className="hidden sm:inline">{filter.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker Modal */}
      <AnimatePresence>
        {showCustomPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomPicker(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                  <h3 className="font-headline font-bold text-lg text-slate-900">
                    Pilih Rentang Tanggal
                  </h3>
                </div>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      event
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tanggal Akhir
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      event
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg flex-shrink-0">
                    info
                  </span>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Pilih rentang tanggal untuk melihat data historis. Maksimal 90 hari ke belakang.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyCustom}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  Terapkan Filter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
