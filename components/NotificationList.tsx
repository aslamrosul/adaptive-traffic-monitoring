"use client";

import { useNotificationStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";

export default function NotificationList() {
  const { timezone } = useAppSettings();
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

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  const filteredNotifs = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }

    return notifications;
  }, [filter, notifications]);

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);

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
    if (category === "traffic") return "traffic";
    if (category === "system") return "settings";
    if (category === "alert") return "warning";

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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-slate-600">Memuat notifikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifikasi
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} notifikasi belum dibaca
          </p>
        </div>

        <button
          type="button"
          onClick={() => markAllAsRead()}
          disabled={unreadCount === 0}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tandai Semua Dibaca
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            filter === "unread"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
      </div>

      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center">
            <span className="material-symbols-outlined mb-4 inline-block text-6xl text-slate-300">
              notifications_off
            </span>

            <p className="text-slate-500">Tidak ada notifikasi</p>
          </div>
        ) : (
          filteredNotifs.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: idx * 0.05,
              }}
              onClick={() => handleNotificationClick(notif)}
              className={`group cursor-pointer rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                !notif.read ? "border-l-4 border-primary" : ""
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${getTypeColor(
                    notif.type,
                  )}`}
                >
                  <span className="material-symbols-outlined">
                    {getIcon(notif.type, notif.category)}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-start justify-between">
                    <h3
                      className={`font-bold text-slate-900 transition-colors group-hover:text-primary ${
                        !notif.read ? "font-extrabold" : ""
                      }`}
                    >
                      {notif.title}
                    </h3>

                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>

                  <p className="mb-2 text-sm text-slate-600">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {formatWithTimezone(notif.createdAt, timezone)}{" "}
                      {getTimezoneLabel(timezone)}
                    </span>

                    {notif.actionUrl && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Lihat Detail
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
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