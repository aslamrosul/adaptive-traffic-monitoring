"use client";

import Header from "@/components/Header";
import IoTConfigPanel from "@/components/IoTConfigPanel";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function IoTConfigPage() {
  const [intersections, setIntersections] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50">
        <Header title="Remote Configuration IoT" />

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

          {/* Device Selector */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intersections.map((intersection, index) => {
                  // Use index for selection to ensure only one is selected
                  const isSelected = selectedIndex === index;
                  
                  return (
                    <button
                      key={`int-${index}-${intersection.id}`}
                      onClick={() => setSelectedIndex(index)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{intersection.name}</h4>
                        {isSelected && (
                          <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{intersection.address}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          intersection.status === 'active' ? 'bg-green-500' : 'bg-slate-300'
                        }`}></span>
                        <span className="text-xs font-mono text-slate-600">{intersection.deviceId}</span>
                      </div>
                    </button>
                  );
                })}
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
      </main>
    </>
  );
}
