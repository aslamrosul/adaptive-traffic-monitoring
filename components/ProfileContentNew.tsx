"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useProfileStore } from "@/lib/store";
import { useActivityLogger } from "@/lib/hooks/useActivityLogger";

type ProfileTab = "overview" | "activity" | "achievements" | "settings";

type PrivacyKey = "publicProfile" | "showEmail" | "showActivity";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseSkills(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getActivityStyle(type?: string) {
  const activityType = String(type || "");

  if (activityType.startsWith("auth.")) {
    return { icon: "login", color: "bg-green-100 text-green-600" };
  }

  if (activityType.startsWith("profile.avatar")) {
    return { icon: "photo_camera", color: "bg-purple-100 text-purple-600" };
  }

  if (activityType.startsWith("profile.password")) {
    return { icon: "lock", color: "bg-orange-100 text-orange-600" };
  }

  if (activityType.startsWith("profile.settings")) {
    return { icon: "settings", color: "bg-cyan-100 text-cyan-600" };
  }

  if (activityType.startsWith("profile.export")) {
    return { icon: "download", color: "bg-orange-100 text-orange-600" };
  }

  if (activityType.startsWith("profile.")) {
    return { icon: "person", color: "bg-blue-100 text-blue-600" };
  }

  return { icon: "history", color: "bg-slate-100 text-slate-600" };
}

export default function ProfileContent() {
  useActivityLogger({
    type: "profile.view",
    action: "Membuka halaman profil",
    description: "Pengguna membuka halaman profil pribadi",
  });

  const {
    profile,
    isLoading,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    updateSettings,
  } = useProfileStore();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [skillsInput, setSkillsInput] = useState("");

  const achievements = profile?.achievements || [];

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

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch("/api/profile/activity?limit=20", {
          cache: "no-store",
        });

        const result = await response.json();

        if (result.success) {
          const mappedActivity = (result.data || []).map((item: any) => {
            const style = getActivityStyle(item.type);
            const createdAt =
              item.createdAt || item.created_at || item.timestamp;

            return {
              id: item.id,
              type: item.type,
              action: item.action,
              description: item.description,
              icon: item.icon || style.icon,
              color: item.color || style.color,
              time: item.time || formatDateTime(createdAt),
              createdAt,
            };
          });

          setActivityLog(mappedActivity);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    }

    fetchActivity();
  }, []);

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

      setSkillsInput(
        Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      );
    }
  }, [profile]);

  const refreshActivity = async () => {
    try {
      const response = await fetch("/api/profile/activity?limit=20", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        const mappedActivity = (result.data || []).map((item: any) => {
          const style = getActivityStyle(item.type);
          const createdAt = item.createdAt || item.created_at || item.timestamp;

          return {
            id: item.id,
            type: item.type,
            action: item.action,
            description: item.description,
            icon: item.icon || style.icon,
            color: item.color || style.color,
            time: item.time || formatDateTime(createdAt),
            createdAt,
          };
        });

        setActivityLog(mappedActivity);
      }
    } catch (error) {
      console.error("Failed to refresh activity:", error);
    }
  };

  const logProfileAction = async (payload: {
    type: string;
    action: string;
    description?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      await fetch("/api/profile/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await refreshActivity();
    } catch (error) {
      console.error("Failed to log profile action:", error);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        ...formData,
        skills: parseSkills(skillsInput),
      } as any);
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
      setSkillsInput(
        Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      );
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

  const handleExportData = async () => {
    if (!profile) return;

    const dataStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile,
        activityLog,
      },
      null,
      2,
    );
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile-${profile.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data profil berhasil diexport!");

    await logProfileAction({
      type: "profile.export",
      action: "Export data profil",
      description: "Pengguna mengekspor data profil pribadi",
    });
  };

  const handleToggleSetting = async (key: PrivacyKey) => {
    if (!profile) return;

    try {
      await updateSettings({
        [key]: !profile.settings[key],
      });
      await refreshActivity();
      toast.success("Pengaturan berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui pengaturan");
    }
  };

  const handleViewHistory = () => {
    setActiveTab("activity");
  };

  const handlePrivacySettings = () => {
    setActiveTab("settings");
  };

  const handleOpenPublicProfile = () => {
    if (!profile) return;

    window.open(
      `/profile/public/${profile.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // Profile tabs configuration
  const profileTabs: Array<{
    id: ProfileTab;
    label: string;
    icon: string;
  }> = [
    {
      id: "overview",
      label: "Overview",
      icon: "dashboard",
    },
    {
      id: "activity",
      label: "Aktivitas",
      icon: "history",
    },
    {
      id: "achievements",
      label: "Pencapaian",
      icon: "emoji_events",
    },
    {
      id: "settings",
      label: "Pengaturan",
      icon: "settings",
    },
  ];

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
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            error
          </span>
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
    {
      label: "Jam Aktif",
      value: `${profile.stats.activeHours.toLocaleString()} jam`,
      icon: "schedule",
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Status Akun",
      value: "Aktif",
      icon: "verified_user",
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Role",
      value: profile.position || "Operator",
      icon: "badge",
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Akun",
      value: profile.accountType,
      icon: "workspace_premium",
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 overflow-x-hidden">
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
        className="bg-gradient-to-br from-primary to-blue-600 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="p-4 lg:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-4 lg:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  sizes="(max-width: 768px) 80px, 128px"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button
                  onClick={handleChangePhoto}
                  disabled={isLoading}
                  className="w-7 h-7 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-primary text-xs lg:text-sm">
                    photo_camera
                  </span>
                </button>
                {!profile.avatar.includes("ui-avatars.com") && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isLoading}
                    className="w-7 h-7 lg:w-10 lg:h-10 bg-red-500 rounded-full shadow-lg flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-white text-xs lg:text-sm">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-white text-center md:text-left w-full">
              {/* Mobile: Vertical Layout */}
              <div className="flex flex-col items-center gap-2 mb-2 md:hidden">
                <div className="w-full">
                  <h1 className="text-lg font-bold font-headline mb-0.5 break-words">
                    {profile.name}
                  </h1>
                  <p className="text-blue-100 text-xs">{profile.position}</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-xs">
                      edit
                    </span>
                    <span>Edit Profil</span>
                  </button>
                )}
              </div>

              {/* Desktop: Horizontal Layout */}
              <div className="hidden md:flex md:flex-row md:items-start md:justify-between md:gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold font-headline mb-1 truncate">
                    {profile.name}
                  </h1>
                  <p className="text-blue-100 text-lg truncate">
                    {profile.position}
                  </p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    <span>Edit Profil</span>
                  </button>
                )}
              </div>

              {/* Contact Info & Badges - 2 Rows on Desktop */}
              <div className="flex flex-col gap-2 mt-2 md:mt-3">
                {/* Row 1: Contact Info - Spread across on Desktop */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-4 text-xs lg:text-sm">
                  <div className="flex items-center gap-1.5 lg:gap-2 justify-center md:justify-start">
                    <span className="material-symbols-outlined text-xs lg:text-sm flex-shrink-0">
                      business
                    </span>
                    <span className="truncate">{profile.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 lg:gap-2 justify-center md:justify-start">
                    <span className="material-symbols-outlined text-xs lg:text-sm flex-shrink-0">
                      email
                    </span>
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 lg:gap-2 justify-center md:justify-start">
                    <span className="material-symbols-outlined text-xs lg:text-sm flex-shrink-0">
                      phone
                    </span>
                    <span className="truncate">{profile.phone}</span>
                  </div>
                </div>

                {/* Row 2: Badges - Spread across on Desktop */}
                <div className="flex flex-wrap items-center justify-center md:justify-between gap-1.5 lg:gap-3">
                  <div className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] lg:text-xs font-semibold">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="material-symbols-outlined text-xs lg:text-sm">
                      verified_user
                    </span>
                    <span className="text-[9px] lg:text-xs font-semibold">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="material-symbols-outlined text-xs lg:text-sm">
                      workspace_premium
                    </span>
                    <span className="text-[9px] lg:text-xs font-semibold">
                      {profile.accountType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 px-3 lg:px-8 py-2 lg:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-base lg:text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-[9px] lg:text-xs text-blue-100 truncate">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs - Continue in next part... */}
      <div className="flex gap-1 lg:gap-2 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-3 font-semibold text-xs lg:text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-base lg:text-lg">
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] overflow-x-hidden">
        {activeTab === "overview" && (
          <div className="space-y-4 lg:space-y-6">
            {/* Mobile: Quick Actions First */}
            <div className="block lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 overflow-x-hidden"
              >
                <h3 className="text-sm font-bold text-slate-900 mb-2 truncate">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleExportData}
                    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">
                      download
                    </span>
                    <span className="text-[9px] font-semibold text-slate-700 text-center">
                      Export
                    </span>
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">
                      history
                    </span>
                    <span className="text-[9px] font-semibold text-slate-700 text-center">
                      History
                    </span>
                  </button>
                  <button
                    onClick={handlePrivacySettings}
                    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">
                      lock
                    </span>
                    <span className="text-[9px] font-semibold text-slate-700 text-center">
                      Privacy
                    </span>
                  </button>
                  <button
                    onClick={handleOpenPublicProfile}
                    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">
                      visibility
                    </span>
                    <span className="text-[9px] font-semibold text-slate-700 text-center">
                      Public
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Desktop: 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                {/* About Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
                >
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                      info
                    </span>
                    <span className="truncate">Tentang</span>
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm lg:text-base"
                      placeholder="Ceritakan tentang diri Anda..."
                    />
                  ) : (
                    <p className="text-slate-600 leading-relaxed text-sm lg:text-base break-words">
                      {profile.bio}
                    </p>
                  )}
                </motion.div>

                {/* Personal Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
                >
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                      badge
                    </span>
                    <span className="truncate">Informasi Personal</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Nama Lengkap
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                          {profile.name}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                          {profile.email}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Telepon
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                          {profile.phone}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Posisi
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              position: e.target.value,
                            })
                          }
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                          {profile.position}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Departemen
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        />
                      ) : (
                        <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                          {profile.department}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-hidden">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 lg:mb-2 truncate">
                        Bergabung Sejak
                      </label>
                      <p className="text-slate-900 font-medium text-sm lg:text-base truncate">
                        {new Date(profile.memberSince).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full sm:flex-1 px-4 lg:px-6 py-2 lg:py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                      >
                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
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
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
                >
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                      psychology
                    </span>
                    <span className="truncate">Keahlian</span>
                  </h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                        placeholder="Contoh: Traffic Management, IoT Systems, Data Analysis"
                      />
                      <p className="text-[10px] lg:text-xs text-slate-500">
                        Pisahkan setiap keahlian dengan koma.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 lg:gap-2">
                      {Array.isArray(profile.skills) &&
                      profile.skills.length > 0 ? (
                        profile.skills.map((skill: string, idx: number) => (
                          <motion.span
                            key={`${skill}-${idx}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-blue-50 text-primary rounded-full text-xs lg:text-sm font-semibold truncate max-w-full"
                          >
                            {skill}
                          </motion.span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Belum ada keahlian yang ditambahkan.
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6 shadow-sm"
                >
                  <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      trending_up
                    </span>
                    Performa
                  </h3>
                  {(() => {
                    const performanceItems = [
                      {
                        label: "Response Time",
                        value: profile.performance?.responseTime,
                        color: "bg-green-500",
                        description:
                          profile.performance?.averageResponseMinutes
                            ? `Rata-rata jeda aktivitas ${profile.performance.averageResponseMinutes} menit`
                            : "Kecepatan respons berdasarkan jeda aktivitas pengguna",
                      },
                      {
                        label: "Accuracy",
                        value: profile.performance?.accuracy,
                        color: "bg-blue-500",
                        description:
                          "Rasio aktivitas berhasil berdasarkan activity log",
                      },
                      {
                        label: "Efficiency",
                        value: profile.performance?.efficiency,
                        color: "bg-purple-500",
                        description:
                          "Efisiensi aktivitas berdasarkan jam aktif pengguna",
                      },
                    ].filter(
                      (item) =>
                        item.value !== null &&
                        item.value !== undefined &&
                        Number.isFinite(Number(item.value)),
                    );

                    if (performanceItems.length === 0) {
                      return (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                          <span className="material-symbols-outlined text-4xl text-slate-300">
                            monitoring
                          </span>

                          <p className="mt-2 font-bold text-slate-700">
                            Data performa belum tersedia
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Performa akan muncul otomatis setelah aktivitas pengguna tercatat.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-5">
                        {performanceItems.map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {item.label}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {item.description}
                                </p>
                              </div>

                              <span className="font-black text-slate-900">
                                {Number(item.value).toFixed(0)}%
                              </span>
                            </div>

                            <div className="h-2 rounded-full bg-slate-100">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, Number(item.value)),
                                  )}%`,
                                }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className={`h-2 rounded-full ${item.color}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </motion.div>
              </div>

              {/* Right Column - Quick Actions & Account Info (Desktop Only) */}
              <div className="hidden lg:block space-y-4 lg:space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
                >
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-3 lg:mb-4 truncate">
                    Quick Actions
                  </h3>
                  <div className="space-y-1.5 lg:space-y-2">
                    <button
                      onClick={handleExportData}
                      className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left overflow-hidden"
                    >
                      <span className="material-symbols-outlined text-primary text-lg lg:text-xl flex-shrink-0">
                        download
                      </span>
                      <span className="text-xs lg:text-sm font-semibold text-slate-700 truncate">
                        Export Data
                      </span>
                    </button>
                    <button
                      onClick={handleViewHistory}
                      className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left overflow-hidden"
                    >
                      <span className="material-symbols-outlined text-primary text-lg lg:text-xl flex-shrink-0">
                        history
                      </span>
                      <span className="text-xs lg:text-sm font-semibold text-slate-700 truncate">
                        View History
                      </span>
                    </button>
                    <button
                      onClick={handlePrivacySettings}
                      className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left overflow-hidden"
                    >
                      <span className="material-symbols-outlined text-primary text-lg lg:text-xl flex-shrink-0">
                        lock
                      </span>
                      <span className="text-xs lg:text-sm font-semibold text-slate-700 truncate">
                        Privacy Settings
                      </span>
                    </button>
                    <button
                      onClick={handleOpenPublicProfile}
                      className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left overflow-hidden"
                    >
                      <span className="material-symbols-outlined text-primary text-lg lg:text-xl flex-shrink-0">
                        visibility
                      </span>
                      <span className="text-xs lg:text-sm font-semibold text-slate-700 truncate">
                        Public Profile
                      </span>
                    </button>
                  </div>
                </motion.div>

                {/* Account Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
                >
                  <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-3 lg:mb-4 truncate">
                    Account Info
                  </h3>
                  <div className="space-y-2 lg:space-y-3">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs lg:text-sm text-slate-600 truncate">
                        Account Type
                      </span>
                      <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] lg:text-xs font-bold flex-shrink-0">
                        {profile.accountType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs lg:text-sm text-slate-600 flex-shrink-0">
                        User ID
                      </span>
                      <span className="text-xs lg:text-sm font-mono font-semibold text-slate-900 truncate">
                        {profile.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs lg:text-sm text-slate-600 flex-shrink-0">
                        Last Login
                      </span>
                      <span className="text-xs lg:text-sm font-semibold text-slate-900 truncate">
                        {new Date(profile.lastLogin).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile: Account Info at Bottom */}
            <div className="block lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 overflow-x-hidden"
              >
                <h3 className="text-sm font-bold text-slate-900 mb-2 truncate">
                  Account Info
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-xs text-slate-600 truncate">
                      Account Type
                    </span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold flex-shrink-0">
                      {profile.accountType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      User ID
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-900 truncate">
                      {profile.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      Last Login
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {new Date(profile.lastLogin).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
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
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
          >
            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                history
              </span>
              <span className="truncate">Aktivitas Terbaru</span>
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {activityLog.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300">
                    history
                  </span>
                  <p className="mt-2 font-bold text-slate-700">
                    Belum ada aktivitas
                  </p>
                  <p className="text-sm text-slate-500">
                    Aktivitas pengguna akan muncul setelah ada aksi di sistem.
                  </p>
                </div>
              ) : (
                activityLog.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors overflow-hidden"
                  >
                    <div
                      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}
                    >
                      <span className="material-symbols-outlined text-lg lg:text-xl">
                        {activity.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm lg:text-base truncate">
                        {activity.action}
                      </p>
                      {activity.description && (
                        <p className="text-xs lg:text-sm text-slate-500 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] lg:text-xs font-medium text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
          >
            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                emoji_events
              </span>
              <span className="truncate">Pencapaian</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              {achievements.map((achievement: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-3 lg:p-6 rounded-xl border-2 overflow-hidden ${
                    achievement.earned
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${achievement.color} flex items-center justify-center mb-2 lg:mb-4`}
                  >
                    <span className="material-symbols-outlined text-xl lg:text-2xl">
                      {achievement.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-0.5 lg:mb-1 text-sm lg:text-base truncate">
                    {achievement.title}
                  </h4>
                  <p className="text-xs lg:text-sm text-slate-600 break-words">
                    {achievement.description}
                  </p>
                  {achievement.earned && (
                    <div className="mt-2 lg:mt-3 flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-green-600">
                      <span className="material-symbols-outlined text-xs lg:text-sm">
                        check_circle
                      </span>
                      <span>Unlocked</span>
                    </div>
                  )}
                  {!achievement.earned && (
                    <div className="mt-2 lg:mt-3 flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-slate-400">
                      <span className="material-symbols-outlined text-xs lg:text-sm">
                        lock
                      </span>
                      <span>Locked</span>
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
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 lg:p-6 overflow-x-hidden"
          >
            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-4 lg:mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg lg:text-xl">
                settings
              </span>
              <span className="truncate">Pengaturan Privasi</span>
            </h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between gap-3 p-3 lg:p-4 bg-slate-50 rounded-lg overflow-hidden">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs lg:text-sm truncate">
                    Profil Publik
                  </p>
                  <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 lg:mt-1 truncate">
                    Izinkan orang lain melihat profil Anda
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting("publicProfile")}
                  disabled={isLoading}
                  className={`relative w-12 h-7 lg:w-14 lg:h-7 rounded-full transition-colors flex-shrink-0 ${
                    profile.settings.publicProfile
                      ? "bg-primary"
                      : "bg-slate-300"
                  } disabled:opacity-50`}
                >
                  <motion.div
                    animate={{ x: profile.settings.publicProfile ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 lg:p-4 bg-slate-50 rounded-lg overflow-hidden">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs lg:text-sm truncate">
                    Tampilkan Email
                  </p>
                  <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 lg:mt-1 truncate">
                    Email akan terlihat di profil publik
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting("showEmail")}
                  disabled={isLoading}
                  className={`relative w-12 h-7 lg:w-14 lg:h-7 rounded-full transition-colors flex-shrink-0 ${
                    profile.settings.showEmail ? "bg-primary" : "bg-slate-300"
                  } disabled:opacity-50`}
                >
                  <motion.div
                    animate={{ x: profile.settings.showEmail ? 28 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 lg:p-4 bg-slate-50 rounded-lg overflow-hidden">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs lg:text-sm truncate">
                    Tampilkan Aktivitas
                  </p>
                  <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 lg:mt-1 truncate">
                    Aktivitas akan terlihat di profil publik
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSetting("showActivity")}
                  disabled={isLoading}
                  className={`relative w-12 h-7 lg:w-14 lg:h-7 rounded-full transition-colors flex-shrink-0 ${
                    profile.settings.showActivity
                      ? "bg-primary"
                      : "bg-slate-300"
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
