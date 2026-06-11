import "server-only";

import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { publishMqttMessages } from "@/lib/server-mqtt";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

export interface IoTConfigRecord {
  device_id: string;
  deviceId: string;

  intersection_id: string | null;
  intersectionId: string | null;

  greenTime: number;
  yellowTime: number;

  densityLevel0Green: number;
  densityLevel1Green: number;
  densityLevel2Green: number;

  autoMode: boolean;
  adaptiveMode: boolean;

  status: "active" | "inactive";

  createdAt: string;
  updatedAt: string;

  lastSyncedAt: string | null;
  lastSyncStatus: "pending" | "success" | "partial" | "failed";
  lastSyncErrors?: Array<{
    topic: string;
    error?: string;
  }>;
}

function toNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, parsed));
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "on" ||
      normalized === "1"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "off" ||
      normalized === "0"
    ) {
      return false;
    }
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return fallback;
}

export function buildIoTConfig(
  input: any,
  existing?: Partial<IoTConfigRecord> | null
): IoTConfigRecord {
  const now = new Date().toISOString();

  const deviceId = String(
    input.deviceId ||
      input.device_id ||
      existing?.deviceId ||
      existing?.device_id ||
      ""
  ).trim();

  const intersectionId =
    input.intersectionId ||
    input.intersection_id ||
    existing?.intersectionId ||
    existing?.intersection_id ||
    null;

  return {
    device_id: deviceId,
    deviceId,

    intersection_id: intersectionId,
    intersectionId,

    greenTime: toNumber(
      input.greenTime,
      existing?.greenTime ?? 10,
      1,
      120
    ),

    yellowTime: toNumber(
      input.yellowTime,
      existing?.yellowTime ?? 3,
      1,
      30
    ),

    densityLevel0Green: toNumber(
      input.densityLevel0Green,
      existing?.densityLevel0Green ?? 10,
      1,
      120
    ),

    densityLevel1Green: toNumber(
      input.densityLevel1Green,
      existing?.densityLevel1Green ?? 20,
      1,
      120
    ),

    densityLevel2Green: toNumber(
      input.densityLevel2Green,
      existing?.densityLevel2Green ?? 30,
      1,
      120
    ),

    autoMode: toBoolean(
      input.autoMode,
      existing?.autoMode ?? true
    ),

    adaptiveMode: toBoolean(
      input.adaptiveMode,
      existing?.adaptiveMode ?? true
    ),

    status:
      input.status === "inactive"
        ? "inactive"
        : existing?.status || "active",

    createdAt: existing?.createdAt || now,
    updatedAt: now,

    lastSyncedAt: existing?.lastSyncedAt || null,
    lastSyncStatus: "pending",
  };
}

export async function getIoTConfig(
  deviceId: string
): Promise<IoTConfigRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.iotConfigs,
      Key: {
        device_id: deviceId,
      },
    })
  );

  return (result.Item as IoTConfigRecord) || null;
}

export async function listIoTConfigs(): Promise<IoTConfigRecord[]> {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: awsTables.iotConfigs,
      Limit: 500,
    })
  );

  return ((result.Items || []) as IoTConfigRecord[]).sort(
    (a, b) =>
      String(b.updatedAt || "").localeCompare(
        String(a.updatedAt || "")
      )
  );
}

export async function publishIoTConfig(config: IoTConfigRecord) {
  const deviceId = config.deviceId || config.device_id;

  return publishMqttMessages([
    {
      topic: `traffic/${deviceId}/config/set`,
      payload: {
        device_id: deviceId,
        intersection_id: config.intersectionId || config.intersection_id,
        green_time_s: config.greenTime,
        yellow_time_s: config.yellowTime,
        density_level_0_green_s: config.densityLevel0Green,
        density_level_1_green_s: config.densityLevel1Green,
        density_level_2_green_s: config.densityLevel2Green,
        auto_mode: config.autoMode,
        adaptive_mode: config.adaptiveMode,
        updated_at: new Date().toISOString(),
      },
      qos: 1,
      retain: true,
    },
  ]);
}

export async function saveIoTConfig(input: any) {
  const deviceId = String(
    input.deviceId || input.device_id || ""
  ).trim();

  if (!deviceId) {
    throw new Error("Device ID wajib diisi");
  }

  const existing = await getIoTConfig(deviceId);
  const pendingConfig = buildIoTConfig(input, existing);

  await dynamo.send(
    new PutCommand({
      TableName: awsTables.iotConfigs,
      Item: pendingConfig,
    })
  );

  try {
    const publishResult = await publishIoTConfig(pendingConfig);

    const failedMessages = publishResult.results
      .filter((result) => !result.success)
      .map((result) => ({
        topic: result.topic,
        error: result.error,
      }));

    const finalConfig: IoTConfigRecord = {
      ...pendingConfig,

      lastSyncedAt:
        publishResult.successCount > 0
          ? new Date().toISOString()
          : null,

      lastSyncStatus:
        publishResult.failedCount === 0
          ? "success"
          : publishResult.successCount > 0
            ? "partial"
            : "failed",

      ...(failedMessages.length > 0
        ? {
            lastSyncErrors: failedMessages,
          }
        : {}),
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.iotConfigs,
        Item: finalConfig,
      })
    );

    return {
      config: finalConfig,
      mqttSent: publishResult.failedCount === 0,
      publishResult,
    };
  } catch (error: any) {
    const failedConfig: IoTConfigRecord = {
      ...pendingConfig,
      lastSyncedAt: null,
      lastSyncStatus: "failed",
      lastSyncErrors: [
        {
          topic: "mqtt-connection",
          error: error.message || "MQTT connection failed",
        },
      ],
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.iotConfigs,
        Item: failedConfig,
      })
    );

    return {
      config: failedConfig,
      mqttSent: false,
      publishResult: {
        success: false,
        successCount: 0,
        failedCount: 1,
        results: [],
      },
    };
  }
}

export async function deleteIoTConfig(deviceId: string) {
  await dynamo.send(
    new DeleteCommand({
      TableName: awsTables.iotConfigs,
      Key: {
        device_id: deviceId,
      },
    })
  );
}