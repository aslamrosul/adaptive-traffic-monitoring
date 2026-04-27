"use client";

import DashboardLayout from "@/components/DashboardLayout";
import IoTConfigPanel from "@/components/IoTConfigPanel";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function IoTConfigPage() {
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
        setSelectedIndex(0); // Always select first item
      }
    } catch (error) {
      console.error('Error loading intersections:', error);
      toast.error('Gagal memuat data persimpangan');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIntersection = intersections[selectedIndex];

  // Filter intersections based on search query
  const filteredIntersections = intersections.filter(intersection =>
    intersection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intersection.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intersection.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Remote Configuration IoT">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Remote Configuration untuk Smart Traffic Light</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Atur durasi lampu lalu lintas berdasarkan jumlah kendaraan secara real-time. 
                  Konfigurasi akan disimpan ke database dan dikirim ke ESP32 melalui MQTT/API.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-blue-700">
                    ✓ Real-time Update
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-blue-700">
                    ✓ MQTT Integration
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-blue-700">
                    ✓ Auto Sync
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Device Selector - Searchable Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <h3 className="font-bold text-slate-900 mb-4">Pilih Perangkat IoT</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : intersections.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">device_hub</span>
                <p>Belum ada perangkat IoT terdaftar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Searchable Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-blue-600">router</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {selectedIntersection?.name || 'Pilih Persimpangan'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {selectedIntersection?.deviceId || 'Tidak ada device dipilih'}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {/* Search Bar */}
                      <div className="p-3 border-b border-slate-200 bg-slate-50">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            search
                          </span>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari persimpangan atau device ID..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Intersection List */}
                      <div className="max-h-80 overflow-y-auto">
                        {filteredIntersections.length === 0 ? (
                          <div className="p-8 text-center text-slate-500">
                            <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                            <p className="text-sm">Tidak ada hasil untuk "{searchQuery}"</p>
                          </div>
                        ) : (
                          filteredIntersections.map((intersection, index) => {
                            // Find the actual index in the original array
                            const actualIndex = intersections.findIndex(i => i.id === intersection.id);
                            const isSelected = selectedIndex === actualIndex;
                            
                            return (
                              <button
                                key={`int-${actualIndex}-${intersection.id}`}
                                onClick={() => {
                                  setSelectedIndex(actualIndex);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                                  isSelected ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-blue-600' : 'bg-slate-200'
                                }`}>
                                  {isSelected ? (
                                    <span className="material-symbols-outlined text-white text-sm">check</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-slate-500 text-sm">router</span>
                                  )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <p className={`font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {intersection.name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate mb-1">
                                    {intersection.address}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      intersection.status === 'active' ? 'bg-green-500' : 'bg-slate-300'
                                    }`}></span>
                                    <span className="text-xs font-mono text-slate-600">
                                      {intersection.deviceId}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <p className="text-xs text-slate-500 text-center">
                          {filteredIntersections.length} dari {intersections.length} perangkat
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Selected Device Info Card */}
                {selectedIntersection && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-xl">settings_remote</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 mb-1">{selectedIntersection.name}</h4>
                        <p className="text-sm text-blue-700 mb-2">{selectedIntersection.address}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">memory</span>
                            {selectedIntersection.deviceId}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                            selectedIntersection.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              selectedIntersection.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                            }`}></span>
                            {selectedIntersection.status === 'active' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Configuration Panel */}
          {selectedIntersection && (
            <motion.div
              key={`config-${selectedIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <IoTConfigPanel
                deviceId={selectedIntersection.deviceId}
                intersectionId={selectedIntersection.id}
                onConfigSaved={(config) => {
                  console.log('Config saved:', config);
                }}
              />
            </motion.div>
          )}

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">lightbulb</span>
              Cara Kerja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Atur Konfigurasi</h4>
                  <p className="text-sm text-slate-600">
                    Tentukan batas kendaraan dan durasi lampu untuk setiap kondisi lalu lintas
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Simpan ke Database</h4>
                  <p className="text-sm text-slate-600">
                    Konfigurasi disimpan ke Azure Cosmos DB dan siap dikirim ke perangkat
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">ESP32 Terima Data</h4>
                  <p className="text-sm text-slate-600">
                    ESP32 menerima konfigurasi via MQTT/API dan menerapkan aturan baru
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
  );
}
