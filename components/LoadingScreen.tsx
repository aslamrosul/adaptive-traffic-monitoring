"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [activeLight, setActiveLight] = useState(0); // 0: red, 1: yellow, 2: green

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLight((prev) => (prev + 1) % 3);
    }, 600); // Change light every 600ms

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
    >
      {/* Traffic Icon with Animated Lights */}
      <div className="relative mb-12">
        {/* Main Traffic Icon */}
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="material-symbols-outlined text-blue-600"
          style={{ 
            fontVariationSettings: "'FILL' 1",
            fontSize: "240px" // Balanced size
          }}
        >
          traffic
        </motion.span>

        {/* Animated Light Indicators - Positioned to match icon lights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-start pt-[62px]"
        >
          {/* Red Light */}
          <motion.div
            animate={{
              opacity: activeLight === 0 ? 1 : 0.15,
              scale: activeLight === 0 ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-[28px] h-[28px] rounded-full bg-red-500 mb-[16px]"
            style={{
              boxShadow: activeLight === 0 ? "0 0 20px rgba(239, 68, 68, 1), 0 0 40px rgba(239, 68, 68, 0.5)" : "none",
            }}
          />
          
          {/* Yellow Light */}
          <motion.div
            animate={{
              opacity: activeLight === 1 ? 1 : 0.15,
              scale: activeLight === 1 ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-[28px] h-[28px] rounded-full bg-yellow-400 mb-[16px]"
            style={{
              boxShadow: activeLight === 1 ? "0 0 20px rgba(251, 191, 36, 1), 0 0 40px rgba(251, 191, 36, 0.5)" : "none",
            }}
          />
          
          {/* Green Light */}
          <motion.div
            animate={{
              opacity: activeLight === 2 ? 1 : 0.15,
              scale: activeLight === 2 ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-[28px] h-[28px] rounded-full bg-green-500"
            style={{
              boxShadow: activeLight === 2 ? "0 0 20px rgba(16, 185, 129, 1), 0 0 40px rgba(16, 185, 129, 0.5)" : "none",
            }}
          />
        </motion.div>
      </div>

      {/* Logo Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-black text-blue-800 tracking-tighter font-headline mb-3">
          Aerial Command
        </h1>
        <p className="text-base md:text-lg text-slate-500 font-medium">
          Sistem Pantauan Lalu Lintas
        </p>
      </motion.div>

      {/* Loading Dots */}
      <div className="flex items-center gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-2 h-2 bg-blue-600 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
}
