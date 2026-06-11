"use client";

import mqtt, { MqttClient } from "mqtt";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";

export type LaneName = "north" | "south" | "east" | "west";
export type LightStatus = "red" | "yellow" | "green";

export interface LaneData {
  light: LightStatus;
  vehicleCount: number;
  vehicleDetected: boolean;
  irState: "detected" | "clear";
  queueDetected: boolean;
  queueLength: number;
  queueLevel: 0 | 1 | 2;
  greenDuration: number;
}

export interface TrafficUpdate {
  id?: string;
  intersectionId: string;
  deviceId: string;
  device?: string;
  timestamp: string;

  north: LaneData;
  south: LaneData;
  east: LaneData;
  west: LaneData;

  greenTimeS: number;
  yellowTimeS: number;
  densityLevel0GreenS: number;
  densityLevel1GreenS: number;
  densityLevel2GreenS: number;

  autoMode: boolean;
  adaptiveMode: boolean;
  sensorMode: boolean;
  dummyMode: boolean;

  wifiRssi: number;
  uptimeS: number;
}

export type MqttConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface PendingValue<T> {
  value: T;
  expiresAt: number;
}

interface PendingCommands {
  autoMode?: PendingValue<boolean>;
  adaptiveMode?: PendingValue<boolean>;

  northLight?: PendingValue<LightStatus>;
  southLight?: PendingValue<LightStatus>;
  eastLight?: PendingValue<LightStatus>;

  greenTimeS?: PendingValue<number>;
  yellowTimeS?: PendingValue<number>;
  densityLevel0GreenS?: PendingValue<number>;
  densityLevel1GreenS?: PendingValue<number>;
  densityLevel2GreenS?: PendingValue<number>;
}

const EMPTY_LANE: LaneData = {
  light: "red",
  vehicleCount: 0,
  vehicleDetected: false,
  irState: "clear",
  queueDetected: false,
  queueLength: 0,
  queueLevel: 0,
  greenDuration: 0,
};

function toNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toBool(
  value: unknown,
  fallback = false,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "on" ||
    normalized === "yes"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "off" ||
    normalized === "no"
  ) {
    return false;
  }

  return fallback;
}

function toLight(value: unknown): LightStatus {
  const normalized = String(value ?? "red")
    .trim()
    .toLowerCase();

  if (
    normalized === "red" ||
    normalized === "yellow" ||
    normalized === "green"
  ) {
    return normalized;
  }

  return "red";
}

function toQueueLevel(
  value: unknown,
): 0 | 1 | 2 {
  const parsed = toNumber(value, 0);

  if (parsed === 1) return 1;
  if (parsed === 2) return 2;

  return 0;
}

function normalizeNestedLane(
  rawLane: any,
): LaneData {
  const queueLevel = toQueueLevel(
    rawLane?.queueLevel ??
      rawLane?.queue_level ??
      rawLane?.densityLevel ??
      rawLane?.density_level,
  );

  const vehicleDetected = toBool(
    rawLane?.vehicleDetected ??
      rawLane?.vehicle_detected,
    queueLevel >= 1,
  );

  return {
    light: toLight(rawLane?.light),

    vehicleCount: toNumber(
      rawLane?.vehicleCount ??
        rawLane?.vehicle_count,
      0,
    ),

    vehicleDetected,

    irState:
      vehicleDetected || queueLevel >= 1
        ? "detected"
        : "clear",

    queueDetected: toBool(
      rawLane?.queueDetected ??
        rawLane?.queue_detected,
      queueLevel >= 2,
    ),

    queueLength: toNumber(
      rawLane?.queueLength ??
        rawLane?.queue_length ??
        rawLane?.queueEstimateCm ??
        rawLane?.queue_estimate_cm,
      0,
    ),

    queueLevel,

    greenDuration: toNumber(
      rawLane?.greenDuration ??
        rawLane?.green_duration ??
        rawLane?.greenDurationS ??
        rawLane?.green_duration_s,
      0,
    ),
  };
}

function laneFromFlat(
  raw: any,
  lane: LaneName,
): LaneData {
  if (lane === "west") {
    return { ...EMPTY_LANE };
  }

  const queueLevel = toQueueLevel(
    raw?.[`${lane}_density_level`],
  );

  const vehicleDetected = toBool(
    raw?.[`${lane}_vehicle_detected`],
    queueLevel >= 1,
  );

  const queueDetected = toBool(
    raw?.[`${lane}_queue_detected`],
    queueLevel >= 2,
  );

  return {
    light: toLight(raw?.[`${lane}_light`]),

    vehicleCount: toNumber(
      raw?.[`${lane}_vehicle_count`],
      0,
    ),

    vehicleDetected,

    irState:
      vehicleDetected || queueLevel >= 1
        ? "detected"
        : "clear",

    queueDetected,

    queueLength: toNumber(
      raw?.[`${lane}_queue_estimate_cm`],
      0,
    ),

    queueLevel,

    greenDuration: toNumber(
      raw?.[`${lane}_green_duration_s`],
      0,
    ),
  };
}

export function normalizeMqttTraffic(
  raw: any,
): TrafficUpdate {
  const timestamp =
    raw?.timestamp ??
    raw?.received_at_utc ??
    new Date().toISOString();

  return {
    id: raw?.id,

    intersectionId:
      raw?.intersection_id ??
      raw?.intersectionId ??
      "SIMPANG_TALUN_01",

    deviceId:
      raw?.device_id ??
      raw?.deviceId ??
      raw?.device ??
      "ESP32_TRAFFIC_01",

    device:
      raw?.device ??
      raw?.device_id ??
      raw?.deviceId ??
      "ESP32_TRAFFIC_01",

    timestamp,

    north: raw?.north
      ? normalizeNestedLane(raw.north)
      : laneFromFlat(raw, "north"),

    south: raw?.south
      ? normalizeNestedLane(raw.south)
      : laneFromFlat(raw, "south"),

    east: raw?.east
      ? normalizeNestedLane(raw.east)
      : laneFromFlat(raw, "east"),

    west: raw?.west
      ? normalizeNestedLane(raw.west)
      : laneFromFlat(raw, "west"),

    greenTimeS: toNumber(
      raw?.green_time_s ?? raw?.greenTimeS,
      10,
    ),

    yellowTimeS: toNumber(
      raw?.yellow_time_s ?? raw?.yellowTimeS,
      3,
    ),

    densityLevel0GreenS: toNumber(
      raw?.density_level_0_green_s ??
        raw?.densityLevel0GreenS,
      10,
    ),

    densityLevel1GreenS: toNumber(
      raw?.density_level_1_green_s ??
        raw?.densityLevel1GreenS,
      20,
    ),

    densityLevel2GreenS: toNumber(
      raw?.density_level_2_green_s ??
        raw?.densityLevel2GreenS,
      30,
    ),

    autoMode: toBool(
      raw?.auto_mode ?? raw?.autoMode,
      true,
    ),

    adaptiveMode: toBool(
      raw?.adaptive_mode ?? raw?.adaptiveMode,
      true,
    ),

    sensorMode: toBool(
      raw?.sensor_mode ?? raw?.sensorMode,
      true,
    ),

    dummyMode: toBool(
      raw?.dummy_mode ?? raw?.dummyMode,
      false,
    ),

    wifiRssi: toNumber(
      raw?.wifi_rssi ?? raw?.wifiRssi,
      0,
    ),

    uptimeS: toNumber(
      raw?.uptime_s ?? raw?.uptimeS,
      0,
    ),
  };
}

function applyPendingCommands(
  data: TrafficUpdate,
  pending: PendingCommands,
): TrafficUpdate {
  const now = Date.now();
  const result = { ...data };

  const applyValue = <T,>(
    pendingValue: PendingValue<T> | undefined,
    currentValue: T,
  ): T => {
    if (!pendingValue) {
      return currentValue;
    }

    if (pendingValue.expiresAt < now) {
      return currentValue;
    }

    return pendingValue.value;
  };

  result.autoMode = applyValue(
    pending.autoMode,
    result.autoMode,
  );

  result.adaptiveMode = applyValue(
    pending.adaptiveMode,
    result.adaptiveMode,
  );

  result.greenTimeS = applyValue(
    pending.greenTimeS,
    result.greenTimeS,
  );

  result.yellowTimeS = applyValue(
    pending.yellowTimeS,
    result.yellowTimeS,
  );

  result.densityLevel0GreenS = applyValue(
    pending.densityLevel0GreenS,
    result.densityLevel0GreenS,
  );

  result.densityLevel1GreenS = applyValue(
    pending.densityLevel1GreenS,
    result.densityLevel1GreenS,
  );

  result.densityLevel2GreenS = applyValue(
    pending.densityLevel2GreenS,
    result.densityLevel2GreenS,
  );

  result.north = {
    ...result.north,
    light: applyValue(
      pending.northLight,
      result.north.light,
    ),
  };

  result.south = {
    ...result.south,
    light: applyValue(
      pending.southLight,
      result.south.light,
    ),
  };

  result.east = {
    ...result.east,
    light: applyValue(
      pending.eastLight,
      result.east.light,
    ),
  };

  return result;
}

export function useMqttTraffic() {
  const { timezone } = useAppSettings();
  
  const clientRef = useRef<MqttClient | null>(null);

  const pendingCommandsRef =
    useRef<PendingCommands>({});

  const [connectionState, setConnectionState] =
    useState<MqttConnectionState>("connecting");

  const [isConnected, setIsConnected] =
    useState(false);

  const [latestData, setLatestData] =
    useState<TrafficUpdate | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [reconnectKey, setReconnectKey] =
    useState(0);

  const host =
    process.env.NEXT_PUBLIC_MQTT_HOST ??
    "13.211.191.195";

  const port =
    process.env.NEXT_PUBLIC_MQTT_PORT ??
    "8089";
  const protocol = 
    process.env.NEXT_PUBLIC_MQTT_PROTOCOL 
    ?? "wss";

  const username =
    process.env.NEXT_PUBLIC_MQTT_USER ??
    "jti";

  const password =
    process.env.NEXT_PUBLIC_MQTT_PASS ??
    "";

  const topicData =
    process.env.NEXT_PUBLIC_MQTT_TOPIC_DATA ??
    "traffic/+/data";

  const createPendingValue = useCallback(
    <T,>(value: T): PendingValue<T> => ({
      value,
      expiresAt: Date.now() + 3000,
    }),
    [],
  );

  const applyOptimisticUpdate = useCallback(
    (
      topic: string,
      payload: string | number | boolean,
    ) => {
      const text = String(payload)
        .trim()
        .toLowerCase();

      setLatestData((previous) => {
        if (!previous) {
          return previous;
        }

        const next: TrafficUpdate = {
          ...previous,
          north: { ...previous.north },
          south: { ...previous.south },
          east: { ...previous.east },
          west: { ...previous.west },
          timestamp: new Date().toISOString(),
        };

        if (
          topic ===
          "traffic/config/auto_mode/set"
        ) {
          const enabled = toBool(text, previous.autoMode);

          next.autoMode = enabled;
          pendingCommandsRef.current.autoMode =
            createPendingValue(enabled);
        }

        if (
          topic ===
          "traffic/config/adaptive_mode/set"
        ) {
          const enabled = toBool(
            text,
            previous.adaptiveMode,
          );

          next.adaptiveMode = enabled;
          pendingCommandsRef.current.adaptiveMode =
            createPendingValue(enabled);
        }

        if (
          topic ===
          "traffic/config/green_time/set"
        ) {
          const value = toNumber(
            payload,
            previous.greenTimeS,
          );

          next.greenTimeS = value;
          pendingCommandsRef.current.greenTimeS =
            createPendingValue(value);
        }

        if (
          topic ===
          "traffic/config/yellow_time/set"
        ) {
          const value = toNumber(
            payload,
            previous.yellowTimeS,
          );

          next.yellowTimeS = value;
          pendingCommandsRef.current.yellowTimeS =
            createPendingValue(value);
        }

        if (
          topic ===
          "traffic/config/level0_green/set"
        ) {
          const value = toNumber(
            payload,
            previous.densityLevel0GreenS,
          );

          next.densityLevel0GreenS = value;

          pendingCommandsRef.current.densityLevel0GreenS =
            createPendingValue(value);
        }

        if (
          topic ===
          "traffic/config/level1_green/set"
        ) {
          const value = toNumber(
            payload,
            previous.densityLevel1GreenS,
          );

          next.densityLevel1GreenS = value;

          pendingCommandsRef.current.densityLevel1GreenS =
            createPendingValue(value);
        }

        if (
          topic ===
          "traffic/config/level2_green/set"
        ) {
          const value = toNumber(
            payload,
            previous.densityLevel2GreenS,
          );

          next.densityLevel2GreenS = value;

          pendingCommandsRef.current.densityLevel2GreenS =
            createPendingValue(value);
        }

        if (
          topic === "traffic/light/north/set"
        ) {
          const light = toLight(payload);

          next.north.light = light;

          pendingCommandsRef.current.northLight =
            createPendingValue(light);
        }

        if (
          topic === "traffic/light/south/set"
        ) {
          const light = toLight(payload);

          next.south.light = light;

          pendingCommandsRef.current.southLight =
            createPendingValue(light);
        }

        if (
          topic === "traffic/light/east/set"
        ) {
          const light = toLight(payload);

          next.east.light = light;

          pendingCommandsRef.current.eastLight =
            createPendingValue(light);
        }

        return next;
      });
    },
    [createPendingValue],
  );

  const publishMqtt = useCallback(
    (
      topic: string,
      payload: string | number | boolean,
    ): boolean => {
      const client = clientRef.current;

      if (!client || !client.connected) {
        setError("MQTT belum terhubung");
        return false;
      }

      applyOptimisticUpdate(topic, payload);

      client.publish(
        topic,
        String(payload),
        {
          qos: 0,
          retain: false,
        },
        (publishError) => {
          if (publishError) {
            console.error(
              "MQTT publish error:",
              publishError,
            );

            setError(publishError.message);
            return;
          }

          console.log(
            "MQTT publish berhasil:",
            topic,
            payload,
          );
        },
      );

      return true;
    },
    [applyOptimisticUpdate],
  );

  const reconnect = useCallback(() => {
    const client = clientRef.current;

    if (client) {
      client.end(true);
      clientRef.current = null;
    }

    setError(null);
    setIsConnected(false);
    setConnectionState("connecting");
    setReconnectKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadLatestFromApi() {
      try {
        const response = await fetch(
          "/api/traffic/latest?limit=1",
          {
            cache: "no-store",
          },
        );

        const json = await response.json();

        if (
          mounted &&
          json.success &&
          Array.isArray(json.data) &&
          json.data.length > 0
        ) {
          const normalized = normalizeMqttTraffic(
            json.data[0],
          );

          setLatestData(normalized);
        }
      } catch (loadError) {
        console.warn(
          "Gagal mengambil latest traffic dari API:",
          loadError,
        );
      }
    }

    loadLatestFromApi();

    const url = `${protocol}://${host}:${port}`;

    console.log("Menghubungkan MQTT WebSocket:", url);

    const client = mqtt.connect(url, {
      clientId: `web_next_${Math.random()
        .toString(16)
        .slice(2)}`,

      username,
      password,

      reconnectPeriod: 3000,
      connectTimeout: 10000,
      clean: true,
      keepalive: 30,
    });

    clientRef.current = client;

    client.on("connect", () => {
      if (!mounted) return;

      console.log("MQTT WebSocket connected");

      setConnectionState("connected");
      setIsConnected(true);
      setError(null);

      client.subscribe(
        topicData,
        { qos: 0 },
        (subscribeError) => {
          if (!subscribeError) {
            console.log(
              "Subscribed MQTT topic:",
              topicData,
            );

            return;
          }

          console.error(
            "MQTT subscribe error:",
            subscribeError,
          );

          setError(subscribeError.message);
        },
      );
    });

    client.on("reconnect", () => {
      if (!mounted) return;

      setConnectionState("reconnecting");
      setIsConnected(false);
    });

    client.on("close", () => {
      if (!mounted) return;

      setConnectionState("disconnected");
      setIsConnected(false);
    });

    client.on("offline", () => {
      if (!mounted) return;

      setConnectionState("disconnected");
      setIsConnected(false);
    });

    client.on("error", (mqttError) => {
      if (!mounted) return;

      console.error("MQTT error:", mqttError);

      setConnectionState("disconnected");
      setIsConnected(false);
      setError(mqttError.message);
    });

    client.on("message", (topic, payload) => {
      if (!mounted) {
        return;
      }

      const isTrafficDataTopic =
        topic === topicData ||
        /^traffic\/[^/]+\/data$/.test(topic);

      if (!isTrafficDataTopic) {
        return;
      }

      try {
        const text = payload.toString();
        const raw = JSON.parse(text);

        const topicParts = topic.split("/");
        const deviceIdFromTopic =
          topicParts.length >= 3 ? topicParts[1] : undefined;

        if (deviceIdFromTopic && !raw.device_id && !raw.deviceId) {
          raw.device_id = deviceIdFromTopic;
          raw.device = deviceIdFromTopic;
        }

        console.log("MQTT telemetry diterima:", topic, raw);

        const normalized =
          normalizeMqttTraffic(raw);

        const withPending = applyPendingCommands(
          normalized,
          pendingCommandsRef.current,
        );

        setLatestData(withPending);
        setError(null);
      } catch (parseError) {
        const message =
          parseError instanceof Error
            ? parseError.message
            : "Gagal parse data MQTT";

        console.error(
          "MQTT parse error:",
          parseError,
        );

        setError(message);
      }
    });

    return () => {
      mounted = false;

      client.removeAllListeners();
      client.end(true);

      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [
    host,
    port,
    username,
    password,
    topicData,
    reconnectKey,
  ]);

  return {
    connectionState,
    isConnected,
    latestData,
    error,
    publishMqtt,
    reconnect,
  };
}