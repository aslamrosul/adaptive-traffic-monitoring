"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const reports = [
  {
    id: 1,
    title: "Laporan Harian - 14 April 2026",
    type: "Harian",
    date: "14 Apr 2026",
    size: "2.4 MB",
    status: "Tersedia",
    icon: "description",
  },
  {
    id: 2,
    title: "Laporan Mingguan - Minggu 15",
    type: "Mingguan",
    date: "8-14 Apr 2026",
    size: "8.1 MB",
    status: "Tersedia",
    icon: "calendar_view_week",
  },
  {
    id: 3,
    title: "Laporan Bulanan - Maret 2026",
    type: "Bulanan",
    date: "Mar 2026",
    size: "24.5 MB",
    status: "Tersedia",
    icon: "calendar_month",
  },
  {
    id: 4,
    title: "Analisis Kemacetan Q1 2026",
    type: "Kuartalan",
    date: "Jan-Mar 2026",
    size: "45.2 MB",
    status: "Tersedia",
    icon: "analytics",
  },
];

const templates = [
  {
    name: "Laporan Kinerja Simpangan",
    description: "Analisis detail per simpangan",
    icon: "traffic",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Laporan Insiden & Anomali",
    description: "Riwayat kejadian dan penanganan",
    icon: "warning",
    color: "bg-orange-100 text-orange-600",
  },
  {
    name: "Laporan Efisiensi IoT",
    description: "Status dan performa sensor",
    icon: "sensors",
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Laporan Custom",
    description: "Buat laporan sesuai kebutuhan",
    icon: "tune",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function ReportsContent() {
  const [selectedType, setSelectedType] = useState("all");

  const handleDownload = (report: typeof reports[0]) => {
    toast.success(`Mengunduh ${report.title}...`);
  };

  const handleGenerateReport = (template: typeof templates[0]) => {
    toast.success(`Membuat ${template.name}...`);
  };

  const filteredReports = selectedType === "all" 
    ? reports 
    : reports.filter((r) => r.type.toLowerCase() === selectedType);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Analisis</h1>
          <p className="text-sm text-slate-500 mt-1">
            Unduh laporan atau buat laporan custom
          </p>
        </div>
        <button
          onClick={() => toast.success("Membuka generator laporan...")}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Buat Laporan Baru
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-xs text-slate-500">Total Laporan</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined">download</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">156</p>
              <p className="text-xs text-slate-500">Total Unduhan</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-slate-500">Laporan Terjadwal</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">folder</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">124 MB</p>
              <p className="text-xs text-slate-500">Total Ukuran</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Template Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleGenerateReport(template)}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{template.icon}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{template.name}</h3>
              <p className="text-sm text-slate-500">{template.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "harian", "mingguan", "bulanan", "kuartalan"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
              selectedType === type
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {type === "all" ? "Semua" : type}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{report.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {report.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-500">{report.date}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">{report.size}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-semibold text-green-600">{report.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success("Membuka preview...")}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Preview"
                >
                  <span className="material-symbols-outlined text-slate-600">visibility</span>
                </button>
                <button
                  onClick={() => handleDownload(report)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Unduh
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Schedule Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Jadwalkan Laporan Otomatis
            </h3>
            <p className="text-slate-600 mb-4">
              Terima laporan secara otomatis via email sesuai jadwal yang Anda tentukan
            </p>
            <button className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Atur Jadwal
            </button>
          </div>
          <span className="material-symbols-outlined text-6xl text-blue-200">
            schedule_send
          </span>
        </div>
      </motion.div>
    </div>
  );
}
