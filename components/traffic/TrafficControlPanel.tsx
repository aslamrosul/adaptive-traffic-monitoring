"use client";

import type { LaneName, TrafficUpdate } from "@/lib/hooks/useMqttTraffic";
import { useEffect, useState } from "react";

interface Props {
  data: TrafficUpdate | null;
  publishMqtt: (topic: string, payload: string | number | boolean) => boolean;
}

const lanes: LaneName[] = ["north", "south", "east"];

const laneLabel: Record<LaneName, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

function LightBadge({ light }: { light: string }) {
  const color =
    light === "green"
      ? "bg-green-600"
      : light === "yellow"
        ? "bg-yellow-400 text-slate-900"
        : "bg-red-600";

  return (
    <span className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase ${color}`}>
      {light}
    </span>
  );
}

export default function TrafficControlPanel({ data, publishMqtt }: Props) {
  const [greenInput, setGreenInput] = useState(10);
  const [yellowInput, setYellowInput] = useState(3);
  const [level0Input, setLevel0Input] = useState(10);
  const [level1Input, setLevel1Input] = useState(20);
  const [level2Input, setLevel2Input] = useState(30);

  useEffect(() => {
    if (!data) return;

    setGreenInput(data.greenTimeS);
    setYellowInput(data.yellowTimeS);
    setLevel0Input(data.densityLevel0GreenS);
    setLevel1Input(data.densityLevel1GreenS);
    setLevel2Input(data.densityLevel2GreenS);
  }, [data]);

  const setLight = (lane: LaneName, color: string) => {
    publishMqtt(`traffic/light/${lane}/set`, color);
  };

  const setGreenTime = () => {
    publishMqtt("traffic/config/green_time/set", greenInput);
  };

  const setYellowTime = () => {
    publishMqtt("traffic/config/yellow_time/set", yellowInput);
  };

  const setLevel0GreenTime = () => {
    publishMqtt("traffic/config/level0_green/set", level0Input);
  };

  const setLevel1GreenTime = () => {
    publishMqtt("traffic/config/level1_green/set", level1Input);
  };

  const setLevel2GreenTime = () => {
    publishMqtt("traffic/config/level2_green/set", level2Input);
  };

  const setAutoMode = (mode: "on" | "off") => {
    publishMqtt("traffic/config/auto_mode/set", mode);
  };

  const setAdaptiveMode = (mode: "on" | "off") => {
    publishMqtt("traffic/config/adaptive_mode/set", mode);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 lg:p-5 space-y-4">
      <h2 className="text-lg font-bold text-center">Data & Kontrol</h2>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm leading-relaxed">
        <div>
          Intersection ID:{" "}
          <b>{data?.intersectionId || "-"}</b>
        </div>
        <div>
          Device ID: <b>{data?.deviceId || "-"}</b>
        </div>
        <div>
          Device: <b>{data?.device || data?.deviceId || "-"}</b>
        </div>
      </div>

      {lanes.map((lane) => {
        const laneData = data?.[lane];

        return (
          <div key={lane} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="text-base font-bold mb-2">
              {laneLabel[lane]} Lane
            </div>

            <div className="space-y-1.5 text-sm">
              <Metric label="Vehicle Count" value={laneData?.vehicleCount ?? 0} />
              <Metric label="Density Level" value={laneData?.queueLevel ?? 0} />
              <Metric
                label="IR Sensor L1"
                value={(laneData?.queueLevel ?? 0) >= 1 ? "ON" : "OFF"}
              />
              <Metric
                label="HC-SR04 L2"
                value={(laneData?.queueLevel ?? 0) >= 2 ? "ON" : "OFF"}
              />
              <Metric label="Queue Estimate" value={`${laneData?.queueLength ?? 0} cm`} />
              <Metric label="Green Duration" value={`${laneData?.greenDuration ?? 0} detik`} />

              <div className="flex justify-between items-center border-b border-slate-200 py-1.5">
                <span>Light</span>
                <LightBadge light={laneData?.light || "red"} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => setLight(lane, "red")}
                className="bg-red-600 text-white rounded-lg px-2 py-2 text-xs font-bold"
              >
                Red
              </button>
              <button
                onClick={() => setLight(lane, "yellow")}
                className="bg-yellow-400 text-slate-900 rounded-lg px-2 py-2 text-xs font-bold"
              >
                Yellow
              </button>
              <button
                onClick={() => setLight(lane, "green")}
                className="bg-green-600 text-white rounded-lg px-2 py-2 text-xs font-bold"
              >
                Green
              </button>
            </div>
          </div>
        );
      })}

      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
        <div className="text-base font-bold mb-2">Pengaturan Waktu</div>

        <div className="space-y-1.5 text-sm mb-3">
          <Metric label="Green Time Manual" value={`${data?.greenTimeS ?? 10} detik`} />
          <Metric label="Yellow Time" value={`${data?.yellowTimeS ?? 3} detik`} />
          <Metric label="Auto Mode" value={String(data?.autoMode ?? true)} />
          <Metric label="Adaptive Mode" value={String(data?.adaptiveMode ?? true)} />
          <Metric label="Level 0 Green" value={`${data?.densityLevel0GreenS ?? 10} detik`} />
          <Metric label="Level 1 Green" value={`${data?.densityLevel1GreenS ?? 20} detik`} />
          <Metric label="Level 2 Green" value={`${data?.densityLevel2GreenS ?? 30} detik`} />
        </div>

        <InputRow
          label="Manual"
          value={greenInput}
          min={1}
          max={120}
          onChange={setGreenInput}
          onSet={setGreenTime}
          buttonClass="bg-green-600 text-white"
        />

        <InputRow
          label="Kuning"
          value={yellowInput}
          min={1}
          max={30}
          onChange={setYellowInput}
          onSet={setYellowTime}
          buttonClass="bg-yellow-400 text-slate-900"
        />

        <InputRow
          label="Level 0"
          value={level0Input}
          min={1}
          max={120}
          onChange={setLevel0Input}
          onSet={setLevel0GreenTime}
          buttonClass="bg-green-600 text-white"
        />

        <InputRow
          label="Level 1"
          value={level1Input}
          min={1}
          max={120}
          onChange={setLevel1Input}
          onSet={setLevel1GreenTime}
          buttonClass="bg-green-600 text-white"
        />

        <InputRow
          label="Level 2"
          value={level2Input}
          min={1}
          max={120}
          onChange={setLevel2Input}
          onSet={setLevel2GreenTime}
          buttonClass="bg-green-600 text-white"
        />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setAutoMode("on")}
            className="bg-green-600 text-white rounded-lg py-2 text-sm font-bold"
          >
            Auto ON
          </button>
          <button
            onClick={() => setAutoMode("off")}
            className="bg-red-600 text-white rounded-lg py-2 text-sm font-bold"
          >
            Auto OFF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setAdaptiveMode("on")}
            className="bg-green-600 text-white rounded-lg py-2 text-sm font-bold"
          >
            Adaptive ON
          </button>
          <button
            onClick={() => setAdaptiveMode("off")}
            className="bg-red-600 text-white rounded-lg py-2 text-sm font-bold"
          >
            Adaptive OFF
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-600 bg-indigo-50 rounded-lg p-3 leading-relaxed">
          <b>Auto ON</b>: lampu bergantian otomatis.
          <br />
          <b>Auto OFF</b>: lampu mengikuti tombol manual.
          <br />
          <b>Adaptive ON</b>: durasi hijau mengikuti density level.
          <br />
          <b>Adaptive OFF</b>: durasi hijau memakai Green Time Manual.
          <br />
          <b>IR L1</b>: aktif saat density minimal 1.
          <br />
          <b>HC-SR04 L2</b>: aktif saat density level 2.
        </div>
      </div>

      <div className="bg-slate-100 rounded-xl p-3 text-sm leading-relaxed">
        WiFi RSSI: <b>{data?.wifiRssi ?? 0}</b> dBm
        <br />
        Uptime: <b>{data?.uptimeS ?? 0}</b> s
        <br />
        Dummy Mode: <b>{String(data?.dummyMode ?? false)}</b>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-200 py-1.5">
      <span>{label}</span>
      <b className="text-right">{value}</b>
    </div>
  );
}

function InputRow({
  label,
  value,
  min,
  max,
  onChange,
  onSet,
  buttonClass,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onSet: () => void;
  buttonClass: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="w-20 text-sm">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
      />
      <button
        onClick={onSet}
        className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-bold ${buttonClass}`}
      >
        Set
      </button>
    </div>
  );
}