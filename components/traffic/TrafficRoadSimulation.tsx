"use client";

import type { LaneName, TrafficUpdate } from "@/lib/hooks/useMqttTraffic";
import { useRef, useState } from "react";

interface Props {
  data: TrafficUpdate | null;
}

const laneLabels: Record<LaneName, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

function TrafficLight({
  lane,
  light,
  className,
}: {
  lane: LaneName;
  light: string;
  className: string;
}) {
  const activeLight = String(light || "red").trim().toLowerCase();

  const bulbs = [
    {
      key: "red",
      activeColor: "#ef4444",
      glow: "0 0 26px 8px rgba(239, 68, 68, 0.85)",
    },
    {
      key: "yellow",
      activeColor: "#facc15",
      glow: "0 0 26px 8px rgba(250, 204, 21, 0.9)",
    },
    {
      key: "green",
      activeColor: "#22c55e",
      glow: "0 0 26px 8px rgba(34, 197, 94, 0.85)",
    },
  ];

  return (
    <div
      className={`absolute z-50 w-[62px] rounded-xl bg-black p-2 shadow-2xl border-2 border-black ${className}`}
    >
      <div className="text-white text-center text-xs font-bold mb-1">
        {laneLabels[lane][0]}
      </div>

      {bulbs.map((bulb) => {
        const active = activeLight === bulb.key;

        return (
          <div
            key={bulb.key}
            className="w-10 h-10 rounded-full mx-auto my-1.5 transition-all duration-300 border"
            style={{
              backgroundColor: active ? bulb.activeColor : "#1f2937",
              opacity: active ? 1 : 0.28,
              boxShadow: active ? bulb.glow : "inset 0 0 8px rgba(0,0,0,0.8)",
              borderColor: active ? "#ffffff" : "#374151",
              transform: active ? "scale(1.12)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

function SensorGroup({
  lane,
  density,
  className,
}: {
  lane: LaneName;
  density: number;
  className: string;
}) {
  const irActive = density >= 1;
  const hcActive = density >= 2;

  return (
    <div className={`absolute z-40 flex items-center gap-3 ${className}`}>
      <div className="absolute -top-6 left-0 bg-white/95 border border-slate-700 rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
        {lane.toUpperCase()} SENSOR
      </div>

      <div
        className={[
          "relative w-[46px] h-[66px] rounded-lg border-4 bg-slate-900 border-slate-950 shadow-lg",
          irActive ? "border-cyan-400 shadow-[0_0_18px_#22d3ee]" : "",
        ].join(" ")}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold">
          IR
        </div>
        <div className={`absolute top-7 left-2 w-3.5 h-3.5 rounded-full ${irActive ? "bg-cyan-400" : "bg-slate-600"}`} />
        <div className={`absolute top-7 right-2 w-3.5 h-3.5 rounded-full ${irActive ? "bg-cyan-400" : "bg-slate-600"}`} />
        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${irActive ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]" : "bg-slate-500"}`} />
      </div>

      <div
        className={[
          "relative w-[82px] h-[52px] rounded-lg border-4 bg-teal-700 border-teal-900 shadow-lg",
          hcActive ? "border-orange-400 shadow-[0_0_18px_#fb923c]" : "",
        ].join(" ")}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold">
          HC-SR04
        </div>
        <div className={`absolute top-5 left-2 w-6 h-6 rounded-full border-4 border-slate-700 ${hcActive ? "bg-orange-300 shadow-[0_0_10px_#fb923c]" : "bg-slate-300"}`} />
        <div className={`absolute top-5 right-2 w-6 h-6 rounded-full border-4 border-slate-700 ${hcActive ? "bg-orange-300 shadow-[0_0_10px_#fb923c]" : "bg-slate-300"}`} />
      </div>
    </div>
  );
}

function Car({
  lane,
  index,
  light,
  density,
  color,
}: {
  lane: LaneName;
  index: number;
  light: string;
  density: number;
  color: string;
}) {
  const visible = index === 1 ? density >= 1 : density >= 2;
  const paused = light === "red";

  if (!visible) return null;

  const base =
    "absolute z-10 rounded-lg shadow-lg before:content-[''] before:absolute before:bg-white/60 before:rounded";

  if (lane === "north") {
    return (
      <div
        className={`${base} ${color} w-[38px] h-[60px] left-[calc(50%+42px)] before:left-2 before:top-2 before:w-[22px] before:h-[14px] animate-carNorth ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{
          animationDelay: index === 1 ? "0s" : "-2s",
          animationDuration: light === "yellow" ? "8s" : "6s",
        }}
      />
    );
  }

  if (lane === "south") {
    return (
      <div
        className={`${base} ${color} w-[38px] h-[60px] left-[calc(50%-85px)] before:left-2 before:top-2 before:w-[22px] before:h-[14px] animate-carSouth ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{
          animationDelay: index === 1 ? "0s" : "-2s",
          animationDuration: light === "yellow" ? "8s" : "6s",
        }}
      />
    );
  }

  if (lane === "east") {
    return (
      <div
        className={`${base} ${color} w-[60px] h-[38px] top-[calc(50%+55px)] before:left-8 before:top-2 before:w-[18px] before:h-[22px] animate-carEast ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{
          animationDelay: index === 1 ? "0s" : "-2s",
          animationDuration: light === "yellow" ? "8s" : "6s",
        }}
      />
    );
  }

  return null;
}

function DensityIndicator({
  lane,
  data,
  className,
}: {
  lane: LaneName;
  data: TrafficUpdate["north"];
  className: string;
}) {
  return (
    <div className={`absolute z-20 bg-black/75 text-white px-3 py-2 rounded-xl text-xs leading-relaxed ${className}`}>
      <b>{laneLabels[lane]}</b>
      <br />
      Count: <b>{data.vehicleCount}</b>
      <br />
      Density: <b>{data.queueLevel}</b>
      <br />
      Queue: <b>{data.queueLength}</b> cm
      <br />
      Green: <b>{data.greenDuration}</b> s
    </div>
  );
}

export default function TrafficRoadSimulation({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.65);
  const [mapX, setMapX] = useState(0);
  const [mapY, setMapY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0, mapX: 0, mapY: 0 });

  const north = data?.north ?? {
    light: "red",
    vehicleCount: 0,
    vehicleDetected: false,
    irState: "clear",
    queueDetected: false,
    queueLength: 0,
    queueLevel: 0,
    greenDuration: 0,
  };

  const south = data?.south ?? north;
  const east = data?.east ?? north;

  const resetMap = () => {
    setScale(0.65);
    setMapX(0);
    setMapY(0);
  };

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.12));
  const zoomOut = () => setScale((s) => Math.max(0.35, s - 0.12));

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 overflow-hidden fullscreen:bg-slate-100 fullscreen:p-4"
    >
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        <button onClick={toggleFullscreen} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">
          ⛶ Fullscreen
        </button>
        <button onClick={zoomIn} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">
          ＋ Zoom
        </button>
        <button onClick={zoomOut} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">
          － Zoom
        </button>
        <button onClick={resetMap} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">
          ⟳ Reset
        </button>
      </div>

      <div
        className={`relative w-full h-[640px] lg:h-[720px] overflow-hidden rounded-2xl bg-green-700 select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={(e) => {
          setDragging(true);
          setStart({ x: e.clientX, y: e.clientY, mapX, mapY });
        }}
        onMouseMove={(e) => {
          if (!dragging) return;
          setMapX(start.mapX + (e.clientX - start.x));
          setMapY(start.mapY + (e.clientY - start.y));
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onWheel={(e) => {
          e.preventDefault();
          setScale((s) =>
            e.deltaY < 0 ? Math.min(3, s + 0.08) : Math.max(0.35, s - 0.08)
          );
        }}
      >
        <div
          className="absolute w-[2600px] h-[1500px] left-1/2 top-1/2 bg-green-600 rounded-2xl overflow-hidden origin-center"
          style={{
            transform: `translate(calc(-50% + ${mapX}px), calc(-50% + ${mapY}px)) scale(${scale})`,
          }}
        >
          <div className="absolute w-[280px] h-full left-1/2 top-0 -translate-x-1/2 bg-[#333]" />
          <div className="absolute h-[280px] w-[60%] right-0 top-1/2 -translate-y-1/2 bg-[#333]" />
          <div className="absolute w-[280px] h-[280px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#333] z-[2]" />

          <div className="absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2 opacity-90 z-[3] bg-[repeating-linear-gradient(to_bottom,#fff_0px,#fff_34px,transparent_34px,transparent_70px)]" />
          <div className="absolute top-1/2 right-0 h-1.5 w-[60%] -translate-y-1/2 opacity-90 z-[3] bg-[repeating-linear-gradient(to_right,#fff_0px,#fff_34px,transparent_34px,transparent_70px)]" />

          <div className="absolute bg-white z-[5] w-[230px] h-2 left-1/2 top-[calc(50%-170px)] -translate-x-1/2" />
          <div className="absolute bg-white z-[5] w-[230px] h-2 left-1/2 top-[calc(50%+162px)] -translate-x-1/2" />
          <div className="absolute bg-white z-[5] w-2 h-[230px] right-[calc(50%-170px)] top-1/2 -translate-y-1/2" />

          <div className="absolute z-20 bg-white/95 px-3 py-2 rounded-xl font-bold shadow left-1/2 top-8 -translate-x-1/2">
            NORTH
          </div>
          <div className="absolute z-20 bg-white/95 px-3 py-2 rounded-xl font-bold shadow left-1/2 bottom-8 -translate-x-1/2">
            SOUTH
          </div>
          <div className="absolute z-20 bg-white/95 px-3 py-2 rounded-xl font-bold shadow right-12 top-1/2 -translate-y-1/2">
            EAST
          </div>

          <TrafficLight lane="north" light={north.light} className="left-[calc(50%+105px)] top-[calc(50%-340px)]" />
          <TrafficLight lane="south" light={south.light} className="left-[calc(50%-170px)] top-[calc(50%+205px)]" />
          <TrafficLight lane="east" light={east.light} className="right-[calc(50%-330px)] top-[calc(50%-150px)]" />

          <SensorGroup lane="north" density={north.queueLevel} className="left-[calc(50%+170px)] top-[calc(50%-300px)]" />
          <SensorGroup lane="south" density={south.queueLevel} className="left-[calc(50%-330px)] top-[calc(50%+260px)]" />
          <SensorGroup lane="east" density={east.queueLevel} className="right-[calc(50%-520px)] top-[calc(50%+110px)]" />

          <Car lane="north" index={1} light={north.light} density={north.queueLevel} color="bg-blue-600" />
          <Car lane="north" index={2} light={north.light} density={north.queueLevel} color="bg-orange-500" />

          <Car lane="south" index={1} light={south.light} density={south.queueLevel} color="bg-purple-600" />
          <Car lane="south" index={2} light={south.light} density={south.queueLevel} color="bg-red-600" />

          <Car lane="east" index={1} light={east.light} density={east.queueLevel} color="bg-green-600" />
          <Car lane="east" index={2} light={east.light} density={east.queueLevel} color="bg-orange-500" />

          <DensityIndicator lane="north" data={north} className="left-[calc(50%-430px)] top-[300px]" />
          <DensityIndicator lane="south" data={south} className="left-[calc(50%+220px)] bottom-[260px]" />
          <DensityIndicator lane="east" data={east} className="right-[300px] top-[calc(50%+180px)]" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes carNorth {
          0% { top: -100px; }
          48% { top: calc(50% - 280px); }
          100% { top: 100%; }
        }

        @keyframes carSouth {
          0% { top: 100%; }
          48% { top: calc(50% + 230px); }
          100% { top: -110px; }
        }

        @keyframes carEast {
          0% { right: -110px; }
          48% { right: calc(50% - 300px); }
          100% { right: 100%; }
        }

        .animate-carNorth {
          animation: carNorth 6s linear infinite;
        }

        .animate-carSouth {
          animation: carSouth 6s linear infinite;
        }

        .animate-carEast {
          animation: carEast 6s linear infinite;
        }
      `}</style>
    </div>
  );
}