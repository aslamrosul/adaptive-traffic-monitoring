"use client";

import DashboardLayout from "@/components/DashboardLayout";
import IoTConfigPanel from "@/components/IoTConfigPanel";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useT } from "@/lib/useT";

export default function IoTConfigPage() {
  const t = useT();
  const [intersections, setIntersections] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadIntersections();
  }, []);

  const loadIntersections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/intersections');
      const data = await response.json();

      if (data.success) {
        setIntersections(data.data);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error loading intersections:', error);
      toast.error(t('errors.loadData') || 'Gagal memuat data persimpangan');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIntersection = intersections[selectedIndex];

  // Filter intersections based on search query
  const filteredIntersections = intersections.filter((intersection) => {
    const query = searchQuery.trim().toLowerCase();

    return (
      String(intersection.name || "")
        .toLowerCase()
        .includes(query) ||
      String(intersection.deviceId || intersection.device_id || "")
        .toLowerCase()
        .includes(query) ||
      String(intersection.address || "")
        .toLowerCase()
        .includes(query) ||
      String(intersection.id || intersection.intersection_id || "")
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <DashboardLayout title="Remote Configuration IoT">
      <div className="p-3 lg:p-6 space-y-3 max-w-[1920px] mx-auto">
        {/* Info Banner — collapsible on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 border border-blue-400 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Mobile: compact one-liner */}
          <div className="flex items-center gap-2 p-2.5 lg:hidden">
            <span className="material-symbols-outlined text-white text-base shrink-0">info</span>
            <p className="text-white text-xs font-semibold flex-1 truncate">
              Remote Config Smart Traffic Light
            </p>
            <div className="flex gap-1 shrink-0">
              {["Real-time", "MQTT", "Auto Sync"].map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-white/20 rounded-full text-[9px] font-semibold text-white">
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
          {/* Desktop: full banner */}
          <div className="hidden lg:block p-3">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-lg">info</span>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1 text-xs">Remote Configuration untuk Smart Traffic Light</h3>
                <p className="text-blue-100 text-[10px] leading-relaxed">
                  Atur durasi lampu lalu lintas berdasarkan jumlah kendaraan secara real-time.
                  Konfigurasi akan disimpan ke database dan dikirim ke ESP32 melalui MQTT/API.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Real-time", "MQTT", "Auto Sync"].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[9px] font-semibold text-white">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column - Device List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Device Selector */}
            <div className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-base">devices</span>
                Pilih Perangkat IoT
              </h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : intersections.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">device_hub</span>
                  <p className="text-sm">Belum ada perangkat IoT terdaftar</p>
                </div>
              ) : (
                <div>
                  {/* Mobile: Compact Dropdown */}
                  <div className="lg:hidden">
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-300 rounded-lg transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2 flex-1 text-left min-w-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-white text-base">router</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-xs">
                              {selectedIntersection?.name || 'Pilih Persimpangan'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {selectedIntersection?.deviceId || 'Tidak ada device dipilih'}
                            </p>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 text-base transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <div className="p-2.5 border-b border-slate-200 bg-slate-50">
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari perangkat..."
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {filteredIntersections.length === 0 ? (
                              <div className="p-6 text-center text-slate-500">
                                <p className="text-xs">Tidak ada hasil untuk "{searchQuery}"</p>
                              </div>
                            ) : (
                              filteredIntersections.map((intersection) => {
                                const actualIndex = intersections.findIndex(i => i.id === intersection.id);
                                const isSelected = selectedIndex === actualIndex;
                                return (
                                  <button
                                    key={`int-mobile-${actualIndex}-${intersection.id}`}
                                    onClick={() => {
                                      setSelectedIndex(actualIndex);
                                      setIsDropdownOpen(false);
                                      setSearchQuery("");
                                    }}
                                    className={`w-full p-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                      <span className={`material-symbols-outlined text-base ${isSelected ? 'text-white' : 'text-slate-500'}`}>router</span>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <p className={`font-semibold text-xs truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{intersection.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${intersection.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                        <span className="text-[10px] font-mono text-slate-500 truncate">{intersection.deviceId}</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                          <div className="p-2 bg-slate-50 border-t border-slate-200">
                            <p className="text-[10px] text-slate-500 text-center">{filteredIntersections.length} dari {intersections.length} perangkat</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Desktop: Full List */}
                  <div className="hidden lg:block">
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari perangkat..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredIntersections.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                          <p className="text-sm">Tidak ada hasil untuk "{searchQuery}"</p>
                        </div>
                      ) : (
                        filteredIntersections.map((intersection) => {
                          const actualIndex = intersections.findIndex(i => i.id === intersection.id);
                          const isSelected = selectedIndex === actualIndex;
                          return (
                            <button
                              key={`int-desktop-${actualIndex}-${intersection.id}`}
                              onClick={() => setSelectedIndex(actualIndex)}
                              className={`w-full p-3 flex items-start gap-3 rounded-lg transition-all border-2 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-white' : 'text-slate-500'}`}>router</span>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{intersection.name}</p>
                                <p className="text-xs text-slate-500 truncate mb-1">{intersection.address}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${intersection.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                  <span className="text-xs font-mono text-slate-600 truncate">{intersection.deviceId}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">{filteredIntersections.length} dari {intersections.length} perangkat</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Configuration Panel */}
          <div className="lg:col-span-9 space-y-3">
            {selectedIntersection ? (
              <>
                {/* Selected Device Info Card — compact on mobile */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-base">settings_remote</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-blue-900 text-sm truncate">{selectedIntersection.name}</h4>
                        <p className="text-xs text-blue-700 truncate">{selectedIntersection.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">memory</span>
                        <span className="hidden sm:inline">{selectedIntersection.deviceId}</span>
                        <span className="sm:hidden">{(selectedIntersection.deviceId || '').slice(-6)}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${selectedIntersection.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedIntersection.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {selectedIntersection.status === 'active' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Configuration Panel */}
                <motion.div
                  key={`config-${selectedIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <IoTConfigPanel
                    deviceId={selectedIntersection.deviceId || selectedIntersection.device_id}
                    intersectionId={selectedIntersection.id || selectedIntersection.intersection_id}
                    onConfigSaved={(config) => { console.log('Config saved:', config); }}
                  />
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center"
              >
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">settings_remote</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Pilih Perangkat IoT</h3>
                <p className="text-slate-500">Pilih perangkat dari daftar di sebelah kiri untuk mengatur konfigurasi</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* How It Works — hidden on mobile to reduce scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="hidden lg:block bg-white rounded-xl p-6 shadow-sm border border-slate-200"
        >
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">lightbulb</span>
            Cara Kerja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Atur Konfigurasi", desc: "Tentukan batas kendaraan dan durasi lampu untuk setiap kondisi lalu lintas" },
              { step: "2", title: "Simpan ke Database", desc: "Konfigurasi disimpan ke DynamoDB dan dikirim ke perangkat melalui Mosquitto MQTT" },
              { step: "3", title: "ESP32 Terima Data", desc: "ESP32 menerima konfigurasi via MQTT/API dan menerapkan aturan baru" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">{step}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                  <p className="text-sm text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
