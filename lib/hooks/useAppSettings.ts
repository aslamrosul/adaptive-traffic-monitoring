"use client";

import { useEffect, useState } from "react";

export interface AppSettings {
  language: string;
  timezone: string;
  browserNotification: boolean;
  emailNotification: boolean;
  telegramNotification: boolean;
  queueAlert: boolean;
  deviceOfflineAlert: boolean;
  dummyModeAlert: boolean;
  weakWifiAlert: boolean;
  autoMode: boolean;
  sensorInterval: number;
}

const defaultSettings: AppSettings = {
  language: "id",
  timezone: "Asia/Jakarta",
  browserNotification: false,
  emailNotification: false,
  telegramNotification: false,
  queueAlert: true,
  deviceOfflineAlert: true,
  dummyModeAlert: true,
  weakWifiAlert: true,
  autoMode: true,
  sensorInterval: 5,
};

export function useAppSettings() {
  const [settings, setSettings] =
    useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result = await response.json();

        if (result.success) {
          setSettings({
            ...defaultSettings,
            ...result.data,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return {
    settings,
    timezone: settings.timezone || "Asia/Jakarta",
    isLoading,
  };
}