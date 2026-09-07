"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/useT";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface Camera {
  camera_id: string;
  intersection_id: string;
  approach_id: string;
  enabled: boolean;
  firmware_version?: string;
  status?: "ONLINE" | "STALE" | "OFFLINE" | "UNKNOWN";
  connected?: boolean | null;
  fresh?: boolean | null;
  frame_age_s?: number | null;
  last_seen?: string;
  fps_ingest?: number;
}

export default function CamerasPage() {
  const t = useT();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "operator";
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ camera_id: "", intersection_id: "SIMPANG_TALUN_01", approach_id: "north" });
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // Live status server-side (registry + Server 2); bukan health_state basi.
      const res = await fetch("/api/cameras/live");
      const json = await res.json();
      if (json.success) {
        setCameras(json.data);
        setError("");
      } else setError(json.error || "Gagal memuat");
    } catch {
      setError("Gagal memuat");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Polling live 4 detik (L); tanpa spinner agar tidak kedip.
    const timer = setInterval(() => load(false), 4000);
    return () => clearInterval(timer);
  }, [load]);

  const provision = async () => {
    setError("");
    setNewToken(null);
    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Gagal provisioning");
        return;
      }
      setNewToken(json.data.token);
      setForm({ ...form, camera_id: "" });
      load();
    } catch {
      setError("Gagal provisioning");
    }
  };

  return (
    <DashboardLayout title={t("cameras.title") || "Kamera"}>
      <div className="p-3 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-extrabold text-slate-800 mb-1">
            {t("cameras.listTitle") || "Kamera terdaftar"}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {t("cameras.listDesc") || "Satu kamera per pendekatan. Token hanya tampil sekali saat provisioning."}
          </p>
          {loading ? (
            <p className="text-sm text-slate-500">Memuat...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Camera ID</th>
                    <th className="py-2">Persimpangan</th>
                    <th className="py-2">Pendekatan</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Frame age</th>
                    <th className="py-2">FPS</th>
                    <th className="py-2">Terakhir terlihat</th>
                  </tr>
                </thead>
                <tbody>
                  {cameras.map((c) => (
                    <tr key={c.camera_id} className="border-b border-slate-100">
                      <td className="py-2 font-mono text-xs">{c.camera_id}</td>
                      <td className="py-2">{c.intersection_id}</td>
                      <td className="py-2 capitalize">{c.approach_id}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "ONLINE"
                              ? "bg-emerald-100 text-emerald-700"
                              : c.status === "STALE"
                                ? "bg-amber-100 text-amber-700"
                                : c.status === "OFFLINE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {c.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="py-2 text-xs tabular-nums">
                        {c.frame_age_s === null || c.frame_age_s === undefined
                          ? "-"
                          : `${Number(c.frame_age_s).toFixed(1)}s`}
                      </td>
                      <td className="py-2">{c.fps_ingest ?? "-"}</td>
                      <td className="py-2 text-xs text-slate-500">{c.last_seen || "-"}</td>
                    </tr>
                  ))}
                  {cameras.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        Belum ada kamera
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {role === "admin" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">
              {t("cameras.provisionTitle") || "Provisioning kamera baru"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="CAM_TALUN_WEST_01"
                value={form.camera_id}
                onChange={(e) => setForm({ ...form, camera_id: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="SIMPANG_TALUN_01"
                value={form.intersection_id}
                onChange={(e) => setForm({ ...form, intersection_id: e.target.value })}
              />
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={form.approach_id}
                onChange={(e) => setForm({ ...form, approach_id: e.target.value })}
              >
                {["north", "south", "east", "west"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {newToken && (
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
                <p className="text-xs font-bold text-amber-800 mb-1">
                  {t("cameras.tokenOnce") || "Token (catat sekali, masukkan ke firmware via SoftAP/serial):"}
                </p>
                <code className="text-xs break-all select-all">{newToken}</code>
              </div>
            )}
            <button
              onClick={provision}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              {t("cameras.provision") || "Buat kamera + token"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
