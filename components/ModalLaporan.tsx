"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

interface ModalLaporanProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalLaporan({ isOpen, onClose }: ModalLaporanProps) {
  const [formData, setFormData] = useState({
    lokasi: "",
    jenis: "Kemacetan",
    prioritas: "Sedang",
    deskripsi: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Laporan berhasil dibuat!", {
      icon: "✅",
      duration: 4000,
    });
    onClose();
    setFormData({
      lokasi: "",
      jenis: "Kemacetan",
      prioritas: "Sedang",
      deskripsi: "",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-primary to-primary-container p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-bold">Buat Laporan Baru</h2>
                      <p className="text-sm text-primary-fixed/80">
                        Laporkan insiden atau anomali lalu lintas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lokasi Persimpangan
                  </label>
                  <select
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Lokasi</option>
                    <option value="Simpang Sudirman">Simpang Sudirman</option>
                    <option value="Simpang Thamrin">Simpang Thamrin</option>
                    <option value="Simpang Kuningan">Simpang Kuningan</option>
                    <option value="Simpang Gatot Subroto">Simpang Gatot Subroto</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Jenis Laporan
                    </label>
                    <select
                      value={formData.jenis}
                      onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Kemacetan">Kemacetan</option>
                      <option value="Kecelakaan">Kecelakaan</option>
                      <option value="Gangguan Sensor">Gangguan Sensor</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prioritas
                    </label>
                    <select
                      value={formData.prioritas}
                      onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Rendah">Rendah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Kritis">Kritis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Jelaskan detail laporan..."
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                  >
                    Kirim Laporan
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
