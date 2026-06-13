"use client";

import type {
  LaneName,
  LightStatus,
  TrafficUpdate,
} from "@/lib/hooks/useMqttTraffic";

import { useEffect, useState } from "react";
import { useT } from "@/lib/useT";

interface Props {
  data: TrafficUpdate | null;

  publishMqtt: (
    topic: string,
    payload: string | number | boolean,
  ) => boolean;
}

const activeLanes: LaneName[] = [
  "north",
  "south",
  "east",
];

const getLaneLabel = (lane: LaneName, t: (key: string) => string): string => {
  const labels: Record<LaneName, string> = {
    north: t('traffic.north'),
    south: t('traffic.south'),
    east: t('traffic.east'),
    west: t('traffic.west'),
  };
  return labels[lane];
};

export default function TrafficControlPanel({
  data,
  publishMqtt,
}: Props) {
  const t = useT();
  const [greenInput, setGreenInput] = useState(10);
  const [yellowInput, setYellowInput] = useState(3);
  const [level0Input, setLevel0Input] = useState(10);
  const [level1Input, setLevel1Input] = useState(20);
  const [level2Input, setLevel2Input] = useState(30);

  const [savedAutoMode, setSavedAutoMode] = useState(true);
  const [savedAdaptiveMode, setSavedAdaptiveMode] = useState(true);

  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const deviceId = data?.deviceId || "";
  const intersectionId = data?.intersectionId || null;

  const showMessage = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const applyConfigToInputs = (config: any) => {
    setGreenInput(
      Number(config.greenTime ?? data?.greenTimeS ?? 10),
    );
    setYellowInput(
      Number(config.yellowTime ?? data?.yellowTimeS ?? 3),
    );
    setLevel0Input(
      Number(
        config.densityLevel0Green ??
          data?.densityLevel0GreenS ??
          10,
      ),
    );
    setLevel1Input(
      Number(
        config.densityLevel1Green ??
          data?.densityLevel1GreenS ??
          20,
      ),
    );
    setLevel2Input(
      Number(
        config.densityLevel2Green ??
          data?.densityLevel2GreenS ??
          30,
      ),
    );
    setSavedAutoMode(
      typeof config.autoMode === "boolean"
        ? config.autoMode
        : data?.autoMode ?? true,
    );
    setSavedAdaptiveMode(
      typeof config.adaptiveMode === "boolean"
        ? config.adaptiveMode
        : data?.adaptiveMode ?? true,
    );
  };

  const loadSavedConfig = async () => {
    if (!deviceId) {
      return;
    }

    setIsLoadingConfig(true);

    try {
      const response = await fetch(
        `/api/iot/config/${encodeURIComponent(deviceId)}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (
        response.ok &&
        result.success &&
        result.data
      ) {
        applyConfigToInputs(result.data);
        return;
      }

      /** Jika belum ada config di DynamoDB, gunakan telemetry
       * sebagai nilai awal, tetapi jangan terus menimpa input.
       */
      applyConfigToInputs({});
    } catch (error) {
      console.error(
        "Gagal mengambil konfigurasi:",
        error,
      );
      applyConfigToInputs({});
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadSavedConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    setMessage(null);
  }, [deviceId]);

  const saveConfigPatch = async (
    patch: Record<string, unknown>,
    successMessage: string,
  ) => {
    if (!deviceId) {
      showMessage(t('iot.deviceId') + " " + t('errors.noData'));
      return false;
    }

    setIsSavingConfig(true);

    try {
      const response = await fetch(
        `/api/iot/config/${encodeURIComponent(deviceId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...patch,
            deviceId,
            device_id: deviceId,
            intersectionId,
            intersection_id: intersectionId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            t('errors.saveConfig'),
        );
      }

      applyConfigToInputs(result.data);

      if (result.mqttSent) {
        showMessage(successMessage);
      } else {
        showMessage(
          t('iot.configSaved') + ", " + t('errors.sendMqtt'),
        );
      }

      return true;
    } catch (error: any) {
      console.error(
        t('errors.saveConfig'),
        error,
      );
      showMessage(
        error.message || t('errors.saveConfig'),
      );
      return false;
    } finally {
      setIsSavingConfig(false);
    }
  };

  const autoMode = savedAutoMode;
  const adaptiveMode = savedAdaptiveMode;

  const changeAutoMode = async (enabled: boolean) => {
    await saveConfigPatch(
      {
        autoMode: enabled,
      },
      enabled
        ? t('trafficControl.autoMode') + " " + t('common.active') + " " + t('success.saved')
        : t('trafficControl.autoMode') + " " + t('common.inactive') + " " + t('success.saved'),
    );
  };

  const changeAdaptiveMode = async (
    enabled: boolean,
  ) => {
    await saveConfigPatch(
      {
        adaptiveMode: enabled,
      },
      enabled
        ? t('trafficControl.adaptiveMode') + " " + t('common.active') + " " + t('success.saved')
        : t('trafficControl.adaptiveMode') + " " + t('common.inactive') + " " + t('success.saved'),
    );
  };

  const setLight = (
    lane: LaneName,
    color: LightStatus,
  ) => {
    if (autoMode) {
      showMessage(
        t('trafficControl.disableAutoModeFirst'),
      );

      return;
    }

    if (!deviceId) {
      showMessage(
        t('iot.deviceId') + " " + t('errors.noData'),
      );
      return;
    }

    /** Lampu manual bersifat sementara sehingga belum disimpan ke IoTConfigs.
     * Nantinya sebaiknya dipindahkan ke API server khusus command.
     * Menggunakan topic device-specific: traffic/{deviceId}/light/{lane}/set
     */
    const success = publishMqtt(
      `traffic/${deviceId}/light/${lane}/set`,
      color,
    );

    if (!success) {
      showMessage(
        t('errors.sendMqtt'),
      );
      return;
    }

    showMessage(
      `${t('traffic.lane')} ${getLaneLabel(lane, t)} - ${getLightLabel(color, t)}`,
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('trafficControl.title')}
        </p>

        <h2 className="text-xl font-bold text-slate-900">
          {t('dashboard.overview')} & {t('trafficControl.manualControl')}
        </h2>
      </header>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <div className="grid gap-2 text-sm">
          <InformationRow
            label="Intersection ID"
            value={data?.intersectionId || "-"}
          />

          <InformationRow
            label="Device ID"
            value={data?.deviceId || "-"}
          />

          <InformationRow
            label="WiFi RSSI"
            value={`${data?.wifiRssi ?? 0} dBm`}
          />

          <InformationRow
            label="Uptime"
            value={`${data?.uptimeS ?? 0} ${t('time.seconds')}`}
          />

          <InformationRow
            label="Dummy Mode"
            value={
              data?.dummyMode
                ? t('common.active')
                : t('common.inactive')
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-3 font-bold text-slate-900">
          {t('intersections.operatingMode')}
        </h3>

        <div className="space-y-3">
          <ModeControl
            label={t('trafficControl.autoMode')}
            description={t('trafficControl.autoModeDesc')}
            active={autoMode}
            onEnable={() => changeAutoMode(true)}
            onDisable={() => changeAutoMode(false)}
            t={t}
          />

          <ModeControl
            label={t('trafficControl.adaptiveMode')}
            description={t('trafficControl.adaptiveModeDesc')}
            active={adaptiveMode}
            onEnable={() => changeAdaptiveMode(true)}
            onDisable={() => changeAdaptiveMode(false)}
            t={t}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">
              {t('trafficControl.manualLightControl')}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {t('trafficControl.disableAutoModeToControl')}
            </p>
          </div>

          <StatusBadge
            active={!autoMode}
            activeText={t('trafficControl.manualMode')}
            inactiveText={t('trafficControl.locked')}
          />
        </div>

        <div className="space-y-3">
          {activeLanes.map((lane) => {
            const laneData = data?.[lane];

            const currentLight = normalizeLight(
              laneData?.light,
            );

            return (
              <article
                key={lane}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {t('traffic.lane')} {getLaneLabel(lane, t)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {t('lanes.vehicles')}:{" "}
                      {laneData?.vehicleCount ?? 0}
                      {" · "}
                      {t('traffic.density')}:{" "}
                      {laneData?.queueLevel ?? 0}
                      {" · "}
                      {t('lanes.queueDistance')}:{" "}
                      {laneData?.queueLength ?? 0} cm
                    </p>
                  </div>

                  <LightBadge light={currentLight} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <LightButton
                    label={t('traffic.redLight')}
                    color="red"
                    active={currentLight === "red"}
                    disabled={autoMode}
                    onClick={() =>
                      setLight(lane, "red")
                    }
                  />

                  <LightButton
                    label={t('traffic.yellowLight')}
                    color="yellow"
                    active={
                      currentLight === "yellow"
                    }
                    disabled={autoMode}
                    onClick={() =>
                      setLight(lane, "yellow")
                    }
                  />

                  <LightButton
                    label={t('traffic.greenLight')}
                    color="green"
                    active={
                      currentLight === "green"
                    }
                    disabled={autoMode}
                    onClick={() =>
                      setLight(lane, "green")
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900">
            {t('trafficControl.durationSettings')}
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            {t('trafficControl.durationSettingsDesc')}
          </p>
        </div>

        {isLoadingConfig && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            {t('common.loading')}...
          </div>
        )}

        {isSavingConfig && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            {t('common.saving')}...
          </div>
        )}

        <div className="space-y-2">
          <InputRow
            label={t('trafficControl.manualDuration')}
            value={greenInput}
            min={1}
            max={120}
            onChange={setGreenInput}
            onSet={(value) =>
              saveConfigPatch(
                {
                  greenTime: value,
                },
                `${t('trafficControl.greenDuration')} ${value} ${t('time.seconds')} ${t('success.saved')}`,
              )
            }
            disabled={isSavingConfig || !deviceId}
            t={t}
          />

          <InputRow
            label={t('traffic.yellowLight')}
            value={yellowInput}
            min={1}
            max={30}
            onChange={setYellowInput}
            onSet={(value) =>
              saveConfigPatch(
                {
                  yellowTime: value,
                },
                `${t('traffic.yellowLight')} ${value} ${t('time.seconds')} ${t('success.saved')}`,
              )
            }
            disabled={isSavingConfig || !deviceId}
            t={t}
          />

          <InputRow
            label="Level 0"
            value={level0Input}
            min={1}
            max={120}
            onChange={setLevel0Input}
            onSet={(value) =>
              saveConfigPatch(
                {
                  densityLevel0Green: value,
                },
                `Level 0 ${value} ${t('time.seconds')} ${t('success.saved')}`,
              )
            }
            disabled={isSavingConfig || !deviceId}
            t={t}
          />

          <InputRow
            label="Level 1"
            value={level1Input}
            min={1}
            max={120}
            onChange={setLevel1Input}
            onSet={(value) =>
              saveConfigPatch(
                {
                  densityLevel1Green: value,
                },
                `Level 1 ${value} ${t('time.seconds')} ${t('success.saved')}`,
              )
            }
            disabled={isSavingConfig || !deviceId}
            t={t}
          />

          <InputRow
            label="Level 2"
            value={level2Input}
            min={1}
            max={120}
            onChange={setLevel2Input}
            onSet={(value) =>
              saveConfigPatch(
                {
                  densityLevel2Green: value,
                },
                `Level 2 ${value} ${t('time.seconds')} ${t('success.saved')}`,
              )
            }
            disabled={isSavingConfig || !deviceId}
            t={t}
          />
        </div>
      </section>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
        <h3 className="mb-2 text-sm font-bold text-indigo-950">
          {t('trafficControl.activeConfig')}
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <ConfigItem
            label={t('trafficControl.autoMode')}
            value={autoMode ? "ON" : "OFF"}
          />

          <ConfigItem
            label={t('trafficControl.adaptiveMode')}
            value={adaptiveMode ? "ON" : "OFF"}
          />

          <ConfigItem
            label={t('trafficControl.manualDuration')}
            value={`${data?.greenTimeS ?? 10}s`}
          />

          <ConfigItem
            label={t('traffic.yellowLight')}
            value={`${data?.yellowTimeS ?? 3}s`}
          />

          <ConfigItem
            label="Density 0"
            value={`${
              data?.densityLevel0GreenS ?? 10
            }s`}
          />

          <ConfigItem
            label="Density 1"
            value={`${
              data?.densityLevel1GreenS ?? 20
            }s`}
          />

          <ConfigItem
            label="Density 2"
            value={`${
              data?.densityLevel2GreenS ?? 30
            }s`}
          />

          <ConfigItem
            label="Dummy Mode"
            value={
              data?.dummyMode ? "ON" : "OFF"
            }
          />
        </div>
      </section>
    </div>
  );
}

function normalizeLight(
  value?: string,
): LightStatus {
  const normalized = String(value ?? "red")
    .trim()
    .toLowerCase();

  if (
    normalized === "red" ||
    normalized === "yellow" ||
    normalized === "green"
  ) {
    return normalized;
  }

  return "red";
}

function getLightLabel(
  light: LightStatus,
  t: (key: string) => string,
): string {
  if (light === "green") return t('traffic.greenLight');
  if (light === "yellow") return t('traffic.yellowLight');
  return t('traffic.redLight');
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-600">
        {label}
      </span>

      <b className="break-all text-right text-slate-900">
        {value}
      </b>
    </div>
  );
}

function ModeControl({
  label,
  description,
  active,
  onEnable,
  onDisable,
  t,
}: {
  label: string;
  description: string;
  active: boolean;
  onEnable: () => void;
  onDisable: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {label}
          </p>

          <p className="text-xs text-slate-500">
            {description}
          </p>
        </div>

        <StatusBadge
          active={active}
          activeText="ON"
          inactiveText="OFF"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={active}
          onClick={onEnable}
          className={[
            "rounded-lg px-3 py-2 text-xs font-bold transition",
            active
              ? "cursor-default bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800",
          ].join(" ")}
        >
          {t('common.active')}
        </button>

        <button
          type="button"
          disabled={!active}
          onClick={onDisable}
          className={[
            "rounded-lg px-3 py-2 text-xs font-bold transition",
            !active
              ? "cursor-default bg-red-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-800",
          ].join(" ")}
        >
          {t('common.inactive')}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-xs font-bold",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700",
      ].join(" ")}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function LightBadge({
  light,
}: {
  light: LightStatus;
}) {
  const classes: Record<LightStatus, string> = {
    red: "bg-red-600 text-white shadow-md shadow-red-200",
    yellow:
      "bg-yellow-400 text-slate-950 shadow-md shadow-yellow-200",
    green:
      "bg-emerald-600 text-white shadow-md shadow-emerald-200",
  };

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold uppercase",
        classes[light],
      ].join(" ")}
    >
      {light}
    </span>
  );
}

function LightButton({
  label,
  color,
  active,
  disabled,
  onClick,
}: {
  label: string;
  color: LightStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const activeClasses: Record<
    LightStatus,
    string
  > = {
    red: "bg-red-600 text-white ring-2 ring-red-300 shadow-md",
    yellow:
      "bg-yellow-400 text-slate-950 ring-2 ring-yellow-200 shadow-md",
    green:
      "bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md",
  };

  const inactiveClasses: Record<
    LightStatus,
    string
  > = {
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    yellow:
      "bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
    green:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={[
        "rounded-lg px-2 py-2 text-xs font-bold transition",
        active
          ? activeClasses[color]
          : inactiveClasses[color],

        disabled && !active
          ? "cursor-not-allowed opacity-35"
          : "",

        disabled && active
          ? "cursor-not-allowed opacity-100"
          : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function InputRow({
  label,
  value,
  min,
  max,
  onChange,
  onSet,
  disabled = false,
  t,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onSet: (value: number) => void;
  disabled?: boolean;
  t: (key: string) => string;
}) {
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = Number(event.target.value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    onChange(parsed);
  };

  const handleSet = () => {
    const normalizedValue = Math.min(
      max,
      Math.max(min, value),
    );

    onChange(normalizedValue);
    onSet(normalizedValue);
  };

  return (
    <div className="grid grid-cols-[72px_1fr_64px] items-center gap-2">
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={handleChange}
          disabled={disabled}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
          {t('time.seconds')}
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleSet}
        className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('common.apply')}
      </button>
    </div>
  );
}

function ConfigItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/80 p-2">
      <p className="text-slate-500">
        {label}
      </p>

      <p className="mt-0.5 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}