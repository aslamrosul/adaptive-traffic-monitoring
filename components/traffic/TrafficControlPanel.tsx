"use client";

import type {
  LaneName,
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

const activeLanes: LaneName[] = ["north", "south", "east"];

const laneLabel: Record<LaneName, string> = {
  north: "Utara",
  south: "Selatan",
  east: "Timur",
  west: "Barat",
};

type LightColor = "red" | "yellow" | "green";

export default function TrafficControlPanel({
  data,
  publishMqtt,
}: Props) {
  const [greenInput, setGreenInput] = useState(10);
  const [yellowInput, setYellowInput] = useState(3);
  const [level0Input, setLevel0Input] = useState(10);
  const [level1Input, setLevel1Input] = useState(20);
  const [level2Input, setLevel2Input] = useState(30);

  useEffect(() => {
    if (!data) return;

    setGreenInput(data.greenTimeS ?? 10);
    setYellowInput(data.yellowTimeS ?? 3);
    setLevel0Input(data.densityLevel0GreenS ?? 10);
    setLevel1Input(data.densityLevel1GreenS ?? 20);
    setLevel2Input(data.densityLevel2GreenS ?? 30);
  }, [data]);

  const autoMode = data?.autoMode ?? true;
  const adaptiveMode = data?.adaptiveMode ?? true;

  const publish = (
    topic: string,
    payload: string | number | boolean,
  ) => {
    const success = publishMqtt(topic, payload);

    if (!success) {
      console.error("Gagal publish MQTT:", {
        topic,
        payload,
      });
    }
  };

  const setLight = (
    lane: LaneName,
    color: LightColor,
  ) => {
    if (autoMode) return;

    publish(`traffic/light/${lane}/set`, color);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Realtime control
        </p>

        <h2 className="text-xl font-bold text-slate-900">
          Data & Kontrol
        </h2>
      </div>

      {/* DEVICE INFORMATION */}
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
        </div>
      </section>

      {/* MODE CONTROL */}
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-3 font-bold text-slate-900">
          Mode Operasi
        </h3>

        <div className="space-y-3">
          <ModeControl
            label="Auto Mode"
            description="Lampu berpindah otomatis"
            active={autoMode}
            onEnable={() =>
              publish("traffic/config/auto_mode/set", "on")
            }
            onDisable={() =>
              publish("traffic/config/auto_mode/set", "off")
            }
          />

          <ModeControl
            label="Adaptive Mode"
            description="Durasi hijau mengikuti kepadatan"
            active={adaptiveMode}
            onEnable={() =>
              publish("traffic/config/adaptive_mode/set", "on")
            }
            onDisable={() =>
              publish("traffic/config/adaptive_mode/set", "off")
            }
          />
        </div>
      </section>

      {/* LIGHT CONTROL */}
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

          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-bold",
              autoMode
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700",
            ].join(" ")}
          >
            {autoMode ? "Terkunci" : "Manual aktif"}
          </span>
        </div>

        <div className="space-y-3">
          {activeLanes.map((lane) => {
            const laneData = data?.[lane];
            const currentLight = normalizeLight(laneData?.light);

            return (
              <div
                key={lane}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      Jalur {laneLabel[lane]}
                    </p>

                    <p className="text-xs text-slate-500">
                      Kendaraan: {laneData?.vehicleCount ?? 0} · Density:{" "}
                      {laneData?.queueLevel ?? 0}
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
                    onClick={() => setLight(lane, "red")}
                  />

                  <LightButton
                    label="Kuning"
                    color="yellow"
                    active={currentLight === "yellow"}
                    disabled={autoMode}
                    onClick={() => setLight(lane, "yellow")}
                  />

                  <LightButton
                    label="Hijau"
                    color="green"
                    active={currentLight === "green"}
                    disabled={autoMode}
                    onClick={() => setLight(lane, "green")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TIME CONFIGURATION */}
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900">
            Pengaturan Durasi
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Durasi dikirim langsung menuju perangkat melalui MQTT.
          </p>
        </div>

        <div className="space-y-2">
          <InputRow
            label="Manual"
            value={greenInput}
            min={1}
            max={120}
            suffix="detik"
            onChange={setGreenInput}
            onSet={() =>
              publish("traffic/config/green_time/set", greenInput)
            }
          />

          <InputRow
            label="Kuning"
            value={yellowInput}
            min={1}
            max={30}
            suffix="detik"
            onChange={setYellowInput}
            onSet={() =>
              publish("traffic/config/yellow_time/set", yellowInput)
            }
          />

          <InputRow
            label="Level 0"
            value={level0Input}
            min={1}
            max={120}
            suffix="detik"
            onChange={setLevel0Input}
            onSet={() =>
              publish(
                "traffic/config/level0_green/set",
                level0Input,
              )
            }
          />

          <InputRow
            label="Level 1"
            value={level1Input}
            min={1}
            max={120}
            suffix="detik"
            onChange={setLevel1Input}
            onSet={() =>
              publish(
                "traffic/config/level1_green/set",
                level1Input,
              )
            }
          />

          <InputRow
            label="Level 2"
            value={level2Input}
            min={1}
            max={120}
            suffix="detik"
            onChange={setLevel2Input}
            onSet={() =>
              publish(
                "traffic/config/level2_green/set",
                level2Input,
              )
            }
          />
        </div>
      </section>

      {/* CURRENT CONFIG */}
      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
        <h3 className="mb-2 text-sm font-bold text-indigo-950">
          Konfigurasi Aktif
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
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
            value={`${data?.densityLevel0GreenS ?? 10}s`}
          />

          <ConfigItem
            label="Density 1"
            value={`${data?.densityLevel1GreenS ?? 20}s`}
          />

          <ConfigItem
            label="Density 2"
            value={`${data?.densityLevel2GreenS ?? 30}s`}
          />

          <ConfigItem
            label="Dummy Mode"
            value={String(data?.dummyMode ?? false)}
          />
        </div>
      </section>
    </div>
  );
}

function normalizeLight(
  light?: string,
): LightColor {
  const normalized = String(light || "red")
    .trim()
    .toLowerCase();

  if (
    normalized === "green" ||
    normalized === "yellow" ||
    normalized === "red"
  ) {
    return normalized;
  }

  return "red";
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

        <span
          className={[
            "rounded-full px-2.5 py-1 text-xs font-bold",
            active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700",
          ].join(" ")}
        >
          {active ? "ON" : "OFF"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEnable}
          className={[
            "rounded-lg px-3 py-2 text-xs font-bold transition",
            active
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-emerald-100",
          ].join(" ")}
        >
          Aktifkan
        </button>

        <button
          type="button"
          onClick={onDisable}
          className={[
            "rounded-lg px-3 py-2 text-xs font-bold transition",
            !active
              ? "bg-red-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-red-100",
          ].join(" ")}
        >
          Matikan
        </button>
      </div>
    </div>
  );
}

function LightBadge({
  light,
}: {
  light: LightColor;
}) {
  const classes: Record<LightColor, string> = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
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
  color: LightColor;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const activeClasses: Record<LightColor, string> = {
    red: "bg-red-600 text-white",
    yellow: "bg-yellow-400 text-slate-900",
    green: "bg-emerald-600 text-white",
  };

  const inactiveClasses: Record<LightColor, string> = {
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    yellow: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    green: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-lg px-2 py-2 text-xs font-bold transition",
        active
          ? activeClasses[color]
          : inactiveClasses[color],
        disabled
          ? "cursor-not-allowed opacity-40"
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
  suffix,
  onChange,
  onSet,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
  onSet: () => void;
}) {
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = Number(event.target.value);

    if (Number.isNaN(parsed)) return;

    onChange(parsed);
  };

  const handleSet = () => {
    const normalizedValue = Math.min(
      max,
      Math.max(min, value),
    );

    onChange(normalizedValue);
    onSet();
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
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
          {suffix}
        </span>
      </div>

      <button
        type="button"
        onClick={handleSet}
        className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
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