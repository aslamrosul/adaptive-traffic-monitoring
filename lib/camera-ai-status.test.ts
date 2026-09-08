// Tests: npx tsx --test lib/camera-ai-status.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveAiStatus, formatVehicleCount } from "./camera-ai-status.js";

describe("deriveAiStatus", () => {
  it("online+fresh+inference fresh -> ACTIVE", () => {
    assert.equal(
      deriveAiStatus({ online: true, fresh: true, connected: true, inferenceFresh: true }),
      "ACTIVE"
    );
  });
  it("online tapi stale -> STALE", () => {
    assert.equal(
      deriveAiStatus({ online: true, fresh: false, connected: true }),
      "STALE"
    );
  });
  it("offline -> OFFLINE", () => {
    assert.equal(
      deriveAiStatus({ online: false, fresh: false, connected: false }),
      "OFFLINE"
    );
  });
  it("API unavailable -> UNKNOWN", () => {
    assert.equal(deriveAiStatus(null), "UNKNOWN");
    assert.equal(deriveAiStatus(undefined), "UNKNOWN");
  });
});

describe("formatVehicleCount", () => {
  it("metric 0 -> display 0", () => {
    assert.equal(formatVehicleCount(0), "0");
  });
  it("metric missing -> display -", () => {
    assert.equal(formatVehicleCount(null), "-");
    assert.equal(formatVehicleCount(undefined), "-");
    assert.equal(formatVehicleCount(""), "-");
  });
});
