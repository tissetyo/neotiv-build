# ⚙️ Neotiv — Backend Architecture & Flow

> This document covers backend architecture, all API routes, data flows, authentication, caching, and infrastructure decisions.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  TV Browser (set-top box)  │  Staff Browser  │  Admin       │
└──────────────┬──────────────────────┬─────────────────┬─────┘
               │                      │                 │
               ▼                      ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Server       │  │ API Routes   │  │ Middleware        │  │
│  │ Components   │  │ /api/*       │  │ Auth + Role Guard │  │
│  │ (SSR/SSG)    │  │              │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
└─────────┼─────────────────┼───────────────────────────────-─┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Auth     │  │ Database │  │ Realtime │  │ Storage   │  │
│  │ (JWT)    │  │ (PgSQL)  │  │ (WS)     │  │ (S3-like) │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  OpenWeatherMap  │  AviationStack  │  Google Maps  │ Redis  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Stack Decisions

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Multi-tenant routing, SSR, API routes, middleware — all in one |
| Language | TypeScript (strict) | Type safety, Supabase auto-generated types |
| Database | Supabase PostgreSQL | RLS, Realtime, Auth, Storage — one platform |
| Auth | Supabase Auth | JWT-based, user metadata for roles, invite-by-email |
| Realtime | Supabase Realtime (WebSocket) | Push notifications, chat, alarm alerts |
| File Storage | Supabase Storage | Integrated with RLS policies |
| Caching | Upstash Redis | Rate-limit external API calls; free tier scalable |
| PWA | next-pwa | Service worker generation, offline caching |
| State (client) | Zustand | Lightweight, works offline, no boilerplate |

---

## 🔐 Authentication Architecture

### Staff Auth Flow

```
1. Staff navigates to /[hotelSlug]/login
2. Submits email + password
3. → supabase.auth.signInWithPassword({ email, password })
4. Supabase returns JWT + user object
5. JWT stored in Supabase-managed cookie (via @supabase/ssr)
6. middleware.ts reads cookie on every request:
   a. Decode JWT → read user_metadata.role + user_metadata.hotel_id
   b. Compare hotel_id against hotels.slug in URL param
   c. If mismatch or wrong role → redirect to /[hotelSlug]/login
7. Server Components use createServerClient() to read auth from cookie
```

### Room TV Auth Flow (PIN-based)

```
1. TV browser navigates to /[hotelSlug]/dashboard/[roomCode]
2. Check localStorage for key: neotiv_room_{hotelSlug}_{roomCode}
3. If session exists → skip to Welcome Screen
4. If no session → show PIN entry screen
5. User enters 4-digit PIN
6. POST /api/room/login { hotelSlug, roomCode, pin }
7. API route (server-side, service_role_key):
   a. Look up rooms WHERE hotel_id = (hotels WHERE slug = hotelSlug).id
      AND room_code = roomCode
   b. Compare pin (bcrypt compare or plain text check)
   c. Return { roomId, hotelId, guestName, ... } if valid
8. Client stores session in localStorage (no expiry)
9. Redirect to /welcome → /main
```

### Role Hierarchy

```
superadmin
  └── full platform access (/admin/*)
  └── can create hotels, invite managers

manager
  └── hotel management (/[hotelSlug]/*)
  └── can invite frontoffice staff
  └── includes all frontoffice permissions

frontoffice
  └── operations panel (/[hotelSlug]/frontoffice/*)
  └── cannot access hotel settings or staff management
```

---

## 🛣️ API Routes Reference

All routes live in `src/app/api/`. All routes validate auth before processing.

### Room Auth

#### `POST /api/room/login`
**Purpose:** Verify room PIN and return session data  
**Auth:** None (public endpoint)  
**Uses:** `SUPABASE_SERVICE_ROLE_KEY`

```typescript
// Request body
{ hotelSlug: string, roomCode: string, pin: string }

// Success response
{
  roomId: string,
  hotelId: string,
  roomCode: string,
  guestName: string | null,
  guestPhotoUrl: string | null,
  backgroundUrl: string | null,
  hotelName: string,
  hotelTimezone: string,
  wifiSsid: string,
  wifiPassword: string,
  wifiUsername: string,
}

// Error response
{ error: 'Invalid PIN' | 'Room not found' }
```

#### `GET /api/room/[roomId]/dashboard-data`
**Purpose:** Fetch all data needed for TV dashboard widgets  
**Auth:** Room session token in header  
**Returns:** Merged hotel + room + services + promos + latest notification + announcements

---

### Weather & External APIs

#### `GET /api/weather?city={city}`
**Purpose:** Proxy OpenWeatherMap, cached in Redis 10 min  
**Auth:** None (public)

```typescript
// Response
{ temp: number, icon: string, description: string, city: string }
```

#### `GET /api/flights?airport={iata}`
**Purpose:** Proxy AviationStack, cached in Redis 5 min  
**Auth:** None (public)

```typescript
// Response
{
  flights: Array<{
    flightNumber: string,
    time: string,        // "19:15"
    destination: string,
    gate: string | null,
    status: 'on_schedule' | 'delay' | 'cancelled' | 'gate_open' | 'last_call' | 'check_in'
  }>
}
```

---

### Hotel Management

#### `POST /api/hotel/[hotelSlug]/invite-staff`
**Auth:** Manager role, matching hotel  
**Uses:** `SUPABASE_SERVICE_ROLE_KEY`

```typescript
// Request body
{ email: string, name: string, role: 'frontoffice' | 'manager' }

// Action
// 1. supabase.auth.admin.inviteUserByEmail(email, { data: { role, hotel_id, name } })
// 2. insert into staff table
```

#### `PATCH /api/hotel/[hotelSlug]/staff/[staffId]/role`
**Auth:** Manager role  

```typescript
// Request body
{ role: 'frontoffice' | 'manager' }

// Action: update staff.role + update auth user metadata
```

#### `PATCH /api/hotel/[hotelSlug]/staff/[staffId]/status`
**Auth:** Manager role  

```typescript
// Request body
{ is_active: boolean }

// Action:
// if false: supabase.auth.admin.updateUserById(userId, { ban_duration: '876600h' })
// if true:  supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })
```

---

### Super Admin

#### `POST /api/admin/hotels`
**Auth:** Superadmin role

```typescript
// Request body
{ name: string, slug: string, location: string, timezone: string }

// Action:
// 1. Insert hotel
// 2. Insert default services (Room Service, Laundry, Spa, Car, Bike, Restaurant)
// 3. Log activity: hotel.created
```

#### `PATCH /api/admin/hotels/[hotelId]/status`
**Auth:** Superadmin role

```typescript
// Request body
{ is_active: boolean }

// Action:
// 1. Update hotels.is_active
// 2. If deactivating: ban all staff for this hotel
// 3. Log activity
```

#### `POST /api/admin/accounts`
**Auth:** Superadmin role

```typescript
// Request body
{ email: string, name: string, role: string, hotel_id: string }

// Action: invite user + create staff record
```

#### `PATCH /api/admin/accounts/[userId]/suspend`
**Auth:** Superadmin role

```typescript
// Request body
{ suspended: boolean }
// Action: ban_duration toggle
```

---

### File Upload

#### `POST /api/upload/hotel-background`
**Auth:** Manager or Superadmin  

```typescript
// Multipart form: file
// Action:
// 1. Validate file type (jpg, png, webp only)
// 2. Validate file size (max 5MB)
// 3. Upload to Supabase Storage: hotel-assets/{hotel_id}/backgrounds/{uuid}.webp
// 4. Return public URL
```

#### `POST /api/upload/guest-photo`
**Auth:** Front office or Manager  

```typescript
// Multipart form: file, room_id
// Upload to: room-assets/{hotel_id}/{room_id}/guest-photo.webp
// Update rooms.guest_photo_url
// Return signed URL (90-day expiry, regenerated on TV login)
```

#### `POST /api/upload/promo-poster`
**Auth:** Front office or Manager  

```typescript
// Upload to: promos/{hotel_id}/{promo_id}/poster.webp
// Return public URL
```

---

## 🔄 Data Flow Diagrams

### Notification Flow (Front Office → Room TV)

```
Front Office                Supabase                  Room TV
     │                         │                         │
     │ Insert notification      │                         │
     │─────────────────────────►│                         │
     │                         │ Realtime broadcast       │
     │                         │────────────────────────► │
     │                         │                         │ Update NotificationCard
     │                         │                         │ Show new notification
```

### Chat Flow (Bidirectional)

```
Room TV                     Supabase                 Front Office
   │                           │                         │
   │ Insert chat_message        │                         │
   │ (sender_role: 'guest')    │                         │
   │──────────────────────────►│                         │
   │                           │ Realtime push            │
   │                           │────────────────────────► │
   │                           │                         │ Append to chat window
   │                           │                         │ Update unread badge
   │                           │                         │
   │                           │ Insert chat_message      │
   │                           │ (sender_role: 'frontoffice')
   │                           │◄────────────────────────│
   │ Realtime push             │                         │
   │◄──────────────────────────│                         │
   │ Append to chat modal      │                         │
```

### Offline Service Request Flow

```
Room TV (Offline)                              Room TV (Online)
       │                                              │
       │ Submit service request                       │
       │ ↓ navigator.onLine = false                  │
       │ Push to localStorage queue                  │
       │ Show "Queued" UI feedback                   │
       │                                              │
       │ ← Wi-Fi reconnects                          │
       │                                             │
       │ online event fires                          │
       │ Flush queue:                                │
       │ → POST service_requests to Supabase         │
       │ → Show "Synced" confirmation                │
```

---

## 🗃️ Server-Side Data Fetching Patterns

### Pattern 1: Server Component with Supabase

```typescript
// src/app/[hotelSlug]/frontoffice/rooms/page.tsx
import { createServerClient } from '@/lib/supabase/server';

export default async function RoomsPage({ params }: { params: { hotelSlug: string } }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const hotelId = user?.user_metadata?.hotel_id as string;

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*, room_types(name)')
    .eq('hotel_id', hotelId)
    .order('room_code');

  if (error) throw new Error('Failed to load rooms');
  return <RoomsList rooms={rooms} />;
}
```

### Pattern 2: Client Component with SWR (realtime-adjacent data)

```typescript
'use client';
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase/client';

const fetcher = async (hotelId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, services(name, icon), rooms(room_code)')
    .eq('hotel_id', hotelId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export function ServiceRequestQueue({ hotelId }: { hotelId: string }) {
  const { data, isLoading, mutate } = useSWR(hotelId, fetcher, { refreshInterval: 30000 });
  // ...
}
```

### Pattern 3: Realtime Subscription

```typescript
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export function useRealtimeNotifications(roomId: string) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setNotification(payload.new as Notification);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  return notification;
}
```

---

## 🧩 Middleware Logic

**File:** `src/middleware.ts`

```typescript
// Executed on every request matching the config matcher
// Matcher: ['/((?!_next/static|_next/image|favicon.ico|api/room).*)']
//
// Logic:
// 1. Create Supabase server client from request cookies
// 2. Call supabase.auth.getUser() to refresh session
// 3. Extract pathname
// 4. Route rules:
//
//    /admin/login → allow (public)
//    /admin/*     → require role: 'superadmin' → else redirect /admin/login
//
//    /[slug]/login → allow (public)
//    /[slug]/frontoffice/* → require auth
//                          → require role: 'frontoffice' OR 'manager'
//                          → require hotel_id matches slug
//                          → else redirect /[slug]/login
//
//    /[slug]/*    → require auth
//                → require role: 'manager'
//                → require hotel_id matches slug
//                → else redirect /[slug]/login
//
//    /[slug]/dashboard/* → skip auth (handled by PIN + localStorage)
//
// 5. hotel_id vs slug matching:
//    Query: SELECT id FROM hotels WHERE slug = slugParam LIMIT 1
//    Compare against user.user_metadata.hotel_id
//    If mismatch → redirect to /[slug]/login with ?error=wrong_hotel
```

---

## ⚡ Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|---|---|---|---|
| Weather data | Upstash Redis | 10 min | TTL expiry |
| Flight data | Upstash Redis | 5 min | TTL expiry |
| Room dashboard data | Zustand + Service Worker | Session / 1h | Manual refresh or realtime push |
| Hotel backgrounds | Service Worker (StaleWhileRevalidate) | 24h | New upload |
| Guest photos | Service Worker (StaleWhileRevalidate) | 24h | New upload |
| Staff queries | SWR in-memory | 30s–5min | `mutate()` on change |

---

## 📦 Environment Variables Reference

```bash
# Public (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anon/public key
NEXT_PUBLIC_OPENWEATHER_API_KEY=     # OpenWeatherMap
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=   # Google Maps Embed

# Private (server only)
SUPABASE_SERVICE_ROLE_KEY=           # Supabase admin operations
AVIATIONSTACK_API_KEY=               # Flight data
UPSTASH_REDIS_REST_URL=              # Upstash Redis endpoint
UPSTASH_REDIS_REST_TOKEN=            # Upstash Redis token
```
