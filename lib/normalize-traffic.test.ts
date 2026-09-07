// Tests: npx tsx --test lib/normalize-traffic.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeMqttTraffic } from "./hooks/useMqttTraffic.js";

const CANON = {
  intersection_id: "SIMPANG_TALUN_01",
  device_id: "ESP32_TRAFFIC_01",
  timestamp: "2026-09-07T00:00:00Z",
  vision_state: "NORMAL",
  vision_fresh_lanes: 3,
  vision_fresh: true,
  firmware_version: "2.1.2",
  active_lane: "north",
  sig_state: "ACTIVE_GREEN",
  config_version: 7,
  mode_degraded: false,
  north_vehicle_count: 5,
  north_queue_vehicles: 2,
  north_count_valid: true,
  north_count_source: "camera",
  north_vision_fresh: true,
  north_distance_cm: 15,
  north_ultrasonic_detected: false,
  north_density_level: 1,
  north_light: "green",
  north_recommended_green_s: 32,
  north_effective_green_s: 32,
  north_queue_estimate_cm: 0,
  wifi_rssi: -52,
  uptime_s: 100,
};

describe("canonical adapter", () => {
  it("recommended/effective green preserved (X.7-8)", () => {
    const n: any = normalizeMqttTraffic(CANON);
    assert.equal(n.north.recommendedGreenS, 32);
    assert.equal(n.north.effectiveGreenS, 32);
  });
  it("sensor level independent dari queue kamera (X.9)", () => {
    const n: any = normalizeMqttTraffic(CANON);
    assert.equal(n.north.queueLevel, 1);
    assert.equal(n.north.cameraQueueVehicles, 2);
    assert.notEqual(n.north.queueLevel, n.north.cameraQueueVehicles);
  });
  it("firmware/uptime/RSSI/sig_state preserved (X.10)", () => {
    const n: any = normalizeMqttTraffic(CANON);
    assert.equal(n.firmwareVersion, "2.1.2");
    assert.equal(n.uptimeS, 100);
    assert.equal(n.wifiRssi, -52);
    assert.equal(n.sigState, "ACTIVE_GREEN");
    assert.equal(n.configVersion, 7);
  });
  it("NORMAL/DEGRADED/FALLBACK preserved (X.11)", () => {
    const n: any = normalizeMqttTraffic(CANON);
    assert.equal(n.visionState, "NORMAL");
    assert.equal(n.visionFreshLanes, 3);
  });
  it("legacy tetap parse (X.12)", () => {
    const n: any = normalizeMqttTraffic({
      intersection_id: "I",
      device_id: "D",
      north_vehicle_count: 4,
      north_density_level: 2,
      north_light: "red",
    });
    assert.equal(n.north.vehicleCount, 4);
    assert.equal(n.north.queueLevel, 2);
    assert.equal(n.north.countValid, true);
    assert.equal(n.visionState, undefined);
  });
});
