"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "@/providers/TranslationProvider";

interface QueueLevelIndicatorProps {
  lane: 'north' | 'south' | 'east' | 'west';
  queueLevel: 0 | 1 | 2;
  greenDuration: number;
  vehicleCount?: number;
  queueLength?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Helper functions
const getBadgeStyle = (level: number) => {
  switch (level) {
    case 0:
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        glow: 'shadow-emerald-200',
      };
    case 1:
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        glow: 'shadow-yellow-200',
      };
    case 2:
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        glow: 'shadow-red-200',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        glow: 'shadow-slate-200',
      };
  }
};

const getLevelText = (level: number, t: any): string => {
  switch (level) {
    case 0: return t('traffic.smooth');
    case 1: return t('traffic.moderate');
    case 2: return t('traffic.congested');
    default: return 'Unknown';
  }
};

const getLevelIcon = (level: number): string => {
  switch (level) {
    case 0: return '🟢';
    case 1: return '🟡';
    case 2: return '🔴';
    default: return '⚪';
  }
};

const getLaneName = (lane: string, t: any): string => {
  const laneMap: Record<string, string> = {
    'north': t('traffic.north'),
    'south': t('traffic.south'),
    'east': t('traffic.east'),
    'west': t('traffic.west'),
  };
  return laneMap[lane.toLowerCase()] || lane;
};

const getQueueLengthRange = (level: number): string => {
  switch (level) {
    case 0: return '> 20cm';
    case 1: return '10-20cm';
    case 2: return '< 10cm';
    default: return 'N/A';
  }
};

export default function QueueLevelIndicator({
  lane,
  queueLevel,
  greenDuration,
  vehicleCount,
  queueLength,
  showDetails = false,
  size = 'md',
  className = '',
}: QueueLevelIndicatorProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const badgeStyle = getBadgeStyle(queueLevel);
  const levelText = getLevelText(queueLevel, t);
  const levelIcon = getLevelIcon(queueLevel);
  const laneName = getLaneName(lane, t);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1',
      text: 'text-xs',
      icon: 'text-sm',
      gap: 'gap-1',
    },
    md: {
      container: 'px-3 py-2',
      text: 'text-sm',
      icon: 'text-base',
      gap: 'gap-2',
    },
    lg: {
      container: 'p-4',
      text: 'text-base',
      icon: 'text-lg',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  // Small size - compact badge
  if (size === 'sm') {
    return (
      <div className="relative inline-block">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          onHoverStart={() => setShowTooltip(true)}
          onHoverEnd={() => setShowTooltip(false)}
          className={`
            ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}
            ${config.container} ${config.gap}
            inline-flex items-center rounded-full border-2 font-bold
            cursor-pointer transition-all duration-300
            ${className}
          `}
        >
          <span className={config.icon}>{levelIcon}</span>
          <span className={config.text}>Level {queueLevel}</span>
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48"
            >
              <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
                <p className="font-bold mb-1">Jalur {laneName} - Level {queueLevel}</p>
                <p className="text-slate-300">Status: {levelText}</p>
                <p className="text-slate-300">Antrian: {queueLength ? `${queueLength}cm` : getQueueLengthRange(queueLevel)}</p>
                <p className="text-slate-300">Lampu hijau: {greenDuration} detik</p>
                {vehicleCount !== undefined && (
                  <p className="text-slate-300">Kendaraan: {vehicleCount}</p>
                )}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Medium size - badge with details
  if (size === 'md') {
    return (
      <div className="relative inline-block">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          onHoverStart={() => {
            setShowTooltip(true);
            setIsHovered(true);
          }}
          onHoverEnd={() => {
            setShowTooltip(false);
            setIsHovered(false);
          }}
          className={`
            ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}
            ${config.container} ${config.gap}
            rounded-xl border-2 font-semibold
            cursor-pointer transition-all duration-300
            ${isHovered ? `shadow-lg ${badgeStyle.glow}` : 'shadow-sm'}
            ${className}
          `}
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={config.icon}
            >
              {levelIcon}
            </motion.span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`${config.text} font-bold`}>Level {queueLevel}</span>
                <span className="text-xs opacity-75">-</span>
                <span className={`${config.text}`}>{levelText}</span>
              </div>
              {showDetails && (
                <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  <span>Lampu hijau: {greenDuration}s</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56"
            >
              <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
                <p className="font-bold mb-2">Jalur {laneName} - Level {queueLevel}</p>
                <div className="space-y-1">
                  <p className="text-slate-300">Status: {levelText}</p>
                  <p className="text-slate-300">Antrian: {queueLength ? `${queueLength}cm` : getQueueLengthRange(queueLevel)}</p>
                  <p className="text-slate-300">Lampu hijau: {greenDuration} detik</p>
                  {vehicleCount !== undefined && (
                    <p className="text-slate-300">Kendaraan: {vehicleCount}</p>
                  )}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Large size - full card
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        ${badgeStyle.bg} ${badgeStyle.border}
        ${config.container}
        rounded-xl border-2 transition-all duration-300
        ${isHovered ? `shadow-xl ${badgeStyle.glow}` : 'shadow-md'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={`${badgeStyle.text} font-bold ${config.text}`}>
          Jalur {laneName}
        </h4>
        <motion.span
          animate={{ 
            scale: isHovered ? [1, 1.3, 1] : 1,
            rotate: isHovered ? [0, 10, -10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
          className={config.icon}
        >
          {levelIcon}
        </motion.span>
      </div>

      {/* Queue Level Badge */}
      <div className={`${badgeStyle.text} mb-3`}>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black">Level {queueLevel}</span>
          <span className="text-lg font-bold opacity-75">- {levelText}</span>
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t-2 ${badgeStyle.border} opacity-30 my-3`}></div>

      {/* Details */}
      <div className="space-y-2">
        {/* Green Duration */}
        <div className="flex items-center justify-between text-sm">
          <span className={`${badgeStyle.text} opacity-75 flex items-center gap-1.5`}>
            <span className="material-symbols-outlined text-base">schedule</span>
            Lampu hijau
          </span>
          <span className={`${badgeStyle.text} font-bold`}>
            {greenDuration} detik
          </span>
        </div>

        {/* Vehicle Count */}
        {vehicleCount !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className={`${badgeStyle.text} opacity-75 flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-base">directions_car</span>
              Kendaraan
            </span>
            <span className={`${badgeStyle.text} font-bold`}>
              {vehicleCount}
            </span>
          </div>
        )}

        {/* Queue Length */}
        <div className="flex items-center justify-between text-sm">
          <span className={`${badgeStyle.text} opacity-75 flex items-center gap-1.5`}>
            <span className="material-symbols-outlined text-base">straighten</span>
            Jarak antrian
          </span>
          <span className={`${badgeStyle.text} font-bold`}>
            {queueLength ? `${queueLength}cm` : getQueueLengthRange(queueLevel)}
          </span>
        </div>
      </div>

      {/* Pulse animation for level changes */}
      <motion.div
        key={queueLevel}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${
            queueLevel === 0 ? 'rgba(16, 185, 129, 0.1)' :
            queueLevel === 1 ? 'rgba(245, 158, 11, 0.1)' :
            'rgba(239, 68, 68, 0.1)'
          } 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}
