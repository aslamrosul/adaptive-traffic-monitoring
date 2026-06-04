"use client";

import mqtt, { MqttClient } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";

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

function toNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return fallback;
}

function toLight(value: unknown): LightStatus {
  const text = String(value || "red").toLowerCase();
  if (text === "green" || text === "yellow" || text === "red") return text;
  return "red";
}

function toQueueLevel(value: unknown): 0 | 1 | 2 {
  const n = toNumber(value, 0);
  if (n === 1) return 1;
  if (n === 2) return 2;
  return 0;
}

function laneFromFlat(raw: any, lane: LaneName): LaneData {
  if (lane === "west") {
    return {
      light: "red",
      vehicleCount: 0,
      vehicleDetected: false,
      irState: "clear",
      queueDetected: false,
      queueLength: 0,
      queueLevel: 0,
      greenDuration: 0,
    };
  }

  const queueLevel = toQueueLevel(raw[`${lane}_density_level`]);
  const vehicleDetected = toBool(raw[`${lane}_vehicle_detected`], queueLevel >= 1);
  const queueDetected = toBool(raw[`${lane}_queue_detected`], queueLevel >= 2);

  return {
    light: toLight(raw[`${lane}_light`]),
    vehicleCount: toNumber(raw[`${lane}_vehicle_count`]),
    vehicleDetected,
    irState: vehicleDetected || queueLevel >= 1 ? "detected" : "clear",
    queueDetected,
    queueLength: toNumber(raw[`${lane}_queue_estimate_cm`]),
    queueLevel,
    greenDuration: toNumber(raw[`${lane}_green_duration_s`]),
  };
}

export function normalizeMqttTraffic(raw: any): TrafficUpdate {
  const timestamp =
    raw.timestamp || raw.received_at_utc || new Date().toISOString();

  return {
    id: raw.id,
    intersectionId:
      raw.intersection_id || raw.intersectionId || "SIMPANG_TALUN_01",
    deviceId: raw.device_id || raw.deviceId || raw.device || "ESP32_TRAFFIC_01",
    device: raw.device || raw.device_id || raw.deviceId || "ESP32_TRAFFIC_01",
    timestamp,

    north: raw.north
      ? raw.north
      : laneFromFlat(raw, "north"),
    south: raw.south
      ? raw.south
      : laneFromFlat(raw, "south"),
    east: raw.east
      ? raw.east
      : laneFromFlat(raw, "east"),
    west: raw.west
      ? raw.west
      : laneFromFlat(raw, "west"),

    greenTimeS: toNumber(raw.green_time_s, 10),
    yellowTimeS: toNumber(raw.yellow_time_s, 3),
    densityLevel0GreenS: toNumber(raw.density_level_0_green_s, 10),
    densityLevel1GreenS: toNumber(raw.density_level_1_green_s, 20),
    densityLevel2GreenS: toNumber(raw.density_level_2_green_s, 30),

    autoMode: toBool(raw.auto_mode, true),
    adaptiveMode: toBool(raw.adaptive_mode, true),
    sensorMode: toBool(raw.sensor_mode, true),
    dummyMode: toBool(raw.dummy_mode, false),

    wifiRssi: toNumber(raw.wifi_rssi),
    uptimeS: toNumber(raw.uptime_s),
  };
}

export function useMqttTraffic() {
  const clientRef = useRef<MqttClient | null>(null);

  const [connectionState, setConnectionState] =
    useState<MqttConnectionState>("connecting");
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<TrafficUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const host = process.env.NEXT_PUBLIC_MQTT_HOST || "13.239.2.166";
  const port = process.env.NEXT_PUBLIC_MQTT_PORT || "8089";
  const username = process.env.NEXT_PUBLIC_MQTT_USER || "jti";
  const password = process.env.NEXT_PUBLIC_MQTT_PASS || "";
  const topicData = process.env.NEXT_PUBLIC_MQTT_TOPIC_DATA || "traffic/data";

  const publishMqtt = useCallback((topic: string, payload: string | number | boolean) => {
    const client = clientRef.current;

    if (!client || !client.connected) {
      alert("MQTT belum terhubung");
      return false;
    }

    client.publish(topic, String(payload), { qos: 0 });
    console.log("MQTT publish:", topic, payload);
    return true;
  }, []);

  const reconnect = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      client.end(true);
      clientRef.current = null;
    }

    setConnectionState("connecting");
    setIsConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadLatestFromApi() {
      try {
        const res = await fetch("/api/traffic/latest?limit=1", {
          cache: "no-store",
        });
        const json = await res.json();

        if (mounted && json.success && json.data?.length > 0) {
          setLatestData(normalizeMqttTraffic(json.data[0]));
        }
      } catch (err) {
        console.warn("Gagal ambil latest traffic dari API:", err);
      }
    }

    loadLatestFromApi();

    const url = `ws://${host}:${port}`;

    const client = mqtt.connect(url, {
      clientId: `web_next_${Math.random().toString(16).slice(2)}`,
      username,
      password,
      reconnectPeriod: 3000,
      connectTimeout: 5000,
      clean: true,
    });

    clientRef.current = client;

    client.on("connect", () => {
      if (!mounted) return;

      console.log("MQTT connected");
      setConnectionState("connected");
      setIsConnected(true);
      setError(null);

      client.subscribe(topicData, { qos: 0 }, (err) => {
        if (err) {
          console.error("Subscribe error:", err);
          setError(err.message);
        }
      });
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

    client.on("error", (err) => {
      if (!mounted) return;
      console.error("MQTT error:", err);
      setConnectionState("disconnected");
      setError(err.message);
      setIsConnected(false);
    });

    client.on("message", (topic, payload) => {
      if (topic !== topicData) return;

      try {
        const text = payload.toString();
        const raw = JSON.parse(text);
        const normalized = normalizeMqttTraffic(raw);

        setLatestData(normalized);
      } catch (err: any) {
        console.error("MQTT parse error:", err);
        setError(err.message || "Gagal parse data MQTT");
      }
    });

    return () => {
      mounted = false;
      client.end(true);
      clientRef.current = null;
    };
  }, [host, port, username, password, topicData]);

  return {
    connectionState,
    isConnected,
    latestData,
    error,
    publishMqtt,
    reconnect,
  };
}