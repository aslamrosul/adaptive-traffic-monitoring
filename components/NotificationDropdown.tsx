"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Kepadatan Ekstrem",
    message: "Simpang Sudirman mengalami lonjakan volume",
    time: "2 menit lalu",
    unread: true,
  },
  {
    id: 2,
    type: "info",
    title: "Pembaruan Sistem",
    message: "Firmware IoT v2.4 berhasil diperbarui",
    time: "1 jam lalu",
    unread: true,
  },
  {
    id: 3,
    type: "success",
    title: "Laporan Selesai",
    message: "Laporan insiden #1234 telah diselesaikan",
    time: "3 jam lalu",
    unread: false,
  },
  {
    id: 4,
    type: "error",
    title: "Sensor Offline",
    message: "Sensor CCTV-04 tidak merespons",
    time: "5 jam lalu",
    unread: false,
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return { icon: "warning", color: "text-orange-500 bg-orange-100" };
      case "info":
        return { icon: "info", color: "text-blue-500 bg-blue-100" };
      case "success":
        return { icon: "check_circle", color: "text-green-500 bg-green-100" };
      case "error":
        return { icon: "error", color: "text-red-500 bg-red-100" };
      default:
        return { icon: "notifications", color: "text-slate-500 bg-slate-100" };
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-primary">
                    {unreadCount} belum dibaca
                  </span>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif, idx) => {
                const iconData = getIcon(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                      notif.unread ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full ${iconData.color} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-lg">{iconData.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-slate-900">{notif.title}</p>
                          {notif.unread && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button className="w-full text-center text-sm font-semibold text-primary hover:text-primary-container transition-colors">
                Lihat Semua Notifikasi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
