"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/lib/useT";

const COLORS = [
  { bg: "rgb(239,68,68)",   shadow: "0 0 20px rgba(239,68,68,0.9), 0 0 40px rgba(239,68,68,0.4)" },
  { bg: "rgb(251,191,36)",  shadow: "0 0 20px rgba(251,191,36,0.9), 0 0 40px rgba(251,191,36,0.4)" },
  { bg: "rgb(34,197,94)",   shadow: "0 0 20px rgba(34,197,94,0.9), 0 0 40px rgba(34,197,94,0.4)" },
];

export default function LoadingScreen() {
  const t = useT();
  const [active, setActive] = useState(0);

  useEffect(() => {
    // merah: 500ms, kuning: 400ms, hijau: 900ms (pause lebih lama)
    const DURATIONS = [500, 400, 1200];
    let timer: ReturnType<typeof setTimeout>;

    const tick = (current: number) => {
      const next = (current + 1) % 3;
      setActive(next);
      timer = setTimeout(() => tick(next), DURATIONS[next]);
    };

    timer = setTimeout(() => tick(0), DURATIONS[0]);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
    >
      {/* Logo + overlay light */}
      <div className="relative mb-4 flex items-center justify-center">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="ASTRAEA"
            width={230}
            height={230}
            className="object-contain"
          />

          {/* Single traffic light dot - fade sendiri */}
          <motion.div
            className="absolute z-20"
            animate={{
              backgroundColor: COLORS[active].bg,
              boxShadow: COLORS[active].shadow,
            }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            style={{
              top: "calc(0.5rem + 116.5px)",
              right: "calc(0.5rem + 92.2px)",
              width: "37px",
              height: "37px",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* Logo Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-black text-blue-800 tracking-tighter font-headline mb-3">
          ASTRAEA
        </h1>
        <p className="text-base md:text-lg text-slate-500 font-medium">
          {t('loading.systemMonitoring')}
        </p>
      </motion.div>

      {/* Loading Dots */}
      <div className="flex items-center gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 bg-blue-600 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
}
