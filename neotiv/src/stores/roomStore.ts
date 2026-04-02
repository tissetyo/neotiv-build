import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, Promo, Service, Announcement } from '@/types';

interface RoomState {
  roomId: string | null;
  roomCode: string;
  hotelSlug: string;
  hotelId: string | null;
  guestName: string;
  guestPhotoUrl: string | null;
  backgroundUrl: string | null;
  hotelName: string;
  hotelTimezone: string;
  hotelLocation: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiUsername: string;
  clockTimezones: [string, string, string];
  clockLabels: [string, string, string];
  latestNotification: Notification | null;
  promos: Promo[];
  services: Service[];
  announcements: Announcement[];
  tvLayoutConfig: Record<string, any> | null;
  unreadChatCount: number;
  hydrate: (data: Partial<RoomState>) => void;
  setNotification: (n: Notification) => void;
  dismissNotification: () => void;
  incrementUnreadChat: () => void;
  clearUnreadChat: () => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  roomCode: '',
  hotelSlug: '',
  hotelId: null,
  guestName: '',
  guestPhotoUrl: null,
  backgroundUrl: null,
  hotelName: '',
  hotelTimezone: 'Asia/Jakarta',
  hotelLocation: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiUsername: '',
  clockTimezones: ['America/New_York', 'Europe/Paris', 'Asia/Shanghai'] as [string, string, string],
  clockLabels: ['New York', 'France', 'China'] as [string, string, string],
  latestNotification: null,
  promos: [],
  services: [],
  announcements: [],
  tvLayoutConfig: null,
  unreadChatCount: 0,
};

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      ...initialState,
      hydrate: (data) => set(data),
      setNotification: (n) => set({ latestNotification: n }),
      dismissNotification: () => set((s) => ({
        latestNotification: s.latestNotification ? { ...s.latestNotification, is_dismissed: true } : null
      })),
      incrementUnreadChat: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
      clearUnreadChat: () => set({ unreadChatCount: 0 }),
      reset: () => set(initialState),
    }),
    {
      name: 'neotiv-room-store',
      partialize: (state) => ({
        roomId: state.roomId,
        hotelId: state.hotelId,
        guestName: state.guestName,
        hotelName: state.hotelName,
        hotelTimezone: state.hotelTimezone,
        wifiSsid: state.wifiSsid,
        wifiPassword: state.wifiPassword,
        wifiUsername: state.wifiUsername,
        clockTimezones: state.clockTimezones,
        clockLabels: state.clockLabels,
        services: state.services,
        announcements: state.announcements,
        tvLayoutConfig: state.tvLayoutConfig,
      }),
    }
  )
);
