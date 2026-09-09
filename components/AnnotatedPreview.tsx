"use client";

import { useState } from "react";

export type PreviewStage = "annotated" | "raw" | "unavailable";

// Aturan transisi stage (murni, testable):
// - error annotated -> raw; error raw -> unavailable
// - tick/cameraId baru -> SELALU coba annotated lagi (tanpa refresh halaman)
export function nextStageOnError(stage: PreviewStage): PreviewStage {
  if (stage === "annotated") return "raw";
  return "unavailable";
}

// Preview kanonis: annotated Server 2 dulu, fallback jujur ke snapshot mentah.
// Keduanya via proxy aman (tanpa token ke browser). 4:3 + object-contain.
// AI status operasional TIDAK diturunkan dari komponen ini.
export default function AnnotatedPreview({
  cameraId,
  tick,
  alt,
  className = "h-full w-full object-contain",
}: {
  cameraId: string;
  tick: number | string;
  alt: string;
  className?: string;
}) {
  const [stage, setStage] = useState<PreviewStage>("annotated");
  const [cycle, setCycle] = useState(`${cameraId}-${tick}`);
  // Pola penyesuaian state saat render (render-adjust): reset ke annotated
  // hanya bila siklus berubah, BUKAN saat stage berubah (anti-loop).
  const here = `${cameraId}-${tick}`;
  if (cycle !== here) {
    setCycle(here);
    setStage("annotated");
  }

  if (stage === "unavailable") {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-slate-400">
        <span className="material-symbols-outlined text-2xl">videocam_off</span>
        <span className="text-[10px] font-bold">Preview sementara tidak tersedia</span>
      </div>
    );
  }
  const src =
    stage === "annotated"
      ? `/api/cameras/${encodeURIComponent(cameraId)}/annotated?t=${tick}`
      : `/api/cameras/${encodeURIComponent(cameraId)}/snapshot?t=${tick}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${cameraId}-${tick}-${stage}`}
      src={src}
      alt={alt}
      className={className}
      onError={() => setStage((s) => nextStageOnError(s))}
    />
  );
}
