"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export interface Crossing {
  crossing_id: string;
  name?: string;
  conflicting_movement_groups: string[];
  enabled: boolean;
  request_mode: "DISABLED" | "FIXED_PHASE" | "BUTTON_REQUEST" | "VISION_REQUEST";
  walk_s: number;
  clearance_s: number;
  min_vehicle_red_s: number;
}

// Panel pejalan kaki (PRD §22, Phase 9): data model + simulasi permintaan.
// Tanpa lampu fisik: simulasi menandai fase WALK + menahan gerakan konflik (tampilan).
export default function PedestrianPanel({
  intersectionId,
  initial,
  onSaved,
}: {
  intersectionId: string;
  initial: Crossing[];
  onSaved: () => void;
}) {
  const [crossings, setCrossings] = useState<Crossing[]>(initial || []);
  const [sim, setSim] = useState<{ crossing_id: string; until: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (next: Crossing[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/intersections/${intersectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedestrian_crossings: next }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan");
      setCrossings(next);
      onSaved();
      toast.success("Konfigurasi pejalan kaki tersimpan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const addCrossing = () => {
    const id = `CROSS_${String(crossings.length + 1).padStart(2, "0")}`;
    save([
      ...crossings,
      {
        crossing_id: id,
        name: `Penyeberangan ${crossings.length + 1}`,
        conflicting_movement_groups: ["N_ALL", "S_ALL", "E_ALL"],
        enabled: false,
        request_mode: "DISABLED",
        walk_s: 10,
        clearance_s: 5,
        min_vehicle_red_s: 15,
      },
    ]);
  };

  const simulate = (c: Crossing) => {
    if (!c.enabled || c.request_mode === "DISABLED") {
      toast.error("Aktifkan crossing dan pilih mode selain DISABLED dulu");
      return;
    }
    const until = Date.now() + (c.walk_s + c.clearance_s) * 1000;
    setSim({ crossing_id: c.crossing_id, until });
    toast.success(`Simulasi WALK ${c.crossing_id}: gerakan konflik ditahan merah`);
  };

  const simActive = sim && sim.until > Date.now() ? sim : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-800">🚶 Pejalan Kaki (pedestrian-ready)</h3>
        <button
          onClick={addCrossing}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
        >
          + Tambah penyeberangan
        </button>
      </div>
      {simActive && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-sm font-bold text-emerald-700">
          WALK aktif: {simActive.crossing_id} — gerakan konflik ditahan merah (simulasi, tanpa lampu fisik).
        </div>
      )}
      {crossings.length === 0 && (
        <p className="text-sm text-slate-400">Belum ada penyeberangan. Tanpa lampu fisik terpasang (sesuai PRD).</p>
      )}
      {crossings.map((c, i) => (
        <div key={c.crossing_id} className="border border-slate-200 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="font-mono text-xs font-bold">{c.crossing_id}</div>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={c.enabled}
              onChange={() => {
                const next = [...crossings];
                next[i] = { ...c, enabled: !c.enabled };
                save(next);
              }}
            />
            Aktif
          </label>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={c.request_mode}
            onChange={(e) => {
              const next = [...crossings];
              next[i] = { ...c, request_mode: e.target.value as Crossing["request_mode"] };
              save(next);
            }}
          >
            {["DISABLED", "FIXED_PHASE", "BUTTON_REQUEST", "VISION_REQUEST"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={() => simulate(c)}
            className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
          >
            Simulasi request
          </button>
          <div className="col-span-2 md:col-span-4 text-xs text-slate-500">
            walk {c.walk_s}s + clearance {c.clearance_s}s • konflik:{" "}
            {(c.conflicting_movement_groups || []).join(", ")}
          </div>
        </div>
      ))}
    </div>
  );
}
