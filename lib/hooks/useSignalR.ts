'use client';

import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

// ========== INTERFACES ==========
// Based on 00-KONSEP-BARU.md - Queue Level System

export interface LaneData {
  light: 'red' | 'yellow' | 'green';
  vehicleCount: number;
  irState: 'detected' | 'clear';
  queueLength: number;        // cm dari ultrasonic sensor
  queueLevel: 0 | 1 | 2;     // 0=Lancar (>20cm), 1=Sedang (10-20cm), 2=Padat (<10cm)
  greenDuration: number;      // Durasi lampu hijau yang digunakan (7s, 10s, atau 15s)
}

export interface TrafficUpdate {
  deviceId: string;
  timestamp: number;
  intersectionId?: string;
  north: LaneData;
  south: LaneData;
  east: LaneData;
  west: LaneData;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface UseSignalRReturn {
  connection: signalR.HubConnection | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  latestData: TrafficUpdate | null;
  error: string | null;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// ========== HOOK ==========

export function useSignalR(): UseSignalRReturn {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<TrafficUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate queue level from queue length if not provided
  const calculateQueueLevel = (queueLength: number): 0 | 1 | 2 => {
    if (queueLength > 20) return 0; // Lancar
    if (queueLength >= 10) return 1; // Sedang
    return 2; // Padat
  };

  // Process incoming traffic data
  const processTrafficData = useCallback((rawData: any): TrafficUpdate => {
    const processLane = (laneData: any): LaneData => {
      const queueLength = laneData.queueLength || 0;
      const queueLevel = laneData.queueLevel !== undefined 
        ? laneData.queueLevel 
        : calculateQueueLevel(queueLength);

      return {
        light: laneData.light || 'red',
        vehicleCount: laneData.vehicleCount || 0,
        irState: laneData.irState || 'clear',
        queueLength,
        queueLevel,
        greenDuration: laneData.greenDuration || (queueLevel === 0 ? 7 : queueLevel === 1 ? 10 : 15),
      };
    };

    return {
      deviceId: rawData.deviceId || 'unknown',
      timestamp: rawData.timestamp || Date.now(),
      intersectionId: rawData.intersectionId,
      north: processLane(rawData.north || {}),
      south: processLane(rawData.south || {}),
      east: processLane(rawData.east || {}),
      west: processLane(rawData.west || {}),
    };
  }, []);

  // Connect to SignalR
  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);

      // Get negotiate token from backend
      const res = await fetch('/api/signalr/negotiate', { method: 'POST' });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'SignalR not configured');
      }

      const data = await res.json();
      
      // Validate response
      if (!data.url || !data.accessToken) {
        throw new Error('Invalid SignalR response: missing url or accessToken');
      }

      console.log('🔗 SignalR connecting to:', data.url);

      // Create connection with automatic reconnect
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(data.url, { 
          accessTokenFactory: () => data.accessToken,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0s, 2s, 10s, 30s, then 30s
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // ========== EVENT HANDLERS ==========

      // Handle traffic updates
      conn.on('trafficUpdate', (rawData: any) => {
        try {
          const processedData = processTrafficData(rawData);
          setLatestData(processedData);
          console.log('📡 Traffic Update:', {
            deviceId: processedData.deviceId,
            timestamp: new Date(processedData.timestamp).toLocaleTimeString(),
            north: `Level ${processedData.north.queueLevel} (${processedData.north.vehicleCount} vehicles)`,
            south: `Level ${processedData.south.queueLevel} (${processedData.south.vehicleCount} vehicles)`,
            east: `Level ${processedData.east.queueLevel} (${processedData.east.vehicleCount} vehicles)`,
            west: `Level ${processedData.west.queueLevel} (${processedData.west.vehicleCount} vehicles)`,
          });
        } catch (err) {
          console.error('❌ Error processing traffic data:', err);
        }
      });

      // Handle reconnecting
      conn.onreconnecting((error) => {
        console.warn('🔄 SignalR reconnecting...', error?.message);
        setConnectionState('reconnecting');
        setIsConnected(false);
      });

      // Handle reconnected
      conn.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected:', connectionId);
        setConnectionState('connected');
        setIsConnected(true);
        setError(null);
      });

      // Handle closed
      conn.onclose((error) => {
        console.warn('❌ SignalR connection closed:', error?.message);
        setConnectionState('disconnected');
        setIsConnected(false);
        if (error) {
          setError(error.message);
        }
      });

      // Start connection
      await conn.start();

      setConnection(conn);
      setConnectionState('connected');
      setIsConnected(true);
      setError(null);
      console.log('✅ SignalR Connected successfully');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      console.error('❌ SignalR connection error:', errorMsg);
      setError(errorMsg);
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [processTrafficData]);

  // Reconnect manually
  const reconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
    }
    await connect();
  }, [connection, connect]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
      setConnection(null);
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [connection]);

  // Auto-connect on mount
  useEffect(() => {
    let isMounted = true;

    const initConnection = async () => {
      if (isMounted) {
        await connect();
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      if (connection) {
        connection.stop().catch(console.error);
      }
    };
  }, []);

  return { 
    connection, 
    connectionState,
    isConnected, 
    latestData, 
    error,
    reconnect,
    disconnect,
  };
}