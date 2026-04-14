"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  detail: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "warning",
    title: "Kepadatan Ekstrem",
    message: "Simpang Sudirman mengalami lonjakan volume",
    time: "2 menit lalu",
    unread: true,
    detail: "Volume kendaraan di Simpang Sudirman mencapai 450 unit/jam, melebihi kapasitas normal 300 unit/jam. Disarankan untuk mengaktifkan protokol kemacetan tinggi dan mengalihkan arus ke jalur alternatif.",
  },
  {
    id: 2,
    type: "info",
    title: "Pembaruan Sistem",
    message: "Firmware IoT v2.4 berhasil diperbarui",
    time: "1 jam lalu",
    unread: true,
    detail: "Sistem telah berhasil memperbarui firmware IoT ke versi 2.4. Pembaruan ini mencakup peningkatan akurasi sensor sebesar 15%, optimasi konsumsi daya, dan perbaikan bug pada modul komunikasi jaringan.",
  },
  {
    id: 3,
    type: "success",
    title: "Laporan Selesai",
    message: "Laporan insiden #1234 telah diselesaikan",
    time: "3 jam lalu",
    unread: true,
    detail: "Laporan insiden kecelakaan ringan di Simpang Tugu telah diselesaikan. Jalur telah dibersihkan dan lalu lintas kembali normal. Tidak ada korban jiwa, hanya kerusakan material ringan.",
  },
  {
    id: 4,
    type: "error",
    title: "Sensor Offline",
    message: "Sensor CCTV-04 tidak merespons",
    time: "5 jam lalu",
    unread: true,
    detail: "Sensor CCTV-04 di Simpang Gatot Subroto tidak merespons sejak pukul 14:30 WIB. Tim teknisi telah dikirim untuk melakukan pemeriksaan dan perbaikan. Estimasi waktu perbaikan: 2 jam.",
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

  const handleNotificationClick = (id: number) => {
    // Toggle expand/collapse
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Tandai sebagai dibaca
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, unread: false } : notif
        )
      );
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, unread: false }))
    );
  };

  const handleDeleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    setExpandedId(null);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setExpandedId(null);
  };

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
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Hapus Semua Notifikasi
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">
                    notifications_off
                  </span>
                  <p className="text-sm text-slate-500 font-semibold">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const iconData = getIcon(notif.type);
                  const isExpanded = expandedId === notif.id;
                  return (
                    <div key={notif.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                          notif.unread ? "bg-blue-50/30" : ""
                        } ${isExpanded ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-full ${iconData.color} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-lg">{iconData.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-slate-900">{notif.title}</p>
                              <div className="flex items-center gap-2">
                                {notif.unread && (
                                  <div className="w-2 h-2 bg-primary rounded-full shrink-0"></div>
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                                  className="p-1 hover:bg-red-100 rounded-full transition-colors group"
                                  title="Hapus notifikasi"
                                >
                                  <span className="material-symbols-outlined text-slate-400 group-hover:text-red-600 text-sm">
                                    close
                                  </span>
                                </button>
                                <span className="material-symbols-outlined text-slate-400 text-sm">
                                  {isExpanded ? "expand_less" : "expand_more"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Detail Expanded */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-slate-50 border-b border-slate-100"
                          >
                            <div className="p-4 pl-16">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {notif.detail}
                              </p>
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(null);
                                  }}
                                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors"
                                >
                                  Tutup
                                </button>
                                <button
                                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                                  className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg font-semibold text-xs hover:bg-red-100 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
