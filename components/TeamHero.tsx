"use client";

import { motion } from "framer-motion";

export default function TeamHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <p className="text-primary font-headline font-extrabold tracking-widest text-xs uppercase mb-2">
        The Aerial Command Squad
      </p>
      <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-4 max-w-2xl leading-tight">
        Membangun Masa Depan Mobilitas Cerdas.
      </h1>
      <p className="text-secondary max-w-xl text-lg">
        Insinyur, desainer, dan analis kami berkolaborasi untuk menciptakan solusi
        manajemen lalu lintas yang prediktif dan efisien bagi kota pintar.
      </p>
    </motion.div>
  );
}
