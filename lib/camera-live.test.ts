// Tests: npx tsx --test lib/camera-live.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveStatus, fetchLiveStatus, mergeCamera } from "./camera-live.js";

const REG = {
  camera_id: "CAM_TALUN_NORTH_01",
  intersection_id: "SIMPANG_TALUN_01",
  approach_id: "north",
  enabled: true,
};

const LIVE_ON = {
  metrics: {
    online: true, fresh: true, connected: true, frame_age_s: 0.8,
    active_vehicle_count: 4, queue_vehicle_count: 2, stopped_vehicle_count: 2,
    max_waiting_time_s: 5.2, confidence: 0.77,
  },
  frame_age_s: 0.8, last_seen: "2026-09-07T00:00:00Z", fps_ingest: 2.5, enabled: true,
};

const LIVE_OFF = {
  metrics: {
    online: false, fresh: false, connected: false, frame_age_s: 90,
    active_vehicle_count: 0, queue_vehicle_count: 0, stopped_vehicle_count: 0,
    max_waiting_time_s: 0, confidence: 0,
  },
  frame_age_s: 90, last_seen: "2026-09-06T00:00:00Z", fps_ingest: 0.8, enabled: true,
};

describe("deriveStatus", () => {
  it("ONLINE bila online+fresh+connected", () => {
    assert.equal(deriveStatus(LIVE_ON).status, "ONLINE");
  });
  it("OFFLINE bila metrics offline (AS: North dicabut)", () => {
    const d = deriveStatus(LIVE_OFF);
    assert.equal(d.status, "OFFLINE");
    assert.equal(d.online, false);
  });
  it("STALE bila connected tapi tak fresh", () => {
    const d = deriveStatus({
      metrics: { online: true, fresh: false, connected: true, frame_age_s: 20 },
    });
    assert.equal(d.status, "STALE");
  });
  it("UNKNOWN bila live null (AT)", () => {
    assert.equal(deriveStatus(null).status, "UNKNOWN");
  });
});

describe("mergeCamera", () => {
  it("inference_fresh dipetakan bila ada (M)", () => {
    const on: any = mergeCamera(REG, {
      ...LIVE_ON,
      metrics: { ...LIVE_ON.metrics, inference_fresh: true },
    });
    assert.equal(on.inference_fresh, true);
    const off: any = mergeCamera(REG, {
      ...LIVE_ON,
      metrics: { ...LIVE_ON.metrics, inference_fresh: false },
    });
    assert.equal(off.inference_fresh, false);
    const missing: any = mergeCamera(REG, LIVE_ON);
    assert.equal(missing.inference_fresh, null);
  });
  it("tidak membocorkan secret (AU)", () => {
    const merged: any = mergeCamera(REG, {
      ...LIVE_ON,
      device_token_hash: "RAHASIA",
    } as any);
    const raw = JSON.stringify(merged).toLowerCase();
    assert.ok(!raw.includes("rahasia"), "hash bocor");
    assert.ok(!raw.includes("token"), "kata token bocor");
    assert.ok(!raw.includes("mqtt_pass"), "mqtt bocor");
    assert.equal(merged.status, "ONLINE");
    assert.equal(merged.frame_age_s, 0.8);
    assert.equal(merged.metrics.active_vehicle_count, 4);
  });
});

describe("fetchLiveStatus", () => {
  it("null saat fetch reject/timeout (AT)", async () => {
    const boom = async () => {
      throw new Error("down");
    };
    const out = await fetchLiveStatus("http://x", "C1", "", 100, boom as any);
    assert.equal(out, null);
    assert.equal(deriveStatus(out).status, "UNKNOWN");
  });
  it("mengirim Bearer hanya bila token diset", async () => {
    let seen: any = null;
    const fake = (async (url: string, init: any) => {
      seen = init;
      return { ok: true, json: async () => ({ metrics: null }) };
    }) as any;
    await fetchLiveStatus("http://x", "C1", "", 1000, fake);
    assert.ok(!seen.headers?.Authorization, "tanpa token jangan kirim header");
    await fetchLiveStatus("http://x", "C1", "TOK", 1000, fake);
    assert.equal(seen.headers.Authorization, "Bearer TOK");
  });
});
