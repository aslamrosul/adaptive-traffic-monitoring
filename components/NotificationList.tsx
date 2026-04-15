"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const notifications = [
  {
    id: 1,
    type: "critical",
    title: "Kepadatan Ekstrem di Simpangan Sarinah",
    description: "Volume kendaraan mencapai 450 unit/jam, waktu tunggu 78 detik",
    time: "2 menit yang lalu",
    icon: "warning",
    read: false,
    link: "/persimpangan/1",
  },
  {
    id: 2,
    type: "info",
    title: "Pembaruan Sistem Berhasil",
    description: "Firmware IoT v2.4 telah diperbarui di seluruh simpangan Jakarta Barat",
    time: "1 jam yang lalu",
    icon: "info",
    read: false,
    link: null,
  },
  {
    id: 3,
    type: "warning",
    title: "Pemeliharaan Rutin Dijadwalkan",
    description: "Kamera CCTV 04 di Bundaran HI akan dibersihkan pukul 23:00",
    time: "3 jam yang lalu",
    icon: "engineering",
    read: true,
    link: "/persimpangan/2",
  },
  {
    id: 4,
    type: "success",
    title: "Sensor Kembali Online",
    description: "Sensor Jalur Selatan telah kembali normal setelah gangguan singkat",
    time: "5 jam yang lalu",
    icon: "check_circle",
    read: true,
    link: null,
  },
  {
    id: 5,
    type: "info",
    title: "Laporan Harian Tersedia",
    description: "Laporan analitik untuk tanggal 14 April 2026 sudah dapat diunduh",
    time: "1 hari yang lalu",
    icon: "description",
    read: true,
    link: "/Analist",
  },
];

export default function NotificationList() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState(notifications);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filteredNotifs = filter === "unread" 
    ? notifs.filter((n) => !n.read)
    : notifs;

  const markAsRead = (id: number) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markAsRead(notif.id);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-100 text-red-600";
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      case "success":
        return "bg-green-100 text-green-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

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
          onClick={markAllAsRead}
          className="px-4 py-2 text-sm font-semibold text-primary hover:bg-blue-50 rounded-lg transition-colors"
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
          Semua ({notifs.length})
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
                  <span className="material-symbols-outlined">{notif.icon}</span>
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
                  <p className="text-sm text-slate-600 mb-2">{notif.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{notif.time}</span>
                    {notif.link && (
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
