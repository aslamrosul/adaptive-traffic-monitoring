export const TIMEZONE_OPTIONS = [
  {
    label: "WIB - Asia/Jakarta",
    value: "Asia/Jakarta",
  },
  {
    label: "WITA - Asia/Makassar",
    value: "Asia/Makassar",
  },
  {
    label: "WIT - Asia/Jayapura",
    value: "Asia/Jayapura",
  },
  {
    label: "UTC",
    value: "UTC",
  },
];

export const LANGUAGE_OPTIONS = [
  {
    label: "Bahasa Indonesia",
    value: "id",
  },
  {
    label: "English",
    value: "en",
  },
];

export function formatWithTimezone(
  timestamp?: string | null,
  timezone = "Asia/Jakarta",
) {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}