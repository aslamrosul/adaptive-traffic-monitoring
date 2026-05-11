"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ConnectionState } from "@/lib/hooks/useSignalR";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  isConnected: boolean;
  error: string | null;
  lastUpdate?: Date | null;
  onReconnect?: () => void;
  compact?: boolean;
  className?: string;
}

export default function ConnectionStatus({
  connectionState,
  isConnected,
  error,
  lastUpdate,
  onReconnect,
  compact = false,
  className = "",
}: ConnectionStatusProps) {
  
  // Get status config based on connection state
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: '🟢',
          text: 'Real-time Connected',
          subtext: 'Data streaming live',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-800',
          dotColor: 'bg-emerald-500',
          animate: true,
        };
      case 'connecting':
        return {
          icon: '🟡',
          text: 'Connecting...',
          subtext: 'Establishing connection',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          dotColor: 'bg-yellow-500',
          animate: true,
        };
      case 'reconnecting':
        return {
          icon: '🟠',
          text: 'Reconnecting...',
          subtext: 'Attempting to restore connection',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-500',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: '🔴',
          text: 'Disconnected',
          subtext: error || 'Connection lost',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500',
          animate: false,
        };
      default:
        return {
          icon: '⚪',
          text: 'Unknown',
          subtext: 'Status unknown',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-800',
          dotColor: 'bg-slate-500',
          animate: false,
        };
    }
  };

  const status = getStatusConfig();

  // Compact version - just a dot and text
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.div
          animate={status.animate ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${status.dotColor}`}
        />
        <span className={`text-xs font-semibold ${status.textColor}`}>
          {status.text}
        </span>
        {lastUpdate && isConnected && (
          <span className="text-xs text-slate-500">
            • {lastUpdate.toLocaleTimeString('id-ID')}
          </span>
        )}
      </div>
    );
  }

  // Full version - card with details
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={connectionState}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          ${status.bgColor} ${status.borderColor}
          border rounded-xl p-3 lg:p-4
          ${className}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status Info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Animated Dot */}
            <motion.div
              animate={status.animate ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-3 h-3 rounded-full ${status.dotColor} flex-shrink-0`}
            />

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm lg:text-base font-bold ${status.textColor}`}>
                  {status.icon} {status.text}
                </span>
                {lastUpdate && isConnected && (
                  <span className="text-xs text-slate-500">
                    • Update: {lastUpdate.toLocaleTimeString('id-ID')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {status.subtext}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reconnect Button (only show when disconnected) */}
            {connectionState === 'disconnected' && onReconnect && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReconnect}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Reconnect
              </motion.button>
            )}

            {/* Fallback Info (when using polling) */}
            {!isConnected && connectionState === 'disconnected' && !error?.includes('not configured') && (
              <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                Using polling fallback (30s refresh)
              </div>
            )}
          </div>
        </div>

        {/* Error Details (expandable) */}
        {error && connectionState === 'disconnected' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-slate-200"
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-red-600 flex-shrink-0">
                error
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-800 mb-1">Error Details:</p>
                <p className="text-xs text-red-700 break-words">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connection Stats (when connected) */}
        {isConnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 pt-3 border-t border-emerald-200"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Protocol</p>
                <p className="text-xs font-bold text-emerald-800">WebSocket</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Latency</p>
                <p className="text-xs font-bold text-emerald-800">~50ms</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Auto-Reconnect</p>
                <p className="text-xs font-bold text-emerald-800">Enabled</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
