import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRealtimeTraffic(intersectionId?: string, limit: number = 100) {
  const params = new URLSearchParams();
  if (intersectionId) params.append('intersectionId', intersectionId);
  params.append('limit', limit.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/traffic/realtime?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 15000, // Refresh setiap 15 detik (dikurangi dari 5 detik)
      revalidateOnFocus: false, // Matikan auto-refresh saat tab difokuskan
    }
  );

  return {
    trafficData: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
