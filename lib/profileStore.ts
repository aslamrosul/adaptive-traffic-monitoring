import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  skills: string[];
  stats: {
    totalLogins: number;
    incidentsHandled: number;
    reportsCreated: number;
    activeHours: number;
  };
  performance: {
    responseTime: number;
    accuracy: number;
    efficiency: number;
  };
  settings: {
    publicProfile: boolean;
    showEmail: boolean;
    showActivity: boolean;
  };
  accountInfo: {
    memberSince: string;
    lastLogin: string;
    accountType: 'Free' | 'Premium' | 'Enterprise';
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    earned: boolean;
    earnedDate?: string;
  }>;
}

interface ProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateAvatar: (avatar: string) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  unlockAchievement: (achievementId: string) => void;
  incrementStat: (stat: keyof UserProfile['stats'], amount?: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetProfile: () => void;
}

const defaultProfile: UserProfile = {
  id: 'user-001',
  name: 'Admin Pusat',
  email: 'admin@aerialcommand.id',
  phone: '+62 812-3456-7890',
  position: 'Operator Senior',
  department: 'Traffic Control Center',
  bio: 'Operator berpengalaman dengan spesialisasi dalam manajemen lalu lintas perkotaan dan sistem IoT.',
  avatar: 'https://ui-avatars.com/api/?name=Admin+Pusat&background=0040a1&color=fff&size=256',
  skills: [
    'Traffic Management',
    'IoT Systems',
    'Data Analysis',
    'Emergency Response',
    'System Administration',
    'Report Generation',
  ],
  stats: {
    totalLogins: 1247,
    incidentsHandled: 89,
    reportsCreated: 156,
    activeHours: 2340,
  },
  performance: {
    responseTime: 95,
    accuracy: 98,
    efficiency: 92,
  },
  settings: {
    publicProfile: true,
    showEmail: false,
    showActivity: true,
  },
  accountInfo: {
    memberSince: 'Jan 2024',
    lastLogin: new Date().toISOString(),
    accountType: 'Premium',
  },
  achievements: [
    {
      id: 'early-adopter',
      title: 'Early Adopter',
      description: 'Pengguna sejak tahun pertama',
      icon: 'emoji_events',
      color: 'bg-yellow-100 text-yellow-600',
      earned: true,
      earnedDate: '2024-01-15',
    },
    {
      id: 'problem-solver',
      title: 'Problem Solver',
      description: 'Menyelesaikan 50+ insiden',
      icon: 'verified',
      color: 'bg-blue-100 text-blue-600',
      earned: true,
      earnedDate: '2024-03-20',
    },
    {
      id: 'night-owl',
      title: 'Night Owl',
      description: 'Aktif di shift malam',
      icon: 'nightlight',
      color: 'bg-purple-100 text-purple-600',
      earned: true,
      earnedDate: '2024-02-10',
    },
    {
      id: 'data-master',
      title: 'Data Master',
      description: 'Generate 100+ laporan',
      icon: 'analytics',
      color: 'bg-green-100 text-green-600',
      earned: false,
    },
  ],
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile, error: null }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
          error: null,
        })),

      updateAvatar: (avatar) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, avatar } : null,
          error: null,
        })),

      updateSettings: (settings) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                settings: { ...state.profile.settings, ...settings },
              }
            : null,
          error: null,
        })),

      addSkill: (skill) =>
        set((state) => {
          if (!state.profile) return state;
          if (state.profile.skills.includes(skill)) return state;
          return {
            profile: {
              ...state.profile,
              skills: [...state.profile.skills, skill],
            },
            error: null,
          };
        }),

      removeSkill: (skill) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                skills: state.profile.skills.filter((s) => s !== skill),
              }
            : null,
          error: null,
        })),

      unlockAchievement: (achievementId) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              achievements: state.profile.achievements.map((achievement) =>
                achievement.id === achievementId
                  ? {
                      ...achievement,
                      earned: true,
                      earnedDate: new Date().toISOString(),
                    }
                  : achievement
              ),
            },
            error: null,
          };
        }),

      incrementStat: (stat, amount = 1) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              stats: {
                ...state.profile.stats,
                [stat]: state.profile.stats[stat] + amount,
              },
            },
            error: null,
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      resetProfile: () => set({ profile: defaultProfile, error: null }),
    }),
    {
      name: 'aerial-command-profile',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
