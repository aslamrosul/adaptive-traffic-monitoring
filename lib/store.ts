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

// Profile Store
interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
  avatar: string;
  memberSince: string;
  lastLogin: string;
  accountType: string;
  stats: {
    totalLogin: number;
    incidentsHandled: number;
    reportsCreated: number;
    activeHours: number;
  };
  performance: {
    responseTime: number;
    accuracy: number;
    efficiency: number;
  };
  skills: string[];
  settings: {
    publicProfile: boolean;
    showEmail: boolean;
    showActivity: boolean;
  };
}

interface ProfileStore {
  profile: ProfileData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  updateSettings: (settings: Partial<ProfileData["settings"]>) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/profile");
      const result = await response.json();

      if (result.success) {
        set({ profile: result.data, isLoading: false });
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: "Failed to fetch profile", isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        set({ profile: result.data, isLoading: false });
      } else {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
    } catch (error) {
      set({ error: "Failed to update profile", isLoading: false });
      throw error;
    }
  },

  uploadAvatar: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              avatar: result.data.url,
            },
            isLoading: false,
          });
        }
      } else {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
    } catch (error) {
      set({ error: "Failed to upload avatar", isLoading: false });
      throw error;
    }
  },

  deleteAvatar: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentProfile.name
              )}&background=0040a1&color=fff`,
            },
            isLoading: false,
          });
        }
      } else {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
    } catch (error) {
      set({ error: "Failed to delete avatar", isLoading: false });
      throw error;
    }
  },

  updateSettings: async (settings) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const updatedSettings = {
      ...currentProfile.settings,
      ...settings,
    };

    await get().updateProfile({ settings: updatedSettings });
  },

  clearError: () => set({ error: null }),
}));
