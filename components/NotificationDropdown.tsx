"use client";

import { useNotificationStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { showBrowserNotification } from "@/lib/browser-notification";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";
import { useT } from "@/lib/useT";
import { getNotificationText } from "@/lib/notification-i18n";

export default function NotificationDropdown() {
  const t = useT();
  const { timezone } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const lastNotificationIdRef = useRef<string | null>(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const newest = notifications.find((item) => !item.read);

    if (!newest) return;

    if (lastNotificationIdRef.current === newest.id) return;

    lastNotificationIdRef.current = newest.id;

    showBrowserNotification({
      title: getNotificationText(newest, "title", t),
      body: getNotificationText(newest, "message", t),
      url: newest.actionUrl || "/notifikasi",
    });
  }, [notifications, t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (expandedId === notif.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(notif.id);

    if (!notif.read) {
      await markAsRead(notif.id);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const getIcon = (type: string, category?: string) => {
    if (category === "traffic") {
      return {
        icon: "traffic",
        color: "text-orange-500 bg-orange-100",
      };
    }

    if (category === "system") {
      return {
        icon: "settings",
        color: "text-blue-500 bg-blue-100",
      };
    }

    switch (type) {
      case "warning":
      case "alert":
        return {
          icon: "warning",
          color: "text-orange-500 bg-orange-100",
        };
      case "info":
        return {
          icon: "info",
          color: "text-blue-500 bg-blue-100",
        };
      case "success":
        return {
          icon: "check_circle",
          color: "text-green-500 bg-green-100",
        };
      case "error":
      case "critical":
        return {
          icon: "error",
          color: "text-red-500 bg-red-100",
        };
      default:
        return {
          icon: "notifications",
          color: "text-slate-500 bg-slate-100",
        };
    }
  };

  const displayNotifications = notifications.slice(0, 5);

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        type="button"
        whileHover={{
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.95,
        }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all hover:bg-white/30 ${
          unreadCount > 0 ? "text-yellow-400" : "text-white"
        }`}
      >
        <div className="relative">
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings:
                "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            }}
          >
            notifications
          </span>

          {unreadCount > 0 && (
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="absolute inset-0 rounded-full bg-yellow-400 opacity-50 blur-md"
            />
          )}
        </div>

        {unreadCount > 0 && (
          <motion.span
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white/50"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 10,
              scale: 0.95,
            }}
            className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  {t('notifications.title')}
                </h3>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined mb-2 text-5xl text-slate-300">
                    notifications_off
                  </span>

                  <p className="text-sm font-semibold text-slate-500">
                    {t('notifications.noNotifications')}
                  </p>
                </div>
              ) : (
                displayNotifications.map((notif, idx) => {
                  const iconData = getIcon(notif.type, notif.category);
                  const isExpanded = expandedId === notif.id;

                  return (
                    <div key={notif.id}>
                      <motion.div
                        initial={{
                          opacity: 0,
                          x: -20,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay: idx * 0.05,
                        }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
                          !notif.read ? "bg-blue-50/30" : ""
                        } ${isExpanded ? "bg-slate-50" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconData.color}`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {iconData.icon}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {getNotificationText(notif, "title", t)}
                              </p>

                              <div className="flex items-center gap-2">
                                {!notif.read && (
                                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}

                                <span className="material-symbols-outlined text-sm text-slate-400">
                                  {isExpanded
                                    ? "expand_less"
                                    : "expand_more"}
                                </span>
                              </div>
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                              {getNotificationText(notif, "message", t)}
                            </p>

                            <p className="mt-2 text-[10px] text-slate-400">
                              {formatWithTimezone(notif.createdAt, timezone)}{" "}
                              {getTimezoneLabel(timezone)}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{
                              height: 0,
                              opacity: 0,
                            }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                            }}
                            transition={{
                              duration: 0.2,
                            }}
                            className="overflow-hidden border-b border-slate-100 bg-slate-50"
                          >
                            <div className="p-4 pl-16">
                              <p className="text-sm leading-relaxed text-slate-700">
                                {getNotificationText(notif, "message", t)}
                              </p>

                              {notif.actionUrl && (
                                <div className="mt-4 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();

                                      if (notif.actionUrl) {
                                        router.push(notif.actionUrl);
                                      }

                                      setIsOpen(false);
                                    }}
                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                  >
                                    {t('dashboard.viewDetails')}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setExpandedId(null);
                                    }}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                  >
                                    {t('notifications.close')}
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

            <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/notifikasi");
                }}
                className="flex-1 text-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {t('notifications.viewAll') || 'Lihat Semua'}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center text-sm font-semibold text-slate-600 transition-colors hover:text-slate-800"
              >
                {t('notifications.close')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}