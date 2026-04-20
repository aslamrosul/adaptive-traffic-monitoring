import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAnalytics(intersectionId?: string, date?: string) {
  const params = new URLSearchParams();
  if (intersectionId) params.append('intersectionId', intersectionId);
  if (date) params.append('date', date);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics/daily?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh setiap 1 menit
      revalidateOnFocus: true,
    }
  );

  return {
    analytics: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
