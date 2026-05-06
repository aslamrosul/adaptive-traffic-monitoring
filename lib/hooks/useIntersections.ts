import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIntersections() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/intersections',
    fetcher,
    {
      refreshInterval: 60000, // Refresh setiap 60 detik (dikurangi dari 30 detik)
      revalidateOnFocus: false, // Matikan auto-refresh saat tab difokuskan
    }
  );

  return {
    intersections: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useIntersection(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/intersections/${id}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh setiap 30 detik (dikurangi dari 10 detik)
      revalidateOnFocus: false, // Matikan auto-refresh saat tab difokuskan
    }
  );

  return {
    intersection: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
