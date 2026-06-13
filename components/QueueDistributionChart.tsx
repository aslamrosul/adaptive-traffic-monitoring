"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "@/providers/TranslationProvider";

interface DistributionItem {
  level: 0 | 1 | 2;
  count: number;
  percentage: number;
}

interface QueueDistributionChartProps {
  data: DistributionItem[];
  isLoading?: boolean;
}

export default function QueueDistributionChart({
  data,
  isLoading = false,
}: QueueDistributionChartProps) {
  const { t } = useTranslation();
  
  const LEVEL_METADATA = useMemo(() => ({
    0: {
      label: t('traffic.smooth'),
      color: "#10b981",
      className: "bg-emerald-500",
    },
    1: {
      label: t('traffic.moderate'),
      color: "#f59e0b",
      className: "bg-amber-500",
    },
    2: {
      label: t('traffic.congested'),
      color: "#ef4444",
      className: "bg-red-500",
    },
  }), [t]);
  
  const normalizedData = useMemo(() => {
    return ([0, 1, 2] as const).map((level) => {
      const item = data.find((current) => current.level === level);

      return {
        level,
        count: item?.count ?? 0,
        percentage: item?.percentage ?? 0,
        ...LEVEL_METADATA[level],
      };
    });
  }, [data]);

  const total = useMemo(() => {
    return normalizedData.reduce(
      (sum, item) => sum + item.count,
      0
    );
  }, [normalizedData]);

  const gradient = useMemo(() => {
    const level0 = normalizedData[0].percentage;
    const level1 = normalizedData[1].percentage;

    const firstEnd = level0;
    const secondEnd = level0 + level1;

    return `conic-gradient(
      ${LEVEL_METADATA[0].color} 0% ${firstEnd}%,
      ${LEVEL_METADATA[1].color} ${firstEnd}% ${secondEnd}%,
      ${LEVEL_METADATA[2].color} ${secondEnd}% 100%
    )`;
  }, [normalizedData]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            {t('charts.loadingData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full min-h-[420px] rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          {t('charts.queueDistributionTitle')}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {t('charts.queueDistributionSubtitle')}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState message={t('charts.noDataPeriod')} />
      ) : (
        <>
          <div className="my-7 flex justify-center">
            <div
              className="relative flex h-48 w-48 items-center justify-center rounded-full"
              style={{ background: gradient }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-3xl font-black text-slate-900">
                  {total.toLocaleString("id-ID")}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('charts.samples')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {normalizedData.map((item) => (
              <div
                key={item.level}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${item.className}`}
                    />

                    <span className="text-sm font-bold text-slate-700">
                      Level {item.level} — {item.label}
                    </span>
                  </div>

                  <span className="text-sm font-black text-slate-900">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    className={`h-full rounded-full ${item.className}`}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {item.count.toLocaleString("id-ID")} {t('charts.samples')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-5xl text-slate-300">
        donut_large
      </span>

      <p className="mt-3 text-sm font-semibold text-slate-500">
        {message}
      </p>
    </div>
  );
}