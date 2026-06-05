"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type LaneFilter = "all" | "north" | "south" | "east";

interface RowData {
  lane: string;
  queueLevel: 0 | 1 | 2;
  count: number;
  avgGreenDuration: number;
  effectiveness: number;
}

interface QueueEffectivenessTableProps {
  startDate: string;
  endDate: string;
  intersectionId?: string;
  lane?: LaneFilter;
}

interface SortConfig {
  key: keyof RowData;
  direction: "asc" | "desc";
}

const EXPECTED_DURATIONS: Record<0 | 1 | 2, number> = {
  0: 10,
  1: 20,
  2: 30,
};

export default function QueueEffectivenessTable({
  startDate,
  endDate,
  intersectionId = "all",
  lane = "all",
}: QueueEffectivenessTableProps) {
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "lane",
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 9;

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane,
          limit: "5000",
        });

        if (intersectionId && intersectionId !== "all") {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/queue-effectiveness?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error || "Gagal mengambil efektivitas antrian"
          );
        }

        const rows = Array.isArray(result.rows)
          ? result.rows.filter((row: RowData) => row.count > 0)
          : [];

        setTableData(rows);
        setCurrentPage(1);
      } catch (fetchError: any) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error("Error fetching queue effectiveness:", fetchError);

        setError(
          fetchError.message || "Gagal memuat tabel efektivitas antrian"
        );

        setTableData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [startDate, endDate, intersectionId, lane]);

  const sortedData = useMemo(() => {
    return [...tableData].sort((a, b) => {
      const first = a[sortConfig.key];
      const second = b[sortConfig.key];

      if (typeof first === "string" && typeof second === "string") {
        return sortConfig.direction === "asc"
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      if (typeof first === "number" && typeof second === "number") {
        return sortConfig.direction === "asc"
          ? first - second
          : second - first;
      }

      return 0;
    });
  }, [tableData, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / itemsPerPage)
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (key: keyof RowData) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc"
          ? "desc"
          : "asc",
    }));

    setCurrentPage(1);
  };

  const getLevelName = (level: number) => {
    if (level === 0) return "Lancar";
    if (level === 1) return "Sedang";
    return "Padat";
  };

  const getLevelBadgeClass = (level: number) => {
    if (level === 0) return "bg-emerald-100 text-emerald-700";
    if (level === 1) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getEffectivenessClass = (value: number) => {
    if (value >= 95) return "text-emerald-600";
    if (value >= 85) return "text-amber-600";
    return "text-red-600";
  };

  const getEffectivenessLabel = (value: number) => {
    if (value >= 95) return "Sangat Efektif";
    if (value >= 85) return "Efektif";
    if (value >= 70) return "Cukup";
    return "Perlu Evaluasi";
  };

  const escapeCsvValue = (value: string | number) => {
    const text = String(value).replaceAll('"', '""');

    return `"${text}"`;
  };

  const exportToCsv = () => {
    if (sortedData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Jalur",
      "Queue Level",
      "Kondisi",
      "Jumlah Sampel",
      "Rata-rata Durasi Aktual",
      "Target Durasi",
      "Efektivitas",
    ];

    const rows = sortedData.map((row) => [
      row.lane,
      row.queueLevel,
      getLevelName(row.queueLevel),
      row.count,
      row.avgGreenDuration.toFixed(1),
      EXPECTED_DURATIONS[row.queueLevel],
      row.effectiveness.toFixed(1),
    ]);

    const content = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `queue-effectiveness-${startDate}-${endDate}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    toast.success("Data berhasil diekspor");
  };

  const SortIcon = ({ column }: { column: keyof RowData }) => {
    if (sortConfig.key !== column) {
      return null;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg lg:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 lg:text-xl">
            Efektivitas Durasi Hijau per Jalur
          </h3>

          <p className="mt-1 text-xs text-slate-500 lg:text-sm">
            Perbandingan durasi aktual terhadap target setiap level antrian.
          </p>
        </div>

        <button
          type="button"
          onClick={exportToCsv}
          disabled={isLoading || sortedData.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Ekspor CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Memuat tabel efektivitas...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">
            error
          </span>

          <p className="mt-2 font-bold text-red-700">
            Data gagal dimuat
          </p>

          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">
            table_rows
          </span>

          <p className="mt-2 font-bold text-slate-700">
            Belum ada data efektivitas
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Tidak ditemukan telemetry pada filter yang dipilih.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("lane")}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Jalur
                      <SortIcon column="lane" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("queueLevel")}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Level
                      <SortIcon column="queueLevel" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("count")}
                      className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Sampel
                      <SortIcon column="count" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("avgGreenDuration")}
                      className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Aktual
                      <SortIcon column="avgGreenDuration" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Target
                    </span>
                  </th>

                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("effectiveness")}
                      className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Efektivitas
                      <SortIcon column="effectiveness" />
                    </button>
                  </th>

                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Evaluasi
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((row) => (
                  <tr
                    key={`${row.lane}-${row.queueLevel}`}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-sm font-bold text-slate-800">
                      {row.lane}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getLevelBadgeClass(
                          row.queueLevel
                        )}`}
                      >
                        Level {row.queueLevel} ·{" "}
                        {getLevelName(row.queueLevel)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                      {row.count.toLocaleString("id-ID")}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-blue-600">
                      {row.avgGreenDuration.toFixed(1)}s
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-600">
                      {EXPECTED_DURATIONS[row.queueLevel]}s
                    </td>

                    <td
                      className={`px-4 py-4 text-right text-sm font-black ${getEffectivenessClass(
                        row.effectiveness
                      )}`}
                    >
                      {row.effectiveness.toFixed(1)}%
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getEffectivenessLabel(row.effectiveness)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Menampilkan{" "}
              <span className="font-bold text-slate-700">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              hingga{" "}
              <span className="font-bold text-slate-700">
                {Math.min(currentPage * itemsPerPage, sortedData.length)}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-slate-700">
                {sortedData.length}
              </span>{" "}
              data
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) => Math.max(1, current - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-xs font-bold text-slate-600">
                  Halaman {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.section>
  );
}