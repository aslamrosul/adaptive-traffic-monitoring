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