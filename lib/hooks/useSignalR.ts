import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export function useSignalR() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      try {
        // Get token
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

        // Create connection
        const conn = new signalR.HubConnectionBuilder()
          .withUrl(data.url, { accessTokenFactory: () => data.accessToken })
          .withAutomaticReconnect()
          .build();

        // Listen for updates
        conn.on('trafficUpdate', (trafficData) => {
          if (isMounted) {
            console.log('📡 SignalR Update:', trafficData);
            setLatestData(trafficData);
          }
        });

        // Start
        await conn.start();

        if (isMounted) {
          setConnection(conn);
          setIsConnected(true);
          setError(null);
          console.log('✅ SignalR Connected');
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Connection failed';
          console.warn('⚠️ SignalR:', errorMsg);
          setError(errorMsg);
          setIsConnected(false);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      connection?.stop();
    };
  }, []);

  return { connection, isConnected, latestData, error };
}