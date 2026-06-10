import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";


const region = process.env.AWS_REGION || "ap-southeast-2";

const client = new DynamoDBClient({
  region,
});

export const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const awsTables = {
  traffic: process.env.DYNAMODB_TRAFFIC_TABLE || "TrafficTelemetry",
  intersections: process.env.DYNAMODB_INTERSECTIONS_TABLE || "Intersections",
  deviceStatus: process.env.DYNAMODB_DEVICE_STATUS_TABLE || "DeviceStatus",
  users: process.env.DYNAMODB_USERS_TABLE || "Users",
  iotConfigs: process.env.DYNAMODB_IOT_CONFIGS_TABLE || "IoTConfigs",
  notifications: process.env.DYNAMODB_NOTIFICATIONS_TABLE || "Notifications",
  userActivities: process.env.DYNAMODB_USER_ACTIVITIES_TABLE || "UserActivities",
};

export async function getLatestTrafficByIntersection(
  intersectionId: string,
  limit = 10
) {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: awsTables.traffic,
      KeyConditionExpression: "intersection_id = :intersection_id",
      ExpressionAttributeValues: {
        ":intersection_id": intersectionId,
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return result.Items || [];
}

export async function getRecentTraffic(limit = 100) {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: awsTables.traffic,
      Limit: limit,
    })
  );

  const items = result.Items || [];

  return items.sort((a: any, b: any) => {
    const ta = new Date(a.timestamp || a.received_at_utc || 0).getTime();
    const tb = new Date(b.timestamp || b.received_at_utc || 0).getTime();
    return tb - ta;
  });
}

export async function scanTable(tableName: string, limit = 100) {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
      Limit: limit,
    })
  );

  return result.Items || [];
}

export async function getIntersectionById(intersectionId: string) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.intersections,
      Key: {
        intersection_id: intersectionId,
      },
    })
  );

  return result.Item || null;
}

export async function putItem(tableName: string, item: any) {
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}

export async function scanTrafficByDateRange(options: {
  startDate?: string;
  endDate?: string;
  intersectionId?: string | null;
  limit?: number;
}) {
  const {
    startDate,
    endDate,
    intersectionId,
    limit = 5000,
  } = options;

  const items: any[] = [];
  let exclusiveStartKey: Record<string, any> | undefined;

  /*
   * Jika intersection dipilih, gunakan Query.
   * TrafficTelemetry mempunyai:
   * partition key = intersection_id
   * sort key      = timestamp
   */
  if (intersectionId && intersectionId !== "all") {
    const keyConditions = [
      "intersection_id = :intersectionId",
    ];

    const expressionValues: Record<string, any> = {
      ":intersectionId": intersectionId,
    };

    const expressionNames: Record<string, string> = {};

    if (startDate && endDate) {
      keyConditions.push("#timestamp BETWEEN :startDate AND :endDate");

      expressionNames["#timestamp"] = "timestamp";
      expressionValues[":startDate"] = startDate;
      expressionValues[":endDate"] = endDate;
    } else if (startDate) {
      keyConditions.push("#timestamp >= :startDate");

      expressionNames["#timestamp"] = "timestamp";
      expressionValues[":startDate"] = startDate;
    } else if (endDate) {
      keyConditions.push("#timestamp <= :endDate");

      expressionNames["#timestamp"] = "timestamp";
      expressionValues[":endDate"] = endDate;
    }

    do {
      const remaining = limit - items.length;

      if (remaining <= 0) {
        break;
      }

      const result = await dynamo.send(
        new QueryCommand({
          TableName: awsTables.traffic,

          KeyConditionExpression: keyConditions.join(" AND "),

          ExpressionAttributeValues: expressionValues,

          ...(Object.keys(expressionNames).length > 0
            ? {
              ExpressionAttributeNames: expressionNames,
            }
            : {}),

          ExclusiveStartKey: exclusiveStartKey,

          ScanIndexForward: true,

          Limit: Math.min(remaining, 1000),
        })
      );

      items.push(...(result.Items || []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey && items.length < limit);

    return items.slice(0, limit);
  }

  /*
   * Jika semua intersection dipilih, DynamoDB tidak bisa Query
   * berdasarkan timestamp karena partition key tidak diketahui.
   * Gunakan Scan dengan pagination.
   */
  const filterConditions: string[] = [];
  const expressionValues: Record<string, any> = {};
  const expressionNames: Record<string, string> = {};

  if (startDate) {
    filterConditions.push("#timestamp >= :startDate");

    expressionNames["#timestamp"] = "timestamp";
    expressionValues[":startDate"] = startDate;
  }

  if (endDate) {
    filterConditions.push("#timestamp <= :endDate");

    expressionNames["#timestamp"] = "timestamp";
    expressionValues[":endDate"] = endDate;
  }

  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.traffic,

        ...(filterConditions.length > 0
          ? {
            FilterExpression: filterConditions.join(" AND "),
            ExpressionAttributeNames: expressionNames,
            ExpressionAttributeValues: expressionValues,
          }
          : {}),

        ExclusiveStartKey: exclusiveStartKey,

        // Limit di Scan adalah jumlah item yang diperiksa,
        // bukan jumlah hasil setelah filter.
        Limit: 1000,
      })
    );

    items.push(...(result.Items || []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey && items.length < limit);

  return items.slice(0, limit);
}