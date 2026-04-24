"use client";

import { useTrafficStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardStats() {
  const router = useRouter();
  const { intersections, fetchIntersections } = useTrafficStore();
  const [stats, setStats] = useState({
    totalVehicles: "0",
    iotStatus: "0%",
    activeDevices: "0/0",
    avgWaitTime: "0",
    flowScore: "N/A",
  });

  useEffect(() => {
    if (intersections.length === 0) {
      fetchIntersections();
    }
  }, [intersections.length, fetchIntersections]);

  useEffect(() => {
    if (intersections.length > 0) {
      // Calculate stats from intersections data
      const activeCount = intersections.filter(i => 
        i.status?.toLowerCase().includes('active') || 
        !i.status?.toLowerCase().includes('inactive')
      ).length;
      const totalCount = intersections.length;
      const iotPercentage = totalCount > 0 ? ((activeCount / totalCount) * 100) : 0;

      // Mock calculations - in production, fetch from analytics API
      const totalVehicles = (Math.random() * 500000 + 1000000).toFixed(0);
      const avgWait = (Math.random() * 20 + 30).toFixed(0);
      const score = iotPercentage > 90 ? "A" : iotPercentage > 80 ? "B+" : iotPercentage > 70 ? "B" : "C";

      setStats({
        totalVehicles: parseInt(totalVehicles).toLocaleString(),
        iotStatus: `${iotPercentage.toFixed(1)}%`,
        activeDevices: `${activeCount}/${totalCount}`,
        avgWaitTime: avgWait,
        flowScore: score,
      });
    }
  }, [intersections]);

  const statsConfig = [
    {
      label: "Total Kendaraan",
      value: stats.totalVehicles,
      change: "+12% vs Kemarin",
      changeType: "positive",
      icon: "directions_car",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-primary-fixed",
      iconColor: "text-primary",
      link: "/Analist",
    },
    {
      label: "Status IoT",
      value: stats.iotStatus,
      subtitle: `${stats.activeDevices} Perangkat Aktif`,
      icon: "cloud_done",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      link: "/persimpangan",
    },
    {
      label: "Waktu Tunggu (Rerata)",
      value: stats.avgWaitTime,
      unit: "detik",
      change: "+5 detik hari ini",
      changeType: "negative",
      icon: "timer",
      bgColor: "bg-surface-container-lowest",
      iconBg: "bg-secondary-fixed",
      iconColor: "text-secondary",
      link: "/Analist",
    },
    {
      label: "Skor Kelancaran",
      value: stats.flowScore,
      subtitle: "Stabil dalam 2 jam terakhir",
      icon: "speed",
      bgColor: "bg-primary",
      iconBg: "",
      iconColor: "text-primary-fixed",
      textColor: "text-on-primary",
      special: true,
      link: "/peta",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statsConfig.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          onClick={() => router.push(stat.link)}
          className={`${stat.bgColor} p-6 rounded-xl shadow-sm ${
            stat.special ? "shadow-primary/20" : "border border-outline-variant/15"
          } flex flex-col justify-between overflow-hidden relative group cursor-pointer`}
        >
          {!stat.special && (
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          )}
          {stat.special && (
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
          )}

          <header className="flex justify-between items-start mb-4 relative z-10">
            <span
              className={`text-[11px] font-bold uppercase tracking-widest ${
                stat.special ? "text-primary-fixed/60" : "text-slate-400"
              }`}
            >
              {stat.label}
            </span>
            <div className={`p-2 ${stat.iconBg} rounded-lg ${stat.iconColor}`}>
              <span className="material-symbols-outlined text-lg">{stat.icon}</span>
            </div>
          </header>

          <div className="relative z-10">
            <h3
              className={`text-3xl font-headline font-extrabold tracking-tight ${
                stat.special ? stat.textColor : "text-slate-900"
              }`}
            >
              {stat.value}
              {stat.unit && (
                <span className="text-sm font-bold text-slate-400 ml-1">{stat.unit}</span>
              )}
            </h3>
            {stat.change && (
              <p
                className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                  stat.changeType === "positive" ? "text-emerald-600" : "text-tertiary"
                }`}
              >
                <span className="material-symbols-outlined text-sm">trending_up</span>
                {stat.change}
              </p>
            )}
            {stat.subtitle && (
              <p
                className={`text-xs font-medium mt-1 ${
                  stat.special ? "text-primary-fixed/80" : "text-slate-500"
                }`}
              >
                {stat.subtitle}
              </p>
            )}
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={`material-symbols-outlined text-sm ${stat.special ? "text-primary-fixed/50" : "text-slate-400"}`}>
              arrow_forward
            </span>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
