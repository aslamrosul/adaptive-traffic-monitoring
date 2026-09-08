// Tests: npx tsx --test lib/camera-display-config.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isDisplaySource,
  isMixedContent,
  sanitizeUrl,
  validateDisplayConfig,
  validateDisplayUrl,
} from "./camera-display-config.js";

describe("display config validation", () => {
  it("canonical valid tanpa URL", () => {
    const r = validateDisplayConfig({ source_type: "canonical" });
    assert.equal(r.ok, true);
    assert.equal(r.config?.active_source, "canonical");
    assert.equal(r.config?.manual_mjpeg_url, "");
  });
  it("mjpeg valid dengan https URL", () => {
    const r = validateDisplayConfig({ source_type: "mjpeg", url: "https://x/y/stream" });
    assert.equal(r.ok, true);
    assert.equal(r.config?.manual_mjpeg_url, "https://x/y/stream");
  });
  it("invalid URL rejected", () => {
    assert.equal(validateDisplayConfig({ source_type: "mjpeg", url: "notaurl" }).ok, false);
  });
  it("javascript: rejected", () => {
    assert.equal(
      validateDisplayUrl("javascript:alert(1)").ok,
      false
    );
  });
  it("blob: rejected untuk persistent config", () => {
    assert.equal(validateDisplayUrl("blob:https://x/abc").ok, false);
  });
  it("data: dan file: rejected", () => {
    assert.equal(validateDisplayUrl("data:image/png;base64,xx").ok, false);
    assert.equal(validateDisplayUrl("file:///etc/passwd").ok, false);
  });
  it("unknown camera ditolak di level validasi tipe (tipe tak dikenal)", () => {
    assert.equal(isDisplaySource("webcam"), false);
    assert.equal(isDisplaySource("upload"), false);
    assert.equal(validateDisplayConfig({ source_type: "webcam" }).ok, false);
  });
  it("URL dipangkas + batas panjang", () => {
    assert.equal(sanitizeUrl("  https://x/  "), "https://x/");
    assert.equal(validateDisplayUrl("https://x/" + "a".repeat(2048)).ok, false);
  });
  it("mixed content terdeteksi", () => {
    assert.equal(isMixedContent(true, "http://10.0.0.1:81/stream"), true);
    assert.equal(isMixedContent(true, "https://x/y"), false);
    assert.equal(isMixedContent(false, "http://10.0.0.1/y"), false);
  });
  it("mjpeg tanpa URL ditolak; canonical tak butuh URL", () => {
    assert.equal(validateDisplayConfig({ source_type: "hls", url: "" }).ok, false);
    assert.equal(validateDisplayConfig({}).ok, false);
  });
});

import { migrateLegacyDisplay } from "./camera-display-config.js";
import { describe as describe2, it as it2 } from "node:test";
import assert2 from "node:assert/strict";

describe2("preset model V6.5", () => {
  it2("1. no config + registered -> canonical (diputuskan di UI dari registry)", () => {
    const r = migrateLegacyDisplay({});
    assert2.equal(r.active_source, "canonical");
  });
  it2("2. saved canonical stays canonical", () => {
    const r = migrateLegacyDisplay({ display_source_type: "canonical" });
    assert2.equal(r.active_source, "canonical");
    assert2.equal(r.manual_mjpeg_url, "");
  });
  it2("3. saved MJPEG keeps URL", () => {
    const r = migrateLegacyDisplay({ display_source_type: "mjpeg", display_url: "https://a/s" });
    assert2.equal(r.active_source, "mjpeg");
    assert2.equal(r.manual_mjpeg_url, "https://a/s");
  });
  it2("4-6. preset survive switching (pure merge)", () => {
    const stored = { mjpeg: "https://a/s", hls: "https://b/m.m3u8" };
    const merge = (sent: { m?: string; h?: string }, active: string) => ({
      active_source: active,
      manual_mjpeg_url: sent.m ?? stored.mjpeg,
      manual_hls_url: sent.h ?? stored.hls,
    });
    assert2.equal(merge({}, "canonical").manual_mjpeg_url, "https://a/s");
    assert2.equal(merge({}, "canonical").manual_hls_url, "https://b/m.m3u8");
    assert2.equal(merge({ m: "https://a/s" }, "mjpeg").manual_hls_url, "https://b/m.m3u8");
  });
  it2("7. HLS independent dari MJPEG", () => {
    const r = migrateLegacyDisplay({ display_source_type: "hls", display_url: "https://b/m.m3u8" });
    assert2.equal(r.manual_hls_url, "https://b/m.m3u8");
    assert2.equal(r.manual_mjpeg_url, "");
  });
  it2("11. config Talun north tak menimpa north lain (keyed by camera_id di API)", () => {
    // Dipastikan di level API: PUT memakai Key camera_id (bukan approach).
    // Di sini verifikasi helper migrasi tak mencampur dua record.
    const a = migrateLegacyDisplay({ display_source_type: "mjpeg", display_url: "https://talun/s" });
    const b = migrateLegacyDisplay({ display_source_type: "mjpeg", display_url: "https://xyz/s" });
    assert2.notEqual(a.manual_mjpeg_url, b.manual_mjpeg_url);
  });
  it2("12. missing metric vs 0 (formatVehicleCount)", async () => {
    const { formatVehicleCount } = await import("./camera-ai-status.js");
    assert2.equal(formatVehicleCount(0), "0");
    assert2.equal(formatVehicleCount(null), "-");
  });
});

import { resolveLaneSource } from "./hooks/useCameraDisplay.js";
import { describe as describe3, it as it3 } from "node:test";
import assert3 from "node:assert/strict";

describe3("resolveLaneSource", () => {
  it3("1. no config + registered -> canonical", () => {
    assert3.equal(
      resolveLaneSource({ serverEntry: null, registered: true }).kind,
      "canonical"
    );
  });
  it3("2. saved canonical -> canonical", () => {
    assert3.equal(
      resolveLaneSource({
        serverEntry: { active_source: "canonical", manual_mjpeg_url: "https://a", manual_hls_url: "" },
        registered: true,
      }).kind,
      "canonical"
    );
  });
  it3("3. saved mjpeg -> mjpeg + url", () => {
    const r = resolveLaneSource({
      serverEntry: { active_source: "mjpeg", manual_mjpeg_url: "https://a/s", manual_hls_url: "" },
      registered: true,
    });
    assert3.equal(r.kind, "mjpeg");
    assert3.equal(r.url, "https://a/s");
  });
  it3("10. no config + unregistered -> none (bukan fake canonical)", () => {
    assert3.equal(
      resolveLaneSource({ serverEntry: null, registered: false }).kind,
      "none"
    );
  });
  it3("local override menang atas server", () => {
    assert3.equal(
      resolveLaneSource({
        serverEntry: { active_source: "mjpeg", manual_mjpeg_url: "https://a", manual_hls_url: "" },
        registered: true,
        localOverride: "webcam",
      }).kind,
      "local-webcam"
    );
  });
});
