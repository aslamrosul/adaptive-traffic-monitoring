"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/lib/store";

export default function NotificationList() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications('user-001', false);
  }, [fetchNotifications]);

  const filteredNotifs = filter === "unread" 
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
      case "error":
        return "bg-red-100 text-red-600";
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      case "success":
        return "bg-green-100 text-green-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (category === 'traffic') return 'traffic';
    if (category === 'system') return 'settings';
    if (category === 'alert') return 'warning';
    
    switch (type) {
      case "critical":
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "success":
        return "check_circle";
      default:
        return "info";
    }
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat notifikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount} notifikasi belum dibaca
          </p>
        </div>
        <button
          onClick={() => markAllAsRead('user-001')}
          disabled={unreadCount === 0}
          className="px-4 py-2 text-sm font-semibold text-primary hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tandai Semua Dibaca
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filter === "unread"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 inline-block">
              notifications_off
            </span>
            <p className="text-slate-500">Tidak ada notifikasi</p>
          </div>
        ) : (
          filteredNotifs.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleNotificationClick(notif)}
              className={`bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                !notif.read ? "border-l-4 border-primary" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-lg ${getTypeColor(notif.type)} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined">{getIcon(notif.type, notif.category)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-bold text-slate-900 group-hover:text-primary transition-colors ${!notif.read ? "font-extrabold" : ""}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {new Date(notif.createdAt).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} WIB
                    </span>
                    {notif.actionUrl && (
                      <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Lihat Detail
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
