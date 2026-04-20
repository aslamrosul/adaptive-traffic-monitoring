"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ModalEditPersimpanganProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intersection: any;
}

export default function ModalEditPersimpangan({
  isOpen,
  onClose,
  onSuccess,
  intersection,
}: ModalEditPersimpanganProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    deviceId: "",
    status: "active",
    lanesCount: "4",
    configMode: "auto",
  });

  useEffect(() => {
    if (intersection) {
      setFormData({
        name: intersection.name || "",
        address: intersection.address || "",
        latitude: intersection.location?.lat?.toString() || "",
        longitude: intersection.location?.lng?.toString() || "",
        deviceId: intersection.deviceId || "",
        status: intersection.status || "active",
        lanesCount: intersection.lanes?.count?.toString() || "4",
        configMode: intersection.config?.mode || "auto",
      });
    }
  }, [intersection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/intersections/${intersection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          location: {
            lat: parseFloat(formData.latitude) || 0,
            lng: parseFloat(formData.longitude) || 0,
          },
          deviceId: formData.deviceId,
          status: formData.status,
          lanes: {
            count: parseInt(formData.lanesCount),
            directions: intersection.lanes?.directions || ["north", "east", "south", "west"],
          },
          config: {
            ...intersection.config,
            mode: formData.configMode,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Persimpangan berhasil diupdate!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Gagal mengupdate persimpangan");
      }
    } catch (error) {
      console.error("Error updating intersection:", error);
      toast.error("Terjadi kesalahan saat mengupdate persimpangan");
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

  if (!intersection) return null;

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
                    Edit Persimpangan
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    Update data persimpangan
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Device ID */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Device ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
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
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Simpan Perubahan</span>
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
