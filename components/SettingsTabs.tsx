"use client";

import { requestBrowserNotificationPermission } from "@/lib/browser-notification";
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/user-settings";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const tabs = [
  { id: "general", label: "Umum", icon: "settings" },
  { id: "notifications", label: "Notifikasi", icon: "notifications" },
  { id: "iot", label: "IoT & Sensor", icon: "sensors" },
  { id: "security", label: "Keamanan", icon: "shield" },
];

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    language: "id",
    timezone: "Asia/Jakarta",
    browserNotification: false,
    emailNotification: false,
    telegramNotification: false,
    telegramBotToken: "",
    telegramChatId: "",
    queueAlert: true,
    deviceOfflineAlert: true,
    dummyModeAlert: true,
    weakWifiAlert: true,
    autoMode: true,
    sensorInterval: 5,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        setSettings((current) => ({
          ...current,
          ...result.data,
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  };
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengubah password");
      }

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password berhasil diubah");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    }
  };

  const handleTelegramTest = async () => {
    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal test Telegram");
      }

      toast.success("Telegram berhasil dites");
    } catch (error: any) {
      toast.error(error.message || "Gagal test Telegram");
    }
  };

  const handleEmailTest = async () => {
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal test email");
      }

      toast.success("Email test berhasil dikirim");
    } catch (error: any) {
      toast.error(error.message || "Gagal test email");
    }
  };
  const updateSetting = (key: string, value: any) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan pengaturan");
      }

      toast.success("Pengaturan berhasil disimpan");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const requestBrowserNotification = async () => {
    const granted = await requestBrowserNotificationPermission();

    if (granted) {
      updateSetting("browserNotification", true);
      toast.success("Notifikasi browser diaktifkan");
    } else {
      updateSetting("browserNotification", false);
      toast.error("Izin notifikasi browser ditolak");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-hidden lg:space-y-6">
      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-slate-200 lg:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-semibold transition-all lg:gap-2 lg:px-4 lg:py-3 lg:text-sm ${activeTab === tab.id
              ? "border-b-2 border-primary text-primary"
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-x-hidden rounded-xl bg-white p-4 shadow-sm lg:p-8"
      >
        {activeTab === "general" && (
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base font-bold text-slate-900 lg:text-lg">
              Pengaturan Umum
            </h3>

            <SwitchRow
              title="Mode Otomatis"
              description="Sistem akan mengatur lampu lalu lintas secara otomatis."
              checked={settings.autoMode}
              onChange={() => updateSetting("autoMode", !settings.autoMode)}
            />

            <SelectRow
              title="Bahasa Sistem"
              value={settings.language}
              onChange={(value) => updateSetting("language", value)}
              options={LANGUAGE_OPTIONS}
            />

            <SelectRow
              title="Zona Waktu"
              value={settings.timezone}
              onChange={(value) => updateSetting("timezone", value)}
              options={TIMEZONE_OPTIONS}
            />

            <InfoBox
              icon="schedule"
              title="Catatan zona waktu"
              description="Data tetap disimpan UTC di database. Zona waktu hanya memengaruhi tampilan dashboard."
            />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base font-bold text-slate-900 lg:text-lg">
              Pengaturan Notifikasi
            </h3>

            <SwitchRow
              title="Notifikasi Browser"
              description="Menampilkan alert di browser saat ada antrean padat atau perangkat offline."
              checked={settings.browserNotification}
              onChange={() => {
                if (!settings.browserNotification) {
                  requestBrowserNotification();
                } else {
                  updateSetting("browserNotification", false);
                }
              }}
            />

            <SwitchRow
              title="Email Notifikasi"
              description="Kirim ringkasan alert penting ke email akun."
              checked={settings.emailNotification}
              onChange={() =>
                updateSetting("emailNotification", !settings.emailNotification)
              }
            />
            {settings.emailNotification && (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="mb-3 text-sm text-slate-600">
                  Email alert akan dikirim ke email akun login.
                </p>

                <button
                  type="button"
                  onClick={handleEmailTest}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Test Email
                </button>
              </div>
            )}

            <SwitchRow
              title="Telegram Bot"
              description="Kirim alert penting ke bot Telegram."
              checked={settings.telegramNotification}
              onChange={() =>
                updateSetting(
                  "telegramNotification",
                  !settings.telegramNotification,
                )
              }
            />

            {settings.telegramNotification && (
              <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-900">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    value={settings.telegramBotToken || ""}
                    onChange={(e) =>
                      updateSetting("telegramBotToken", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    placeholder="123456:ABC..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-900">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={settings.telegramChatId || ""}
                    onChange={(e) =>
                      updateSetting("telegramChatId", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    placeholder="123456789"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTelegramTest}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Test Telegram
                </button>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="mb-3 font-semibold text-slate-900">
                Jenis Alert Aktif
              </p>

              <div className="space-y-2">
                <CheckboxRow
                  label="Antrean Level 2 / padat"
                  checked={settings.queueAlert}
                  onChange={() => updateSetting("queueAlert", !settings.queueAlert)}
                />
                <CheckboxRow
                  label="Perangkat offline"
                  checked={settings.deviceOfflineAlert}
                  onChange={() =>
                    updateSetting(
                      "deviceOfflineAlert",
                      !settings.deviceOfflineAlert,
                    )
                  }
                />
                <CheckboxRow
                  label="Dummy mode aktif"
                  checked={settings.dummyModeAlert}
                  onChange={() =>
                    updateSetting("dummyModeAlert", !settings.dummyModeAlert)
                  }
                />
                <CheckboxRow
                  label="Sinyal WiFi ESP32 lemah"
                  checked={settings.weakWifiAlert}
                  onChange={() =>
                    updateSetting("weakWifiAlert", !settings.weakWifiAlert)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "iot" && (
          <div className="space-y-4 lg:space-y-6">
            <h3 className="text-base font-bold text-slate-900 lg:text-lg">
              Pengaturan IoT & Sensor
            </h3>

            <div className="rounded-lg bg-slate-50 p-4">
              <label className="mb-2 block font-semibold text-slate-900">
                Interval Pengambilan Data (detik)
              </label>

              <input
                type="number"
                value={settings.sensorInterval}
                onChange={(event) =>
                  updateSetting("sensorInterval", Number(event.target.value))
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                min={1}
                max={60}
              />

              <p className="mt-1 text-xs text-slate-500">
                Saat ini: {settings.sensorInterval} detik
              </p>
            </div>

            <InfoBox
              icon="sensors"
              title="Konfigurasi IoT utama"
              description="Pengaturan waktu lampu dan mode adaptif tetap diatur melalui halaman IoT Config agar tersinkron ke ESP32."
            />
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 lg:text-lg">
              Keamanan
            </h3>

            <InfoBox
              icon="verified_user"
              title="Login aman"
              description="Akun menggunakan NextAuth. Password lokal terenkripsi bcrypt, sedangkan akun Google memakai OAuth."
              color="green"
            />

            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="mb-3 font-bold text-slate-900">Ubah Password</h4>

              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm((current) => ({
                      ...current,
                      oldPassword: e.target.value,
                    }))
                  }
                  placeholder="Password lama"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                />

                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Password baru"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                />

                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Konfirmasi password baru"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Simpan Password Baru
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Catatan: fitur ini hanya berlaku untuk akun email/password. Akun
                Google tidak memiliki password lokal.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row lg:mt-8 lg:gap-3 lg:pt-6">
          <button
            type="button"
            onClick={fetchSettings}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto lg:px-6 lg:text-base"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto lg:px-6 lg:text-base"
          >
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 lg:p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 lg:text-base">
          {title}
        </p>
        <p className="text-xs text-slate-500 lg:text-sm">{description}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors lg:h-8 lg:w-14 ${checked ? "bg-primary" : "bg-slate-300"
          }`}
      >
        <div
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform lg:h-6 lg:w-6 ${checked ? "translate-x-6 lg:translate-x-7" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}

function SelectRow({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 lg:p-4">
      <label className="mb-2 block text-sm font-semibold text-slate-900 lg:text-base">
        {title}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 lg:px-4 lg:text-base"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded"
      />
      <span>{label}</span>
    </label>
  );
}

function InfoBox({
  icon,
  title,
  description,
  color = "blue",
}: {
  icon: string;
  title: string;
  description: string;
  color?: "blue" | "green";
}) {
  const cls =
    color === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined">{icon}</span>

        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}