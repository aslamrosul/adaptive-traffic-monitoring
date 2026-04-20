import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(intersectionId?: string, status?: string, priority?: string, limit: number = 50) {
  const params = new URLSearchParams();
  if (intersectionId) params.append('intersectionId', intersectionId);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  params.append('limit', limit.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/events?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 15000, // Refresh setiap 15 detik
      revalidateOnFocus: true,
    }
  );

  return {
    events: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
