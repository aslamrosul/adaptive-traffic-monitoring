"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

const activityLog = [
  {
    action: "Login ke sistem",
    time: "2 menit yang lalu",
    icon: "login",
    color: "text-green-600 bg-green-100",
  },
  {
    action: "Mengubah pengaturan notifikasi",
    time: "1 jam yang lalu",
    icon: "settings",
    color: "text-blue-600 bg-blue-100",
  },
  {
    action: "Mengunduh laporan bulanan",
    time: "3 jam yang lalu",
    icon: "download",
    color: "text-purple-600 bg-purple-100",
  },
  {
    action: "Manual override di Simpangan Sarinah",
    time: "5 jam yang lalu",
    icon: "emergency",
    color: "text-red-600 bg-red-100",
  },
  {
    action: "Membuat laporan custom",
    time: "1 hari yang lalu",
    icon: "description",
    color: "text-orange-600 bg-orange-100",
  },
];

const achievements = [
  {
    title: "Early Adopter",
    description: "Pengguna sejak tahun pertama",
    icon: "emoji_events",
    color: "bg-yellow-100 text-yellow-600",
    earned: true,
  },
  {
    title: "Problem Solver",
    description: "Menyelesaikan 50+ insiden",
    icon: "verified",
    color: "bg-blue-100 text-blue-600",
    earned: true,
  },
  {
    title: "Night Owl",
    description: "Aktif di shift malam",
    icon: "nightlight",
    color: "bg-purple-100 text-purple-600",
    earned: true,
  },
  {
    title: "Data Master",
    description: "Generate 100+ laporan",
    icon: "analytics",
    color: "bg-green-100 text-green-600",
    earned: false,
  },
];

const stats = [
  { label: "Total Login", value: "1,247", icon: "login", color: "bg-blue-100 text-blue-600" },
  { label: "Insiden Ditangani", value: "89", icon: "task_alt", color: "bg-green-100 text-green-600" },
  { label: "Laporan Dibuat", value: "156", icon: "description", color: "bg-purple-100 text-purple-600" },
  { label: "Jam Aktif", value: "2,340", icon: "schedule", color: "bg-orange-100 text-orange-600" },
];

export default function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form states
  const [name, setName] = useState("Admin Pusat");
  const [email, setEmail] = useState("admin@aerialcommand.id");
  const [phone, setPhone] = useState("+62 812-3456-7890");
  const [position, setPosition] = useState("Operator Senior");
  const [department, setDepartment] = useState("Traffic Control Center");
  const [bio, setBio] = useState("Operator berpengalaman dengan spesialisasi dalam manajemen lalu lintas perkotaan dan sistem IoT.");

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profil berhasil diperbarui!");
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setName("Admin Pusat");
    setEmail("admin@aerialcommand.id");
  };

  const handleChangePhoto = () => {
    toast.success("Fitur upload foto akan segera tersedia!");
  };

  const handleExportData = () => {
    toast.success("Mengekspor data profil...");
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpIApxE04Qb_oiOm5vKyJouaZSGn8892BXclyCjOjJvViGb2Ul6YlBOPTXioVn6_PUR97pernkLb5ro_CoqlLokRIjEA5hmVmeNiZJmbvKaJAGO5q3fQl2prP0rzAogISm79FucyYXWTnYGCZO5jIN9hl4AWk6mPSd6FtC7upjlLvgsAHVQh3JY7HvYzR4QnYgeEolBA2IDrBE_GcKU6vL9rU1shBTmEJ3YrHN1iTPUaevg-qpG39P46iDq7JpZoq5Oo3O7FLoxDo"
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={handleChangePhoto}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-primary text-sm">photo_camera</span>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold font-headline mb-1">{name}</h1>
                  <p className="text-blue-100 text-lg">{position}</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Profil
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">business</span>
                  <span className="text-sm">{department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">email</span>
                  <span className="text-sm">{email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">phone</span>
                  <span className="text-sm">{phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold">Online</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span className="text-xs font-semibold">Verified</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span className="text-xs font-semibold">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-blue-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "activity", label: "Aktivitas", icon: "history" },
          { id: "achievements", label: "Pencapaian", icon: "emoji_events" },
          { id: "settings", label: "Pengaturan", icon: "settings" },
        ].map((tab) => (
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

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Tentang Saya
                </h3>
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed">{bio}</p>
                )}
              </div>

              {/* Personal Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Informasi Personal
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Nama Lengkap
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      ) : (
                        <p className="font-semibold text-slate-900">{name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Posisi
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      ) : (
                        <p className="font-semibold text-slate-900">{position}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      ) : (
                        <p className="font-semibold text-slate-900">{email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Telepon
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      ) : (
                        <p className="font-semibold text-slate-900">{phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Departemen
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    ) : (
                      <p className="font-semibold text-slate-900">{department}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Simpan Perubahan
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills & Expertise */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  Keahlian & Sertifikasi
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Traffic Management",
                    "IoT Systems",
                    "Data Analysis",
                    "Emergency Response",
                    "System Administration",
                    "Report Generation",
                  ].map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-6">
              {/* Performance */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  Performa
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-bold text-slate-900">95%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "95%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Accuracy</span>
                      <span className="font-bold text-slate-900">98%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "98%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Efficiency</span>
                      <span className="font-bold text-slate-900">92%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExportData}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold text-sm text-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export Data Profil
                  </button>
                  <button
                    onClick={() => toast.success("Membuka riwayat aktivitas...")}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold text-sm text-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">history</span>
                    Lihat Riwayat Lengkap
                  </button>
                  <button
                    onClick={() => toast.success("Membuka pengaturan privasi...")}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold text-sm text-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">privacy_tip</span>
                    Pengaturan Privasi
                  </button>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Informasi Akun</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Member Since</span>
                    <span className="font-semibold text-slate-900">Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Login</span>
                    <span className="font-semibold text-slate-900">2 menit lalu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Account Type</span>
                    <span className="font-semibold text-primary">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Aktivitas Terbaru</h3>
            <div className="space-y-4">
              {activityLog.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white rounded-xl shadow-sm p-6 text-center ${
                  !achievement.earned ? "opacity-50 grayscale" : ""
                }`}
              >
                <div className={`w-16 h-16 rounded-full ${achievement.color} flex items-center justify-center mx-auto mb-4`}>
                  <span className="material-symbols-outlined text-3xl">{achievement.icon}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{achievement.title}</h3>
                <p className="text-sm text-slate-500">{achievement.description}</p>
                {achievement.earned && (
                  <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    Unlocked
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Pengaturan Profil</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Profil Publik</p>
                  <p className="text-sm text-slate-500">Tampilkan profil Anda ke pengguna lain</p>
                </div>
                <button className="relative w-14 h-8 rounded-full bg-primary">
                  <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Tampilkan Email</p>
                  <p className="text-sm text-slate-500">Email terlihat di profil publik</p>
                </div>
                <button className="relative w-14 h-8 rounded-full bg-slate-300">
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Tampilkan Aktivitas</p>
                  <p className="text-sm text-slate-500">Aktivitas terlihat di profil publik</p>
                </div>
                <button className="relative w-14 h-8 rounded-full bg-primary">
                  <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  Hapus Akun
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus permanen.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
