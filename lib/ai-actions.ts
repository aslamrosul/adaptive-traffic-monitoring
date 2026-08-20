import "server-only";

import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { saveIoTConfig } from "@/lib/iot-config-service";
import { createActivityLog } from "@/lib/activity-log-service";
import type { AiSummary } from "@/lib/ai-service";

export type AiActionFieldType = "text" | "number" | "select" | "password";

export interface AiActionField {
  name: string;
  label: string;
  type: AiActionFieldType;
  required: boolean;
  options?: { value: string; label: string }[];
  value?: string | number | boolean;
}

export interface AiActionProposal {
  type: string;
  label: string;
  description: string;
  fields: AiActionField[];
}

export interface AiActionExecutorContext {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
}

// ---------------------------------------------------------------------------
// Deteksi intent aksi dari pertanyaan (rule-based)
// ---------------------------------------------------------------------------

function extractSeconds(question: string): number | null {
  const matches = [
    ...question.matchAll(/(\d{1,3})\s*(?:detik|s\b|second|dtk|d\b)/gi),
  ];
  if (matches.length === 0) return null;
  const value = Number(matches[0][1]);
  return value >= 1 && value <= 120 ? value : null;
}

function extractLevel(question: string): number | null {
  const match = question.match(/level\s*([0-2])/i);
  if (match) return Number(match[1]);
  if (/padat|level 2|macet|terpadat/i.test(question)) return 2;
  if (/sedang|level 1/i.test(question)) return 1;
  if (/lancar|level 0/i.test(question)) return 0;
  return null;
}

function extractLanguage(question: string): string | null {
  const q = question.toLowerCase();
  if (/jepang|japanese|\bja\b/.test(q)) return "ja";
  if (/inggris|english|\ben\b/.test(q)) return "en";
  if (/indonesia|indonesian|\bid\b/.test(q)) return "id";
  return null;
}

function extractName(text: string, prefixRegex: RegExp): string | null {
  const match = text.match(prefixRegex);
  if (!match) return null;
  return match[1]?.trim().replace(/[.,!?]+$/, "") || null;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/i;

export function detectAiActionIntent(
  question: string,
  summary: AiSummary,
  ctx: { intersectionId?: string | null }
): AiActionProposal | null {
  const normalized = question.toLowerCase();
  const intersectionId = ctx.intersectionId || null;

  // 1. Terapkan rekomendasi durasi hijau (level 0/1/2)
  if (
    /terapkan rekomendasi|apply recommendation|rekomendasi durasi|terapkan.*hijau|rekomendasi.*hijau|terapkan.*rekomendasi/i.test(
      normalized
    )
  ) {
    return {
      type: "apply_green_recommendations",
      label: "Terapkan Rekomendasi Durasi Hijau",
      description:
        "Menerapkan durasi lampu hijau yang direkomendasikan untuk semua level antrean (0: 10s, 1: 20s, 2: 30s) ke perangkat yang aktif, lalu mengirimkannya ke ESP32 via MQTT.",
      fields: [
        {
          name: "deviceId",
          label: "Device ID",
          type: "text",
          required: true,
          value: defaultDeviceId(summary) || "",
        },
        {
          name: "level0Green",
          label: "Durasi Hijau Level 0 (lancar) — detik",
          type: "number",
          required: true,
          value: 10,
        },
        {
          name: "level1Green",
          label: "Durasi Hijau Level 1 (sedang) — detik",
          type: "number",
          required: true,
          value: 20,
        },
        {
          name: "level2Green",
          label: "Durasi Hijau Level 2 (padat) — detik",
          type: "number",
          required: true,
          value: 30,
        },
      ],
    };
  }

  // 2. Ubah durasi lampu hijau satu level
  if (
    /(durasi|lama|waktu).*(hijau|green)|(hijau|green).*(durasi|lama|waktu)|atur.*(hijau|green)|ubah.*(hijau|green)|set.*(hijau|green)|lampu hijau/i.test(
      normalized
    )
  ) {
    const seconds = extractSeconds(question);
    const level = extractLevel(question);
    return {
      type: "set_green_duration",
      label: "Ubah Durasi Lampu Hijau",
      description:
        "Mengubah durasi lampu hijau untuk satu level antrean pada perangkat yang dipilih, lalu mengirimkannya ke ESP32 via MQTT.",
      fields: [
        {
          name: "deviceId",
          label: "Device ID",
          type: "text",
          required: true,
          value: defaultDeviceId(summary) || "",
        },
        {
          name: "level",
          label: "Level Antrean",
          type: "select",
          required: true,
          options: [
            { value: "0", label: "Level 0 (lancar)" },
            { value: "1", label: "Level 1 (sedang)" },
            { value: "2", label: "Level 2 (padat)" },
          ],
          value: level ?? 2,
        },
        {
          name: "greenSeconds",
          label: "Durasi Hijau (detik)",
          type: "number",
          required: true,
          value: seconds ?? recommendedGreen(level),
        },
      ],
    };
  }

  // 3. Tambah persimpangan
  const addIntersectionMatch = question.match(
    /(?:tambah|buat|daftarkan?|add|create)\s*(?:persimpangan|intersection|simpang)\s*(?::|saya|baru)?\s*"?([a-zA-Z0-9 _-]+)"?/i
  );
  if (/tambah.*persimpangan|tambah.*intersection|buat.*persimpangan|add intersection|create intersection/i.test(normalized)) {
    return {
      type: "add_intersection",
      label: "Tambah Persimpangan",
      description:
        "Mendaftarkan persimpangan baru ke sistem. Nama wajib diisi; ID dan alamat opsional.",
      fields: [
        {
          name: "name",
          label: "Nama Persimpangan",
          type: "text",
          required: true,
          value: addIntersectionMatch ? addIntersectionMatch[1].trim() : "",
        },
        {
          name: "id",
          label: "ID Persimpangan (opsional)",
          type: "text",
          required: false,
          value: "",
        },
        {
          name: "address",
          label: "Alamat (opsional)",
          type: "text",
          required: false,
          value: "",
        },
      ],
    };
  }

  // 4. Tambah user
  if (
    /tambah.*(user|pengguna|akun)|buat.*(user|pengguna|akun)|add user|create user|register user/i.test(
      normalized
    )
  ) {
    const email = question.match(EMAIL_RE)?.[0] || "";
    const name =
      extractName(question, /(?:tambah|buat|add|create)\s*(?:user|pengguna|akun)\s*(?:baru)?\s*"?([a-zA-Z0-9 _-]+)"?/i) ||
      "";
    const role = /admin/i.test(normalized) ? "admin" : "operator";
    return {
      type: "add_user",
      label: "Tambah Pengguna",
      description:
        "Membuat akun pengguna baru (credentials). Nama, email, role, dan password wajib diisi.",
      fields: [
        {
          name: "name",
          label: "Nama",
          type: "text",
          required: true,
          value: name,
        },
        {
          name: "email",
          label: "Email",
          type: "text",
          required: true,
          value: email,
        },
        {
          name: "role",
          label: "Role",
          type: "select",
          required: true,
          options: [
            { value: "operator", label: "Operator" },
            { value: "admin", label: "Admin" },
          ],
          value: role,
        },
        {
          name: "password",
          label: "Password (min. 6 karakter)",
          type: "password",
          required: true,
          value: "",
        },
      ],
    };
  }

  // 5. Ubah pengaturan (bahasa, mode otomatis, interval sensor)
  if (
    /ubah.*bahasa|ganti.*bahasa|change language|set language|language|auto.?mode|otomatis|sensor.*interval|interval.*sensor|pengaturan|settings|atur (aplikasi|sistem)/i.test(
      normalized
    )
  ) {
    const lang = extractLanguage(question);
    const autoMode = /auto.?mode|mode otomatis|adaptive|adaptif/i.test(normalized)
      ? /matikan|off|disable|nonaktif/.test(normalized)
        ? false
        : true
      : undefined;
    return {
      type: "update_settings",
      label: "Ubah Pengaturan Aplikasi",
      description:
        "Memperbarui pengaturan aplikasi untuk akun Anda (bahasa, mode otomatis, interval sensor).",
      fields: [
        {
          name: "language",
          label: "Bahasa",
          type: "select",
          required: false,
          options: [
            { value: "id", label: "Indonesia" },
            { value: "en", label: "English" },
            { value: "ja", label: "日本語" },
          ],
          value: lang || "id",
        },
        {
          name: "autoMode",
          label: "Mode Otomatis",
          type: "select",
          required: false,
          options: [
            { value: "true", label: "Aktif" },
            { value: "false", label: "Nonaktif" },
          ],
          value: autoMode === undefined ? "true" : String(autoMode),
        },
        {
          name: "sensorInterval",
          label: "Interval Sensor (detik)",
          type: "number",
          required: false,
          value: 5,
        },
      ],
    };
  }

  return null;
}

function defaultDeviceId(summary: AiSummary): string | null {
  return summary.intersectionId ? `ESP32_${summary.intersectionId}` : null;
}

function recommendedGreen(level: number | null): number {
  if (level === 0) return 10;
  if (level === 1) return 20;
  return 30;
}

// ---------------------------------------------------------------------------
// Eksekusi aksi
// ---------------------------------------------------------------------------

export async function executeAiAction(
  type: string,
  params: Record<string, any>,
  context: AiActionExecutorContext
): Promise<{ message: string; data?: any }> {
  const { user } = context;

  switch (type) {
    case "apply_green_recommendations": {
      const deviceId = String(params.deviceId || "").trim();
      if (!deviceId) throw new Error("Device ID wajib diisi");

      const result = await saveIoTConfig({
        deviceId,
        densityLevel0Green: Number(params.level0Green) || 10,
        densityLevel1Green: Number(params.level1Green) || 20,
        densityLevel2Green: Number(params.level2Green) || 30,
      });

      await createActivityLog({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "iot.config.update",
        action: "AI menerapkan rekomendasi durasi hijau",
        description: `Menerapkan rekomendasi durasi hijau (0:${params.level0Green}s, 1:${params.level1Green}s, 2:${params.level2Green}s) ke perangkat ${deviceId}`,
        metadata: { deviceId, source: "ai-assistant" },
      }).catch(() => {});

      return {
        message: `Rekomendasi durasi hijau berhasil diterapkan ke device ${deviceId} (level 0: ${params.level0Green}s, level 1: ${params.level1Green}s, level 2: ${params.level2Green}s).${
          result.mqttSent ? " Konfigurasi juga telah dikirim ke ESP32." : " Konfigurasi disimpan, tetapi pengiriman MQTT gagal."
        }`,
        data: { config: result.config, mqttSent: result.mqttSent },
      };
    }

    case "set_green_duration": {
      const deviceId = String(params.deviceId || "").trim();
      const level = Number(params.level);
      const seconds = Number(params.greenSeconds);
      if (!deviceId) throw new Error("Device ID wajib diisi");
      if (![0, 1, 2].includes(level)) throw new Error("Level harus 0, 1, atau 2");
      if (!(seconds >= 1 && seconds <= 120)) throw new Error("Durasi hijau harus antara 1–120 detik");

      const result = await saveIoTConfig({
        deviceId,
        [`densityLevel${level}Green`]: seconds,
      });

      await createActivityLog({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "iot.config.update",
        action: "AI mengubah durasi lampu hijau",
        description: `Durasi hijau level ${level} device ${deviceId} diubah menjadi ${seconds} detik`,
        metadata: { deviceId, level, greenSeconds: seconds, source: "ai-assistant" },
      }).catch(() => {});

      return {
        message: `Durasi lampu hijau level ${level} untuk device ${deviceId} berhasil diubah menjadi ${seconds} detik.${
          result.mqttSent ? " Konfigurasi telah dikirim ke ESP32." : " Konfigurasi disimpan, tetapi pengiriman MQTT gagal."
        }`,
        data: { config: result.config, mqttSent: result.mqttSent },
      };
    }

    case "add_intersection": {
      const name = String(params.name || "").trim();
      if (!name) throw new Error("Nama persimpangan wajib diisi");

      const intersectionId =
        String(params.id || "").trim() || `intersection_${Date.now()}`;

      const item = {
        id: intersectionId,
        intersection_id: intersectionId,
        name,
        address: String(params.address || "").trim() || "-",
        status: "active",
        lanes: {
          count: 3,
          directions: ["north", "south", "east"],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamo.send(
        new PutCommand({
          TableName: awsTables.intersections,
          Item: item,
        })
      );

      await createActivityLog({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "intersection.create",
        action: "AI menambah persimpangan",
        description: `Menambahkan persimpangan ${name}`,
        metadata: { intersectionId, intersectionName: name, source: "ai-assistant" },
      }).catch(() => {});

      return {
        message: `Persimpangan "${name}" berhasil ditambahkan (ID: ${intersectionId}).`,
        data: item,
      };
    }

    case "add_user": {
      const name = String(params.name || "").trim();
      const email = String(params.email || "").trim().toLowerCase();
      const role = String(params.role || "operator").toLowerCase();
      const password = String(params.password || "");

      if (!name || !email || !password) {
        throw new Error("Nama, email, dan password wajib diisi");
      }
      if (!/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(email)) {
        throw new Error("Format email tidak valid");
      }
      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const item = {
        email,
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        name,
        password: hashedPassword,
        role: role.includes("admin") ? "admin" : "operator",
        phone: "",
        photoURL: "",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0040a1&color=fff`,
        location: "",
        status: "active",
        provider: "credentials",
        reportsCreated: 0,
        reportsCompleted: 0,
        activeHours: 0,
        createdAt: now,
        updatedAt: now,
      };

      await dynamo.send(
        new PutCommand({
          TableName: awsTables.users,
          Item: item,
          ConditionExpression: "attribute_not_exists(email)",
        })
      );

      await createActivityLog({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "user.create",
        action: "AI menambah pengguna",
        description: `Menambahkan pengguna ${name} dengan role ${item.role}`,
        metadata: { targetUserEmail: email, targetUserRole: item.role, source: "ai-assistant" },
      }).catch(() => {});

      return {
        message: `Pengguna "${name}" (${email}, role ${item.role}) berhasil ditambahkan.`,
        data: { email, name, role: item.role, id: item.id },
      };
    }

    case "update_settings": {
      const dbUser = await dynamo.send(
        new GetCommand({
          TableName: awsTables.users,
          Key: { email: user.email },
        })
      );
      if (!dbUser.Item) throw new Error("Akun tidak ditemukan");

      const existing = dbUser.Item.appSettings || {};
      const patch: Record<string, any> = {};

      if (params.language !== undefined && params.language !== "") {
        patch.language = String(params.language);
      }
      if (params.autoMode !== undefined && params.autoMode !== "") {
        patch.autoMode = params.autoMode === "true" || params.autoMode === true;
      }
      if (params.sensorInterval !== undefined && params.sensorInterval !== "") {
        patch.sensorInterval = Number(params.sensorInterval);
      }
      if (params.timezone !== undefined && params.timezone !== "") {
        patch.timezone = String(params.timezone);
      }

      if (Object.keys(patch).length === 0) {
        throw new Error("Tidak ada pengaturan yang diubah");
      }

      const appSettings = { ...existing, ...patch };

      await dynamo.send(
        new PutCommand({
          TableName: awsTables.users,
          Item: { ...dbUser.Item, appSettings, updatedAt: new Date().toISOString() },
        })
      );

      await createActivityLog({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "settings.update",
        action: "AI mengubah pengaturan aplikasi",
        description: `Memperbarui pengaturan: ${Object.keys(patch).join(", ")}`,
        metadata: { changedFields: Object.keys(patch), source: "ai-assistant" },
      }).catch(() => {});

      const messages: string[] = [];
      if (patch.language) {
        const langName =
          patch.language === "en" ? "English" : patch.language === "ja" ? "日本語" : "Indonesia";
        messages.push(`bahasa diubah ke ${langName}`);
      }
      if (patch.autoMode !== undefined) {
        messages.push(`mode otomatis ${patch.autoMode ? "diaktifkan" : "dinonaktifkan"}`);
      }
      if (patch.sensorInterval !== undefined) {
        messages.push(`interval sensor ${patch.sensorInterval} detik`);
      }

      return {
        message: `Pengaturan berhasil disimpan: ${messages.join(", ")}.`,
        data: appSettings,
      };
    }

    default:
      throw new Error(`Aksi AI tidak dikenal: ${type}`);
  }
}