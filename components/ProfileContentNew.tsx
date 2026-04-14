"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useProfileStore } from "@/lib/store";

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

export default function ProfileContent() {
  const { profile, isLoading, fetchProfile, updateProfile, uploadAvatar, deleteAvatar, updateSettings } = useProfileStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    bio: "",
  });

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        position: profile.position,
        department: profile.department,
        bio: profile.bio,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      toast.error("Gagal memperbarui profil");
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        position: profile.position,
        department: profile.department,
        bio: profile.bio,
      });
    }
    setIsEditing(false);
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    try {
      const loadingToast = toast.loading("Mengupload foto...");
      await uploadAvatar(file);
      toast.dismiss(loadingToast);
      toast.success("Foto berhasil diupload!");
    } catch (error) {
      toast.error("Gagal mengupload foto");
    }
  };

  const handleDeleteAvatar = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus foto profil?")) {
      try {
        await deleteAvatar();
        toast.success("Foto profil berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus foto profil");
      }
    }
  };

  const handleExportData = () => {
    if (!profile) return;
    
    const dataStr = JSON.stringify(profile, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile-${profile.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data profil berhasil diexport!");
  };

  const handleToggleSetting = async (key: keyof typeof profile.settings) => {
    if (!profile) return;
    
    try {
      await updateSettings({
        [key]: !profile.settings[key],
      });
      toast.success("Pengaturan berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui pengaturan");
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
          <p className="text-slate-600">Gagal memuat profil</p>
          <button
            onClick={() => fetchProfile()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Login", value: profile.stats.totalLogin.toLocaleString(), icon: "login", color: "bg-blue-100 text-blue-600" },
    { label: "Insiden Ditangani", value: profile.stats.incidentsHandled.toString(), icon: "task_alt", color: "bg-green-100 text-green-600" },
    { label: "Laporan Dibuat", value: profile.stats.reportsCreated.toString(), icon: "description", color: "bg-purple-100 text-purple-600" },
    { label: "Jam Aktif", value: profile.stats.activeHours.toLocaleString(), icon: "schedule", color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

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
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button
                  onClick={handleChangePhoto}
                  disabled={isLoading}
                  className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-primary text-sm">photo_camera</span>
                </button>
                {!profile.avatar.includes("ui-avatars.com") && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isLoading}
                    className="w-10 h-10 bg-red-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-white text-sm">delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold font-headline mb-1">{profile.name}</h1>
                  <p className="text-blue-100 text-lg">{profile.position}</p>
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
                  <span className="text-sm">{profile.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">email</span>
                  <span className="text-sm">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">phone</span>
                  <span className="text-sm">{profile.phone}</span>
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
                  <span className="text-xs font-semibold">{profile.accountType}</span>
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

      {/* Tabs - Continue in next part... */}
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
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Tentang
                </h3>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Ceritakan tentang diri Anda..."
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
                )}
              </motion.div>

              {/* Personal Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Informasi Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Nama Lengkap</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Telepon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{profile.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Posisi</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{profile.position}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Departemen</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{profile.department}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Bergabung Sejak</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(profile.memberSince).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Skills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  Keahlian
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-4 py-2 bg-blue-50 text-primary rounded-full text-sm font-semibold"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  Performa
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Response Time", value: profile.performance.responseTime, color: "bg-green-500" },
                    { label: "Accuracy", value: profile.performance.accuracy, color: "bg-blue-500" },
                    { label: "Efficiency", value: profile.performance.efficiency, color: "bg-purple-500" },
                  ].map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{metric.label}</span>
                        <span className="text-sm font-bold text-slate-900">{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                          className={`h-full ${metric.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Quick Actions & Account Info */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-primary">download</span>
                    <span className="text-sm font-semibold text-slate-700">Export Data</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <span className="text-sm font-semibold text-slate-700">View History</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <span className="text-sm font-semibold text-slate-700">Privacy Settings</span>
                  </button>
                </div>
              </motion.div>

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">Account Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Account Type</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                      {profile.accountType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">User ID</span>
                    <span className="text-sm font-mono font-semibold text-slate-900">{profile.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Last Login</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(profile.lastLogin).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Aktivitas Terbaru
            </h3>
            <div className="space-y-4">
              {activityLog.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{activity.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">emoji_events</span>
              Pencapaian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-6 rounded-xl border-2 ${
                    achievement.earned
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${achievement.color} flex items-center justify-center mb-4`}>
                    <span className="material-symbols-outlined text-2xl">{achievement.icon}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-slate-600">{achievement.description}</p>
                  {achievement.earned && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-600">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Unlocked
                    </div>
                  )}
                  {!achievement.earned && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Locked
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span>
              Pengaturan Privasi
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Profil Publik</p>
                  <p className="text-xs text-slate-500 mt-1">Izinkan orang lain melihat profil Anda</p>
                </div>
                <button
                  onClick={() => handleToggleSetting("publicProfile")}
                  disabled={isLoading}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    profile.settings.publicProfile ? "bg-primary" : "bg-slate-300"
                  } disabled:opacity-50`}
                >
                  <motion.div
                    animate={{ x: profile.settings.publicProfile ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Tampilkan Email</p>
                  <p className="text-xs text-slate-500 mt-1">Email akan terlihat di profil publik</p>
                </div>
                <button
                  onClick={() => handleToggleSetting("showEmail")}
                  disabled={isLoading}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    profile.settings.showEmail ? "bg-primary" : "bg-slate-300"
                  } disabled:opacity-50`}
                >
                  <motion.div
                    animate={{ x: profile.settings.showEmail ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Tampilkan Aktivitas</p>
                  <p className="text-xs text-slate-500 mt-1">Aktivitas akan terlihat di profil publik</p>
                </div>
                <button
                  onClick={() => handleToggleSetting("showActivity")}
                  disabled={isLoading}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    profile.settings.showActivity ? "bg-primary" : "bg-slate-300"
                  } disabled:opacity-50`}
                >
                  <motion.div
                    animate={{ x: profile.settings.showActivity ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
