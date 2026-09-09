"use client";

import { useEffect, useState } from "react";
import {
  initPreview,
  previewNext,
  type PreviewState,
} from "@/lib/annotated-preview-state";

// Preview kanonis double-buffered: frame valid TAK PERNAH dicabut sebelum
// pengganti berhasil load. Tiap tick coba annotated lagi (tanpa refresh).
// Keduanya via proxy aman (tanpa token ke browser). 4:3 + object-contain.
// AI status operasional TIDAK diturunkan dari komponen ini.
//
// Lifecycle: visibleUrl hanya diganti saat pendingUrl onLoad sukses (atomic
// swap). Gagal annotated -> coba raw SIKLUS SAMA (setelah load). Gagal
// keduanya -> visible lama TETAP; placeholder hanya bila belum pernah ada
// frame valid. Visible <img> SENGAJA tidak memakai tick di key (anti-flicker).
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

  // Tick/camera baru -> mulai annotated baru, visible lama TETAP (atau
  // dibersihkan bila kamera berganti, lihat previewNext).
  useEffect(() => {
    setSt((prev) => {
      if (prev.cameraId === cameraId && prev.tick === tick) return prev;
      return previewNext(prev, { type: "tick", cameraId, tick });
    });
  }, [cameraId, tick]);

  // Preload pendingUrl di background via browser Image(). Cleanup membatalkan
  // hasil basi bila tick berikutnya datang sebelum load selesai, sehingga
  // tidak ada backlog request dan frame basi tak bisa overwrite frame baru
  // (ditambah guard ev.url !== pendingUrl di previewNext).
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
