"use client";

import { motion } from "framer-motion";

const alerts = [
  {
    type: "warning",
    title: "Kepadatan Ekstrem",
    description: "Simpangan Sarinah mengalami kenaikan volume mendadak arah Utara.",
    time: "2 mnt",
    icon: "warning",
    iconBg: "bg-tertiary/10",
    iconColor: "text-tertiary",
    action: "Buka Live Feed",
    live: true,
  },
  {
    type: "info",
    title: "Pembaruan Sistem",
    description: "Firmware IoT v2.4 berhasil diperbarui di seluruh simpangan Jakarta Barat.",
    time: "1 jam",
    icon: "info",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    live: false,
  },
  {
    type: "maintenance",
    title: "Pemeliharaan Rutin",
    description: "Kamera CCTV 04 di Bundaran HI dijadwalkan pembersihan lensa pukul 23:00.",
    time: "3 jam",
    icon: "engineering",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-700",
    live: false,
  },
];

export default function AlertsPanel() {
  const liveCount = alerts.filter((a) => a.live).length;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden sticky top-24">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h4 className="font-headline font-bold text-slate-900">Peringatan Terbaru</h4>
        {liveCount > 0 && (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-black"
          >
            {liveCount} LIVE
          </motion.span>
        )}
      </header>

      <div className="p-0">
        {alerts.map((alert, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-full ${alert.iconBg} ${alert.iconColor} flex items-center justify-center shrink-0`}
              >
                <span className="material-symbols-outlined text-xl">{alert.icon}</span>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                  <span className="text-[10px] font-medium text-slate-400">{alert.time}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{alert.description}</p>
                {alert.action && (
                  <div className="pt-2">
                    <button className="text-[10px] font-bold text-primary uppercase tracking-wider group-hover:underline">
                      {alert.action}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="p-4 bg-slate-50 text-center">
        <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
          Lihat Semua Riwayat
        </button>
      </footer>
    </div>
  );
}
