// Validasi display config kamera (murni, tanpa I/O). Server + client pakai modul ini.

export const DISPLAY_SOURCES = ["canonical", "mjpeg", "hls"] as const;
export type DisplaySource = (typeof DISPLAY_SOURCES)[number];

// Source lokal yang TIDAK BOLEH dipersist global (STEP 3).
export const LOCAL_ONLY_SOURCES = ["webcam", "upload"] as const;

export const MAX_URL_LENGTH = 2048;

export interface DisplayConfigInput {
  source_type?: unknown;
  active_source?: unknown;
  url?: unknown;
  manual_mjpeg_url?: unknown;
  manual_hls_url?: unknown;
  enabled?: unknown;
  autoplay?: unknown;
}

export interface ValidDisplayConfig {
  active_source: DisplaySource;
  manual_mjpeg_url: string;
  manual_hls_url: string;
  enabled: boolean;
  autoplay: boolean;
}

export function isDisplaySource(v: unknown): v is DisplaySource {
  return (
    typeof v === "string" &&
    (DISPLAY_SOURCES as readonly string[]).includes(v)
  );
}

export function sanitizeUrl(v: unknown): string {
  return String(v ?? "").trim();
}

// STEP 5: hanya https?/http?; tolak javascript:/data:/file:/blob:.
export function validateDisplayUrl(url: unknown): { ok: boolean; url: string; reason?: string } {
  const u = sanitizeUrl(url);
  if (!u) return { ok: false, url: "", reason: "URL kosong" };
  if (u.length > MAX_URL_LENGTH) {
    return { ok: false, url: "", reason: `URL melebihi ${MAX_URL_LENGTH} karakter` };
  }
  const lower = u.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return { ok: false, url: "", reason: "Skema URL tidak diizinkan" };
  }
  if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
    return { ok: false, url: "", reason: "URL harus https:// atau http://" };
  }
  try {
    new URL(u);
  } catch {
    return { ok: false, url: "", reason: "URL tidak valid" };
  }
  return { ok: true, url: u };
}

export function isMixedContent(pageIsHttps: boolean, url: string): boolean {
  return pageIsHttps && url.toLowerCase().startsWith("http://");
}

export function validateDisplayConfig(input: DisplayConfigInput): {
  ok: boolean;
  config?: ValidDisplayConfig;
  reason?: string;
} {
  // Terima nama lama (source_type/url) maupun baru (active_source/preset).
  const rawSource = input.active_source ?? input.source_type;
  if (!isDisplaySource(rawSource)) {
    return {
      ok: false,
      reason:
        "active_source harus canonical|mjpeg|hls (webcam/upload hanya lokal, bukan global)",
    };
  }
  const active_source = rawSource;
  // Preset dipertahankan independen; hanya preset yang dikirim ikut divalidasi.
  // Field yang tidak dikirim = null (pemanggil merge dengan nilai tersimpan).
  let manual_mjpeg_url: string | null = null;
  let manual_hls_url: string | null = null;
  const rawMjpeg = input.manual_mjpeg_url ?? (active_source === "mjpeg" ? input.url : undefined);
  const rawHls = input.manual_hls_url ?? (active_source === "hls" ? input.url : undefined);
  if (rawMjpeg !== undefined) {
    const checked = validateDisplayUrl(rawMjpeg);
    if (!checked.ok && String(rawMjpeg ?? "").trim() !== "") {
      return { ok: false, reason: `URL MJPEG: ${checked.reason}` };
    }
    if (checked.ok) manual_mjpeg_url = checked.url;
    else if (String(rawMjpeg ?? "").trim() === "" && active_source === "mjpeg") {
      return { ok: false, reason: "URL MJPEG wajib diisi untuk sumber mjpeg" };
    }
  }
  if (rawHls !== undefined) {
    const checked = validateDisplayUrl(rawHls);
    if (!checked.ok && String(rawHls ?? "").trim() !== "") {
      return { ok: false, reason: `URL HLS: ${checked.reason}` };
    }
    if (checked.ok) manual_hls_url = checked.url;
    else if (String(rawHls ?? "").trim() === "" && active_source === "hls") {
      return { ok: false, reason: "URL HLS wajib diisi untuk sumber hls" };
    }
  }
  return {
    ok: true,
    config: {
      active_source,
      manual_mjpeg_url: manual_mjpeg_url ?? "",
      manual_hls_url: manual_hls_url ?? "",
      enabled: input.enabled !== false,
      autoplay: input.autoplay !== false,
    },
  };
}

// Migrasi aman dari model lama (display_source_type/display_url).
export function migrateLegacyDisplay(old: {
  display_source_type?: unknown;
  display_url?: unknown;
}): { active_source: DisplaySource; manual_mjpeg_url: string; manual_hls_url: string } {
  const t = isDisplaySource(old.display_source_type) ? old.display_source_type : "canonical";
  const u = sanitizeUrl(old.display_url);
  return {
    active_source: t,
    manual_mjpeg_url: t === "mjpeg" ? u : "",
    manual_hls_url: t === "hls" ? u : "",
  };
}
