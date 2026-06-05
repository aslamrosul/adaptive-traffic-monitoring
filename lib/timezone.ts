export const APP_TIMEZONE = "Asia/Jakarta";
export const APP_UTC_OFFSET = "+07:00";

/**
 * Menghasilkan tanggal YYYY-MM-DD berdasarkan zona waktu WIB.
 */
export function getWibDateValue(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Menambah atau mengurangi hari pada nilai YYYY-MM-DD.
 *
 * Contoh:
 * addDaysToDateValue("2026-06-06", -7)
 */
export function addDaysToDateValue(
  dateValue: string,
  days: number,
): string {
  const date = new Date(`${dateValue}T12:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/**
 * Mengubah rentang tanggal operasional WIB menjadi timestamp UTC
 * untuk query DynamoDB.
 */
export function wibDateRangeToUtc(
  startDate: string,
  endDate: string = startDate,
) {
  const startUtc = new Date(
    `${startDate}T00:00:00.000${APP_UTC_OFFSET}`,
  ).toISOString();

  const endUtc = new Date(
    `${endDate}T23:59:59.999${APP_UTC_OFFSET}`,
  ).toISOString();

  return {
    startUtc,
    endUtc,
  };
}

/**
 * Membaca date/startDate/endDate dari query parameter,
 * lalu menghasilkan batas query UTC.
 */
export function resolveWibAnalyticsRange(
  searchParams: URLSearchParams,
) {
  const singleDate = searchParams.get("date");

  const startDate =
    searchParams.get("startDate") ||
    singleDate ||
    getWibDateValue();

  const endDate =
    searchParams.get("endDate") ||
    singleDate ||
    startDate;

  const { startUtc, endUtc } = wibDateRangeToUtc(
    startDate,
    endDate,
  );

  return {
    startDate,
    endDate,
    startUtc,
    endUtc,
  };
}

/**
 * Mengambil nomor jam berdasarkan WIB.
 */
export function getWibHour(timestamp: string): number {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? 0,
  );

  return hour === 24 ? 0 : hour;
}

/**
 * Format timestamp UTC menjadi waktu WIB untuk tampilan pengguna.
 */
export function formatWib(
  timestamp?: string | null,
  includeSeconds = true,
): string {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds
      ? {
          second: "2-digit",
        }
      : {}),
    hour12: false,
  }).format(date);
}