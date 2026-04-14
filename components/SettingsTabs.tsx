"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const tabs = [
  { id: "general", label: "Umum", icon: "settings" },
  { id: "notifications", label: "Notifikasi", icon: "notifications" },
  { id: "iot", label: "IoT & Sensor", icon: "sensors" },
  { id: "security", label: "Keamanan", icon: "shield" },
  { id: "advanced", label: "Lanjutan", icon: "tune" },
];

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("general");
  const [autoMode, setAutoMode] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [sensorInterval, setSensorInterval] = useState(5);

  const handleSave = () => {
    toast.success("Pengaturan berhasil disimpan!");
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-8"
      >
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan Umum</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Mode Otomatis</p>
                    <p className="text-sm text-slate-500">
                      Sistem akan mengatur lampu lalu lintas secara otomatis
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoMode(!autoMode)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      autoMode ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        autoMode ? "translate-x-7" : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Bahasa Sistem
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Bahasa Indonesia</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Zona Waktu
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>WIB (GMT+7)</option>
                    <option>WITA (GMT+8)</option>
                    <option>WIT (GMT+9)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan Notifikasi</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Email Notifikasi</p>
                    <p className="text-sm text-slate-500">
                      Terima notifikasi melalui email
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotif(!emailNotif)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      emailNotif ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        emailNotif ? "translate-x-7" : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Push Notifikasi</p>
                    <p className="text-sm text-slate-500">
                      Terima notifikasi push di browser
                    </p>
                  </div>
                  <button
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      pushNotif ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        pushNotif ? "translate-x-7" : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Prioritas Notifikasi
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Kepadatan Ekstrem</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Anomali IoT</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Pemeliharaan Rutin</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "iot" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan IoT & Sensor</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Interval Pengambilan Data (detik)
                  </label>
                  <input
                    type="number"
                    value={sensorInterval}
                    onChange={(e) => setSensorInterval(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Saat ini: {sensorInterval} detik
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Status Koneksi</p>
                      <p className="text-xs text-blue-700 mt-1">
                        42 dari 43 sensor aktif (98.4%)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Algoritma Optimasi
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Adaptive-Flow v2.4</option>
                    <option>Fixed-Time Classic</option>
                    <option>AI-Predictive Beta</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Keamanan</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Ubah Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password lama"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <input
                    type="password"
                    placeholder="Password baru"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmasi password baru"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600">verified_user</span>
                    <div>
                      <p className="font-semibold text-green-900 text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-green-700 mt-1">
                        Aktif - Terakhir digunakan 2 jam yang lalu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900 mb-2">Sesi Aktif</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Windows - Chrome</span>
                      <span className="text-green-600 font-semibold">Saat ini</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Android - Mobile App</span>
                      <button className="text-red-600 font-semibold hover:underline">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pengaturan Lanjutan</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-yellow-600">warning</span>
                    <div>
                      <p className="font-semibold text-yellow-900 text-sm">Peringatan</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Pengaturan ini hanya untuk pengguna advanced. Perubahan dapat mempengaruhi kinerja sistem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    Mode Debug
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option>Disabled</option>
                    <option>Enabled (Console Only)</option>
                    <option>Enabled (Full Logging)</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <label className="block font-semibold text-slate-900 mb-2">
                    API Rate Limit
                  </label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Requests per minute
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Danger Zone</p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors">
                    Reset Semua Pengaturan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
          <button className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
