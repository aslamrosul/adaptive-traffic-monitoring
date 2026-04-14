"use client";

import { motion } from "framer-motion";

export default function TeamFooter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-20 p-8 rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-center gap-8"
    >
      <div className="flex-1">
        <h2 className="text-2xl font-bold font-headline mb-3">
          Kolaborasi Global, Dampak Lokal.
        </h2>
        <p className="text-secondary">
          Tim kami bekerja dengan standar keamanan tertinggi dan protokol data privasi
          untuk memastikan sistem Aerial Command aman bagi seluruh warga.
        </p>
      </div>
      <div className="flex gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3"
        >
          <div className="text-primary bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined">language</span>
          </div>
          <div>
            <p className="font-bold text-lg">15+</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Bahasa</p>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3"
        >
          <div className="text-primary bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <div>
            <p className="font-bold text-lg">4</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Kantor Cabang</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
