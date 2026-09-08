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
    assert.equal(r.config?.url, "");
  });
  it("mjpeg valid dengan https URL", () => {
    const r = validateDisplayConfig({ source_type: "mjpeg", url: "https://x/y/stream" });
    assert.equal(r.ok, true);
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
