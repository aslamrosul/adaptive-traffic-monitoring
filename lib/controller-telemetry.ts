// V6.7.4 — Isolasi telemetri controller vs vision (murni, testable).
//
// Kepemilikan data:
// - Controller ESP32 memiliki: north/south/east light, active phase,
//   auto/adaptive mode, sensor lokal, WiFi RSSI, uptime, dummy mode.
// - Vision/CAM_YOLO memiliki: deteksi/tracking kendaraan, queue kamera,
//   vision freshness, data kamera annotated.
//
// Aturan: record vision TIDAK BOLEH menggantikan fase lampu fisik controller,
// walau timestamp-nya lebih baru. Bila controller tidak tersedia: tampilkan
// unavailable/stale, JANGAN sintesis all-red dari record vision.

export type TelemetryKind = "controller" | "vision" | "unknown";

export interface DeviceLike {
  deviceId?: unknown;
  device_id?: unknown;
  device?: unknown;
}

export function readDeviceId(item: DeviceLike | null | undefined): string {
  if (!item || typeof item !== "object") return "";
  const raw =
    (item as Record<string, unknown>).device_id ??
    (item as Record<string, unknown>).deviceId ??
    (item as Record<string, unknown>).device ??
    "";
  return String(raw ?? "").trim();
}

export function isSameDeviceId(a: unknown, b: unknown): boolean {
  const left = String(a ?? "").trim().toLowerCase();
  const right = String(b ?? "").trim().toLowerCase();
  if (!left || !right) return false;
  return left === right;
}

// Produsen vision: YOLO / kamera / vision pipeline.
export function isVisionProducerId(deviceId: unknown): boolean {
  const id = String(deviceId ?? "").trim();
  if (!id) return false;
  return /yolo|vision|\bcam\b|cam_|camera/i.test(id);
}

// Pemilik lampu fisik: controller ESP32.
export function isControllerProducerId(deviceId: unknown): boolean {
  const id = String(deviceId ?? "").trim();
  if (!id) return false;
  if (isVisionProducerId(id)) return false;
  return /^esp32/i.test(id);
}

export function getTelemetryKind(deviceId: unknown): TelemetryKind {
  const id = String(deviceId ?? "").trim();
  if (!id) return "unknown";
  if (isVisionProducerId(id)) return "vision";
  if (isControllerProducerId(id)) return "controller";
  return "unknown";
}

interface TelemetryLike extends DeviceLike {
  isControllerTelemetry?: unknown;
  telemetryKind?: unknown;
}

// True bila record boleh dipakai untuk UI controller fisik (lampu/mode/RSSI).
// - Flag eksplisit false (record vision) SELALU ditolak.
// - Flag eksplisit true diterima (sumber tepercaya menandai controller).
// - Tanpa flag: nilai dari bentuk device id (legacy backward-compatible).
export function isControllerTelemetryRecord(
  item: TelemetryLike | null | undefined,
): boolean {
  if (!item || typeof item !== "object") return false;
  if ((item as Record<string, unknown>).isControllerTelemetry === false) {
    return false;
  }
  if ((item as Record<string, unknown>).isControllerTelemetry === true) {
    return true;
  }
  return isControllerProducerId(readDeviceId(item));
}

function timestampOf(item: { timestamp?: unknown }): number {
  return new Date(String((item as { timestamp?: unknown }).timestamp ?? ""))
    .getTime();
}

// Hanya membandingkan controller-vs-controller. Record vision diabaikan,
// sehingga timestamp vision yang lebih baru tidak bisa menggeser fase lampu.
export function pickNewestControllerTraffic<
  T extends { timestamp?: unknown } & TelemetryLike,
>(a?: T | null, b?: T | null): T | null {
  const left = a && isControllerTelemetryRecord(a) ? a : null;
  const right = b && isControllerTelemetryRecord(b) ? b : null;
  if (!left) return right;
  if (!right) return left;
  const ta = timestampOf(left);
  const tb = timestampOf(right);
  if (Number.isNaN(ta)) return right;
  if (Number.isNaN(tb)) return left;
  return tb > ta ? right : left;
}

// Ambil N item pertama milik device yang diminta (pencocokan case-insensitive).
// Dipakai API agar fallback intersection tidak mengambil record CAM_YOLO.
export function selectFirstMatchingDevice<T extends DeviceLike>(
  items: T[],
  deviceId: string,
  limit: number,
): T[] {
  const target = String(deviceId ?? "").trim().toLowerCase();
  if (!target) return [];
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 1, 1), 100);
  const matched: T[] = [];
  for (const item of items) {
    if (matched.length >= safeLimit) break;
    if (readDeviceId(item).toLowerCase() === target) matched.push(item);
  }
  return matched;
}

// Resolve controller dari registry persimpangan (verbatim, tanpa hardcode
// global). Contoh: SIMPANG_TALUN_01 -> ESP32_TRAFFIC_01 bila registry
// menyediakannya. Isolasi bentuk (vision vs controller) ditegakkan terpisah
// oleh isControllerTelemetryRecord, bukan di sini.
export function resolveControllerDeviceId(
  selectedIntersection: string | null | undefined,
  intersections: Array<{
    id?: unknown;
    intersection_id?: unknown;
    deviceId?: unknown;
    device_id?: unknown;
  }>,
): string | null {
  if (!selectedIntersection || selectedIntersection === "all") return null;
  const found = (intersections ?? []).find(
    (item) =>
      String(item?.id ?? "") === selectedIntersection ||
      String(item?.intersection_id ?? "") === selectedIntersection,
  );
  const deviceId =
    String(found?.deviceId ?? found?.device_id ?? "").trim() || null;
  return deviceId;
}

// True bila record mentah membawa field lampu controller (flat atau nested).
export function hasLightFields(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  const flat = ["north_light", "south_light", "east_light"].some(
    (key) => r[key] !== undefined && r[key] !== null && r[key] !== "",
  );
  if (flat) return true;
  return ["north", "south", "east"].some((lane) => {
    const nested = r[lane];
    if (!nested || typeof nested !== "object") return false;
    const light = (nested as Record<string, unknown>).light;
    return light !== undefined && light !== null && light !== "";
  });
}
