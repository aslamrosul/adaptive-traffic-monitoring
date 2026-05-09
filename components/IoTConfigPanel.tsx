"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface TrafficRule {
  vehicleThreshold: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  description: string;
}

interface IoTConfig {
  id?: string;
  deviceId: string;
  intersectionId?: string;
  trafficLightConfig: {
    rules: TrafficRule[];
    defaultGreenDuration: number;
    defaultYellowDuration: number;
    defaultRedDuration: number;
    minCycleTime: number;
    maxCycleTime: number;
  };
  sensorConfig: {
    enabled: boolean;
    updateInterval: number;
    vehicleCountReset: number;
  };
  status?: string;
  updatedAt?: string;
  lastSyncedAt?: string | null;
}

interface IoTConfigPanelProps {
  deviceId: string;
  intersectionId?: string;
  onConfigSaved?: (config: IoTConfig) => void;
}

export default function IoTConfigPanel({ deviceId, intersectionId, onConfigSaved }: IoTConfigPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<IoTConfig>({
    deviceId,
    intersectionId,
    trafficLightConfig: {
      rules: [
        {
          vehicleThreshold: 10,
          greenDuration: 30,
          yellowDuration: 5,
          redDuration: 25,
          description: 'Lalu lintas rendah',
        },
        {
          vehicleThreshold: 20,
          greenDuration: 45,
          yellowDuration: 5,
          redDuration: 20,
          description: 'Lalu lintas sedang',
        },
        {
          vehicleThreshold: 30,
          greenDuration: 60,
          yellowDuration: 5,
          redDuration: 15,
          description: 'Lalu lintas tinggi',
        },
      ],
      defaultGreenDuration: 30,
      defaultYellowDuration: 5,
      defaultRedDuration: 25,
      minCycleTime: 60,
      maxCycleTime: 120,
    },
    sensorConfig: {
      enabled: true,
      updateInterval: 5000,
      vehicleCountReset: 60000,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load existing configuration
  useEffect(() => {
    loadConfig();
  }, [deviceId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/iot/config/${deviceId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/iot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          data.mqttSent 
            ? 'Konfigurasi berhasil disimpan dan dikirim ke ESP32!' 
            : 'Konfigurasi disimpan, tapi ESP32 mungkin offline'
        );
        if (onConfigSaved) {
          onConfigSaved(data.data);
        }
        // Reload to get updated lastSyncedAt
        await loadConfig();
      } else {
        toast.error(data.error || 'Gagal menyimpan konfigurasi');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Terjadi kesalahan saat menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-200">
      {/* Traffic Light Duration Rules */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-slate-900">Aturan Durasi Lampu Lalu Lintas</h4>
          <button
            onClick={() => {
              const newRule: TrafficRule = {
                vehicleThreshold: 40,
                greenDuration: 70,
                yellowDuration: 5,
                redDuration: 10,
                description: 'Lalu lintas sangat tinggi',
              };
              setConfig({
                ...config,
                trafficLightConfig: {
                  ...config.trafficLightConfig,
                  rules: [...config.trafficLightConfig.rules, newRule],
                },
              });
              toast.success('Aturan baru ditambahkan');
            }}
            className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-blue-50 rounded-lg font-semibold transition-all text-sm border border-primary"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Aturan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {config.trafficLightConfig.rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-primary transition-all"
            >
              {/* Header with Title and Delete Button */}
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={rule.description}
                  onChange={(e) => {
                    const newRules = [...config.trafficLightConfig.rules];
                    newRules[index].description = e.target.value;
                    setConfig({
                      ...config,
                      trafficLightConfig: {
                        ...config.trafficLightConfig,
                        rules: newRules,
                      },
                    });
                  }}
                  className="flex-1 text-base font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Nama aturan"
                />
                <button
                  onClick={() => {
                    if (config.trafficLightConfig.rules.length > 1) {
                      const newRules = config.trafficLightConfig.rules.filter((_, i) => i !== index);
                      setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          rules: newRules,
                        },
                      });
                      toast.success('Aturan dihapus');
                    } else {
                      toast.error('Minimal harus ada 1 aturan');
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus aturan"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>

              {/* Batas Kendaraan */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Batas Kendaraan
                </label>
                <input
                  type="number"
                  value={rule.vehicleThreshold}
                  onChange={(e) => {
                    const newRules = [...config.trafficLightConfig.rules];
                    newRules[index].vehicleThreshold = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      trafficLightConfig: {
                        ...config.trafficLightConfig,
                        rules: newRules,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                />
              </div>

              {/* Duration Inputs Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Hijau */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Hijau
                  </label>
                  <input
                    type="number"
                    value={rule.greenDuration}
                    onChange={(e) => {
                      const newRules = [...config.trafficLightConfig.rules];
                      newRules[index].greenDuration = parseInt(e.target.value) || 0;
                      setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          rules: newRules,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="5"
                  />
                </div>

                {/* Kuning */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Kuning
                  </label>
                  <input
                    type="number"
                    value={rule.yellowDuration}
                    onChange={(e) => {
                      const newRules = [...config.trafficLightConfig.rules];
                      newRules[index].yellowDuration = parseInt(e.target.value) || 0;
                      setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          rules: newRules,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="3"
                  />
                </div>

                {/* Merah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Merah
                  </label>
                  <input
                    type="number"
                    value={rule.redDuration}
                    onChange={(e) => {
                      const newRules = [...config.trafficLightConfig.rules];
                      newRules[index].redDuration = parseInt(e.target.value) || 0;
                      setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          rules: newRules,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="5"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Advanced Settings */}
      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-3"
        >
          <span className="material-symbols-outlined text-sm">
            {showAdvanced ? 'expand_less' : 'expand_more'}
          </span>
          Pengaturan Lanjutan
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Default Durations */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-slate-900 mb-3">Durasi Default (Tanpa Kendaraan)</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Hijau</label>
                    <input
                      type="number"
                      value={config.trafficLightConfig.defaultGreenDuration}
                      onChange={(e) => setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          defaultGreenDuration: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      min="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kuning</label>
                    <input
                      type="number"
                      value={config.trafficLightConfig.defaultYellowDuration}
                      onChange={(e) => setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          defaultYellowDuration: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      min="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Merah</label>
                    <input
                      type="number"
                      value={config.trafficLightConfig.defaultRedDuration}
                      onChange={(e) => setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          defaultRedDuration: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      min="5"
                    />
                  </div>
                </div>
              </div>

              {/* Cycle Time */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-slate-900 mb-3">Waktu Siklus</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Minimum (detik)</label>
                    <input
                      type="number"
                      value={config.trafficLightConfig.minCycleTime}
                      onChange={(e) => setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          minCycleTime: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      min="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Maximum (detik)</label>
                    <input
                      type="number"
                      value={config.trafficLightConfig.maxCycleTime}
                      onChange={(e) => setConfig({
                        ...config,
                        trafficLightConfig: {
                          ...config.trafficLightConfig,
                          maxCycleTime: parseInt(e.target.value),
                        },
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      min="60"
                    />
                  </div>
                </div>
              </div>

              {/* Sensor Config */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-slate-900 mb-3">Konfigurasi Sensor</h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.sensorConfig.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        sensorConfig: {
                          ...config.sensorConfig,
                          enabled: e.target.checked,
                        },
                      })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Aktifkan Sensor Kendaraan</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Update Interval (ms)</label>
                      <input
                        type="number"
                        value={config.sensorConfig.updateInterval}
                        onChange={(e) => setConfig({
                          ...config,
                          sensorConfig: {
                            ...config.sensorConfig,
                            updateInterval: parseInt(e.target.value),
                          },
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        min="1000"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Reset Counter (ms)</label>
                      <input
                        type="number"
                        value={config.sensorConfig.vehicleCountReset}
                        onChange={(e) => setConfig({
                          ...config,
                          sensorConfig: {
                            ...config.sensorConfig,
                            vehicleCountReset: parseInt(e.target.value),
                          },
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        min="10000"
                        step="10000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Last Updated */}
      {config.updatedAt && (
        <div className="mt-3 space-y-1">
          <div className="text-xs text-slate-500">
            Terakhir diupdate: {new Date(config.updatedAt).toLocaleString('id-ID')}
          </div>
          {config.lastSyncedAt && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-700 font-semibold">
                Terakhir sync ke ESP32: {new Date(config.lastSyncedAt).toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {config.updatedAt && !config.lastSyncedAt && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-yellow-700 font-semibold">
                Belum pernah sync ke ESP32
              </span>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan & Kirim ke ESP32
            </>
          )}
        </button>
        <button
          onClick={loadConfig}
          disabled={isSaving}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>
    </div>
  );
}
