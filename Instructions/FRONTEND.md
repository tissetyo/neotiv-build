# 🖥️ Neotiv — Frontend Architecture

> This document covers the complete frontend structure: directory layout, component organization, state management, data fetching patterns, and hooks.

---

## 📁 Full Directory Structure

```
src/
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # Root layout: fonts, global providers
│   ├── page.tsx                          # Root: redirect based on role or to /admin/login
│   ├── globals.css                       # Design tokens, base styles
│   │
│   ├── [hotelSlug]/                      # Multi-tenant hotel routes
│   │   ├── layout.tsx                    # Hotel shell: validate hotel exists
│   │   ├── login/
│   │   │   └── page.tsx                  # Staff login (email + password)
│   │   │
│   │   ├── dashboard/
│   │   │   └── [roomCode]/
│   │   │       ├── page.tsx              # TV: PIN entry → Welcome screen
│   │   │       └── main/
│   │   │           └── page.tsx          # TV: Main dashboard
│   │   │
│   │   ├── frontoffice/
│   │   │   ├── layout.tsx                # Front office shell + sidebar
│   │   │   ├── page.tsx                  # Redirect → /rooms
│   │   │   ├── rooms/
│   │   │   │   ├── page.tsx              # Room grid
│   │   │   │   └── [roomId]/
│   │   │   │       └── personalize/
│   │   │   │           └── page.tsx      # Guest personalization
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   └── page.tsx
│   │   │   ├── alarms/
│   │   │   │   └── page.tsx
│   │   │   ├── service-requests/
│   │   │   │   └── page.tsx
│   │   │   └── promos/
│   │   │       └── page.tsx
│   │   │
│   │   ├── settings/                     # Manager only
│   │   │   ├── page.tsx                  # Hotel settings (tabs)
│   │   │   ├── rooms/
│   │   │   │   └── page.tsx
│   │   │   ├── room-types/
│   │   │   │   └── page.tsx
│   │   │   ├── staff/
│   │   │   │   └── page.tsx
│   │   │   └── services/
│   │   │       └── page.tsx
│   │   │
│   │   └── analytics/
│   │       └── page.tsx
│   │
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Redirect → /hotels
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── hotels/
│   │   │   ├── page.tsx
│   │   │   └── [hotelId]/
│   │   │       └── page.tsx
│   │   ├── accounts/
│   │   │   └── page.tsx
│   │   ├── announcements/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── monitor/
│   │       └── page.tsx
│   │
│   └── api/                              # Server-side API routes
│       ├── room/
│       │   └── login/
│       │       └── route.ts
│       ├── weather/
│       │   └── route.ts
│       ├── flights/
│       │   └── route.ts
│       ├── upload/
│       │   ├── hotel-background/
│       │   │   └── route.ts
│       │   ├── guest-photo/
│       │   │   └── route.ts
│       │   └── promo-poster/
│       │       └── route.ts
│       ├── hotel/
│       │   └── [hotelSlug]/
│       │       ├── invite-staff/
│       │       │   └── route.ts
│       │       └── staff/
│       │           └── [staffId]/
│       │               ├── role/
│       │               │   └── route.ts
│       │               └── status/
│       │                   └── route.ts
│       └── admin/
│           ├── hotels/
│           │   ├── route.ts
│           │   └── [hotelId]/
│           │       └── status/
│           │           └── route.ts
│           └── accounts/
│               ├── route.ts
│               └── [userId]/
│                   └── suspend/
│                       └── route.ts
│
├── components/
│   ├── tv/                               # TV dashboard components
│   │   ├── AnalogClock.tsx
│   │   ├── DigitalClock.tsx
│   │   ├── WeatherWidget.tsx
│   │   ├── GuestCard.tsx
│   │   ├── WifiCard.tsx
│   │   ├── FlightSchedule.tsx
│   │   ├── NotificationCard.tsx
│   │   ├── HotelDeals.tsx
│   │   ├── HotelService.tsx
│   │   ├── HotelInfo.tsx
│   │   ├── MapWidget.tsx
│   │   ├── AppGrid.tsx
│   │   ├── AppLauncher.tsx              # Fullscreen iframe overlay
│   │   ├── MarqueeBar.tsx
│   │   ├── ChatModal.tsx
│   │   ├── AlarmModal.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── WelcomeCard.tsx
│   │   ├── PinEntry.tsx
│   │   └── skeletons/
│   │       ├── ClockSkeleton.tsx
│   │       ├── FlightSkeleton.tsx
│   │       ├── NotificationSkeleton.tsx
│   │       └── WidgetSkeleton.tsx       # Generic skeleton
│   │
│   ├── frontoffice/
│   │   ├── RoomGrid.tsx
│   │   ├── RoomCard.tsx
│   │   ├── RoomSidePanel.tsx
│   │   ├── GuestPersonalizationForm.tsx
│   │   ├── BackgroundLibrary.tsx
│   │   ├── NotificationComposer.tsx
│   │   ├── NotificationHistory.tsx
│   │   ├── AlarmList.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ServiceRequestQueue.tsx
│   │   └── PromoGrid.tsx
│   │
│   ├── management/
│   │   ├── HotelSettingsForm.tsx
│   │   ├── RoomTable.tsx
│   │   ├── AddRoomDialog.tsx
│   │   ├── RoomTypeTable.tsx
│   │   ├── StaffTable.tsx
│   │   ├── InviteStaffDialog.tsx
│   │   ├── ServicesConfig.tsx
│   │   ├── ServiceItemRow.tsx
│   │   └── AnalyticsCards.tsx
│   │
│   ├── admin/
│   │   ├── HotelTable.tsx
│   │   ├── CreateHotelForm.tsx
│   │   ├── AccountTable.tsx
│   │   ├── AnnouncementComposer.tsx
│   │   ├── PlatformSettings.tsx
│   │   └── UsageMonitor.tsx
│   │
│   ├── shared/
│   │   ├── Sidebar.tsx                  # Staff panels sidebar
│   │   ├── Navbar.tsx                   # Staff panels top bar
│   │   ├── HotelSwitcher.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Toast.tsx                    # (or use shadcn Toaster)
│   │
│   └── ui/                              # shadcn/ui components (auto-generated)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # createBrowserClient
│   │   ├── server.ts                    # createServerClient (for RSC + API)
│   │   ├── middleware.ts                # createServerClient for middleware
│   │   └── types.ts                     # supabase gen types output
│   │
│   ├── hooks/
│   │   ├── useDpadNavigation.ts         # Arrow key / Enter / Escape focus mgmt
│   │   ├── useOfflineQueue.ts           # localStorage queue + flush on reconnect
│   │   ├── useRealtime.ts               # Supabase realtime subscription wrapper
│   │   ├── useWeather.ts                # SWR fetch from /api/weather
│   │   ├── useFlights.ts                # SWR fetch from /api/flights
│   │   └── useHotelAuth.ts             # Read hotel_id + role from auth user
│   │
│   └── utils/
│       ├── clock.ts                     # Timezone → angle calculations
│       ├── qr.ts                        # WiFi QR string generator
│       ├── formatters.ts                # Date/time formatting helpers
│       ├── statusColors.ts              # Flight/service status → color maps
│       └── cache.ts                     # Upstash Redis wrapper
│
├── stores/
│   ├── roomStore.ts                     # TV dashboard global state
│   └── offlineQueueStore.ts             # Offline action queue
│
├── types/
│   └── index.ts                         # Shared TypeScript interfaces
│
└── middleware.ts                        # Auth + role guard (Next.js middleware)
```

---

## 🧩 Component Patterns

### Server Component (default)

```typescript
// src/app/[hotelSlug]/frontoffice/rooms/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { RoomGrid } from '@/components/frontoffice/RoomGrid';
import type { Room } from '@/types';

export default async function RoomsPage({
  params,
}: {
  params: { hotelSlug: string };
}): Promise<JSX.Element> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hotelId = user?.user_metadata?.hotel_id as string;

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*, room_types(name)')
    .eq('hotel_id', hotelId)
    .order('room_code');

  if (error) throw new Error('Failed to load rooms');

  return <RoomGrid rooms={rooms as Room[]} hotelId={hotelId} />;
}
```

### Client Component (interactive)

```typescript
// src/components/frontoffice/RoomGrid.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Room } from '@/types';

interface RoomGridProps {
  rooms: Room[];
  hotelId: string;
}

export function RoomGrid({ rooms: initialRooms, hotelId }: RoomGridProps): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const supabase = createBrowserClient();

  const toggleOccupancy = async (roomId: string, current: boolean): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_occupied: !current })
      .eq('id', roomId)
      .eq('hotel_id', hotelId); // RLS double-check

    if (error) {
      console.error('Toggle failed:', error.message);
      return;
    }

    setRooms(prev =>
      prev.map(r => r.id === roomId ? { ...r, is_occupied: !current } : r)
    );
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {rooms.map(room => (
        <RoomCard key={room.id} room={room} onToggle={toggleOccupancy} />
      ))}
    </div>
  );
}
```

### TV Widget Component

```typescript
// src/components/tv/NotificationCard.tsx
'use client';

import { useRealtime } from '@/lib/hooks/useRealtime';
import type { Notification } from '@/types';

interface NotificationCardProps {
  roomId: string;
  initialNotification: Notification | null;
}

export function NotificationCard({
  roomId,
  initialNotification,
}: NotificationCardProps): JSX.Element {
  const liveNotification = useRealtime<Notification>('notifications', {
    filter: `room_id=eq.${roomId}`,
    event: 'INSERT',
  });

  const notification = liveNotification ?? initialNotification;

  if (!notification) {
    return <NotificationEmpty />;
  }

  return (
    <div
      className="tv-widget tv-focusable"
      data-focusable="true"
      tabIndex={0}
    >
      <div className="flex justify-between items-center">
        <span className="tv-badge-red">Notification</span>
        <span className="tv-text-xs tv-text-muted">
          {formatTime(notification.created_at)}
        </span>
      </div>
      <h3 className="tv-text-lg tv-font-bold mt-2">{notification.title}</h3>
      <p className="tv-text-sm tv-text-muted mt-1 line-clamp-4">{notification.body}</p>
    </div>
  );
}
```

---

## 🗃️ State Management

### Zustand Room Store

```typescript
// src/stores/roomStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification { id: string; title: string; body: string; created_at: string; }
interface Promo { id: string; title: string; poster_url: string | null; description: string | null; }
interface Service { id: string; name: string; icon: string | null; sort_order: number; }

interface RoomState {
  // Identity
  roomId: string | null;
  roomCode: string;
  hotelSlug: string;
  hotelId: string | null;

  // Guest
  guestName: string;
  guestPhotoUrl: string | null;
  backgroundUrl: string | null;

  // Hotel config
  hotelName: string;
  hotelTimezone: string;
  hotelLocation: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiUsername: string;
  clockConfigs: Array<{ timezone: string; label: string }>;

  // Live widget data
  latestNotification: Notification | null;
  promos: Promo[];
  services: Service[];
  announcements: string[];
  unreadChatCount: number;

  // Actions
  hydrate: (data: Partial<RoomState>) => void;
  setNotification: (n: Notification) => void;
  incrementChat: () => void;
  clearChat: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      // ... initial state and actions
      hydrate: (data) => set(data),
      setNotification: (n) => set({ latestNotification: n }),
      incrementChat: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
      clearChat: () => set({ unreadChatCount: 0 }),
      reset: () => set({ roomId: null, guestName: '', /* ... */ }),
    }),
    {
      name: 'neotiv-room-store', // localStorage key
      partialize: (state) => ({
        // Only persist these keys (safe to cache offline)
        roomId: state.roomId,
        hotelId: state.hotelId,
        guestName: state.guestName,
        hotelName: state.hotelName,
        hotelTimezone: state.hotelTimezone,
        wifiSsid: state.wifiSsid,
        wifiPassword: state.wifiPassword,
        wifiUsername: state.wifiUsername,
        clockConfigs: state.clockConfigs,
        services: state.services,
        announcements: state.announcements,
      }),
    }
  )
);
```

### Offline Queue Store

```typescript
// src/stores/offlineQueueStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type QueueItem =
  | { type: 'chat'; payload: { roomId: string; message: string; hotelId: string }; timestamp: number }
  | { type: 'service_request'; payload: { roomId: string; serviceId: string; note: string; hotelId: string }; timestamp: number };

interface OfflineQueueState {
  queue: QueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  addToQueue: (item: Omit<QueueItem, 'timestamp'>) => void;
  setOnline: (online: boolean) => void;
  flushQueue: () => Promise<void>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: true,
      isSyncing: false,
      addToQueue: (item) =>
        set((s) => ({ queue: [...s.queue, { ...item, timestamp: Date.now() }] })),
      setOnline: (online) => {
        set({ isOnline: online });
        if (online) get().flushQueue();
      },
      flushQueue: async () => {
        const { queue } = get();
        if (queue.length === 0) return;
        set({ isSyncing: true });
        // Process each item in order, remove from queue on success
        // ...
        set({ isSyncing: false });
      },
    }),
    { name: 'neotiv-offline-queue' }
  )
);
```

---

## 🪝 Custom Hooks

### `useDpadNavigation`

```typescript
// src/lib/hooks/useDpadNavigation.ts
// Manages keyboard focus for TV remote D-pad
// Usage:
//   const { registerRef } = useDpadNavigation();
//   <div ref={registerRef('widget-clock')} data-focusable tabIndex={0}>

export function useDpadNavigation() {
  // 1. Collect all elements with data-focusable attribute
  // 2. On ArrowUp/Down/Left/Right: find spatially nearest focusable element
  //    using getBoundingClientRect() comparisons
  // 3. On Enter: trigger click on focused element
  // 4. On Escape: close any open modal, return focus to last non-modal element
}
```

### `useRealtime`

```typescript
// src/lib/hooks/useRealtime.ts
// Generic realtime subscription hook

interface UseRealtimeOptions {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;  // e.g., 'room_id=eq.abc123'
}

export function useRealtime<T>(
  table: string,
  options: UseRealtimeOptions
): T | null {
  // Subscribe to table changes matching filter
  // Return latest payload
  // Cleanup on unmount
}
```

### `useWeather`

```typescript
// src/lib/hooks/useWeather.ts
import useSWR from 'swr';

export function useWeather(city: string) {
  return useSWR(
    `/api/weather?city=${encodeURIComponent(city)}`,
    (url) => fetch(url).then((r) => r.json()),
    { refreshInterval: 10 * 60 * 1000 } // refresh every 10 min
  );
}
```

### `useHotelAuth`

```typescript
// src/lib/hooks/useHotelAuth.ts
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export function useHotelAuth() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHotelId(user?.user_metadata?.hotel_id ?? null);
      setRole(user?.user_metadata?.role ?? null);
      setStaffId(user?.id ?? null);
    });
  }, []);

  return { hotelId, role, staffId };
}
```

---

## 🔧 Supabase Client Setup

### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/server.ts`

```typescript
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export function createServerClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.3.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "swr": "^2.2.5",
    "react-qr-code": "^2.0.0",
    "next-pwa": "^5.6.0",
    "@upstash/redis": "^1.31.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## 🚫 Anti-patterns to Avoid

```typescript
// ❌ Don't fetch in useEffect on initial load (use RSC instead)
useEffect(() => {
  fetch('/api/rooms').then(...)
}, []);

// ✅ Use Server Component for initial data
// async function Page() { const rooms = await fetchRooms(); return <RoomGrid rooms={rooms} /> }

// ❌ Don't put service_role_key in client component
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ❌ Don't skip hotel_id filter
await supabase.from('rooms').select('*'); // Returns ALL rooms from ALL hotels

// ✅ Always scope by hotel
await supabase.from('rooms').select('*').eq('hotel_id', hotelId);

// ❌ Don't use any type
const handler = (payload: any) => { ... }

// ✅ Use generated DB types
import type { Tables } from '@/lib/supabase/types';
const handler = (payload: Tables<'notifications'>) => { ... }
```
