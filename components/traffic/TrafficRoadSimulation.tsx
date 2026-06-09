"use client";

import type {
  LaneData,
  LaneName,
  LightStatus,
  TrafficUpdate,
} from "@/lib/hooks/useMqttTraffic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Props {
  data: TrafficUpdate | null;
}

type ActiveLane = "north" | "south" | "east";

interface SimulatedCar {
  id: string;
  lane: ActiveLane;
  progress: number;
  colorClass: string;
}

const ACTIVE_LANES: ActiveLane[] = ["north", "south", "east"];

const EMPTY_LANE: LaneData = {
  light: "red",
  vehicleCount: 0,
  vehicleDetected: false,
  irState: "clear",
  queueDetected: false,
  queueLength: 0,
  queueLevel: 0,
  greenDuration: 0,
};

const LANE_LABELS: Record<ActiveLane, string> = {
  north: "North",
  south: "South",
  east: "East",
};

const CAR_COLORS = [
  "bg-blue-600",
  "bg-orange-500",
  "bg-purple-600",
  "bg-red-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-pink-600",
];

const STOP_PROGRESS: Record<ActiveLane, number> = {
  north: 0.375,
  south: 0.375,
  east: 0.405,
};

const CAR_SPACING = 0.055;
const NORMAL_SPEED = 0.085;
const YELLOW_SPEED = 0.038;
const MAX_CARS_PER_LANE = 12;

function normalizeLight(value: unknown): LightStatus {
  const normalized = String(value ?? "red").trim().toLowerCase();

  if (
    normalized === "red" ||
    normalized === "yellow" ||
    normalized === "green"
  ) {
    return normalized;
  }

  return "red";
}

function TrafficLight({
  lane,
  light,
  className,
}: {
  lane: ActiveLane;
  light: LightStatus;
  className: string;
}) {
  const bulbs = [
    {
      key: "red",
      activeColor: "#ef4444",
      glow: "0 0 26px 8px rgba(239,68,68,.85)",
    },
    {
      key: "yellow",
      activeColor: "#facc15",
      glow: "0 0 26px 8px rgba(250,204,21,.9)",
    },
    {
      key: "green",
      activeColor: "#22c55e",
      glow: "0 0 26px 8px rgba(34,197,94,.85)",
    },
  ];

  return (
    <div
      className={`absolute z-50 w-[62px] rounded-xl border-2 border-black bg-black p-2 shadow-2xl ${className}`}
    >
      <div className="mb-1 text-center text-xs font-bold text-white">
        {LANE_LABELS[lane][0]}
      </div>

      {bulbs.map((bulb) => {
        const active = light === bulb.key;

        return (
          <div
            key={bulb.key}
            className="mx-auto my-1.5 h-10 w-10 rounded-full border transition-all duration-300"
            style={{
              backgroundColor: active ? bulb.activeColor : "#111827",
              opacity: active ? 1 : 0.32,
              boxShadow: active
                ? bulb.glow
                : "inset 0 0 8px rgba(0,0,0,.9)",
              borderColor: active ? "#fff" : "#374151",
              transform: active ? "scale(1.12)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

function IrSensor({
  active,
  className,
}: {
  active: boolean;
  className: string;
}) {
  return (
    <div
      className={`absolute z-40 h-[66px] w-[46px] rounded-lg border-4 bg-slate-900 shadow-lg ${
        active
          ? "border-cyan-400 shadow-[0_0_18px_#22d3ee]"
          : "border-slate-950"
      } ${className}`}
    >
      <div className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] font-bold text-white">
        IR
      </div>
      <div
        className={`absolute left-2 top-7 h-3.5 w-3.5 rounded-full ${
          active ? "bg-cyan-400" : "bg-slate-600"
        }`}
      />
      <div
        className={`absolute right-2 top-7 h-3.5 w-3.5 rounded-full ${
          active ? "bg-cyan-400" : "bg-slate-600"
        }`}
      />
      <div
        className={`absolute bottom-2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${
          active
            ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
            : "bg-slate-500"
        }`}
      />
    </div>
  );
}

function HcSensor({
  active,
  className,
}: {
  active: boolean;
  className: string;
}) {
  return (
    <div
      className={`absolute z-40 h-[52px] w-[82px] rounded-lg border-4 bg-teal-700 shadow-lg ${
        active
          ? "border-orange-400 shadow-[0_0_18px_#fb923c]"
          : "border-teal-900"
      } ${className}`}
    >
      <div className="absolute left-1/2 top-1 -translate-x-1/2 text-[9px] font-bold text-white">
        HC-SR04
      </div>
      <div
        className={`absolute left-2 top-5 h-6 w-6 rounded-full border-4 border-slate-700 ${
          active
            ? "bg-orange-300 shadow-[0_0_10px_#fb923c]"
            : "bg-slate-300"
        }`}
      />
      <div
        className={`absolute right-2 top-5 h-6 w-6 rounded-full border-4 border-slate-700 ${
          active
            ? "bg-orange-300 shadow-[0_0_10px_#fb923c]"
            : "bg-slate-300"
        }`}
      />
    </div>
  );
}

function EquipmentLabel({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <div
      className={`absolute z-40 whitespace-nowrap rounded-md border border-slate-700 bg-white/95 px-2 py-0.5 text-[10px] font-bold ${className}`}
    >
      {text}
    </div>
  );
}

function RoadEquipment({
  lane,
  laneData,
}: {
  lane: ActiveLane;
  laneData: LaneData;
}) {
  const light = normalizeLight(laneData.light);
  const irActive = laneData.vehicleDetected;
  const hcActive = laneData.queueDetected;

  if (lane === "north") {
    return (
      <>
        <EquipmentLabel
          text="NORTH: LAMPU → IR → HC-SR04"
          className="left-[calc(50%+180px)] top-[calc(50%-525px)]"
        />
        <TrafficLight
          lane="north"
          light={light}
          className="left-[calc(50%+105px)] top-[calc(50%-340px)]"
        />
        <IrSensor
          active={irActive}
          className="left-[calc(50%+125px)] top-[calc(50%-435px)]"
        />
        <HcSensor
          active={hcActive}
          className="left-[calc(50%+105px)] top-[calc(50%-515px)]"
        />
      </>
    );
  }

  if (lane === "south") {
    return (
      <>
        <EquipmentLabel
          text="SOUTH: LAMPU → IR → HC-SR04"
          className="left-[calc(50%-380px)] top-[calc(50%+500px)]"
        />
        <TrafficLight
          lane="south"
          light={light}
          className="left-[calc(50%-170px)] top-[calc(50%+205px)]"
        />
        <IrSensor
          active={irActive}
          className="left-[calc(50%-150px)] top-[calc(50%+390px)]"
        />
        <HcSensor
          active={hcActive}
          className="left-[calc(50%-170px)] top-[calc(50%+485px)]"
        />
      </>
    );
  }

  return (
    <>
      <EquipmentLabel
        text="EAST: LAMPU → IR → HC-SR04"
        className="right-[calc(50%-650px)] top-[calc(50%+260px)]"
      />
      <TrafficLight
        lane="east"
        light={light}
        className="right-[calc(50%-330px)] top-[calc(50%+165px)]"
      />
      <IrSensor
        active={irActive}
        className="right-[calc(50%-445px)] top-[calc(50%+205px)]"
      />
      <HcSensor
        active={hcActive}
        className="right-[calc(50%-570px)] top-[calc(50%+212px)]"
      />
    </>
  );
}

function CarView({ car }: { car: SimulatedCar }) {
  const base =
    "absolute z-10 rounded-lg shadow-xl before:absolute before:rounded before:bg-white/65 before:content-['']";

  if (car.lane === "north") {
    return (
      <div
        className={`${base} ${car.colorClass} h-[60px] w-[38px] before:left-2 before:top-2 before:h-[14px] before:w-[22px]`}
        style={{
          left: "calc(50% + 42px)",
          top: `${car.progress * 1500}px`,
          transform: "translateY(-50%)",
        }}
      />
    );
  }

  if (car.lane === "south") {
    return (
      <div
        className={`${base} ${car.colorClass} h-[60px] w-[38px] before:left-2 before:top-2 before:h-[14px] before:w-[22px]`}
        style={{
          left: "calc(50% - 82px)",
          top: `${(1 - car.progress) * 1500}px`,
          transform: "translateY(-50%) rotate(180deg)",
        }}
      />
    );
  }

  return (
    <div
      className={`${base} ${car.colorClass} h-[38px] w-[60px] before:left-8 before:top-2 before:h-[22px] before:w-[18px]`}
      style={{
        left: `${(1 - car.progress) * 2600}px`,
        top: "calc(50% + 44px)",
        transform: "translateX(-50%) rotate(180deg)",
      }}
    />
  );
}

function DensityIndicator({
  lane,
  data,
  className,
  simulatedCars,
}: {
  lane: ActiveLane;
  data: LaneData;
  className: string;
  simulatedCars: number;
}) {
  return (
    <div
      className={`absolute z-20 rounded-xl bg-black/80 px-3 py-2 text-xs leading-relaxed text-white ${className}`}
    >
      <b>{LANE_LABELS[lane]}</b>
      <br />
      Count asli: <b>{data.vehicleCount}</b>
      <br />
      Mobil simulasi: <b>{simulatedCars}</b>
      <br />
      Density: <b>{data.queueLevel}</b>
      <br />
      Queue: <b>{data.queueLength}</b> cm
      <br />
      Green: <b>{data.greenDuration}</b> s
    </div>
  );
}

function calculateCountDelta(current: number, previous: number): number {
  if (current < previous) {
    return 0;
  }

  return current - previous;
}

export default function TrafficRoadSimulation({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);
  const dataRef = useRef<TrafficUpdate | null>(data);

  const countsInitializedRef = useRef(false);
  const previousCountsRef = useRef<Record<ActiveLane, number>>({
    north: 0,
    south: 0,
    east: 0,
  });

  const [cars, setCars] = useState<SimulatedCar[]>([]);
  const [scale, setScale] = useState(0.72);
  const [mapX, setMapX] = useState(0);
  const [mapY, setMapY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({
    x: 0,
    y: 0,
    mapX: 0,
    mapY: 0,
  });
  const touchStartRef = useRef<{ x: number; y: number; mapX: number; mapY: number } | null>(null);
  const isPanningRef = useRef(false);

  // Attach non-passive touchmove listener so we can call preventDefault for map panning
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !touchStartRef.current) return;
      const touch = event.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      if (!isPanningRef.current) {
        if (Math.abs(dx) > Math.abs(dy) + 5) {
          isPanningRef.current = true;
        } else {
          return; // let page scroll naturally
        }
      }

      event.preventDefault();
      const origin = touchStartRef.current;
      setMapX(origin.mapX + touch.clientX - origin.x);
      setMapY(origin.mapY + touch.clientY - origin.y);
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, []);

  const north = data?.north ?? EMPTY_LANE;
  const south = data?.south ?? EMPTY_LANE;
  const east = data?.east ?? EMPTY_LANE;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    countsInitializedRef.current = false;
    setCars([]);
  }, [data?.deviceId]);

  const spawnCars = (lane: ActiveLane, amount: number) => {
    if (amount <= 0) {
      return;
    }

    setCars((currentCars) => {
      const laneCars = currentCars.filter((car) => car.lane === lane);
      const remainingSlots = Math.max(
        0,
        MAX_CARS_PER_LANE - laneCars.length,
      );
      const amountToCreate = Math.min(amount, remainingSlots, 5);

      const created: SimulatedCar[] = Array.from(
        { length: amountToCreate },
        (_, index) => ({
          id: `${lane}-${Date.now()}-${index}-${Math.random()
            .toString(16)
            .slice(2)}`,
          lane,
          progress: -0.04 - index * CAR_SPACING,
          colorClass:
            CAR_COLORS[(currentCars.length + index) % CAR_COLORS.length],
        }),
      );

      return [...currentCars, ...created];
    });
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    const currentCounts: Record<ActiveLane, number> = {
      north: data.north.vehicleCount,
      south: data.south.vehicleCount,
      east: data.east.vehicleCount,
    };

    if (!countsInitializedRef.current) {
      previousCountsRef.current = currentCounts;
      countsInitializedRef.current = true;
      return;
    }

    for (const lane of ACTIVE_LANES) {
      const current = currentCounts[lane];
      const previous = previousCountsRef.current[lane];
      const delta = calculateCountDelta(current, previous);

      if (delta > 0) {
        spawnCars(lane, delta);
      }

      previousCountsRef.current[lane] = current;
    }
  }, [
    data?.north.vehicleCount,
    data?.south.vehicleCount,
    data?.east.vehicleCount,
  ]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      const previousTimestamp = lastFrameAtRef.current ?? timestamp;
      const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.1);
      lastFrameAtRef.current = timestamp;

      setCars((currentCars) => {
        const currentData = dataRef.current;

        if (!currentData || currentCars.length === 0) {
          return currentCars;
        }

        const queueOrderById = new Map<string, number>();

        for (const lane of ACTIVE_LANES) {
          const waitingCars = currentCars
            .filter(
              (car) =>
                car.lane === lane &&
                car.progress <= STOP_PROGRESS[lane] + 0.025,
            )
            .sort((a, b) => b.progress - a.progress);

          waitingCars.forEach((car, index) => {
            queueOrderById.set(car.id, index);
          });
        }

        return currentCars
          .map((car) => {
            const laneData = currentData[car.lane];
            const light = normalizeLight(laneData.light);
            const stopLine = STOP_PROGRESS[car.lane];
            const queueIndex = queueOrderById.get(car.id) ?? 0;
            const stopTarget = stopLine - queueIndex * CAR_SPACING;

            let nextProgress = car.progress;

            if (light === "green") {
              nextProgress += NORMAL_SPEED * deltaSeconds;
            } else if (
              car.progress > stopLine + 0.02
            ) {
              // Mobil yang sudah melewati garis tetap menyelesaikan perjalanan.
              nextProgress += NORMAL_SPEED * deltaSeconds;
            } else if (car.progress < stopTarget) {
              const speed =
                light === "yellow" ? YELLOW_SPEED : NORMAL_SPEED;

              nextProgress = Math.min(
                stopTarget,
                car.progress + speed * deltaSeconds,
              );
            }

            return {
              ...car,
              progress: nextProgress,
            };
          })
          .filter((car) => car.progress < 1.08);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = null;
      lastFrameAtRef.current = null;
    };
  }, []);

  const carCountByLane = useMemo(() => {
    return {
      north: cars.filter((car) => car.lane === "north").length,
      south: cars.filter((car) => car.lane === "south").length,
      east: cars.filter((car) => car.lane === "east").length,
    };
  }, [cars]);

  const resetMap = () => {
    setScale(0.72);
    setMapX(0);
    setMapY(0);
  };

  const clearSimulation = () => {
    setCars([]);
  };

  const zoomIn = () => setScale((value) => Math.min(3, value + 0.12));
  const zoomOut = () => setScale((value) => Math.max(0.35, value - 0.12));

  const toggleFullscreen = () => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    if (!document.fullscreenElement) {
      void element.requestFullscreen();
      return;
    }

    void document.exitFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg fullscreen:bg-slate-100 fullscreen:p-4"
    >
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"
        >
          ⛶ Fullscreen
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"
        >
          ＋ Zoom
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"
        >
          － Zoom
        </button>
        <button
          type="button"
          onClick={resetMap}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"
        >
          ⟳ Reset Map
        </button>
        <button
          type="button"
          onClick={clearSimulation}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white"
        >
          Bersihkan Mobil
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        Mobil virtual hanya muncul ketika <b>vehicleCount asli bertambah</b>.
        Lampu merah membuat mobil berhenti dan membentuk antrean; lampu hijau
        menjalankan antrean melewati persimpangan.
      </div>

      <div
        className={`relative h-[520px] w-full select-none overflow-hidden rounded-2xl bg-green-700 lg:h-[600px] ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={(event) => {
          setDragging(true);
          setStart({
            x: event.clientX,
            y: event.clientY,
            mapX,
            mapY,
          });
        }}
        onMouseMove={(event) => {
          if (!dragging) {
            return;
          }

          setMapX(start.mapX + event.clientX - start.x);
          setMapY(start.mapY + event.clientY - start.y);
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onWheel={(event) => {
          event.preventDefault();
          setScale((value) =>
            event.deltaY < 0
              ? Math.min(3, value + 0.08)
              : Math.max(0.35, value - 0.08),
          );
        }}
        onTouchStart={(event) => {
          if (event.touches.length !== 1) return;
          const touch = event.touches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, mapX, mapY };
          isPanningRef.current = false;
        }}
        onTouchEnd={() => {
          touchStartRef.current = null;
          isPanningRef.current = false;
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[1500px] w-[2600px] origin-center overflow-hidden rounded-2xl bg-green-600"
          style={{
            transform: `translate(calc(-50% + ${mapX}px), calc(-50% + ${mapY}px)) scale(${scale})`,
          }}
        >
          <div className="absolute left-1/2 top-0 h-full w-[280px] -translate-x-1/2 bg-[#333]" />
          <div className="absolute right-0 top-1/2 h-[280px] w-[60%] -translate-y-1/2 bg-[#333]" />
          <div className="absolute left-1/2 top-1/2 z-[2] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 bg-[#333]" />

          <div className="absolute left-1/2 top-0 z-[3] h-full w-1.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#fff_0px,#fff_34px,transparent_34px,transparent_70px)] opacity-90" />
          <div className="absolute right-0 top-1/2 z-[3] h-1.5 w-[60%] -translate-y-1/2 bg-[repeating-linear-gradient(to_right,#fff_0px,#fff_34px,transparent_34px,transparent_70px)] opacity-90" />

          <div className="absolute left-1/2 top-[calc(50%-170px)] z-[5] h-2 w-[230px] -translate-x-1/2 bg-white" />
          <div className="absolute left-1/2 top-[calc(50%+162px)] z-[5] h-2 w-[230px] -translate-x-1/2 bg-white" />
          <div className="absolute right-[calc(50%-170px)] top-1/2 z-[5] h-[230px] w-2 -translate-y-1/2 bg-white" />

          <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-xl bg-white/95 px-3 py-2 font-bold shadow">
            NORTH
          </div>
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-white/95 px-3 py-2 font-bold shadow">
            SOUTH
          </div>
          <div className="absolute right-12 top-1/2 z-20 -translate-y-1/2 rounded-xl bg-white/95 px-3 py-2 font-bold shadow">
            EAST
          </div>

          <RoadEquipment lane="north" laneData={north} />
          <RoadEquipment lane="south" laneData={south} />
          <RoadEquipment lane="east" laneData={east} />

          {cars.map((car) => (
            <CarView key={car.id} car={car} />
          ))}

          <DensityIndicator
            lane="north"
            data={north}
            simulatedCars={carCountByLane.north}
            className="left-[calc(50%-430px)] top-[300px]"
          />
          <DensityIndicator
            lane="south"
            data={south}
            simulatedCars={carCountByLane.south}
            className="bottom-[260px] left-[calc(50%+220px)]"
          />
          <DensityIndicator
            lane="east"
            data={east}
            simulatedCars={carCountByLane.east}
            className="right-[300px] top-[calc(50%+180px)]"
          />
        </div>
      </div>
    </div>
  );
}
