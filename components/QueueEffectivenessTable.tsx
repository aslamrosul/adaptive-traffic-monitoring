"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface QueueEffectivenessData {
  id: string;
  intersectionName: string;
  lane: string;
  avgQueueLength: number;
  avgGreenDuration: number;
  vehiclesPerSecond: number;
  effectiveness: number; // percentage
  status: "optimal" | "good" | "fair" | "poor";
}

interface QueueEffectivenessTableProps {
  data: QueueEffectivenessData[];
  isLoading?: boolean;
}

export default function QueueEffectivenessTable({
  data,
  isLoading = false,
}: QueueEffectivenessTableProps) {
  const tableData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        {
          id: "1",
          intersectionName: "Persimpangan Sudirman",
          lane: "Jalur Utara",
          avgQueueLength: 8.5,
          avgGreenDuration: 10,
          vehiclesPerSecond: 4.2,
          effectiveness: 92,
          status: "optimal" as const,
        },
        {
          id: "2",
          intersectionName: "Persimpangan Sudirman",
          lane: "Jalur Timur",
          avgQueueLength: 12.3,
          avgGreenDuration: 12,
          vehiclesPerSecond: 3.8,
          effectiveness: 85,
          status: "good" as const,
        },
        {
          id: "3",
          intersectionName: "Persimpangan Gatot Subroto",
          lane: "Jalur Barat",
          avgQueueLength: 15.7,
          avgGreenDuration: 15,
          vehiclesPerSecond: 3.2,
          effectiveness: 78,
          status: "fair" as const,
        },
        {
          id: "4",
          intersectionName: "Persimpangan Gatot Subroto",
          lane: "Jalur Selatan",
          avgQueueLength: 18.2,
          avgGreenDuration: 15,
          vehiclesPerSecond: 2.9,
          effectiveness: 65,
          status: "poor" as const,
        },
        {
          id: "5",
          intersectionName: "Persimpangan Ahmad Yani",
          lane: "Jalur Utara",
          avgQueueLength: 9.1,
          avgGreenDuration: 10,
          vehiclesPerSecond: 4.1,
          effectiveness: 90,
          status: "optimal" as const,
        },
      ];
    }
    return data;
  }, [data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-100 text-green-700";
      case "good":
        return "bg-blue-100 text-blue-700";
      case "fair":
        return "bg-yellow-100 text-yellow-700";
      case "poor":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "optimal":
        return "Optimal";
      case "good":
        return "Baik";
      case "fair":
        return "Cukup";
      case "poor":
        return "Buruk";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Memuat data efektivitas antrian...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
        Tabel Efektivitas Antrian
      </h3>
      <p className="text-[9px] lg:text-[10px] text-slate-500 mb-6">
        Analisis efektivitas penanganan antrian per jalur berdasarkan durasi lampu hijau.
      </p>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 font-bold text-slate-600">Persimpangan</th>
              <th className="text-left py-3 px-4 font-bold text-slate-600">Jalur</th>
              <th className="text-center py-3 px-4 font-bold text-slate-600">
                Panjang Antrian (cm)
              </th>
              <th className="text-center py-3 px-4 font-bold text-slate-600">
                Durasi Hijau (s)
              </th>
              <th className="text-center py-3 px-4 font-bold text-slate-600">
                Kendaraan/Detik
              </th>
              <th className="text-center py-3 px-4 font-bold text-slate-600">Efektivitas</th>
              <th className="text-center py-3 px-4 font-bold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4 text-slate-700 font-semibold">
                  {row.intersectionName}
                </td>
                <td className="py-3 px-4 text-slate-600">{row.lane}</td>
                <td className="py-3 px-4 text-center text-slate-600">
                  {row.avgQueueLength.toFixed(1)}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">
                  {row.avgGreenDuration}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">
                  {row.vehiclesPerSecond.toFixed(1)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-full max-w-[80px] h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${row.effectiveness}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.8 }}
                      />
                    </div>
                    <span className="font-bold text-slate-700 min-w-[40px]">
                      {row.effectiveness}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      row.status
                    )}`}
                  >
                    {getStatusLabel(row.status)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {tableData.map((row, idx) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + idx * 0.05 }}
            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {row.intersectionName}
                </p>
                <p className="text-[9px] text-slate-500">{row.lane}</p>
              </div>
              <span
                className={`inline-block px-2 py-1 rounded text-[8px] font-bold ${getStatusColor(
                  row.status
                )}`}
              >
                {getStatusLabel(row.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2 text-[9px]">
              <div>
                <p className="text-slate-500">Panjang Antrian</p>
                <p className="font-bold text-slate-700">{row.avgQueueLength.toFixed(1)} cm</p>
              </div>
              <div>
                <p className="text-slate-500">Durasi Hijau</p>
                <p className="font-bold text-slate-700">{row.avgGreenDuration}s</p>
              </div>
              <div>
                <p className="text-slate-500">Kendaraan/Detik</p>
                <p className="font-bold text-slate-700">{row.vehiclesPerSecond.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-slate-500">Efektivitas</p>
                <p className="font-bold text-slate-700">{row.effectiveness}%</p>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${row.effectiveness}%` }}
                transition={{ delay: 0.4 + idx * 0.05, duration: 0.8 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
