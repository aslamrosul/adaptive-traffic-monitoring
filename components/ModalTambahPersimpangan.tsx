"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface ModalTambahPersimpanganProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalTambahPersimpangan({
  isOpen,
  onClose,
  onSuccess,
}: ModalTambahPersimpanganProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [usedDevices, setUsedDevices] = useState<string[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [creatingDevice, setCreatingDevice] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    deviceId: "",
    status: "active",
    lanesCount: "4",
    lanesDirections: ["north", "east", "south", "west"],
    configMode: "auto",
  });

  // Fetch devices from IoT Hub when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDevices();
      fetchUsedDevices();
    }
  }, [isOpen]);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const response = await fetch('/api/iot/devices');
      const data = await response.json();
      
      if (data.success) {
        setDevices(data.activeDevices || []);
      } else {
        toast.error('Gagal memuat daftar device dari IoT Hub');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Gagal memuat daftar device');
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchUsedDevices = async () => {
    try {
      const response = await fetch('/api/intersections');
      const data = await response.json();
      
      if (data.success) {
        // Get all deviceIds that are already used
        const used = data.data.map((i: any) => i.deviceId);
        setUsedDevices(used);
      }
    } catch (error) {
      console.error('Error fetching used devices:', error);
    }
  };

  // Filter available devices (not used by other intersections)
  const availableDevices = devices.filter(
    (device) => !usedDevices.includes(device.deviceId)
  );

  const handleCreateDevice = async () => {
    if (!newDeviceId.trim()) {
      toast.error('Device ID tidak boleh kosong');
      return;
    }

    setCreatingDevice(true);
    try {
      const response = await fetch('/api/iot/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: newDeviceId.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Device ${newDeviceId} berhasil dibuat!`);
        
        // Show connection string in a modal or copy to clipboard
        if (data.device?.connectionString) {
          navigator.clipboard.writeText(data.device.connectionString);
          toast.success('Connection string disalin ke clipboard!');
        }

        // Refresh device list
        await fetchDevices();
        
        // Auto-select the new device
        setFormData(prev => ({ ...prev, deviceId: newDeviceId.trim() }));
        
        // Close add device form
        setShowAddDevice(false);
        setNewDeviceId('');
      } else {
        toast.error(data.error || 'Gagal membuat device');
      }
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error('Terjadi kesalahan saat membuat device');
    } finally {
      setCreatingDevice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/intersections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          deviceId: formData.deviceId,
          status: formData.status,
          lanesCount: parseInt(formData.lanesCount),
          lanesDirections: formData.lanesDirections,
          configMode: formData.configMode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Persimpangan berhasil ditambahkan!");
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: "",
          address: "",
          latitude: "",
          longitude: "",
          deviceId: "",
          status: "active",
          lanesCount: "4",
          lanesDirections: ["north", "east", "south", "west"],
          configMode: "auto",
        });
      } else {
        toast.error(data.error || "Gagal menambahkan persimpangan");
      }
    } catch (error) {
      console.error("Error adding intersection:", error);
      toast.error("Terjadi kesalahan saat menambahkan persimpangan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-headline font-bold">
                    Tambah Persimpangan Baru
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    Isi data persimpangan yang akan ditambahkan
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Nama Persimpangan */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama Persimpangan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Persimpangan Sudirman-Thamrin"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Jl. Sudirman - Jl. Thamrin, Jakarta Pusat"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Koordinat */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="-6.2088"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="106.8456"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Device ID - Dropdown or Manual Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Device ID <span className="text-red-500">*</span>
                  </label>
                  {loadingDevices ? (
                    <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-slate-500">Memuat device dari IoT Hub...</span>
                    </div>
                  ) : availableDevices.length > 0 ? (
                    <>
                      <select
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">-- Pilih Device --</option>
                        {availableDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.deviceId} {device.connectionState === 'Connected' ? '🟢' : '⚪'}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500">
                          Hanya menampilkan device yang belum digunakan ({availableDevices.length} tersedia)
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddDevice(!showAddDevice)}
                          className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Tambah Device Baru
                        </button>
                      </div>

                      {/* Add Device Form */}
                      {showAddDevice && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50"
                        >
                          <p className="text-sm font-bold text-blue-900 mb-2">Buat Device Baru di IoT Hub</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDeviceId}
                              onChange={(e) => setNewDeviceId(e.target.value)}
                              placeholder="Contoh: esp32-traffic-monitor-2"
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={creatingDevice}
                            />
                            <button
                              type="button"
                              onClick={handleCreateDevice}
                              disabled={creatingDevice || !newDeviceId.trim()}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {creatingDevice ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  <span>Membuat...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">add</span>
                                  <span>Buat</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            💡 Connection string akan otomatis disalin ke clipboard
                          </p>
                        </motion.div>
                      )}
                    </>
                  ) : devices.length > 0 ? (
                    <>
                      <div className="w-full px-4 py-3 border border-amber-300 rounded-lg bg-amber-50">
                        <p className="text-sm text-amber-800 mb-2">
                          ⚠️ Semua device sudah digunakan.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddDevice(!showAddDevice)}
                          className="text-sm font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">add_circle</span>
                          Tambah Device Baru di IoT Hub
                        </button>
                      </div>

                      {/* Add Device Form */}
                      {showAddDevice && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50"
                        >
                          <p className="text-sm font-bold text-blue-900 mb-2">Buat Device Baru di IoT Hub</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDeviceId}
                              onChange={(e) => setNewDeviceId(e.target.value)}
                              placeholder="Contoh: esp32-traffic-monitor-2"
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={creatingDevice}
                            />
                            <button
                              type="button"
                              onClick={handleCreateDevice}
                              disabled={creatingDevice || !newDeviceId.trim()}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {creatingDevice ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  <span>Membuat...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">add</span>
                                  <span>Buat</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            💡 Connection string akan otomatis disalin ke clipboard
                          </p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: esp32-traffic-monitor"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <div className="mt-2 p-3 border border-amber-300 rounded-lg bg-amber-50">
                        <p className="text-xs text-amber-800">
                          ⚠️ Tidak dapat memuat device dari IoT Hub. Masukkan Device ID secara manual.
                          Pastikan device sudah terdaftar di Azure IoT Hub.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Status & Mode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Mode Operasi
                    </label>
                    <select
                      name="configMode"
                      value={formData.configMode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="auto">Auto</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Jalur */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Jumlah Jalur
                  </label>
                  <select
                    name="lanesCount"
                    value={formData.lanesCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="3">3 Jalur</option>
                    <option value="4">4 Jalur</option>
                    <option value="5">5 Jalur</option>
                    <option value="6">6 Jalur</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-xl">
                      info
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        Informasi
                      </p>
                      <p className="text-xs text-blue-700">
                        Setelah persimpangan ditambahkan, Anda dapat mengkonfigurasi
                        detail lebih lanjut di halaman detail persimpangan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Tambah Persimpangan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
