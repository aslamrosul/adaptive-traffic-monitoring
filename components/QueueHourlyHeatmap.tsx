"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type LaneFilter = "all" | "north" | "south" | "east";
type TrafficLane = Exclude<LaneFilter, "all">;

interface QueueHourlyHeatmapProps {
  startDate: string;
  endDate: string;
  intersectionId?: string;
  lane?: LaneFilter;
}

interface HourlyData {
  hour: string;

  north: number | null;
  south: number | null;
  east: number | null;

  sampleCount: number;
}

interface HeatmapItem {
  hour: string;
  average: number | null;
  sampleCount: number;
  intensity: number;
  peakLane: string;
}

const LANE_LABELS: Record<TrafficLane, string> = {
  north: "Jalur Utara",
  south: "Jalur Selatan",
  east: "Jalur Timur",
};

const LANES: TrafficLane[] = [
  "north",
  "south",
  "east",
];

function getConditionLabel(
  average: number | null,
): string {
  if (average === null) {
    return "Tidak ada data";
  }

  if (average < 0.5) {
    return "Lancar";
  }

  if (average < 1.5) {
    return "Sedang";
  }

  return "Padat";
}

function getBlockStyle(
  item: HeatmapItem,
): React.CSSProperties {
  if (item.average === null) {
    return {
      backgroundColor: "#f1f5f9",
      color: "#94a3b8",
    };
  }

  const alpha = Math.min(
    0.95,
    Math.max(
      0.12,
      item.intensity / 100,
    ),
  );

  return {
    backgroundColor: `rgba(37, 99, 235, ${alpha})`,
    color:
      item.intensity >= 50
        ? "#ffffff"
        : "#334155",
  };
}

export default function QueueHourlyHeatmap({
  startDate,
  endDate,
  intersectionId,
  lane = "all",
}: QueueHourlyHeatmapProps) {
  const [hours, setHours] = useState<HourlyData[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const controller = new AbortController();

    async function fetchHourlyQueue() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane,
          limit: "5000",
        });

        if (intersectionId) {
          params.set(
            "intersectionId",
            intersectionId,
          );
        }

        const response = await fetch(
          `/api/analytics/queue-by-hour?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.error ||
              "Gagal mengambil laporan antrean per jam",
          );
        }

        const receivedHours: HourlyData[] =
          Array.isArray(result.hours)
            ? result.hours
            : [];

        setHours(receivedHours);

        setTotalSamples(
          Number(
            result.totalSamples ??
              receivedHours.reduce(
                (sum, item) =>
                  sum +
                  Number(item.sampleCount || 0),
                0,
              ),
          ),
        );
      } catch (fetchError: any) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error(
          "Queue hourly heatmap error:",
          fetchError,
        );

        setHours([]);
        setTotalSamples(0);

        setError(
          fetchError.message ||
            "Gagal memuat laporan antrean per jam",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchHourlyQueue();

    return () => controller.abort();
  }, [
    startDate,
    endDate,
    intersectionId,
    lane,
  ]);

  const selectedLanes = useMemo<TrafficLane[]>(() => {
    if (lane === "all") {
      return LANES;
    }

    return [lane];
  }, [lane]);

  const heatmapData = useMemo<HeatmapItem[]>(() => {
    return hours.map((item) => {
      const availableLanes = selectedLanes
        .map((currentLane) => ({
          lane: currentLane,
          value: item[currentLane],
        }))
        .filter(
          (
            entry,
          ): entry is {
            lane: TrafficLane;
            value: number;
          } =>
            entry.value !== null &&
            entry.value !== undefined,
        );

      if (
        availableLanes.length === 0 ||
        item.sampleCount === 0
      ) {
        return {
          hour: item.hour,
          average: null,
          sampleCount: 0,
          intensity: 0,
          peakLane: "-",
        };
      }

      const average =
        availableLanes.reduce(
          (sum, entry) => sum + entry.value,
          0,
        ) / availableLanes.length;

      const peakLaneEntry = [...availableLanes].sort(
        (first, second) =>
          second.value - first.value,
      )[0];

      return {
        hour: item.hour,

        average:
          Math.round(average * 100) / 100,

        sampleCount: item.sampleCount,

        intensity: Math.round(
          Math.min(
            100,
            Math.max(
              0,
              (average / 2) * 100,
            ),
          ),
        ),

        peakLane:
          LANE_LABELS[peakLaneEntry.lane],
      };
    });
  }, [
    hours,
    selectedLanes,
  ]);

  const peak = useMemo(() => {
    const validItems = heatmapData.filter(
      (
        item,
      ): item is HeatmapItem & {
        average: number;
      } => item.average !== null,
    );

    if (validItems.length === 0) {
      return null;
    }

    return [...validItems].sort(
      (first, second) =>
        second.average - first.average,
    )[0];
  }, [heatmapData]);

  const periodLabel =
    startDate === endDate
      ? startDate
      : `${startDate} sampai ${endDate}`;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-xl border border-indigo-100 bg-white p-4 shadow-lg lg:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Ringkasan Per Jam
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900 lg:text-xl">
            Laporan Antrean Per Jam
          </h3>

          <p className="mt-1 text-xs text-slate-500 lg:text-sm">
            Intensitas rata-rata level antrean berdasarkan jam WIB pada{" "}
            {periodLabel}.
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            {totalSamples.toLocaleString("id-ID")} sampel jalur
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
            Jam Antrean Tertinggi
          </p>

          <p className="text-xl font-black text-indigo-800">
            {peak?.hour || "-"}
          </p>

          <p className="text-[10px] font-semibold text-indigo-600">
            {peak
              ? `Level ${peak.average.toFixed(2)} · ${peak.peakLane}`
              : "Belum ada data"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <HeatmapLoading />
      ) : error ? (
        <HeatmapError message={error} />
      ) : totalSamples === 0 ? (
        <HeatmapEmpty />
      ) : (
        <>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(72px, 1fr))",
            }}
          >
            {heatmapData.map((item, index) => {
              const isPeak =
                peak?.hour === item.hour &&
                peak?.average === item.average;

              const tooltip = [
                `${item.hour} WIB`,
                item.average === null
                  ? "Tidak ada sampel"
                  : `Rata-rata Level ${item.average.toFixed(2)}`,
                `Kondisi: ${getConditionLabel(
                  item.average,
                )}`,
                `Sampel: ${item.sampleCount}`,
                `Jalur tertinggi: ${item.peakLane}`,
              ].join("\n");

              return (
                <motion.div
                  key={item.hour}
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: index * 0.015,
                  }}
                  title={tooltip}
                  className="relative flex min-h-24 cursor-help flex-col justify-between rounded-xl border border-white/30 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={getBlockStyle(item)}
                >
                  {isPeak && (
                    <span className="absolute -right-1 -top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[8px] font-black uppercase text-white shadow">
                      Puncak
                    </span>
                  )}

                  <span className="text-xs font-black">
                    {item.hour}
                  </span>

                  <div>
                    <p className="text-xl font-black">
                      {item.average === null
                        ? "-"
                        : item.average.toFixed(1)}
                    </p>

                    <p className="text-[9px] font-bold uppercase opacity-80">
                      {getConditionLabel(
                        item.average,
                      )}
                    </p>
                  </div>

                  <p className="text-[8px] font-semibold opacity-70">
                    {item.sampleCount} sampel
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <span className="text-[10px] font-semibold text-slate-400">
              Lancar
            </span>

            <div className="flex gap-1">
              {[10, 25, 40, 55, 70, 85, 100].map(
                (intensity) => (
                  <div
                    key={intensity}
                    className="h-3 w-7 rounded"
                    style={{
                      backgroundColor: `rgba(37, 99, 235, ${
                        intensity / 100
                      })`,
                    }}
                  />
                ),
              )}
            </div>

            <span className="text-[10px] font-semibold text-slate-400">
              Padat
            </span>
          </div>
        </>
      )}
    </motion.article>
  );
}

function HeatmapLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

        <p className="text-sm text-slate-500">
          Memuat laporan antrean per jam...
        </p>
      </div>
    </div>
  );
}

function HeatmapError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div>
        <span className="material-symbols-outlined text-4xl text-red-400">
          error
        </span>

        <p className="mt-2 font-bold text-red-700">
          Data gagal dimuat
        </p>

        <p className="mt-1 text-sm text-red-600">
          {message}
        </p>
      </div>
    </div>
  );
}

function HeatmapEmpty() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div>
        <span className="material-symbols-outlined text-5xl text-slate-300">
          grid_view
        </span>

        <p className="mt-2 font-bold text-slate-700">
          Belum ada data antrean
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Tidak ditemukan telemetry pada periode dan filter yang dipilih.
        </p>
      </div>
    </div>
  );
}