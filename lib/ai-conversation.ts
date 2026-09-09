// Logika percakapan AI: temporal parser (WIB), intent routing, follow-up,
// peak-hour berbasis volume, agregasi anomali. Murni (tanpa DB) + testable.
import {
  addDaysToDateValue,
  getWibDateValue,
} from "@/lib/timezone";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type TrafficIntent =
  | "peak_hour"
  | "congestion"
  | "recommendation"
  | "volume"
  | "anomaly"
  | "forecast"
  | "guide"
  | "about"
  | "action"
  | "unknown";

export interface ResolvedTimeframe {
  startDate: string;
  endDate: string;
  label: string;
  current: boolean;
}

function norm(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(q: string, keys: string[]): boolean {
  return keys.some((k) => q.includes(k));
}

// ---------------------------------------------------------------------------
// WIB helpers (Senin = awal pekan)
// ---------------------------------------------------------------------------

function wibParts(date = new Date()): { ymd: string; dowMon0: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const ymd = `${get("year")}-${get("month")}-${get("day")}`;
  // en short weekday: Sun..Sat
  const wd = parts.find((p) => p.type === "weekday")?.value || "";
  const sun0 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  const dowMon0 = sun0 < 0 ? 0 : (sun0 + 6) % 7;
  return { ymd, dowMon0 };
}

function mondayOfThisWeek(todayYmd: string, dowMon0: number): string {
  return addDaysToDateValue(todayYmd, -dowMon0);
}

// ---------------------------------------------------------------------------
// Temporal parser (deterministik, WIB)
// ---------------------------------------------------------------------------

export function parseTimeframe(
  question: string,
  now = new Date()
): ResolvedTimeframe | null {
  const q = norm(question);
  const { ymd: today, dowMon0 } = wibParts(now);
  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(q);

  if (
    hasWord("sekarang") ||
    q.includes("saat ini") ||
    q.includes("terkini") ||
    q.includes("realtime") ||
    q.includes("real time")
  ) {
    return { startDate: today, endDate: today, label: "saat ini", current: true };
  }
  if (hasWord("kemarin")) {
    const d = addDaysToDateValue(today, -1);
    return { startDate: d, endDate: d, label: "kemarin", current: false };
  }
  if (q.includes("hari ini")) {
    return { startDate: today, endDate: today, label: "hari ini", current: false };
  }
  if (
    q.includes("minggu ini") ||
    q.includes("pekan ini")
  ) {
    return {
      startDate: mondayOfThisWeek(today, dowMon0),
      endDate: today,
      label: "minggu ini",
      current: false,
    };
  }
  if (
    q.includes("seminggu terakhir") ||
    q.includes("7 hari terakhir") ||
    q.includes("tujuh hari terakhir")
  ) {
    return {
      startDate: addDaysToDateValue(today, -6),
      endDate: today,
      label: "7 hari terakhir",
      current: false,
    };
  }
  if (q.includes("minggu lalu") || q.includes("pekan lalu") || q.includes("seminggu lalu")) {
    const thisMon = mondayOfThisWeek(today, dowMon0);
    return {
      startDate: addDaysToDateValue(thisMon, -7),
      endDate: addDaysToDateValue(thisMon, -1),
      label: "minggu lalu",
      current: false,
    };
  }
  if (q.includes("bulan ini")) {
    return {
      startDate: today.slice(0, 8) + "01",
      endDate: today,
      label: "bulan ini",
      current: false,
    };
  }
  if (q.includes("bulan lalu")) {
    const firstThis = today.slice(0, 8) + "01";
    const endPrev = addDaysToDateValue(firstThis, -1);
    return {
      startDate: endPrev.slice(0, 8) + "01",
      endDate: endPrev,
      label: "bulan lalu",
      current: false,
    };
  }
  const m = q.match(/(\d{4})\s*[-\s]\s*(\d{1,2})\s*[-\s]\s*(\d{1,2})/);
  if (m) {
    const d = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    return { startDate: d, endDate: d, label: d, current: false };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Intent routing (peak_hour SEBELUM congestion)
// ---------------------------------------------------------------------------

const PEAK_KEYS = [
  "jam paling sibuk",
  "jam tersibuk",
  "jam sibuk",
  "jam puncak",
  "jam ramai",
  "jam brp",
  "jam berapa",
  "pukul berapa",
  "pukul brp",
  "kapan paling ramai",
  "kapan paling padat",
  "kapan tersibuk",
  "peak hour",
  "busiest hour",
  "rush hour",
];

const CONGESTION_KEYS = [
  "paling padat",
  "termacet",
  "macet",
  "congested",
  "padat",
  "ramai",
  "sibuk",
  "paling ramai",
  "most congested",
  "jalur mana",
  "lajur mana",
];

const CURRENT_KEYS = ["sekarang", "saat ini", "terkini", "realtime", "real time"];

export function detectIntent(question: string): TrafficIntent {
  const q = norm(question);
  if (has(q, PEAK_KEYS)) return "peak_hour";
  if (has(q, CONGESTION_KEYS)) {
    // "jalur mana" tanpa konteks waktu lain = kondisi saat ini/dominan
    return "congestion";
  }
  if (
    has(q, [
      "rekomendasi", "durasi hijau", "lampu hijau", "green", "saran",
      "tambah", "tingkatkan", "recommendation",
    ])
  )
    return "recommendation";
  if (
    has(q, ["volume", "kendaraan", "berapa banyak", "jumlah kendaraan", "banyak", "traffic volume"])
  )
    return "volume";
  if (
    has(q, ["anomali", "masalah", "error", "offline", "aneh", "gangguan", "rusak", "anomaly"])
  )
    return "anomaly";
  if (
    has(q, ["prediksi", "forecast", "kedepan", "nanti", "besok", "ramalan", "kemungkinan", "akan datang"])
  )
    return "forecast";
  if (
    has(q, [
      "panduan", "tutorial", "cara pakai", "cara menggunakan", "cara memakai",
      "bantuan", "petunjuk", "guide", "how to use", "manual", "usage",
    ])
  )
    return "guide";
  if (
    has(q, ["apa itu", "cara kerja", "adaptive", "sistem", "bekerja", "how", "explain", "fungsi"])
  )
    return "about";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Follow-up
// ---------------------------------------------------------------------------

const FOLLOWUP_PATTERNS = [
  /^(jam|pukul)\s*(brp|berapa)\??$/,
  /^(jalur|lajur)\s*(mana|apa)\??$/,
  /^(berapa|brp)\s*(kendaraan|banyak|jumlah)?\??$/,
  /^(kenapa|mengapa)\??$/,
  /^(dibanding|banding).*(lalu|kemarin|minggu)/,
  /^(kalau|kalo)\s+(east|west|north|south|utara|selatan|timur|barat)/,
  /^(sekarang|saat ini)\s*(gimana|bagaimana|gmn)\??$/,
  /^(gimana|bagaimana|gmn|terus|lanjut)\??$/,
];

export function isFollowUp(question: string): boolean {
  const q = norm(question);
  if (q.split(" ").length > 6) return false;
  return FOLLOWUP_PATTERNS.some((re) => re.test(q));
}

export interface ResolvedConversation {
  effectiveQuestion: string;
  timeframe: ResolvedTimeframe | null;
  intent: TrafficIntent;
  inherited: boolean;
}

// Pertanyaan singkat + riwayat ada -> warisi konteks turn terakhir yang bermakna.
export function resolveConversation(
  question: string,
  history: ChatTurn[],
  now = new Date()
): ResolvedConversation {
  const intent = detectIntent(question);
  const timeframe = parseTimeframe(question, now);
  if (!isFollowUp(question) || history.length === 0) {
    return { effectiveQuestion: question, timeframe, intent, inherited: false };
  }
  // Cari turn user terakhir yang substantif (>6 kata atau punya timeframe sendiri).
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i];
    if (turn.role !== "user") continue;
    const words = norm(turn.content).split(" ").filter(Boolean);
    if (words.length <= 6 && !parseTimeframe(turn.content, now)) continue;
    const prevIntent = detectIntent(turn.content);
    const prevTf = parseTimeframe(turn.content, now);
    return {
      effectiveQuestion: `${turn.content} ${question}`,
      timeframe: timeframe || prevTf,
      intent: intent === "unknown" ? prevIntent : intent,
      inherited: true,
    };
  }
  return { effectiveQuestion: question, timeframe, intent, inherited: false };
}

// ---------------------------------------------------------------------------
// Peak hour berbasis VOLUME (delta counter per device per jam)
// ---------------------------------------------------------------------------

export interface VolumeSample {
  deviceId: string;
  lane: string;
  timestamp: string;
  count: number;
}

export interface PeakHourResult {
  hour: number | null;
  label: string | null;
  peakFlow: number;
  hourlyFlow: number[];
  metric: "volume" | "queue-level";
  totalFlow: number;
}

function hourOf(ts: string): number {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(ts))
  );
  return Number.isFinite(h) && h >= 0 && h < 24 ? h : -1;
}

function wibDateOf(ts: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

export function peakHourByVolume(samples: VolumeSample[]): PeakHourResult {
  const hourlyFlow = new Array(24).fill(0) as number[];
  // Kelompokkan per device+lane+TANGGAL WIB; delta kronologis di dalam grup.
  // Tiap delta diatribusikan ke jam WIB sampel AKHIR. Tak ada delta lintas hari.
  const groups = new Map<string, { t: number; c: number }[]>();
  for (const s of samples) {
    const h = hourOf(s.timestamp);
    if (h < 0 || !Number.isFinite(s.count) || s.count < 0) continue;
    const t = new Date(s.timestamp).getTime();
    if (!Number.isFinite(t)) continue;
    const key = `${s.deviceId}|${s.lane}|${wibDateOf(s.timestamp)}`;
    const arr = groups.get(key) || [];
    arr.push({ t, c: s.count });
    groups.set(key, arr);
  }
  let totalFlow = 0;
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.t - b.t);
    for (let i = 1; i < arr.length; i += 1) {
      const d = arr[i].c - arr[i - 1].c;
      const add = d >= 0 ? d : arr[i].c;
      if (add <= 0) continue;
      const hh = hourOf(new Date(arr[i].t).toISOString());
      if (hh < 0) continue;
      hourlyFlow[hh] += add;
      totalFlow += add;
    }
  }
  let peak: number | null = null;
  let best = 0;
  for (let h = 0; h < 24; h += 1) {
    if (hourlyFlow[h] > best) {
      best = hourlyFlow[h];
      peak = h;
    }
  }
  if (peak === null || totalFlow <= 0) {
    return { hour: null, label: null, peakFlow: 0, hourlyFlow, metric: "volume", totalFlow };
  }
  return {
    hour: peak,
    label: `${String(peak).padStart(2, "0")}:00 WIB`,
    peakFlow: best,
    hourlyFlow,
    metric: "volume",
    totalFlow,
  };
}

// ---------------------------------------------------------------------------
// Validasi history client (H/I)
// ---------------------------------------------------------------------------

export function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatTurn[] = [];
  for (const item of raw) {
    if (out.length >= 10) break;
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    if (rec.role !== "user" && rec.role !== "assistant") continue;
    const content = String(rec.content || "").trim().slice(0, 500);
    if (!content) continue;
    out.push({ role: rec.role, content });
  }
  // Maks 8 pesan terakhir (4 pasang), total dibatasi.
  const trimmed = out.slice(-8);
  let total = 0;
  const final: ChatTurn[] = [];
  for (const t of trimmed) {
    total += t.content.length;
    if (total > 4000) break;
    final.push(t);
  }
  return final;
}
