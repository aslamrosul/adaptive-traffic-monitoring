"use client";

// Badge status vision per persimpangan: NORMAL / DEGRADED / FALLBACK / UNKNOWN.
// Sumber: field vision_state + vision_fresh_lanes dari telemetri kanonis (DynamoDB).
export default function VisionStateBadge({
  state,
  freshLanes,
}: {
  state: string | null;
  freshLanes: number | null;
}) {
  const s = (state || "UNKNOWN").toUpperCase();
  const style =
    s === "NORMAL"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : s === "DEGRADED"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : s === "FALLBACK"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-slate-200 text-slate-600 border-slate-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style}`}
      title="Status vision: NORMAL=semua pendekatan fresh, DEGRADED=sebagian, FALLBACK=tidak ada"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Vision: {s}
      {freshLanes !== null && freshLanes !== undefined ? ` (${freshLanes})` : ""}
    </span>
  );
}
