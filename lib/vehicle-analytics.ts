import {
  getItemTimestamp,
  getLaneVehicleCount,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import {
  APP_TIMEZONE,
  getWibDateValue,
  getWibHour,
} from "@/lib/timezone";

export interface VehicleDeltaEvent {
  timestamp: string;
  date: string;
  hour: number;

  intersectionId: string;
  deviceId: string;

  lane: TrafficLane;
  delta: number;
}

export function getSelectedTrafficLanes(
  lane?: TrafficLane | "all" | null,
): TrafficLane[] {
  if (
    lane &&
    lane !== "all" &&
    TRAFFIC_LANES.includes(lane)
  ) {
    return [lane];
  }

  return [...TRAFFIC_LANES];
}

export function calculateVehicleDeltaEvents(
  items: any[],
  options?: {
    startUtc?: string;
    endUtc?: string;
  },
): VehicleDeltaEvent[] {
  const startTime = options?.startUtc
    ? new Date(options.startUtc).getTime()
    : Number.NEGATIVE_INFINITY;

  const endTime = options?.endUtc
    ? new Date(options.endUtc).getTime()
    : Number.POSITIVE_INFINITY;

  const sortedItems = [...items].sort((a, b) => {
    return (
      new Date(getItemTimestamp(a)).getTime() -
      new Date(getItemTimestamp(b)).getTime()
    );
  });

  const previousCounters = new Map<string, number>();
  const events: VehicleDeltaEvent[] = [];

  for (const item of sortedItems) {
    const timestamp = getItemTimestamp(item);
    const timestampMs = new Date(timestamp).getTime();

    if (!Number.isFinite(timestampMs)) {
      continue;
    }

    const intersectionId = String(
      item.intersection_id ||
        item.intersectionId ||
        "UNKNOWN_INTERSECTION",
    );

    const deviceId = String(
      item.device_id ||
        item.deviceId ||
        item.device ||
        "UNKNOWN_DEVICE",
    );

    for (const lane of TRAFFIC_LANES) {
      const currentCount = Math.max(
        0,
        getLaneVehicleCount(item, lane),
      );

      const counterKey =
        `${intersectionId}:${deviceId}:${lane}`;

      const previousCount =
        previousCounters.get(counterKey);

      previousCounters.set(counterKey, currentCount);

      // Sampel pertama hanya dijadikan baseline.
      if (previousCount === undefined) {
        continue;
      }

      let delta = 0;

      if (currentCount >= previousCount) {
        delta = currentCount - previousCount;
      } else {
        /*
         * Counter turun berarti ESP32 kemungkinan restart.
         * Nilai counter saat ini dianggap kendaraan setelah restart.
         */
        delta = currentCount;
      }

      if (
        delta <= 0 ||
        timestampMs < startTime ||
        timestampMs > endTime
      ) {
        continue;
      }

      events.push({
        timestamp,
        date: getWibDateValue(new Date(timestamp)),
        hour: getWibHour(timestamp),

        intersectionId,
        deviceId,

        lane,
        delta,
      });
    }
  }

  return events;
}

export function formatWibDayLabel(
  dateValue: string,
): string {
  const date = new Date(`${dateValue}T12:00:00.000Z`);

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatLaneName(
  lane?: TrafficLane | null,
): string {
  if (lane === "north") return "Jalur Utara";
  if (lane === "south") return "Jalur Selatan";
  if (lane === "east") return "Jalur Timur";

  return "-";
}