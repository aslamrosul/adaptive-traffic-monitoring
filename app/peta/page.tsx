import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const markers = [
  {
    name: "Simpang Sudirman",
    status: "Macet Parah",
    volume: "4,200/jam",
    density: 89,
    color: "tertiary",
    position: { top: "35%", left: "45%" },
  },
  {
    name: "Simpang Thamrin",
    status: "Lancar",
    volume: "850/jam",
    density: 12,
    color: "green-600",
    position: { top: "20%", left: "25%" },
  },
  {
    name: "Simpang Kuningan",
    status: "Padat Merayap",
    volume: "2,100/jam",
    density: 55,
    color: "amber-500",
    position: { top: "60%", left: "60%" },
  },
  {
    name: "Simpang Gatot Subroto",
    status: "Macet Parah",
    volume: "3,850/jam",
    density: 82,
    color: "tertiary",
    position: { top: "75%", left: "30%" },
  },
];

export default function PetaPage() {
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

            {/* Markers */}
            {markers.map((marker, idx) => (
              <div
                key={idx}
                className="absolute group cursor-pointer z-10"
                style={marker.position}
              >
                <div className="relative flex flex-col items-center">
                  {marker.color === "tertiary" && (
                    <div className="marker-pulse absolute -inset-2 bg-tertiary/20 rounded-full blur-sm"></div>
                  )}
                  <div
                    className={`w-10 h-10 bg-${marker.color} rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white relative z-10`}
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
                      <h4 className="font-headline font-bold text-slate-900">{marker.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                          marker.status === "Lancar"
                            ? "bg-green-100 text-green-700"
                            : marker.status === "Padat Merayap"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-tertiary/10 text-tertiary"
                        }`}
                      >
                        {marker.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Volume Kendaraan</span>
                        <span className="font-bold text-slate-900">{marker.volume}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Kepadatan</span>
                        <span className="font-bold text-slate-900">{marker.density}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            marker.density > 70
                              ? "bg-tertiary"
                              : marker.density > 40
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${marker.density}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
