// Validasi display config kamera (murni, tanpa I/O). Server + client pakai modul ini.

export const DISPLAY_SOURCES = ["canonical", "mjpeg", "hls"] as const;
export type DisplaySource = (typeof DISPLAY_SOURCES)[number];

// Source lokal yang TIDAK BOLEH dipersist global (STEP 3).
export const LOCAL_ONLY_SOURCES = ["webcam", "upload"] as const;

export const MAX_URL_LENGTH = 2048;

export interface DisplayConfigInput {
  source_type?: unknown;
  url?: unknown;
  enabled?: unknown;
  autoplay?: unknown;
}

export interface ValidDisplayConfig {
  source_type: DisplaySource;
  url: string;
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
  const source_type = input.source_type;
  if (!isDisplaySource(source_type)) {
    return {
      ok: false,
      reason:
        "source_type harus canonical|mjpeg|hls (webcam/upload hanya lokal, bukan global)",
    };
  }
  let url = "";
  if (source_type === "mjpeg" || source_type === "hls") {
    const checked = validateDisplayUrl(input.url);
    if (!checked.ok) return { ok: false, reason: checked.reason };
    url = checked.url;
  }
  return {
    ok: true,
    config: {
      source_type,
      url,
      enabled: input.enabled !== false,
      autoplay: input.autoplay !== false,
    },
  };
}
