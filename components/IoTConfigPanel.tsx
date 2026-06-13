"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/TranslationProvider";

interface IoTConfig {
  device_id?: string;
  deviceId: string;

  intersection_id?: string | null;
  intersectionId?: string | null;

  greenTime: number;
  yellowTime: number;

  densityLevel0Green: number;
  densityLevel1Green: number;
  densityLevel2Green: number;

  autoMode: boolean;
  adaptiveMode: boolean;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  lastSyncedAt?: string | null;
  lastSyncStatus?: "pending" | "success" | "partial" | "failed";
  lastSyncErrors?: Array<{
    topic: string;
    error?: string;
  }>;
}

interface IoTConfigPanelProps {
  deviceId: string;
  intersectionId?: string;
  onConfigSaved?: (config: IoTConfig) => void;
}

function createDefaultConfig(
  deviceId: string,
  intersectionId?: string
): IoTConfig {
  return {
    device_id: deviceId,
    deviceId,

    intersection_id: intersectionId || null,
    intersectionId: intersectionId || null,

    greenTime: 10,
    yellowTime: 3,

    densityLevel0Green: 10,
    densityLevel1Green: 20,
    densityLevel2Green: 30,

    autoMode: true,
    adaptiveMode: true,

    status: "active",
    lastSyncedAt: null,
    lastSyncStatus: "pending",
  };
}

export default function IoTConfigPanel({
  deviceId,
  intersectionId,
  onConfigSaved,
}: IoTConfigPanelProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<IoTConfig>(() =>
    createDefaultConfig(deviceId, intersectionId)
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/iot/config/${encodeURIComponent(deviceId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setConfig({
          ...createDefaultConfig(deviceId, intersectionId),
          ...data.data,

          device_id: deviceId,
          deviceId,

          intersection_id:
            data.data.intersection_id ||
            data.data.intersectionId ||
            intersectionId ||
            null,

          intersectionId:
            data.data.intersectionId ||
            data.data.intersection_id ||
            intersectionId ||
            null,
        });

        return;
      }

      if (response.status === 404) {
        setConfig(createDefaultConfig(deviceId, intersectionId));
        return;
      }

      throw new Error(
        data.error || t('iot.configPanel.loadingError')
      );
    } catch (error: any) {
      console.error("Error loading IoT config:", error);

      setConfig(createDefaultConfig(deviceId, intersectionId));

      toast.error(
        error.message || t('iot.configPanel.loadingError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setConfig(createDefaultConfig(deviceId, intersectionId));
    loadConfig();
  }, [deviceId, intersectionId]);

  const updateNumber = (
    field:
      | "greenTime"
      | "yellowTime"
      | "densityLevel0Green"
      | "densityLevel1Green"
      | "densityLevel2Green",
    value: string
  ) => {
    setConfig((current) => ({
      ...current,
      [field]: Number(value) || 0,
    }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/iot/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
          device_id: deviceId,
          deviceId,

          intersection_id: intersectionId || null,
          intersectionId: intersectionId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || t('errors.saveConfig')
        );
      }

      setConfig(data.data);

      if (data.mqttSent) {
        toast.success(t('iot.configPanel.saveSuccess'));
      } else {
        toast.error(t('iot.configPanel.savePartialSuccess'));
      }

      onConfigSaved?.(data.data);
    } catch (error: any) {
      console.error("Error saving IoT config:", error);

      toast.error(
        error.message || t('iot.configPanel.savingError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const syncStatusClass =
    config.lastSyncStatus === "success"
      ? "bg-green-100 text-green-700"
      : config.lastSyncStatus === "partial"
        ? "bg-yellow-100 text-yellow-700"
        : config.lastSyncStatus === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="bg-white rounded-xl p-3 lg:p-6 shadow-sm border border-slate-200 space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 lg:text-lg">
            {t('iot.configPanel.title')}
          </h3>

          <p className="text-xs text-slate-500 mt-0.5 lg:text-sm lg:mt-1">
            {t('iot.configPanel.subtitle')}
          </p>
        </div>

        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase shrink-0 ${syncStatusClass}`}
        >
          {t('iot.configPanel.sync')}: {t(`iot.configPanel.${config.lastSyncStatus || 'pending'}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 lg:gap-3 lg:p-4">
        <InfoItem label={t('iot.deviceId')} value={deviceId} />
        <InfoItem label={t('iot.configPanel.intersectionId')} value={intersectionId || "-"} />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-2 lg:mb-4">
          <span className="material-symbols-outlined text-blue-600 text-base">
            timer
          </span>

          <h4 className="font-bold text-slate-900 text-sm lg:text-base">
            {t('iot.configPanel.manualTimings')}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <NumberInput
            label={t('iot.configPanel.manualGreen')}
            description={t('iot.configPanel.manualGreenDesc')}
            value={config.greenTime}
            min={1}
            max={120}
            suffix={t('iot.configPanel.seconds')}
            onChange={(value) =>
              updateNumber("greenTime", value)
            }
          />

          <NumberInput
            label={t('iot.configPanel.yellowTime')}
            description={t('iot.configPanel.yellowTimeDesc')}
            value={config.yellowTime}
            min={1}
            max={30}
            suffix={t('iot.configPanel.seconds')}
            onChange={(value) =>
              updateNumber("yellowTime", value)
            }
          />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-3 lg:pt-6">
        <div className="flex items-center gap-2 mb-2 lg:mb-4">
          <span className="material-symbols-outlined text-blue-600 text-base">
            traffic
          </span>

          <h4 className="font-bold text-slate-900 text-sm lg:text-base">
            {t('iot.configPanel.densityBasedDuration')}
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <NumberInput
            label={t('iot.configPanel.densityLevel0')}
            description={t('iot.configPanel.densityLevel0Desc')}
            value={config.densityLevel0Green}
            min={1}
            max={120}
            suffix={t('iot.configPanel.seconds')}
            onChange={(value) =>
              updateNumber("densityLevel0Green", value)
            }
          />

          <NumberInput
            label={t('iot.configPanel.densityLevel1')}
            description={t('iot.configPanel.densityLevel1Desc')}
            value={config.densityLevel1Green}
            min={1}
            max={120}
            suffix={t('iot.configPanel.seconds')}
            onChange={(value) =>
              updateNumber("densityLevel1Green", value)
            }
          />

          <NumberInput
            label={t('iot.configPanel.densityLevel2')}
            description={t('iot.configPanel.densityLevel2Desc')}
            value={config.densityLevel2Green}
            min={1}
            max={120}
            suffix={t('iot.configPanel.seconds')}
            onChange={(value) =>
              updateNumber("densityLevel2Green", value)
            }
          />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-3 lg:pt-6">
        <div className="flex items-center gap-2 mb-2 lg:mb-4">
          <span className="material-symbols-outlined text-blue-600 text-base">
            tune
          </span>

          <h4 className="font-bold text-slate-900 text-sm lg:text-base">
            {t('iot.configPanel.operatingMode')}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <ToggleCard
            title={t('iot.configPanel.autoMode')}
            description={t('iot.configPanel.autoModeDesc')}
            checked={config.autoMode}
            onChange={(checked) =>
              setConfig((current) => ({
                ...current,
                autoMode: checked,
              }))
            }
          />

          <ToggleCard
            title={t('iot.configPanel.adaptiveMode')}
            description={t('iot.configPanel.adaptiveModeDesc')}
            checked={config.adaptiveMode}
            onChange={(checked) =>
              setConfig((current) => ({
                ...current,
                adaptiveMode: checked,
              }))
            }
          />
        </div>
      </section>

      {config.lastSyncedAt && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700 font-semibold">
            {t('iot.configPanel.lastSyncedAt')}
          </p>

          <p className="text-sm text-green-900 mt-1">
            {new Date(config.lastSyncedAt).toLocaleString(
              "id-ID",
              { timeZone: "Asia/Jakarta" }
            )} WIB
          </p>
        </div>
      )}

      {config.lastSyncErrors &&
        config.lastSyncErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-800 mb-2">
              {t('iot.configPanel.failedTopics')}
            </p>

            <div className="space-y-1">
              {config.lastSyncErrors.map((error) => (
                <p
                  key={error.topic}
                  className="text-xs text-red-700"
                >
                  {error.topic}: {error.error || t('iot.configPanel.unknownError')}
                </p>
              ))}
            </div>
          </div>
        )}

      <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 border-t border-slate-200 pt-3 lg:pt-6">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('iot.configPanel.saving')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">
                send
              </span>
              {t('iot.configPanel.saveAndSend')}
            </>
          )}
        </motion.button>

        <button
          type="button"
          onClick={loadConfig}
          disabled={isSaving}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {t('iot.configPanel.reload')}
        </button>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-blue-600 font-semibold">
        {label}
      </p>

      <p className="text-sm text-blue-950 font-mono mt-1 break-all">
        {value}
      </p>
    </div>
  );
}

function NumberInput({
  label,
  description,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block bg-slate-50 border border-slate-200 rounded-xl p-2.5 lg:p-4">
      <span className="text-xs font-bold text-slate-900 lg:text-sm">
        {label}
      </span>

      <span className="block text-[10px] text-slate-500 mt-0.5 mb-2 lg:text-xs lg:mt-1 lg:mb-3">
        {description}
      </span>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 lg:px-3 lg:py-2"
        />

        <span className="text-[10px] font-semibold text-slate-500 shrink-0 lg:text-xs">
          {suffix}
        </span>
      </div>
    </label>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
        checked
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-900">{title}</p>

          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <div
          className={`relative w-12 h-7 rounded-full transition-colors ${
            checked ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>
      </div>
    </button>
  );
}