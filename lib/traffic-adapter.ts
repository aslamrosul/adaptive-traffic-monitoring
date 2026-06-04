export type LaneName = "north" | "south" | "east" | "west";
export type LightStatus = "red" | "yellow" | "green";

function toNumber(value: any, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: any, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toLight(value: any): LightStatus {
  const text = String(value || "red").toLowerCase();
  if (text === "green" || text === "yellow" || text === "red") return text;
  return "red";
}

function laneFromFlat(item: any, lane: LaneName) {
  if (lane === "west") {
    return {
      light: "red" as LightStatus,
      vehicleCount: 0,
      vehicleDetected: false,
      irState: "clear",
      queueDetected: false,
      queueLength: 0,
      queueLevel: 0,
      greenDuration: 0,
    };
  }

  const vehicleDetected = toBool(item[`${lane}_vehicle_detected`]);
  const queueDetected = toBool(item[`${lane}_queue_detected`]);
  const densityLevel = toNumber(item[`${lane}_density_level`], 0);

  return {
    light: toLight(item[`${lane}_light`]),
    vehicleCount: toNumber(item[`${lane}_vehicle_count`], 0),
    vehicleDetected,
    irState: vehicleDetected || densityLevel >= 1 ? "detected" : "clear",
    queueDetected,
    queueLength: toNumber(item[`${lane}_queue_estimate_cm`], 0),
    queueLevel: densityLevel,
    greenDuration: toNumber(item[`${lane}_green_duration_s`], 0),
  };
}

export function normalizeTrafficItem(item: any) {
  const north = laneFromFlat(item, "north");
  const south = laneFromFlat(item, "south");
  const east = laneFromFlat(item, "east");
  const west = laneFromFlat(item, "west");

  const timestamp =
    item.timestamp || item.received_at_utc || new Date().toISOString();

  return {
    ...item,

    id: item.id,
    intersectionId:
      item.intersection_id || item.intersectionId || "SIMPANG_TALUN_01",
    deviceId: item.device_id || item.deviceId || item.device || "ESP32_TRAFFIC_01",

    timestamp,
    processedAt: item.received_at_utc || timestamp,

    vehicleCount:
      north.vehicleCount +
      south.vehicleCount +
      east.vehicleCount +
      west.vehicleCount,

    north,
    south,
    east,
    west,

    autoMode: toBool(item.auto_mode),
    adaptiveMode: toBool(item.adaptive_mode),
    dummyMode: toBool(item.dummy_mode),
    sensorMode: toBool(item.sensor_mode),
    wifiRssi: toNumber(item.wifi_rssi),
    uptimeS: toNumber(item.uptime_s),
  };
}

export function normalizeTrafficItems(items: any[]) {
  return items.map(normalizeTrafficItem);
}