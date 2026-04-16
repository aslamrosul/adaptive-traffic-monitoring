"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function PetaPage() {
  const [intersections, setIntersections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIntersections();
  }, []);

  const fetchIntersections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/intersections");
      const result = await response.json();

      if (result.success) {
        setIntersections(result.data);
      } else {
        toast.error("Gagal memuat data persimpangan");
      }
    } catch (error) {
      console.error("Error fetching intersections:", error);
      toast.error("Gagal memuat data persimpangan");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "green-600";
      case "maintenance":
        return "amber-500";
      case "offline":
        return "tertiary";
      default:
        return "slate-400";
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Lancar";
      case "maintenance":
        return "Pemeliharaan";
      case "offline":
        return "Offline";
      default:
        return status;
    }
  };

  // Helper function to calculate position (simple grid layout)
  const getPosition = (index: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      top: `${20 + (row * 60 / Math.ceil(total / cols))}%`,
      left: `${20 + (col * 60 / cols)}%`,
    };
  };
  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen relative flex flex-col">
        <Header title="Sistem Pantauan Lalu Lintas" />

        <section className="flex-1 relative overflow-hidden bg-slate-200">
          {/* Map Background */}
          <div className="absolute inset-0 w-full h-full bg-slate-300">
            <svg
              className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 1000 1000"
            >
              <path
                d="M0,500 L1000,500 M500,0 L500,1000 M200,0 L200,1000 M800,0 L800,1000"
                fill="none"
                stroke="#0040a1"
                strokeWidth="4"
              />
            </svg>

            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-300/50">
                <div className="bg-white p-6 rounded-xl shadow-xl">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-600 text-sm">Memuat peta...</p>
                </div>
              </div>
            )}

            {/* Markers */}
            {!isLoading && intersections.map((intersection, idx) => {
              const position = intersection.location 
                ? { 
                    top: `${50 + (intersection.location.lat + 6.2) * 100}%`, 
                    left: `${50 + (intersection.location.lng - 106.8) * 100}%` 
                  }
                : getPosition(idx, intersections.length);
              
              const statusColor = getStatusColor(intersection.status);
              const statusLabel = getStatusLabel(intersection.status);

              return (
              <div
                key={intersection.id}
                className="absolute group cursor-pointer z-10"
                style={position}
              >
                <div className="relative flex flex-col items-center">
                  {statusColor === "tertiary" && (
                    <div className="marker-pulse absolute -inset-2 bg-tertiary/20 rounded-full blur-sm"></div>
                  )}
                  <div
                    className={`w-10 h-10 bg-${statusColor} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white relative z-10`}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      traffic
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-4 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-headline font-bold text-slate-900">{intersection.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                          statusLabel === "Lancar"
                            ? "bg-green-100 text-green-700"
                            : statusLabel === "Pemeliharaan"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-tertiary/10 text-tertiary"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Device ID</span>
                        <span className="font-bold text-slate-900">{intersection.deviceId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Jalur</span>
                        <span className="font-bold text-slate-900">{intersection.lanes?.count || 4} jalur</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Mode</span>
                        <span className="font-bold text-slate-900 uppercase">{intersection.config?.mode || "auto"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Map Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-3">
            <div className="flex flex-col bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
              <button className="p-3 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="p-3 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-10 right-6 w-72 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl shadow-2xl text-white border border-white/10">
            <h3 className="font-headline font-bold text-sm mb-4 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">info</span>
              Legenda Kepadatan
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                  <span className="text-xs font-medium text-slate-300">Lancar</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">V/C &lt; 0.4</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-xs font-medium text-slate-300">Sedang</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">0.4 - 0.7</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_10px_rgba(147,0,13,0.5)]"></div>
                  <span className="text-xs font-medium text-slate-300">Padat</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">V/C &gt; 0.7</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
