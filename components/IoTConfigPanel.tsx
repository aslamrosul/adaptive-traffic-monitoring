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

  const updateRule = (index: number, field: keyof TrafficRule, value: any) => {
    const newRules = [...config.trafficLightConfig.rules];
    newRules[index] = {
      ...newRules[index],
      [field]: value,
    };
    setConfig({
      ...config,
      trafficLightConfig: {
        ...config.trafficLightConfig,
        rules: newRules,
      },
    });
  };

  const addRule = () => {
    const newRule: TrafficRule = {
      vehicleThreshold: 40,
      greenDuration: 75,
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
  };

  const removeRule = (index: number) => {
    const newRules = config.trafficLightConfig.rules.filter((_, i) => i !== index);
    setConfig({
      ...config,
      trafficLightConfig: {
        ...config.trafficLightConfig,
        rules: newRules,
      },
    });
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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">settings_remote</span>
            Remote Configuration
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Device ID: <span className="font-mono font-semibold">{deviceId}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            config.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {config.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
          </span>
        </div>
      </div>

      {/* Traffic Light Rules */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Aturan Durasi Lampu Lalu Lintas</h4>
          <button
            onClick={addRule}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tambah Aturan
          </button>
        </div>

        <div className="space-y-3">
          {config.trafficLightConfig.rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
            >
              <div className="flex items-start justify-between mb-3">
                <input
                  type="text"
                  value={rule.description}
                  onChange={(e) => updateRule(index, 'description', e.target.value)}
                  className="text-sm font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Deskripsi aturan"
                />
                {config.trafficLightConfig.rules.length > 1 && (
                  <button
                    onClick={() => removeRule(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Vehicle Threshold */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Batas Kendaraan
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rule.vehicleThreshold}
                      onChange={(e) => updateRule(index, 'vehicleThreshold', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      unit
                    </span>
                  </div>
                </div>

                {/* Green Duration */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hijau
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rule.greenDuration}
                      onChange={(e) => updateRule(index, 'greenDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      detik
                    </span>
                  </div>
                </div>

                {/* Yellow Duration */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kuning
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rule.yellowDuration}
                      onChange={(e) => updateRule(index, 'yellowDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="3"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      detik
                    </span>
                  </div>
                </div>

                {/* Red Duration */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Merah
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rule.redDuration}
                      onChange={(e) => updateRule(index, 'redDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      detik
                    </span>
                  </div>
                </div>
              </div>

              {/* Rule Summary */}
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                Jika kendaraan <strong>&gt; {rule.vehicleThreshold}</strong>, maka lampu hijau <strong>{rule.greenDuration} detik</strong>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-4"
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
        <div className="mt-4 space-y-1">
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
      <div className="mt-6 flex gap-3">
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
