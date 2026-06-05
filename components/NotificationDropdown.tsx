"use client";

import { useNotificationStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications('user-001', false);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: any) => {
    // Toggle expand/collapse
    if (expandedId === notif.id) {
      setExpandedId(null);
    } else {
      setExpandedId(notif.id);
      // Mark as read
      if (!notif.read) {
        markAsRead(notif.id);
      }
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead('user-001');
  };

  const getIcon = (type: string, category?: string) => {
    if (category === 'traffic') {
      return { icon: "traffic", color: "text-orange-500 bg-orange-100" };
    }
    if (category === 'system') {
      return { icon: "settings", color: "text-blue-500 bg-blue-100" };
    }
    
    switch (type) {
      case "warning":
      case "alert":
        return { icon: "warning", color: "text-orange-500 bg-orange-100" };
      case "info":
        return { icon: "info", color: "text-blue-500 bg-blue-100" };
      case "success":
        return { icon: "check_circle", color: "text-green-500 bg-green-100" };
      case "error":
      case "critical":
        return { icon: "error", color: "text-red-500 bg-red-100" };
      default:
        return { icon: "notifications", color: "text-slate-500 bg-slate-100" };
    }
  };

  // Show only first 5 notifications in dropdown
  const displayNotifications = notifications.slice(0, 5);

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all ${
          unreadCount > 0 ? 'text-yellow-400' : 'text-white'
        }`}
      >
        <div className="relative">
          <span 
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            notifications
          </span>
          {unreadCount > 0 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50"
            />
          )}
        </div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
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
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">
                    notifications_off
                  </span>
                  <p className="text-sm text-slate-500 font-semibold">Tidak ada notifikasi</p>
                </div>
              ) : (
                displayNotifications.map((notif, idx) => {
                  const iconData = getIcon(notif.type, notif.category);
                  const isExpanded = expandedId === notif.id;
                  return (
                    <div key={notif.id}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !notif.read ? "bg-blue-50/30" : ""
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
                                {!notif.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full shrink-0"></div>
                                )}
                                <span className="material-symbols-outlined text-slate-400 text-sm">
                                  {isExpanded ? "expand_less" : "expand_more"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2">
                              {new Date(notif.createdAt).toLocaleString('id-ID', {
                                timeZone: 'Asia/Jakarta',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })} WIB
                            </p>
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
                                {notif.message}
                              </p>
                              {notif.actionUrl && (
                                <div className="flex gap-2 mt-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (notif.actionUrl) {
                                        router.push(notif.actionUrl);
                                      }
                                      setIsOpen(false);
                                    }}
                                    className="px-3 py-1.5 bg-primary text-white rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors"
                                  >
                                    Lihat Detail
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedId(null);
                                    }}
                                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-colors"
                                  >
                                    Tutup
                                  </button>
                                </div>
                              )}
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/notifikasi");
                }}
                className="flex-1 text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Lihat Semua
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
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
