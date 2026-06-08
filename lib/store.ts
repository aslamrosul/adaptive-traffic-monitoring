import { create } from 'zustand';

interface TrafficData {
  id: string;
  name: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  status: string;
  deviceId?: string;
  lanes?: any;
  config?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface TrafficStore {
  intersections: TrafficData[];
  selectedIntersection: string | null;
  isLoading: boolean;
  isInitialLoad: boolean;
  error: string | null;

  // Actions
  fetchIntersections: (isBackgroundRefresh?: boolean) => Promise<void>;
  searchIntersections: (query: string) => Promise<void>;
  setSelectedIntersection: (id: string | null) => void;
  updateIntersection: (id: string, data: Partial<TrafficData>) => Promise<void>;
  clearError: () => void;
}

export const useTrafficStore = create<TrafficStore>((set, get) => ({
  intersections: [],
  selectedIntersection: null,
  isLoading: false,
  isInitialLoad: true,
  error: null,

  fetchIntersections: async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      set({ isLoading: true, error: null });
    }
    try {
      const response = await fetch('/api/intersections');
      const result = await response.json();

      if (result.success) {
        set({ intersections: result.data, isLoading: false, isInitialLoad: false });
      } else {
        set({ error: result.error, isLoading: false, isInitialLoad: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch intersections', isLoading: false, isInitialLoad: false });
    }
  },

  searchIntersections: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/intersections?search=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (result.success) {
        set({ intersections: result.data, isLoading: false });
      } else {
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to search intersections', isLoading: false });
    }
  },

  setSelectedIntersection: (id) => set({ selectedIntersection: id }),

  updateIntersection: async (id: string, data: Partial<TrafficData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/intersections/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        set((state) => ({
          intersections: state.intersections.map((intersection) =>
            intersection.id === id ? { ...intersection, ...result.data } : intersection
          ),
          isLoading: false,
        }));
      } else {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
    } catch (error) {
      set({ error: 'Failed to update intersection', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
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


// Notification Store
// Notification Store
interface NotificationData {
  id: string;
  notification_id?: string;

  user_id?: string;
  created_at?: string;

  type: string;
  severity?: string;
  category?: string;

  title: string;
  message: string;

  read: boolean;

  actionUrl?: string | null;
  relatedTo?: string | null;

  intersection_id?: string | null;
  device_id?: string | null;
  lane?: string | null;

  metadata?: any;

  createdAt: string;
  updatedAt?: string;
}

interface NotificationStore {
  notifications: NotificationData[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

function normalizeNotification(item: any): NotificationData {
  const id = item.id || item.notification_id;

  return {
    ...item,

    id,
    notification_id: item.notification_id || id,

    user_id: item.user_id,
    created_at: item.created_at,

    type: item.type || item.severity || "info",
    severity: item.severity || item.type || "info",
    category: item.category || "system",

    title: item.title || "Notifikasi",
    message: item.message || "",

    read: Boolean(item.read),

    actionUrl: item.actionUrl ?? null,
    relatedTo: item.relatedTo ?? null,

    createdAt:
      item.createdAt ||
      item.created_at ||
      new Date().toISOString(),

    updatedAt: item.updatedAt,
  };
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async (unreadOnly = false) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const params = new URLSearchParams({
        limit: "50",
      });

      if (unreadOnly) {
        params.set("unreadOnly", "true");
      }

      const response = await fetch(
        `/api/notifications?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || "Failed to fetch notifications",
        );
      }

      const notifications: NotificationData[] = Array.isArray(result.data)
        ? result.data.map((item: any) => normalizeNotification(item))
        : [];

      set({
        notifications,
        unreadCount: Number(
          result.unreadCount ??
            notifications.filter(
              (notification: NotificationData) => !notification.read,
            ).length,
        ),
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch notifications",
        isLoading: false,
      });
    }
  },

  markAsRead: async (id: string) => {
    if (!id) {
      return;
    }

    const notification = get().notifications.find(
      (item) => item.id === id,
    );

    if (!notification) {
      return;
    }

    if (notification.read) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          created_at:
            notification.created_at || notification.createdAt,
          read: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || "Failed to mark notification as read",
        );
      }

      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllAsRead: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || "Failed to mark all notifications as read",
        );
      }

      set((state) => ({
        notifications: state.notifications.map((item) => ({
          ...item,
          read: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  clearError: () =>
    set({
      error: null,
    }),
}));