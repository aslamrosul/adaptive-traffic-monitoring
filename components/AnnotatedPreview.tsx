"use client";

import { useEffect, useState } from "react";
import {
  initPreview,
  previewNext,
  type PreviewState,
} from "@/lib/annotated-preview-state";

// Preview kanonis double-buffered + single-flight (V6.7.3.1):
// frame valid TAK PERNAH dicabut sebelum pengganti berhasil load.
// Tick polling 1500ms TIDAK membatalkan preload yang sedang berjalan:
// request pending dipertahankan hidup, tick terbaru di-coalesce ke queuedTick
// dan diproses setelah siklus annotated/raw selesai. Tanpa backlog.
// Keduanya via proxy aman (tanpa token ke browser). 4:3 + object-contain.
// AI status operasional TIDAK diturunkan dari komponen ini.
//
// Lifecycle: visibleUrl hanya diganti saat pendingUrl onLoad sukses (atomic
// swap A->B). Gagal annotated -> coba raw TICK SAMA (queued dipertahankan).
// Gagal keduanya -> visible lama TETAP + mulai queued terbaru bila ada;
// placeholder hanya bila belum pernah ada frame valid.
// Visible <img> SENGAJA tidak memakai tick di key (anti-flicker).
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
  const [st, setSt] = useState<PreviewState>(() => initPreview(cameraId, tick));

  // Single-flight: tick baru saat sibuk TIDAK mengganti pendingUrl,
  // hanya di-coalesce ke queuedTick (lihat previewNext). Visible lama TETAP;
  // dibersihkan hanya bila kamera berganti.
  useEffect(() => {
    setSt((prev) => {
      if (prev.cameraId !== cameraId) {
        return previewNext(prev, { type: "tick", cameraId, tick });
      }
      if (String(prev.tick) === String(tick)) return prev;
      if (prev.queuedTick != null && String(prev.queuedTick) === String(tick)) {
        return prev;
      }
      return previewNext(prev, { type: "tick", cameraId, tick });
    });
  }, [cameraId, tick]);

  // Preload single-flight pendingUrl di background via browser Image().
  // pendingUrl STABIL saat tick datang bertubi-tubi (tidak diganti), sehingga
  // effect ini TIDAK re-run dan request berjalan TETAP hidup (tidak di-cancel).
  // Cleanup hanya berjalan bila siklus selesai (pendingUrl -> queued/next/null)
  // atau kamera berganti -> request lama dibatalkan + hasil basi diabaikan
  // (guard ev.url !== pendingUrl di previewNext + flag cancelled).
  useEffect(() => {
    const url = st.pendingUrl;
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSt((prev) => previewNext(prev, { type: "load", url }));
    };
    img.onerror = () => {
      if (!cancelled) setSt((prev) => previewNext(prev, { type: "error", url }));
    };
    img.src = url;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [st.pendingUrl]);

  if (!st.visibleUrl) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-slate-400">
        <span className="material-symbols-outlined text-2xl">videocam_off</span>
        <span className="text-[10px] font-bold">Preview sementara tidak tersedia</span>
      </div>
    );
  }

  return (
    // Visible TIDAK memakai tick di key: tidak pernah remount tiap polling.
    // key hanya cameraId agar ganti kamera me-reset elemen secara bersih.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={cameraId}
      src={st.visibleUrl}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
