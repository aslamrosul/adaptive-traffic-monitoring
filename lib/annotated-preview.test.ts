// Tests: npx tsx --test lib/annotated-preview.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextStageOnError } from "../components/AnnotatedPreview.js";

describe("nextStageOnError", () => {
  it("annotated gagal -> raw (CASE B)", () => {
    assert.equal(nextStageOnError("annotated"), "raw");
  });
  it("raw gagal -> unavailable, bukan dead permanen (CASE D)", () => {
    assert.equal(nextStageOnError("raw"), "unavailable");
    assert.equal(nextStageOnError("unavailable"), "unavailable");
  });
});
