"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronUp, ChevronDown, Download } from "lucide-react";

interface RowData {
  lane: string;
  queueLevel: 0 | 1 | 2;
  count: number;
  avgGreenDuration: number;
  effectiveness: number;
}

interface QueueEffectivenessTableProps {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

interface SortConfig {
  key: keyof RowData;
  direction: "asc" | "desc";
}

// Expected green light durations for each queue level
const EXPECTED_DURATIONS: Record<number, number> = {
  0: 7,   // Level 0 (Lancar): 7 seconds
  1: 10,  // Level 1 (Sedang): 10 seconds
  2: 15,  // Level 2 (Padat): 15 seconds
};

// Lane names
const LANE_NAMES: Record<string, string> = {
  north: "Jalur Utara",
  south: "Jalur Selatan",
  east: "Jalur Timur",
  west: "Jalur Barat",
};

// Mock data generator
function generateMockData(): RowData[] {
  return [
    {
      lane: "Jalur Utara",
      queueLevel: 0,
      count: 450,
      avgGreenDuration: 7.2,
      effectiveness: 97.1,
    },
    {
      lane: "Jalur Utara",
      queueLevel: 1,
      count: 320,
      avgGreenDuration: 10.5,
      effectiveness: 95.2,
    },
    {
      lane: "Jalur Utara",
      queueLevel: 2,
      count: 180,
      avgGreenDuration: 15.8,
      effectiveness: 94.9,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 0,
      count: 480,
      avgGreenDuration: 7.1,
      effectiveness: 98.6,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 1,
      count: 350,
      avgGreenDuration: 10.3,
      effectiveness: 96.8,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 2,
      count: 170,
      avgGreenDuration: 15.2,
      effectiveness: 98.7,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 0,
      count: 420,
      avgGreenDuration: 7.3,
      effectiveness: 95.9,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 1,
      count: 310,
      avgGreenDuration: 10.7,
      effectiveness: 93.5,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 2,
      count: 190,
      avgGreenDuration: 16.1,
      effectiveness: 93.1,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 0,
      count: 460,
      avgGreenDuration: 7.0,
      effectiveness: 100.0,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 1,
      count: 340,
      avgGreenDuration: 10.2,
      effectiveness: 97.9,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 2,
      count: 200,
      avgGreenDuration: 15.5,
      effectiveness: 96.7,
    },
  ];
}

export default function QueueEffectivenessTable({
  startDate,
  endDate,
}: QueueEffectivenessTableProps) {
  const [tableData, setTableData] = useState<RowData[]>(generateMockData());
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "lane",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/queue-effectiveness?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setTableData(data.rows || generateMockData());
      toast.success("Data berhasil dimuat");
    } catch (error) {
      console.error("Error fetching queue effectiveness data:", error);
      toast.error("Gagal memuat data, menggunakan data demo");
      setTableData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...tableData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [tableData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);

  // Helper functions
  const getLevelBadge = (level: number): string => {
    switch (level) {
      case 0:
        return "bg-green-100 text-green-800";
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelName = (level: number): string => {
    switch (level) {
      case 0:
        return "Lancar";
      case 1:
        return "Sedang";
      case 2:
        return "Padat";
      default:
        return "Unknown";
    }
  };

  const getEffectivenessColor = (effectiveness: number): string => {
    if (effectiveness >= 95) return "text-green-600 font-semibold";
    if (effectiveness >= 90) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getEffectivenessStatus = (effectiveness: number): string => {
    if (effectiveness >= 95) return "✅ Excellent";
    if (effectiveness >= 90) return "✅ Good";
    if (effectiveness >= 85) return "⚠️ Fair";
    return "❌ Poor";
  };

  // Handle sort
  const handleSort = (key: keyof RowData) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
    setCurrentPage(1);
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = [
        "Lane",
        "Queue Level",
        "Count",
        "Avg Duration (s)",
        "Expected (s)",
        "Effectiveness (%)",
      ];

      const rows = sortedData.map((row) => [
        row.lane,
        `${row.queueLevel} (${getLevelName(row.queueLevel)})`,
        row.count,
        row.avgGreenDuration.toFixed(1),
        EXPECTED_DURATIONS[row.queueLevel],
        row.effectiveness.toFixed(1),
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n"
      );

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `queue-effectiveness-${startDate}-${endDate}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Data berhasil diexport ke CSV");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Gagal mengexport data");
    }
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: keyof RowData }) => {
    if (sortConfig.key !== column) {
      return <div className="w-4 h-4 opacity-0" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg lg:text-xl font-bold font-headline text-on-surface mb-2">
              📊 Tabel Efektivitas Antrian
            </h3>
            <p className="text-sm text-slate-500">
              Detail efektivitas durasi lampu hijau per jalur dan level antrian dari{" "}
              <span className="font-semibold">{startDate}</span> hingga{" "}
              <span className="font-semibold">{endDate}</span>
            </p>
          </div>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Memuat data efektivitas antrian...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("lane")}
                      className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      Jalur
                      <SortIndicator column="lane" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort("queueLevel")}
                      className="flex items-center justify-center gap-2 font-semibold text-slate-700 hover:text-slate-900 transition-colors w-full"
                    >
                      Level
                      <SortIndicator column="queueLevel" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort("count")}
                      className="flex items-center justify-center gap-2 font-semibold text-slate-700 hover:text-slate-900 transition-colors w-full"
                    >
                      Jumlah
                      <SortIndicator column="count" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort("avgGreenDuration")}
                      className="flex items-center justify-center gap-2 font-semibold text-slate-700 hover:text-slate-900 transition-colors w-full"
                    >
                      Rata-rata
                      <SortIndicator column="avgGreenDuration" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">
                    Diharapkan
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort("effectiveness")}
                      className="flex items-center justify-center gap-2 font-semibold text-slate-700 hover:text-slate-900 transition-colors w-full"
                    >
                      Efektivitas
                      <SortIndicator column="effectiveness" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.lane}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLevelBadge(
                          row.queueLevel
                        )}`}
                      >
                        Level {row.queueLevel} ({getLevelName(row.queueLevel)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {row.avgGreenDuration.toFixed(1)}s
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">
                      {EXPECTED_DURATIONS[row.queueLevel]}s
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={getEffectivenessColor(row.effectiveness)}>
                          {row.effectiveness.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-500">
                          {getEffectivenessStatus(row.effectiveness)}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 pt-6 border-t border-slate-200"
          >
            <div className="text-sm text-slate-600">
              Menampilkan{" "}
              <span className="font-semibold">{startIndex + 1}</span> hingga{" "}
              <span className="font-semibold">{endIndex}</span> dari{" "}
              <span className="font-semibold">{sortedData.length}</span> data
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sebelumnya
              </motion.button>

              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm font-semibold text-slate-700">
                  Halaman {currentPage} dari {totalPages}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Berikutnya
              </motion.button>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
          >
            {/* Total Records */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-1">Total Data</p>
              <p className="text-2xl font-bold text-blue-600">
                {sortedData.length.toLocaleString()}
              </p>
            </div>

            {/* Average Effectiveness */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-1">Rata-rata Efektivitas</p>
              <p className="text-2xl font-bold text-green-600">
                {(
                  sortedData.reduce((sum, row) => sum + row.effectiveness, 0) /
                  sortedData.length
                ).toFixed(1)}
                %
              </p>
            </div>

            {/* Highest Effectiveness */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-600 mb-1">Efektivitas Tertinggi</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Math.max(...sortedData.map((row) => row.effectiveness)).toFixed(
                  1
                )}
                %
              </p>
            </div>

            {/* Lowest Effectiveness */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-slate-600 mb-1">Efektivitas Terendah</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.min(...sortedData.map((row) => row.effectiveness)).toFixed(
                  1
                )}
                %
              </p>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200"
          >
            <h4 className="font-bold text-sm text-indigo-900 mb-2">
              💡 Cara Membaca Tabel
            </h4>
            <ul className="text-xs text-indigo-800 space-y-1">
              <li>
                • <span className="font-semibold">Jalur:</span> Nama jalur lalu lintas
              </li>
              <li>
                • <span className="font-semibold">Level:</span> Level antrian (0=Lancar,
                1=Sedang, 2=Padat)
              </li>
              <li>
                • <span className="font-semibold">Jumlah:</span> Berapa kali level ini
                terdeteksi
              </li>
              <li>
                • <span className="font-semibold">Rata-rata:</span> Durasi lampu hijau
                rata-rata yang digunakan
              </li>
              <li>
                • <span className="font-semibold">Diharapkan:</span> Durasi lampu hijau
                yang seharusnya digunakan
              </li>
              <li>
                • <span className="font-semibold">Efektivitas:</span> Persentase sesuai
                antara durasi aktual dan diharapkan
              </li>
            </ul>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
