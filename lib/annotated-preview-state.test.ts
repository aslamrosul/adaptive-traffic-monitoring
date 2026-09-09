// Tests V6.7.3.1: npx tsx --test lib/annotated-preview-state.test.ts
// Single-flight: pending TIDAK diganti oleh tick, coalesce newest-wins,
// proses queued setelah siklus selesai. Tanpa backlog, tanpa starvation.
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

describe("previewNext single-flight V6.7.3.1", () => {
  it("1. tick saat annotated pending -> pending TIDAK diganti", () => {
    let st = initPreview("C1", 1);
    const pendingBefore = st.pendingUrl;
    assert.ok(pendingBefore?.includes("/annotated"));
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    // Pending request B (tick 1) tetap hidup, tidak diganti tick 2.
    assert.equal(st.pendingUrl, pendingBefore);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 1));
    assert.equal(st.pendingKind, "annotated");
    // Tick terbaru diingat sebagai antrian, visible tidak hilang.
    assert.equal(st.queuedTick, 2);
    assert.equal(st.tick, 1);
    assert.equal(st.visibleUrl, null);
  });

  it("2. multiple ticks saat pending -> coalesce ke newest saja", () => {
    let st = initPreview("C1", 1);
    const pendingBefore = st.pendingUrl;
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 4 });
    assert.equal(st.pendingUrl, pendingBefore);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 1));
    assert.equal(st.queuedTick, 4);
    // Tidak ada backlog: hanya satu slot antrian.
    assert.ok(!Array.isArray((st as unknown as Record<string, unknown>).queuedTick));
  });

  it("3. setelah load sukses -> queued terbaru langsung dimulai", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    // B (tick 1) selesai: swap A->B lalu request newest (3), lewati 2.
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 1) });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 1));
    assert.equal(st.visibleKind, "annotated");
    assert.equal(st.tick, 3);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    assert.equal(st.pendingKind, "annotated");
    assert.equal(st.queuedTick, null);
    // Selesaikan antrian: idle tanpa sisa.
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 3));
    assert.equal(st.pendingUrl, null);
    assert.equal(st.queuedTick, null);
  });

  it("4. setelah annotated+raw gagal -> queued terbaru dimulai", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    const good = st.visibleUrl;
    // Siklus tick 2 dimulai (idle -> langsung), lalu tick 3 datang saat sibuk.
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    assert.equal(st.queuedTick, 3);
    // Annotated 2 gagal -> raw 2 SIKLUS SAMA, queued tetap.
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, rawUrl("C1", 2));
    assert.equal(st.pendingKind, "raw");
    assert.equal(st.queuedTick, 3);
    assert.equal(st.visibleUrl, good);
    // Raw 2 gagal -> siklus selesai gagal, langsung mulai queued 3.
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.tick, 3);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    assert.equal(st.queuedTick, null);
  });

  it("5. visible frame tidak pernah hilang (last-good retention)", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    const good = st.visibleUrl;
    assert.ok(good);
    // Tick saat idle -> mulai baru, visible lama tetap selama pending.
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.visibleUrl, good);
    // Gagal total tanpa antrian -> visible tetap, pending null (bukan blank).
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, null);
    // Tick saat pending juga tidak boleh mengosongkan visible.
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    // Idle -> langsung pending baru, visible tetap.
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 4 });
    // Sibuk -> queued, visible tetap.
    assert.equal(st.visibleUrl, good);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 3));
    assert.equal(st.queuedTick, 4);
  });

  it("6. annotated recovery menggantikan raw frame", () => {
    let st = initPreview("C1", 1);
    // Annotated 1 gagal -> raw 1, raw sukses -> visible raw.
    st = previewNext(st, { type: "error", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, rawUrl("C1", 1));
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, rawUrl("C1", 1));
    assert.equal(st.visibleKind, "raw");
    // Tick berikut (idle) retry annotated, sukses -> kembali annotated.
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.visibleUrl, annotatedUrl("C1", 2));
    assert.equal(st.visibleKind, "annotated");
  });

  it("7. respons basi tidak bisa overwrite frame", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    // Pending masih tick 1; respons untuk tick 2 (belum diminta) adalah basi.
    const before = st;
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 2) });
    assert.equal(st, before);
    st = previewNext(st, { type: "error", url: annotatedUrl("C1", 2) });
    assert.equal(st, before);
    assert.equal(st.pendingUrl, annotatedUrl("C1", 1));
    // Selesaikan tick 1 -> mulai queued 2; respons lama tick 1 kini basi.
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 1) });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    const afterQueue = st;
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 1) });
    assert.equal(st, afterQueue);
    st = previewNext(st, { type: "error", url: rawUrl("C1", 1) });
    assert.equal(st, afterQueue);
  });

  it("8. ganti cameraId: batalkan/isolasi kamera lama", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.ok(st.visibleUrl);
    // Sibuk + antrian, lalu ganti kamera -> bersih total.
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 3 });
    assert.equal(st.queuedTick, 3);
    st = previewNext(st, { type: "tick", cameraId: "C2", tick: 1 });
    assert.equal(st.cameraId, "C2");
    assert.equal(st.visibleUrl, null);
    assert.equal(st.pendingUrl, annotatedUrl("C2", 1));
    assert.equal(st.queuedTick, null);
    // Respons kamera lama basi -> diabaikan.
    const before = st;
    st = previewNext(st, { type: "load", url: annotatedUrl("C1", 1) });
    assert.equal(st, before);
    st = previewNext(st, { type: "error", url: annotatedUrl("C1", 3) });
    assert.equal(st, before);
  });

  it("9. idle tick langsung mulai annotated (tanpa antre)", () => {
    let st = initPreview("C1", 1);
    st = previewNext(st, { type: "load", url: st.pendingUrl! });
    assert.equal(st.pendingUrl, null);
    st = previewNext(st, { type: "tick", cameraId: "C1", tick: 2 });
    assert.equal(st.pendingUrl, annotatedUrl("C1", 2));
    assert.equal(st.queuedTick, null);
    assert.equal(st.tick, 2);
  });

  it("10. komponen single-flight: pending stabil + visible tidak di-key tick", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "..", "components", "AnnotatedPreview.tsx"), "utf8");
    assert.ok(!src.includes("${cameraId}-${tick}"));
    assert.ok(!/key=\{[^}]*tick[^}]*\}/.test(src));
    assert.ok(src.includes("visibleUrl"));
    assert.ok(src.includes("new Image()"));
    // Kontrak single-flight V6.7.3.1 wajib ada di komponen.
    assert.ok(src.includes("queuedTick"), "komponen harus memakai queuedTick");
    assert.ok(
      src.includes("pendingUrl") && src.includes("useEffect"),
      "preload harus berbasis pendingUrl stabil"
    );
  });
});
