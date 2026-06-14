"use client";

type TranslateFn = (key: string) => string;

type NotificationLike = {
  title?: string | null;
  message?: string | null;
  titleKey?: string | null;
  messageKey?: string | null;
  params?: any;
  metadata?: any;
  notificationType?: string | null;
  code?: string | null;
  type?: string | null;
  severity?: string | null;
  category?: string | null;
  intersection_id?: string | null;
  device_id?: string | null;
  lane?: string | null;
};

function parseObject(value: any): Record<string, any> {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object") {
    return value;
  }

  return {};
}

function normalizeNotificationCode(notif: NotificationLike) {
  const metadata = parseObject(notif.metadata);
  const rawCode = String(
    notif.notificationType ||
      notif.code ||
      metadata.notificationType ||
      metadata.code ||
      "",
  )
    .trim()
    .toLowerCase();

  if (rawCode) {
    if (rawCode === "dummy_mode") return "dummyMode";
    if (rawCode === "sensor_mode_false") return "sensorModeFalse";
    if (rawCode === "weak_wifi") return "weakWifi";
    if (rawCode === "queue_level_2") return "queueLevel2";

    return rawCode.replace(/_([a-z])/g, (_, letter) =>
      String(letter).toUpperCase(),
    );
  }

  if (metadata.wifi_rssi !== undefined || metadata.wifiRssi !== undefined) {
    return "weakWifi";
  }

  if (metadata.dummy_mode === true || metadata.dummyMode === true) {
    return "dummyMode";
  }

  if (metadata.sensor_mode === false || metadata.sensorMode === false) {
    return "sensorModeFalse";
  }

  if (
    metadata.queue_level !== undefined ||
    metadata.queueLevel !== undefined ||
    metadata.queue_detected !== undefined ||
    metadata.queueDetected !== undefined
  ) {
    return "queueLevel2";
  }

  const title = String(notif.title || "").toLowerCase();
  const message = String(notif.message || "").toLowerCase();
  const text = `${title} ${message}`;

  if (text.includes("wifi") || text.includes("rssi")) return "weakWifi";
  if (text.includes("dummy")) return "dummyMode";
  if (text.includes("sensor mode")) return "sensorModeFalse";
  if (
    text.includes("antrean") ||
    text.includes("antrian") ||
    text.includes("queue")
  ) {
    return "queueLevel2";
  }

  return "";
}

function getNestedValue(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

export function getNotificationParams(
  notif: NotificationLike,
): Record<string, any> {
  const metadata = parseObject(notif.metadata);
  const params = parseObject(notif.params);

  return {
    ...metadata,
    ...params,

    intersection:
      params.intersection ||
      metadata.intersection ||
      notif.intersection_id ||
      "-",

    intersectionId:
      params.intersectionId ||
      metadata.intersectionId ||
      notif.intersection_id ||
      "-",

    deviceId:
      params.deviceId ||
      params.device_id ||
      metadata.deviceId ||
      metadata.device_id ||
      notif.device_id ||
      "-",

    device_id:
      params.device_id ||
      metadata.device_id ||
      notif.device_id ||
      "-",

    lane: params.lane || metadata.lane || notif.lane || "-",

    level:
      params.level ??
      getNestedValue(metadata, ["queue_level", "queueLevel"]) ??
      "-",

    queueEstimateCm:
      params.queueEstimateCm ??
      getNestedValue(metadata, ["queue_estimate_cm", "queueEstimateCm"]) ??
      "-",

    queueVehicles:
      params.queueVehicles ??
      getNestedValue(metadata, ["queue_vehicles", "queueVehicles"]) ??
      "-",

    rssi:
      params.rssi ??
      getNestedValue(metadata, ["wifi_rssi", "wifiRssi"]) ??
      "-",

    threshold:
      params.threshold ??
      getNestedValue(metadata, ["threshold", "wifi_threshold"]) ??
      "-",

    light:
      params.light ?? metadata.light ?? "-",

    message: notif.message || "",
  };
}

function isMissingTranslation(value: string, key: string) {
  return !value || value === key;
}

function translateParamValue(key: string, value: any, t: TranslateFn) {
  if (value === null || value === undefined || value === "") return "-";

  const raw = String(value);

  if (key === "lane" || key === "direction") {
    const translated = t(`traffic.${raw.toLowerCase()}`);
    return isMissingTranslation(translated, `traffic.${raw.toLowerCase()}`)
      ? raw
      : translated;
  }

  if (key === "light") {
    const lightKey = `traffic.${raw.toLowerCase()}Light`;
    const translated = t(lightKey);
    return isMissingTranslation(translated, lightKey) ? raw : translated;
  }

  if (key === "status") {
    const translated = t(`common.${raw.toLowerCase()}`);
    return isMissingTranslation(translated, `common.${raw.toLowerCase()}`)
      ? raw
      : translated;
  }

  if (key === "type" || key === "severity") {
    const translated = t(`notifications.types.${raw.toLowerCase()}`);
    return isMissingTranslation(
      translated,
      `notifications.types.${raw.toLowerCase()}`,
    )
      ? raw
      : translated;
  }

  return raw;
}

export function interpolateNotificationText(
  template: string,
  params: Record<string, any>,
  t: TranslateFn,
) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    translateParamValue(key, params[key], t),
  );
}

export function getNotificationText(
  notif: NotificationLike,
  field: "title" | "message",
  t: TranslateFn,
) {
  const explicitKey =
    field === "title" ? notif.titleKey : notif.messageKey;

  const code = normalizeNotificationCode(notif);
  const inferredKey = code
    ? `notifications.items.${code}.${field}`
    : "";

  const key = explicitKey || inferredKey;
  const params = getNotificationParams(notif);

  if (key) {
    const translated = t(key);

    if (!isMissingTranslation(translated, key)) {
      return interpolateNotificationText(translated, params, t);
    }
  }

  return String(notif[field] || "");
}
