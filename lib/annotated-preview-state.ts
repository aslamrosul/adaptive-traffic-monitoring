// State machine preview kanonis (murni, testable).
// Aturan: frame valid TAK PERNAH dicabut sebelum pengganti berhasil load.
// Tick/camera baru SELALU coba annotated lagi. Tanpa refresh halaman.

export type PreviewKind = "annotated" | "raw";

export interface PreviewState {
  cameraId: string;
  tick: number | string;
  gen: number;
  visibleUrl: string | null;
  visibleKind: PreviewKind | null;
  pendingUrl: string | null;
  pendingKind: PreviewKind | null;
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
  };
}

export type PreviewEvent =
  | { type: "tick"; cameraId: string; tick: number | string }
  | { type: "load"; url: string }
  | { type: "error"; url: string };

// Tick: naikkan generasi, mulai annotated baru, visible TETAP.
export function previewNext(
  st: PreviewState,
  ev: PreviewEvent
): PreviewState {
  if (ev.type === "tick") {
    if (ev.cameraId !== st.cameraId) {
      // Kamera ganti: jangan pertahankan frame kamera lama sebagai data baru.
      // Mulai bersih (netral loading), annotated langsung.
      return {
        cameraId: ev.cameraId,
        tick: ev.tick,
        gen: st.gen + 1,
        visibleUrl: null,
        visibleKind: null,
        pendingUrl: annotatedUrl(ev.cameraId, ev.tick),
        pendingKind: "annotated",
      };
    }
    return {
      ...st,
      tick: ev.tick,
      gen: st.gen + 1,
      pendingUrl: annotatedUrl(st.cameraId, ev.tick),
      pendingKind: "annotated",
    };
  }
  // Hasil basi (bukan pending saat ini) diabaikan -> anti overwrite silang.
  if (ev.url !== st.pendingUrl) return st;
  if (ev.type === "load") {
    return {
      ...st,
      visibleUrl: ev.url,
      visibleKind: st.pendingKind,
      pendingUrl: null,
      pendingKind: null,
    };
  }
  // error: annotated -> coba raw SIKLUS SAMA; raw gagal -> pending null
  // (visible lama tetap; bila belum pernah ada -> unavailable).
  if (st.pendingKind === "annotated") {
    return {
      ...st,
      pendingUrl: rawUrl(st.cameraId, st.tick),
      pendingKind: "raw",
    };
  }
  return { ...st, pendingUrl: null, pendingKind: null };
}
