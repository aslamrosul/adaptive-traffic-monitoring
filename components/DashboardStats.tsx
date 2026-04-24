"use client";

import { useDashboardWithFilter, type TimeRange, type DateRange } from "@/lib/hooks/useDashboardWithFilter";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface DashboardStatsProps {
  timeRange: TimeRange;
  customDates?: DateRange;
}

export default function DashboardStats({ timeRange, customDates }: DashboardStatsProps) {
  const router = useRouter();
  const { stats, isLoading } = useDashboardWithFilter(timeRange, customDates);

  if (isLoading || !stats) {
    return (
      <section className="space-y-6">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-xl animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-20 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const statsConfig = [
    {
      label: "Total Kendaraan",
      value: stats.totalVehiclesToday.toLocaleString(),
      change: `${stats.changeVsYesterday >= 0 ? '+' : ''}${stats.changeVsYesterday}% vs Kemarin`,
      changeType: stats.changeVsYesterday >= 0 ? "positive" : "negative",
      icon: "directions_car",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-primary-fixed",
      iconColor: "text-primary",
      link: "/Analist",
    },
    {
      label: "Status IoT",
      value: `${stats.iotPercentage}%`,
      subtitle: `${stats.activeDevices}/${stats.totalDevices} Perangkat Aktif`,
      icon: "cloud_done",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      link: "/persimpangan",
    },
    {
      label: "Waktu Tunggu (Rerata)",
      value: stats.avgWaitTime.toString(),
      unit: "detik",
      change: `${stats.changeWaitTime >= 0 ? '+' : ''}${stats.changeWaitTime} detik hari ini`,
      changeType: stats.changeWaitTime >= 0 ? "negative" : "positive",
      icon: "timer",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-secondary-fixed",
      iconColor: "text-secondary",
      link: "/Analist",
    },
    {
      label: "Skor Kelancaran",
      value: stats.flowScore,
      subtitle: "Berdasarkan data real-time",
      icon: "speed",
      bgColor: "bg-primary",
      iconBg: "",
      iconColor: "text-primary-fixed",
      textColor: "text-on-primary",
      special: true,
      link: "/Analist",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Mobile: First 3 cards horizontal, 4th card full width */}
      {/* Desktop: All 4 cards in one row */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
        {statsConfig.slice(0, 3).map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => router.push(stat.link)}
            className={`${stat.bgColor} p-4 md:p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between overflow-hidden relative group cursor-pointer`}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

            <header className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
              <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {stat.label}
              </span>
              <div className={`p-1.5 md:p-2 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-base md:text-lg">{stat.icon}</span>
              </div>
            </header>

            <div className="relative z-10">
              <h3 className="text-xl md:text-3xl font-headline font-extrabold tracking-tight text-slate-900">
                {stat.value}
                {stat.unit && (
                  <span className="text-[10px] md:text-sm font-bold text-slate-400 ml-1">{stat.unit}</span>
                )}
              </h3>
              {stat.change && (
                <p
                  className={`text-[10px] md:text-xs font-semibold mt-1 flex items-center gap-1 ${
                    stat.changeType === "positive" ? "text-emerald-600" : "text-tertiary"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs md:text-sm">trending_up</span>
                  <span className="hidden md:inline">{stat.change}</span>
                </p>
              )}
              {stat.subtitle && (
                <p className="text-[10px] md:text-xs font-medium mt-1 text-slate-500">
                  {stat.subtitle}
                </p>
              )}
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-sm text-slate-400">
                arrow_forward
              </span>
            </div>
          </motion.div>
        ))}
        
        {/* Desktop: 4th card in same row */}
        <motion.div
          key={statsConfig[3].label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
          onClick={() => router.push(statsConfig[3].link)}
          className="hidden md:flex bg-primary p-6 rounded-xl shadow-sm shadow-primary/20 flex-col justify-between overflow-hidden relative group cursor-pointer"
        >
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

          <header className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary-fixed/60">
              {statsConfig[3].label}
            </span>
            <div className={`p-2 rounded-lg text-primary-fixed`}>
              <span className="material-symbols-outlined text-lg">{statsConfig[3].icon}</span>
            </div>
          </header>

          <div className="relative z-10">
            <h3 className="text-3xl font-headline font-extrabold tracking-tight text-on-primary">
              {statsConfig[3].value}
            </h3>
            <p className="text-xs font-medium mt-1 text-primary-fixed/80">
              {statsConfig[3].subtitle}
            </p>
          </div>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-sm text-primary-fixed/50">
              arrow_forward
            </span>
          </div>
        </motion.div>
      </div>

      {/* Mobile: 4th card full width below */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02, y: -4 }}
        onClick={() => router.push(statsConfig[3].link)}
        className="md:hidden bg-primary p-6 rounded-xl shadow-sm shadow-primary/20 flex flex-col justify-between overflow-hidden relative group cursor-pointer"
      >
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <header className="flex justify-between items-start mb-4 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-fixed/60">
            {statsConfig[3].label}
          </span>
          <div className={`p-2 rounded-lg text-primary-fixed`}>
            <span className="material-symbols-outlined text-lg">{statsConfig[3].icon}</span>
          </div>
        </header>

        <div className="relative z-10">
          <h3 className="text-3xl font-headline font-extrabold tracking-tight text-on-primary">
            {statsConfig[3].value}
          </h3>
          <p className="text-xs font-medium mt-1 text-primary-fixed/80">
            {statsConfig[3].subtitle}
          </p>
        </div>

        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-sm text-primary-fixed/50">
            arrow_forward
          </span>
        </div>
      </motion.div>
    </section>
  );
}
