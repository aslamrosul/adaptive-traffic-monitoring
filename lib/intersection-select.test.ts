// Tests: npx tsx --test lib/intersection-select.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInitialIntersection } from "./intersection-select.js";

describe("resolveInitialIntersection", () => {
  it("Talun ada -> Talun", () => {
    assert.equal(
      resolveInitialIntersection([
        { id: "X", status: "active" },
        { id: "SIMPANG_TALUN_01", status: "active" },
      ]),
      "SIMPANG_TALUN_01"
    );
  });
  it("Talun absen -> aktif pertama", () => {
    assert.equal(
      resolveInitialIntersection([
        { id: "A", status: "inactive" },
        { id: "B", status: "active" },
      ]),
      "B"
    );
  });
  it("tak ada aktif -> pertama tersedia", () => {
    assert.equal(resolveInitialIntersection([{ id: "A", status: "inactive" }]), "A");
  });
  it("list kosong -> all", () => {
    assert.equal(resolveInitialIntersection([]), "all");
    assert.equal(resolveInitialIntersection(null), "all");
  });
});
