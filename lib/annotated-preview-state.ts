// State machine preview kanonis (murni, testable).
// Aturan: frame valid TAK PERNAH dicabut sebelum pengganti berhasil load.
// V6.7.3.1 single-flight: request yang sedang pending TIDAK diganti hanya
// karena polling tick baru datang. Tick terbaru di-coalesce ke queuedTick
// dan diproses setelah siklus annotated/raw saat ini selesai. Tanpa backlog.
//
// Makna field:
// - tick: tick yang SEDANG dimuat (pending) atau terakhir selesai bila idle.
// - queuedTick: tick terbaru yang datang saat sibuk, menunggu diproses.
//   null bila tidak ada antrian. Hanya SATU slot (newest-wins).

export type PreviewKind = "annotated" | "raw";

export interface PreviewState {
  cameraId: string;
  tick: number | string;
  gen: number;
  visibleUrl: string | null;
  visibleKind: PreviewKind | null;
  pendingUrl: string | null;
  pendingKind: PreviewKind | null;
  queuedTick: number | string | null;
}

export function annotatedUrl(cameraId: string, tick: number | string): string {
  return `/api/cameras/${encodeURIComponent(cameraId)}/annotated?t=${tick}`;
}

export function rawUrl(cameraId: string, tick: number | string): string {
  return `/api/cameras/${encodeURIComponent(cameraId)}/snapshot?t=${tick}`;
}

export function initPreview(cameraId: string, tick: number | string): PreviewState {
  return {
    cameraId,
    tick,
    gen: 1,
    visibleUrl: null,
    visibleKind: null,
    pendingUrl: annotatedUrl(cameraId, tick),
    pendingKind: "annotated",
    queuedTick: null,
  };
}

export type PreviewEvent =
  | { type: "tick"; cameraId: string; tick: number | string }
  | { type: "load"; url: string }
  | { type: "error"; url: string };

// Single-flight: tick saat sibuk TIDAK mengganti pendingUrl.
// Tick: naikkan generasi hanya bila ada perubahan nyata; pending TETAP bila
// sibuk (coalesce ke queuedTick), mulai annotated baru hanya bila idle.
export function previewNext(
  st: PreviewState,
  ev: PreviewEvent
): PreviewState {
  if (ev.type === "tick") {
    if (ev.cameraId !== st.cameraId) {
      // Kamera ganti: batalkan/isolasi kamera lama. Jangan pertahankan frame
      // kamera lama sebagai data baru. Mulai bersih, annotated langsung,
      // antrian dibuang.
      return {
        cameraId: ev.cameraId,
        tick: ev.tick,
        gen: st.gen + 1,
        visibleUrl: null,
        visibleKind: null,
        pendingUrl: annotatedUrl(ev.cameraId, ev.tick),
        pendingKind: "annotated",
        queuedTick: null,
      };
    }
    if (String(ev.tick) === String(st.tick)) {
      // Tick sama dengan yang sedang dimuat/selesai: tidak ada kerja baru.
      // JANGAN hapus queuedTick yang mungkin sudah menunggu tick lebih baru.
      return st;
    }
    if (st.pendingUrl != null) {
      // SIBUK (annotated/raw pending): PERTAHANKAN request berjalan.
      // Coalesce ke tick terbaru saja, tanpa backlog.
      if (
        st.queuedTick != null &&
        String(st.queuedTick) === String(ev.tick)
      ) {
        return st;
      }
      return {
        ...st,
        gen: st.gen + 1,
        queuedTick: ev.tick,
      };
    }
    // IDLE: mulai annotated untuk tick terbaru segera.
    return {
      ...st,
      tick: ev.tick,
      gen: st.gen + 1,
      pendingUrl: annotatedUrl(st.cameraId, ev.tick),
      pendingKind: "annotated",
      queuedTick: null,
    };
  }
  // Hasil basi (bukan pending saat ini) diabaikan -> anti overwrite silang.
  if (ev.url !== st.pendingUrl) return st;
  if (ev.type === "load") {
    const visibleUrl = ev.url;
    const visibleKind = st.pendingKind;
    // Siklus selesai sukses: swap atomik, lalu proses antrian terbaru bila ada.
    if (
      st.queuedTick != null &&
      String(st.queuedTick) !== String(st.tick)
    ) {
      const nt = st.queuedTick;
      return {
        ...st,
        tick: nt,
        gen: st.gen + 1,
        visibleUrl,
        visibleKind,
        pendingUrl: annotatedUrl(st.cameraId, nt),
        pendingKind: "annotated",
        queuedTick: null,
      };
    }
    return {
      ...st,
      visibleUrl,
      visibleKind,
      pendingUrl: null,
      pendingKind: null,
      queuedTick: null,
    };
  }
  // error: annotated -> coba raw SIKLUS SAMA (tick SAMA, queued DIPERTAHANKAN,
  // visible lama tetap); raw gagal -> siklus selesai gagal, visible lama tetap,
  // lalu mulai antrian terbaru bila ada.
  if (st.pendingKind === "annotated") {
    return {
      ...st,
      pendingUrl: rawUrl(st.cameraId, st.tick),
      pendingKind: "raw",
    };
  }
  if (
    st.queuedTick != null &&
    String(st.queuedTick) !== String(st.tick)
  ) {
    const nt = st.queuedTick;
    return {
      ...st,
      tick: nt,
      gen: st.gen + 1,
      pendingUrl: annotatedUrl(st.cameraId, nt),
      pendingKind: "annotated",
      queuedTick: null,
    };
  }
  return { ...st, pendingUrl: null, pendingKind: null, queuedTick: null };
}
