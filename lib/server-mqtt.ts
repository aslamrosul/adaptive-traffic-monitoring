import "server-only";

import mqtt, { type MqttClient } from "mqtt";

export interface MqttPublishMessage {
  topic: string;
  payload: string | number | boolean | object;
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

export interface MqttPublishResult {
  topic: string;
  success: boolean;
  error?: string;
}

const mqttUrl =
  process.env.MQTT_SERVER_URL || "mqtt://127.0.0.1:1883";

const mqttUsername = process.env.MQTT_USER;
const mqttPassword = process.env.MQTT_PASS;

function serializePayload(
  payload: MqttPublishMessage["payload"]
): string {
  if (typeof payload === "string") return payload;

  if (
    typeof payload === "number" ||
    typeof payload === "boolean"
  ) {
    return String(payload);
  }

  return JSON.stringify(payload);
}

function publishSingleMessage(
  client: MqttClient,
  message: MqttPublishMessage
): Promise<MqttPublishResult> {
  return new Promise((resolve) => {
    client.publish(
      message.topic,
      serializePayload(message.payload),
      {
        qos: message.qos ?? 1,
        retain: message.retain ?? true,
      },
      (error) => {
        if (error) {
          resolve({
            topic: message.topic,
            success: false,
            error: error.message,
          });

          return;
        }

        resolve({
          topic: message.topic,
          success: true,
        });
      }
    );
  });
}

export async function publishMqttMessages(
  messages: MqttPublishMessage[]
): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  results: MqttPublishResult[];
}> {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(mqttUrl, {
      username: mqttUsername,
      password: mqttPassword,
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: 6000,
      clientId: `next_server_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`,
    });

    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) return;

      finished = true;
      client.end(true);
      reject(new Error("MQTT connection timeout"));
    }, 10000);

    client.once("connect", async () => {
      try {
        const results: MqttPublishResult[] = [];

        for (const message of messages) {
          const result = await publishSingleMessage(client, message);
          results.push(result);
        }

        const successCount = results.filter(
          (result) => result.success
        ).length;

        const failedCount = results.length - successCount;

        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          client.end(false);

          resolve({
            success: failedCount === 0,
            successCount,
            failedCount,
            results,
          });
        }
      } catch (error) {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          client.end(true);
          reject(error);
        }
      }
    });

    client.once("error", (error) => {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      client.end(true);
      reject(error);
    });
  });
}