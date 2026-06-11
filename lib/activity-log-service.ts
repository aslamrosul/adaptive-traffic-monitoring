import "server-only";

import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
    PutCommand,
    QueryCommand,
} from "@aws-sdk/lib-dynamodb";

export type ActivityType =
    | "auth.login"
    | "auth.logout"
    | "profile.view"
    | "profile.update"
    | "profile.export"
    | "profile.avatar.upload"
    | "profile.avatar.delete"
    | "profile.password.change"
    | "profile.settings.update"
    | "public.profile.view"
    | "dashboard.view"
    | "analytics.view"
    | "iot.config.update"
    | "intersection.create"
    | "intersection.update"
    | "intersection.delete"
    | "user.create"
    | "user.update"
    | "user.delete"
    | "notification.view"
    | "settings.view"
    | "settings.update"
    | "report.export"
    | "report.create"
    | "report.update"
    | "report.delete"
    | "report.view"
    | "system.action";

export interface CreateActivityLogInput {
    userId: string;
    email?: string;
    name?: string;
    type: ActivityType;
    action: string;
    description?: string;
    icon?: string;
    color?: string;
    metadata?: Record<string, any>;
}

const ACTIVITY_STYLE: Record<
    string,
    {
        icon: string;
        color: string;
    }
> = {
    "auth.login": {
        icon: "login",
        color: "text-green-600 bg-green-100",
    },
    "auth.logout": {
        icon: "logout",
        color: "text-red-600 bg-red-100",
    },
    "profile.view": {
        icon: "person",
        color: "text-blue-600 bg-blue-100",
    },
    "profile.update": {
        icon: "edit",
        color: "text-blue-600 bg-blue-100",
    },
    "profile.export": {
        icon: "download",
        color: "text-orange-600 bg-orange-100",
    },
    "profile.avatar.upload": {
        icon: "photo_camera",
        color: "text-purple-600 bg-purple-100",
    },
    "profile.avatar.delete": {
        icon: "delete",
        color: "text-red-600 bg-red-100",
    },
    "profile.password.change": {
        icon: "lock_reset",
        color: "text-orange-600 bg-orange-100",
    },
    "profile.settings.update": {
        icon: "settings",
        color: "text-cyan-600 bg-cyan-100",
    },
    "public.profile.view": {
        icon: "visibility",
        color: "text-indigo-600 bg-indigo-100",
    },
    "dashboard.view": {
        icon: "dashboard",
        color: "text-blue-600 bg-blue-100",
    },
    "analytics.view": {
        icon: "analytics",
        color: "text-indigo-600 bg-indigo-100",
    },
    "iot.config.update": {
        icon: "memory",
        color: "text-purple-600 bg-purple-100",
    },
    "intersection.create": {
        icon: "add_road",
        color: "text-green-600 bg-green-100",
    },
    "intersection.update": {
        icon: "traffic",
        color: "text-blue-600 bg-blue-100",
    },
    "intersection.delete": {
        icon: "delete",
        color: "text-red-600 bg-red-100",
    },
    "user.create": {
        icon: "person_add",
        color: "text-green-600 bg-green-100",
    },
    "user.update": {
        icon: "manage_accounts",
        color: "text-blue-600 bg-blue-100",
    },
    "user.delete": {
        icon: "person_remove",
        color: "text-red-600 bg-red-100",
    },
    "notification.view": {
        icon: "notifications",
        color: "text-purple-600 bg-purple-100",
    },
    "settings.view": {
        icon: "settings",
        color: "text-slate-600 bg-slate-100",
    },
    "settings.update": {
        icon: "settings",
        color: "text-cyan-600 bg-cyan-100",
    },
    "report.export": {
        icon: "download",
        color: "text-orange-600 bg-orange-100",
    },
    "report.create": {
        icon: "post_add",
        color: "text-green-600 bg-green-100",
    },
    "report.update": {
        icon: "edit_document",
        color: "text-blue-600 bg-blue-100",
    },
    "report.delete": {
        icon: "delete",
        color: "text-red-600 bg-red-100",
    },
    "report.view": {
        icon: "article",
        color: "text-slate-600 bg-slate-100",
    },
    "system.action": {
        icon: "settings_applications",
        color: "text-slate-600 bg-slate-100",
    },
};

function safeMetadata(metadata?: Record<string, any>) {
    if (!metadata) return {};

    const blockedKeys = new Set([
        "password",
        "oldPassword",
        "newPassword",
        "confirmPassword",
        "token",
        "accessToken",
        "refreshToken",
        "secret",
    ]);

    return Object.fromEntries(
        Object.entries(metadata).filter(
            ([key]) => !blockedKeys.has(key),
        ),
    );
}

export function timeAgo(dateInput?: string | Date | null) {
    if (!dateInput) return "-";

    const date =
        dateInput instanceof Date
            ? dateInput
            : new Date(dateInput);

    if (Number.isNaN(date.getTime())) return "-";

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60_000));

    if (diffMin < 60) return `${diffMin} menit yang lalu`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam yang lalu`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} hari yang lalu`;

    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth} bulan yang lalu`;
}

export async function createActivityLog(
    input: CreateActivityLogInput,
) {
    const now = new Date().toISOString();

    const style =
        ACTIVITY_STYLE[input.type] ||
        ACTIVITY_STYLE["system.action"];

    const item = {
        user_id: input.userId,
        created_at: now,

        id: `activity-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`,

        email: input.email || "",
        name: input.name || "",

        type: input.type,
        action: input.action,
        description: input.description || "",

        icon: input.icon || style.icon,
        color: input.color || style.color,

        metadata: safeMetadata(input.metadata),

        read: false,
    };

    await dynamo.send(
        new PutCommand({
            TableName: awsTables.userActivities,
            Item: item,
        }),
    );

    return item;
}

export async function listUserActivities(options: {
    userId: string;
    limit?: number;
}) {
    const result = await dynamo.send(
        new QueryCommand({
            TableName: awsTables.userActivities,
            KeyConditionExpression: "user_id = :userId",
            ExpressionAttributeValues: {
                ":userId": options.userId,
            },
            ScanIndexForward: false,
            Limit: Math.min(options.limit || 20, 100),
        }),
    );

    return (result.Items || []).map((item: any) => ({
        id: item.id,
        type: item.type,

        action: item.action,
        description: item.description || "",

        time: timeAgo(item.created_at),
        createdAt: item.created_at,
        timestamp: item.created_at,

        icon: item.icon || "history",
        color: item.color || "text-slate-600 bg-slate-100",

        metadata: item.metadata || {},
    }));
}

function calculateActiveMinutesFromActivities(items: any[]) {
    const timestamps = items
        .map((item) =>
            new Date(
                item.created_at ||
                    item.timestamp ||
                    item.createdAt,
            ),
        )
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

    if (timestamps.length <= 1) {
        return 0;
    }

    let activeMinutes = 0;

    for (let index = 1; index < timestamps.length; index++) {
        const previous = timestamps[index - 1];
        const current = timestamps[index];

        const diffMinutes = Math.floor(
            (current.getTime() - previous.getTime()) / 60_000,
        );

        if (diffMinutes <= 0) {
            continue;
        }

        // Kalau jeda terlalu lama, jangan dihitung full.
        // Contoh buka dashboard jam 08:00 lalu login lagi jam 13:00,
        // itu bukan berarti aktif 5 jam.
        activeMinutes += Math.min(diffMinutes, 30);
    }

    return activeMinutes;
}

export async function getUserActivityStats(options: {
    userId: string;
}) {
    const result = await dynamo.send(
        new QueryCommand({
            TableName: awsTables.userActivities,
            KeyConditionExpression: "user_id = :userId",
            ExpressionAttributeValues: {
                ":userId": options.userId,
            },
            ScanIndexForward: false,
            Limit: 500,
        }),
    );

    const items = result.Items || [];

    const byType: Record<string, number> = {};

    for (const item of items as any[]) {
        const type = String(item.type || "system.action");
        byType[type] = (byType[type] || 0) + 1;
    }

    const activeMinutes =
        calculateActiveMinutesFromActivities(items);
    const activeHours =
        Math.round((activeMinutes / 60) * 10) / 10;

    const totalActivities = items.length;

    const totalLogin = byType["auth.login"] || 0;
    const dashboardViews = byType["dashboard.view"] || 0;
    const analyticsViews = byType["analytics.view"] || 0;
    const profileUpdates = byType["profile.update"] || 0;
    const profileExports = byType["profile.export"] || 0;
    const settingsUpdates =
        (byType["profile.settings.update"] || 0) +
        (byType["settings.update"] || 0);

    const avatarUploads =
        byType["profile.avatar.upload"] || 0;
    const passwordChanges =
        byType["profile.password.change"] || 0;
    const iotConfigUpdates = byType["iot.config.update"] || 0;

    const reportExports =
        (byType["report.export"] || 0) +
        (byType["profile.export"] || 0);

    const reportsCreated = byType["report.create"] || 0;

    const meaningfulActivities = [
        dashboardViews,
        analyticsViews,
        profileUpdates,
        profileExports,
        settingsUpdates,
        avatarUploads,
        passwordChanges,
        iotConfigUpdates,
        reportExports,
        reportsCreated,
    ].reduce((sum, value) => sum + value, 0);

    const hasEnoughPerformanceData =
        totalActivities >= 5 && activeMinutes > 0;

    const efficiency = hasEnoughPerformanceData
        ? Math.min(
              100,
              Math.max(
                  1,
                  Math.round(
                      (meaningfulActivities /
                          Math.max(activeHours, 1)) *
                          20,
                  ),
              ),
          )
        : null;

    const performance = {
        responseTime: null,
        accuracy: null,
        efficiency,
    };

    return {
        totalActivities,

        totalLogin,
        dashboardViews,
        analyticsViews,
        profileUpdates,
        profileExports,
        settingsUpdates,
        avatarUploads,
        passwordChanges,
        iotConfigUpdates,
        reportExports,
        reportsCreated,

        activeMinutes,
        activeHours,

        performance,

        byType,
    };
}