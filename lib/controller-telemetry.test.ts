// Tests V6.7.4: npx tsx --test lib/controller-telemetry.test.ts
// Isolasi telemetri controller (ESP32) dari vision (CAM_YOLO): record vision
// yang lebih baru tidak boleh menggeser fase lampu fisik controller.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getTelemetryKind,
  isControllerTelemetryRecord,
  isSameDeviceId,
  pickNewestControllerTraffic,
  resolveControllerDeviceId,
  selectFirstMatchingDevice,
} from "./controller-telemetry.js";
import { normalizeMqttTraffic } from "./hooks/useMqttTraffic.js";

const CTRL_OLD = {
  deviceId: "ESP32_TRAFFIC_01",
  intersectionId: "SIMPANG_TALUN_01",
  timestamp: "2026-09-09T10:00:00Z",
  north: { light: "green" },
  south: { light: "red" },
  east: { light: "red" },
};

const CTRL_NEW = {
  ...CTRL_OLD,
  timestamp: "2026-09-09T10:00:05Z",
  north: { light: "red" },
  south: { light: "green" },
  east: { light: "red" },
};

const VISION_NEWER = {
  deviceId: "CAM_YOLO_SIMPANG_TALUN_01",
  intersectionId: "SIMPANG_TALUN_01",
  timestamp: "2026-09-09T10:00:10Z",
  // Tanpa field lampu controller.
};

const VISION_RAW = {
  intersection_id: "SIMPANG_TALUN_01",
  device_id: "CAM_YOLO_SIMPANG_TALUN_01",
  timestamp: "2026-09-09T10:00:10Z",
  north_vehicle_count: 7,
  north_queue_vehicles: 3,
  vision_state: "NORMAL",
  vision_fresh_lanes: 3,
};

const REGISTRY = [
  {
    id: "SIMPANG_TALUN_01",
    intersection_id: "SIMPANG_TALUN_01",
    device_id: "ESP32_TRAFFIC_01",
  },
  {
    id: "SIMPANG_BARU_02",
    intersection_id: "SIMPANG_BARU_02",
    deviceId: "ESP32_TRAFFIC_02",
  },
];

describe("controller telemetry isolation V6.7.4", () => {
  it("1. controller newest -> lamp controller ditampilkan", () => {
    const out: any = pickNewestControllerTraffic(null, CTRL_NEW as any);
    assert.equal(out?.deviceId, "ESP32_TRAFFIC_01");
    assert.equal(out?.south?.light, "green");
  });

  it("2. CAM_YOLO lebih baru -> lamp controller TETAP", () => {
    const out: any = pickNewestControllerTraffic(
      CTRL_OLD as any,
      VISION_NEWER as any,
    );
    assert.equal(out?.deviceId, "ESP32_TRAFFIC_01");
    assert.equal(out?.north?.light, "green");
    // Urutan argumen dibalik pun vision tetap ditolak.
    const out2: any = pickNewestControllerTraffic(
      VISION_NEWER as any,
      CTRL_OLD as any,
    );
    assert.equal(out2?.deviceId, "ESP32_TRAFFIC_01");
  });

  it("3. API fallback mengembalikan device controller yang cocok", () => {
    const items = [
      { device_id: "CAM_YOLO_SIMPANG_TALUN_01", timestamp: "t2" },
      { device_id: "ESP32_TRAFFIC_01", timestamp: "t1" },
    ];
    const out = selectFirstMatchingDevice(items, "ESP32_TRAFFIC_01", 1);
    assert.equal(out.length, 1);
    assert.equal(out[0].device_id, "ESP32_TRAFFIC_01");
    // Case-insensitive + limit dihormati.
    assert.ok(isSameDeviceId("esp32_traffic_01", "ESP32_TRAFFIC_01"));
    assert.ok(!isSameDeviceId("CAM_YOLO_SIMPANG_TALUN_01", "ESP32_TRAFFIC_01"));
  });

  it("4. record CAM_YOLO tanpa field lampu tidak pernah jadi all-red", () => {
    const n: any = normalizeMqttTraffic(VISION_RAW);
    assert.equal(n.isControllerTelemetry, false);
    assert.equal(n.telemetryKind, "vision");
    assert.equal(getTelemetryKind(n.deviceId), "vision");
    assert.equal(isControllerTelemetryRecord(n), false);
    // Seleksi controller mengembalikan null (unavailable), bukan record red.
    assert.equal(pickNewestControllerTraffic(n, null), null);
    assert.equal(pickNewestControllerTraffic(null, n), null);
  });

  it("5. controller MQTT lebih baru -> MQTT menang", () => {
    const out: any = pickNewestControllerTraffic(
      CTRL_NEW as any,
      CTRL_OLD as any,
    );
    assert.equal(out?.timestamp, CTRL_NEW.timestamp);
    assert.equal(out?.south?.light, "green");
  });

  it("6. controller API lebih baru -> API menang", () => {
    const out: any = pickNewestControllerTraffic(
      CTRL_OLD as any,
      CTRL_NEW as any,
    );
    assert.equal(out?.timestamp, CTRL_NEW.timestamp);
  });

  it("7. ganti intersection memakai controller registernya sendiri", () => {
    assert.equal(
      resolveControllerDeviceId("SIMPANG_TALUN_01", REGISTRY as any),
      "ESP32_TRAFFIC_01",
    );
    assert.equal(
      resolveControllerDeviceId("SIMPANG_BARU_02", REGISTRY as any),
      "ESP32_TRAFFIC_02",
    );
    assert.equal(resolveControllerDeviceId("all", REGISTRY as any), null);
    assert.equal(
      resolveControllerDeviceId("SIMPANG_UNKNOWN", REGISTRY as any),
      null,
    );
  });

  it("8. tanpa data controller -> null (unavailable), bukan all-red palsu", () => {
    assert.equal(pickNewestControllerTraffic(null, null), null);
    assert.equal(
      pickNewestControllerTraffic(VISION_NEWER as any, VISION_NEWER as any),
      null,
    );
    const n: any = normalizeMqttTraffic(VISION_RAW);
    assert.equal(pickNewestControllerTraffic(n, n), null);
  });

  it("9. metrik vision tetap tersedia dan tidak hilang", () => {
    const n: any = normalizeMqttTraffic(VISION_RAW);
    assert.equal(n.north.vehicleCount, 7);
    assert.equal(n.north.cameraQueueVehicles, 3);
    assert.equal(n.visionState, "NORMAL");
    assert.equal(n.visionFreshLanes, 3);
    assert.equal(n.deviceId, "CAM_YOLO_SIMPANG_TALUN_01");
    // Slot vision di latestByDevice tetap ber-device CAM_YOLO (tidak
    // dipaksa jadi ESP32).
  });

  it("10. Device ID Talun = ESP32_TRAFFIC_01 + panel unavailable explisit", () => {
    assert.equal(
      resolveControllerDeviceId("SIMPANG_TALUN_01", REGISTRY as any),
      "ESP32_TRAFFIC_01",
    );
    const here = dirname(fileURLToPath(import.meta.url));
    const panel = readFileSync(
      join(here, "..", "components", "traffic", "TrafficControlPanel.tsx"),
      "utf8",
    );
    // Panel menandai unavailable/stale saat data controller null.
    assert.ok(
      panel.includes("tidak tersedia") || panel.includes("unavailable"),
      "panel harus menampilkan status unavailable saat data null",
    );
    const dash = readFileSync(
      join(here, "..", "app", "dashboard", "page.tsx"),
      "utf8",
    );
    // Dashboard meminta + memvalidasi device controller yang sama.
    assert.ok(dash.includes("deviceId="), "dashboard harus query deviceId");
    assert.ok(
      dash.includes("pickNewestControllerTraffic"),
      "dashboard harus memakai seleksi controller-only",
    );
    assert.ok(
      !/function pickNewestTraffic\(/.test(dash),
      "komparator lintas-device lama harus sudah diganti",
    );
  });
});
