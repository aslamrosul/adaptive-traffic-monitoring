"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/providers/TranslationProvider";

export default function TeamHero() {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <p className="text-primary font-headline font-extrabold tracking-widest text-xs uppercase mb-2">
        {t('team.title')}
      </p>
      <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-4 max-w-2xl leading-tight">
        {t('team.heroTitle')}
      </h1>
      <p className="text-secondary max-w-xl text-lg">
        {t('team.heroSubtitle')}
      </p>
    </motion.div>
  );
}
