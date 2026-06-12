"use client";

import { useDashboardWithFilter, type TimeRange, type DateRange } from "@/lib/hooks/useDashboardWithFilter";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface DashboardStatsProps {
  timeRange: TimeRange;
  customDates?: DateRange;
  intersectionId?: string;
}

export default function DashboardStats({
  timeRange,
  customDates,
  intersectionId = "all",
}: DashboardStatsProps) {
  const router = useRouter();

  const { stats, isLoading } = useDashboardWithFilter(
    timeRange,
    customDates,
    intersectionId,
  );

  // Only show skeleton on initial load when stats is null
  if (isLoading && !stats) {
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

  // Return null if stats is still null after loading
  if (!stats) {
    return null;
  }

  const statsConfig = [
    {
      label: "Total Kendaraan",
      value: stats.totalVehiclesToday.toLocaleString(),
      change: `${stats.changeVsYesterday >= 0 ? '+' : ''}${stats.changeVsYesterday}% vs Kemarin`,
      changeType: stats.changeVsYesterday >= 0 ? "positive" : "negative",
      icon: "directions_car",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "",
      iconColor: "text-white",
      textColor: "text-white",
      link: "/Analist",
    },
    {
      label: "Status IoT",
      value: `${stats.activeDevices}/${stats.totalDevices}`,
      subtitle: "Perangkat Aktif",
      icon: "cloud_done",
      bgColor: "bg-gradient-to-br from-emerald-500 to-green-600",
      iconBg: "",
      iconColor: "text-white",
      textColor: "text-white",
      link: "/persimpangan",
    },
    {
      label: "Waktu Tunggu (Rerata)",
      value: stats.avgWaitTime.toString(),
      unit: "detik",
      change: `${stats.changeWaitTime >= 0 ? '+' : ''}${stats.changeWaitTime} detik hari ini`,
      changeType: stats.changeWaitTime >= 0 ? "negative" : "positive",
      icon: "timer",
      bgColor: "bg-gradient-to-br from-orange-500 to-amber-600",
      iconBg: "",
      iconColor: "text-white",
      textColor: "text-white",
      link: "/Analist",
    },
    {
      label: "Skor Kelancaran",
      value: stats.flowScore,
      subtitle: "Berdasarkan data real-time",
      icon: "speed",
      bgColor: "bg-gradient-to-br from-purple-600 to-indigo-700",
      iconBg: "",
      iconColor: "text-white",
      textColor: "text-white",
      special: true,
      link: "/Analist",
    },
  ];

  return (
    <section className="space-y-6">
      {/* All 4 cards in one row for both mobile and desktop */}
      <div className="grid grid-cols-4 gap-2 lg:gap-4">
        {statsConfig.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => router.push(stat.link)}
            className={`${stat.bgColor} p-2 lg:p-2.5 rounded-xl shadow-lg hover:shadow-2xl border border-white/20 flex flex-col justify-between overflow-hidden relative group cursor-pointer transition-all min-h-[70px] lg:min-h-[85px]`}
          >
            <div className="absolute -right-6 -top-6 w-20 h-20 lg:w-28 lg:h-28 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>

            <header className="flex justify-between items-start mb-0.5 relative z-10">
              <span className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-wider ${stat.textColor || 'text-white'} opacity-90 leading-tight`}>
                {stat.label}
              </span>
              <div className={`p-0.5 lg:p-1 bg-white/20 backdrop-blur-sm rounded-lg ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-sm lg:text-base">{stat.icon}</span>
              </div>
            </header>

            <div className="relative z-10">
              <h3 className={`text-base lg:text-xl font-headline font-extrabold tracking-tight ${stat.textColor || 'text-white'} leading-none mb-0.5`}>
                {stat.value}
                {stat.unit && (
                  <span className={`text-[10px] lg:text-xs font-bold ${stat.textColor || 'text-white'} opacity-70 ml-1`}>{stat.unit}</span>
                )}
              </h3>
              {stat.change && (
                <p
                  className={`text-[8px] lg:text-[10px] font-semibold flex items-center gap-0.5 ${stat.textColor || 'text-white'} opacity-90 leading-tight`}
                >
                  <span className="material-symbols-outlined text-[10px] lg:text-xs">trending_up</span>
                  <span>{stat.change}</span>
                </p>
              )}
              {stat.subtitle && (
                <p className={`text-[8px] lg:text-[10px] font-medium ${stat.textColor || 'text-white'} opacity-90 leading-tight`}>
                  {stat.subtitle}
                </p>
              )}
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={`material-symbols-outlined text-xs lg:text-sm ${stat.textColor || 'text-white'} opacity-50`}>
                arrow_forward
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
