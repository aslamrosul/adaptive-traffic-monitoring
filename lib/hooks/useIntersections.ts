import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIntersections() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/intersections',
    fetcher,
    {
      refreshInterval: 30000, // Refresh setiap 30 detik
      revalidateOnFocus: true,
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
      refreshInterval: 10000, // Refresh setiap 10 detik
      revalidateOnFocus: true,
    }
  );

  return {
    intersection: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
