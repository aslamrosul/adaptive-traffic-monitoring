import { create } from 'zustand';

interface TrafficData {
  id: string;
  name: string;
  volume: number;
  status: 'Lancar' | 'Sedang' | 'Padat' | 'Macet Parah';
  density: number;
  avgWaitTime: number;
}

interface TrafficStore {
  intersections: TrafficData[];
  selectedIntersection: string | null;
  setSelectedIntersection: (id: string | null) => void;
  updateIntersection: (id: string, data: Partial<TrafficData>) => void;
}

export const useTrafficStore = create<TrafficStore>((set) => ({
  intersections: [
    {
      id: '1',
      name: 'Simpang Sudirman',
      volume: 4200,
      status: 'Macet Parah',
      density: 89,
      avgWaitTime: 78,
    },
    {
      id: '2',
      name: 'Simpang Thamrin',
      volume: 850,
      status: 'Lancar',
      density: 12,
      avgWaitTime: 25,
    },
    {
      id: '3',
      name: 'Simpang Kuningan',
      volume: 2100,
      status: 'Sedang',
      density: 55,
      avgWaitTime: 45,
    },
    {
      id: '4',
      name: 'Simpang Gatot Subroto',
      volume: 3850,
      status: 'Macet Parah',
      density: 82,
      avgWaitTime: 72,
    },
  ],
  selectedIntersection: null,
  setSelectedIntersection: (id) => set({ selectedIntersection: id }),
  updateIntersection: (id, data) =>
    set((state) => ({
      intersections: state.intersections.map((intersection) =>
        intersection.id === id ? { ...intersection, ...data } : intersection
      ),
    })),
}));
