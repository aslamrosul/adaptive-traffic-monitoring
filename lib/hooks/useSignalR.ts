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
        const { url, accessToken } = await res.json();

        // Create connection
        const conn = new signalR.HubConnectionBuilder()
          .withUrl(url, { accessTokenFactory: () => accessToken })
          .withAutomaticReconnect()
          .build();

        // Listen for updates
        conn.on('trafficUpdate', (data) => {
          if (isMounted) {
            console.log('📡 Update:', data);
            setLatestData(data);
          }
        });

        // Start
        await conn.start();

        if (isMounted) {
          setConnection(conn);
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed');
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