"use client";

import type {
  LaneName,
  LightStatus,
  TrafficUpdate,
} from "@/lib/hooks/useMqttTraffic";

import { useEffect, useState } from "react";

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

const laneLabels: Record<LaneName, string> = {
  north: "Utara",
  south: "Selatan",
  east: "Timur",
  west: "Barat",
};

export default function TrafficControlPanel({
  data,
  publishMqtt,
}: Props) {
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

  const saveConfigPatch = async (
    patch: Record<string, unknown>,
    successMessage: string,
  ) => {
    if (!deviceId) {
      showMessage("Device ID belum tersedia.");
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
            "Gagal menyimpan konfigurasi",
        );
      }

      applyConfigToInputs(result.data);

      if (result.mqttSent) {
        showMessage(successMessage);
      } else {
        showMessage(
          "Konfigurasi tersimpan, tetapi pengiriman MQTT tidak sepenuhnya berhasil.",
        );
      }

      return true;
    } catch (error: any) {
      console.error(
        "Gagal menyimpan konfigurasi:",
        error,
      );
      showMessage(
        error.message || "Gagal menyimpan konfigurasi.",
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
        ? "Auto Mode berhasil diaktifkan dan disimpan."
        : "Auto Mode berhasil dimatikan dan disimpan.",
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
        ? "Adaptive Mode berhasil diaktifkan dan disimpan."
        : "Adaptive Mode berhasil dimatikan dan disimpan.",
    );
  };

  const setLight = (
    lane: LaneName,
    color: LightStatus,
  ) => {
    if (autoMode) {
      showMessage(
        "Matikan Auto Mode sebelum mengontrol lampu secara manual.",
      );

      return;
    }

    if (!deviceId) {
      showMessage(
        "Device ID belum tersedia, tidak dapat mengirim perintah lampu.",
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
        "Gagal mengirim perintah lampu melalui MQTT.",
      );
      return;
    }

    showMessage(
      `Lampu Jalur ${laneLabels[lane]} diubah menjadi ${getLightLabel(
        color,
      )}.`,
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Realtime Control
        </p>

        <h2 className="text-xl font-bold text-slate-900">
          Data & Kontrol
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
            value={`${data?.uptimeS ?? 0} detik`}
          />

          <InformationRow
            label="Dummy Mode"
            value={
              data?.dummyMode
                ? "Aktif"
                : "Tidak Aktif"
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-3 font-bold text-slate-900">
          Mode Operasi
        </h3>

        <div className="space-y-3">
          <ModeControl
            label="Auto Mode"
            description="Lampu berpindah secara otomatis."
            active={autoMode}
            onEnable={() => changeAutoMode(true)}
            onDisable={() => changeAutoMode(false)}
          />

          <ModeControl
            label="Adaptive Mode"
            description="Durasi hijau mengikuti tingkat kepadatan."
            active={adaptiveMode}
            onEnable={() => changeAdaptiveMode(true)}
            onDisable={() => changeAdaptiveMode(false)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">
              Kontrol Lampu Manual
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Matikan Auto Mode untuk mengontrol lampu.
            </p>
          </div>

          <StatusBadge
            active={!autoMode}
            activeText="Manual Aktif"
            inactiveText="Terkunci"
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
                      Jalur {laneLabels[lane]}
                    </p>

                    <p className="text-xs text-slate-500">
                      Kendaraan:{" "}
                      {laneData?.vehicleCount ?? 0}
                      {" · "}
                      Density:{" "}
                      {laneData?.queueLevel ?? 0}
                      {" · "}
                      Antrean:{" "}
                      {laneData?.queueLength ?? 0} cm
                    </p>
                  </div>

                  <LightBadge light={currentLight} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <LightButton
                    label="Merah"
                    color="red"
                    active={currentLight === "red"}
                    disabled={autoMode}
                    onClick={() =>
                      setLight(lane, "red")
                    }
                  />

                  <LightButton
                    label="Kuning"
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
                    label="Hijau"
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
            Pengaturan Durasi
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Nilai akan disimpan ke DynamoDB dan
            dikirim menuju ESP32 melalui MQTT
            retained.
          </p>
        </div>

        {isLoadingConfig && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            Memuat konfigurasi tersimpan...
          </div>
        )}

        {isSavingConfig && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Menyimpan ke DynamoDB dan mengirim
            ke ESP32...
          </div>
        )}

        <div className="space-y-2">
          <InputRow
            label="Manual"
            value={greenInput}
            min={1}
            max={120}
            onChange={setGreenInput}
            onSet={(value) =>
              saveConfigPatch(
                {
                  greenTime: value,
                },
                `Durasi hijau manual disimpan menjadi ${value} detik.`,
              )
            }
            disabled={isSavingConfig || !deviceId}
          />

          <InputRow
            label="Kuning"
            value={yellowInput}
            min={1}
            max={30}
            onChange={setYellowInput}
            onSet={(value) =>
              saveConfigPatch(
                {
                  yellowTime: value,
                },
                `Durasi lampu kuning disimpan menjadi ${value} detik.`,
              )
            }
            disabled={isSavingConfig || !deviceId}
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
                `Durasi Level 0 disimpan menjadi ${value} detik.`,
              )
            }
            disabled={isSavingConfig || !deviceId}
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
                `Durasi Level 1 disimpan menjadi ${value} detik.`,
              )
            }
            disabled={isSavingConfig || !deviceId}
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
                `Durasi Level 2 disimpan menjadi ${value} detik.`,
              )
            }
            disabled={isSavingConfig || !deviceId}
          />
        </div>
      </section>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
        <h3 className="mb-2 text-sm font-bold text-indigo-950">
          Konfigurasi Aktif
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <ConfigItem
            label="Auto Mode"
            value={autoMode ? "ON" : "OFF"}
          />

          <ConfigItem
            label="Adaptive Mode"
            value={adaptiveMode ? "ON" : "OFF"}
          />

          <ConfigItem
            label="Manual"
            value={`${data?.greenTimeS ?? 10}s`}
          />

          <ConfigItem
            label="Kuning"
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
): string {
  if (light === "green") return "hijau";
  if (light === "yellow") return "kuning";

  return "merah";
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
}: {
  label: string;
  description: string;
  active: boolean;
  onEnable: () => void;
  onDisable: () => void;
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
          Aktifkan
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
          Matikan
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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onSet: (value: number) => void;
  disabled?: boolean;
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
          detik
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleSet}
        className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Set
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