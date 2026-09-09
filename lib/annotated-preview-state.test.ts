// Tests: npx tsx --test lib/annotated-preview-state.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  annotatedUrl,
  initPreview,
  previewNext,
  rawUrl,
} from "./annotated-preview-state.js";

describe("previewNext", () => {
  it("1. annotated sukses langsung", () => {
    let st = initPreview("C1", 1);
    assert.ok(st.pendingUrl?.includes("/annotated"));
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 1));
    assert.equal(st.pendingUrl, null);
  });
  it("2. annotated gagal -> raw siklus sama", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, rawUrl("C1", 1));
    assert.equal(st.visibleUrl, null);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, rawUrl("C1", 1));
  });
  it("3. raw gagal tanpa frame lama -> pending null (placeholder)", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, null);
    assert.equal(st.visibleUrl, null);
  });
  it("4. raw gagal TAPI frame lama ada -> frame lama bertahan", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    const good = st.visibleUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, null);
  });
  it("5. tick berikut coba annotated lagi + pulih otomatis", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 2));
  });
  it("6. respons basi diabaikan (anti overwrite silang)", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    const stale = annotatedUrl("C1", 1);
    const before = st;
    st = previewNext(st, { type: "load", url: stale });
    assert.equal(st, before);
    st = previewNext(st, { type: "error", url: stale });
    assert.equal(st, before);
  });
  it("7. ganti kamera: frame lama dibuang, mulai bersih", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    st = previewNext(st, { type: "tick", cameraId: "C2", tick: 1 });
    assert.equal(st.visibleUrl, null);
    assert.equal(st.pendingUrl, annotatedUrl("C2", 1));
  });
  it("8. visible image TIDAK di-key/remount oleh polling tick", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "..", "components", "AnnotatedPreview.tsx"), "utf8");
    assert.ok(!src.includes("${cameraId}-${tick}"));
    assert.ok(!/key=\{[^}]*tick[^}]*\}/.test(src));
    assert.ok(src.includes("visibleUrl"));
    assert.ok(src.includes("new Image()"));
  });
});
