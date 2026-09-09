// Tests V6.7.3.1: npx tsx --test lib/annotated-preview.test.ts
// Mencakup 8 kasus wajib single-flight: pending dipertahankan across ticks,
// coalesce newest, proses queued setelah siklus, retention, recovery,
// anti-stale, isolasi kamera, + kontrak komponen anti-flicker.
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

describe("annotated preview V6.7.3.1 (single-flight)", () => {
  it("1. tick saat annotated pending -> pending TIDAK diganti", () => {
    let st = initPreview("C1", 1);
    const pending = st.pendingUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.pendingUrl, pending);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 1));
    assert.equal(st.queuedTick, 2);
    assert.equal(st.tick, 1);
  });

  it("2. multiple ticks saat pending -> coalesce ke newest", () => {
    let st = initPreview("C1", 1);
    const pending = st.pendingUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 4 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 5 });
    assert.equal(st.pendingUrl, pending);
    assert.equal(st.queuedTick, 5);
  });

  it("3. setelah load sukses -> queued terbaru dimulai", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 1) });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 1));
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    assert.equal(st.queuedTick, null);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 3));
    assert.equal(st.pendingUrl, null);
  });

  it("4. setelah annotated+raw gagal -> queued terbaru dimulai", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    const good = st.visibleUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, rawUrl("C1", 2));
    assert.equal(st.queuedTick, 3);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    assert.equal(st.queuedTick, null);
  });

  it("5. visible tidak pernah hilang", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    const good = st.visibleUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.visibleUrl, good);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, rawUrl("C1", 2));
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, null);
  });

  it("6. annotated recovery menggantikan raw", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleKind, "raw");
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 2));
    assert.equal(st.visibleKind, "annotated");
  });

  it("7. respons basi diabaikan", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    const before = st;
    // Queued tick belum diminta -> basi.
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 2) });
    assert.equal(st, before);
    st = previewNext(st, { type: "error", url: annotatedUrl("C1", 2) });
    assert.equal(st, before);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 1));
  });

  it("8. ganti cameraId isolasi + batalkan kamera lama", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.ok(st.visibleUrl);
    st = previewNext(st, { type: "tick", cameraId: "C2", tick: 1 });
    assert.equal(st.visibleUrl, null);
    assert.equal(st.cameraId, "C2");
    assert.equal(st.pendingUrl, annotatedUrl("C2", 1));
    assert.equal(st.queuedTick, null);
  });

  it("9. visible image TIDAK di-key/remount oleh polling tick + single-flight", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "..", "components", "AnnotatedPreview.tsx"), "utf8");
    // Pola lama penyebab flicker/starvation DILARANG muncul:
    assert.ok(
      !src.includes("${cameraId}-${tick}"),
      "visible <img> tidak boleh memakai key `${cameraId}-${tick}-...`"
    );
    assert.ok(
      !/key=\{[^}]*tick[^}]*\}/.test(src),
      "tidak boleh ada key yang mengandung tick"
    );
    // Double-buffer + single-flight wajib ada.
    assert.ok(src.includes("visibleUrl"), "harus ada last-good-frame visibleUrl");
    assert.ok(
      src.includes("new Image()"),
      "harus preload background via browser Image()"
    );
    assert.ok(src.includes("queuedTick"), "harus ada coalesce queuedTick");
  });
});
