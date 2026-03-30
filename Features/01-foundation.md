# Phase 1 — Foundation

> **Prerequisite:** None. This is the starting point.  
> **Goal:** Scaffold the entire project structure, database, auth, and PWA shell. At the end of this phase, the app boots, auth redirects work, and all DB tables exist.

---

## 📋 Tasks

- [ ] Initialize Next.js 14+ project (App Router, TypeScript, Tailwind CSS)
- [ ] Install and configure all dependencies
- [ ] Set up Supabase project and run full schema migration
- [ ] Configure Supabase Auth with role-based middleware
- [ ] Set up PWA (manifest + service worker)
- [ ] Create base layout shells for all 4 panels
- [ ] Implement room TV PIN login page
- [ ] Implement staff login page (email + password)

---

## 🛠️ Project Initialization

### Commands

```bash
npx create-next-app@latest neotiv \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd neotiv

# UI + components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card badge table dialog sheet tabs

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm install framer-motion
npm install next-pwa
npm install qrcode
npm install qrcode react-qr-code
npm install @types/qrcode

# Dev dependencies
npm install -D @types/node
```

### `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_google_maps_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
```

---

## 🗄️ Supabase Schema

Run the following SQL in the Supabase SQL editor in order:

### Migration 001 — Core Tables

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Hotels
create table hotels (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  logo_url text,
  location text,
  timezone text not null default 'Asia/Jakarta',
  default_background_url text,
  wifi_ssid text,
  wifi_password text,
  wifi_username text,
  clock_timezone_1 text default 'America/New_York',
  clock_label_1 text default 'New York',
  clock_timezone_2 text default 'Europe/Paris',
  clock_label_2 text default 'France',
  clock_timezone_3 text default 'Asia/Shanghai',
  clock_label_3 text default 'China',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Room Types
create table room_types (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Rooms
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_type_id uuid references room_types(id) on delete set null,
  room_code text not null,
  is_occupied boolean default false,
  pin text,
  background_url text,
  guest_name text,
  guest_photo_url text,
  custom_welcome_message text,
  checkin_date date,
  checkout_date date,
  created_at timestamptz default now(),
  unique(hotel_id, room_code)
);

-- Staff
create table staff (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('frontoffice', 'manager')),
  name text,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean default false,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

-- Chat Messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  sender_role text not null check (sender_role in ('guest', 'frontoffice')),
  sender_name text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Alarms
create table alarms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  scheduled_time timestamptz not null,
  note text,
  is_acknowledged boolean default false,
  created_at timestamptz default now()
);

-- Promos
create table promos (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  title text not null,
  description text,
  poster_url text,
  valid_from date,
  valid_until date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Services
create table services (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  icon text,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Service Requests
create table service_requests (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Global Announcements (for marquee)
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  text text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### Migration 002 — Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table hotels enable row level security;
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table staff enable row level security;
alter table notifications enable row level security;
alter table chat_messages enable row level security;
alter table alarms enable row level security;
alter table promos enable row level security;
alter table services enable row level security;
alter table service_requests enable row level security;
alter table announcements enable row level security;

-- Helper function: get hotel_id for current auth user
create or replace function get_my_hotel_id()
returns uuid as $$
  select (raw_user_meta_data->>'hotel_id')::uuid
  from auth.users
  where id = auth.uid();
$$ language sql security definer;

-- Helper function: get role for current auth user
create or replace function get_my_role()
returns text as $$
  select raw_user_meta_data->>'role'
  from auth.users
  where id = auth.uid();
$$ language sql security definer;

-- HOTELS: superadmin can do all; managers can read/update their own
create policy "superadmin all" on hotels for all
  using (get_my_role() = 'superadmin');

create policy "manager read own hotel" on hotels for select
  using (id = get_my_hotel_id());

create policy "manager update own hotel" on hotels for update
  using (id = get_my_hotel_id());

-- ROOMS: hotel staff see only their hotel's rooms
create policy "staff see own hotel rooms" on rooms for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- STAFF: managers manage their hotel's staff; superadmin all
create policy "manager manage staff" on staff for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- NOTIFICATIONS: hotel staff see their hotel's notifications
create policy "staff notifications" on notifications for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- CHAT MESSAGES
create policy "staff chat" on chat_messages for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- ALARMS
create policy "staff alarms" on alarms for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- PROMOS
create policy "staff promos" on promos for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- SERVICES
create policy "staff services" on services for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- SERVICE REQUESTS
create policy "staff service_requests" on service_requests for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- ANNOUNCEMENTS
create policy "staff announcements" on announcements for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');

-- ROOM TYPES
create policy "staff room_types" on room_types for all
  using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
```

### Migration 003 — Seed Data (dev only)

```sql
-- Insert a sample hotel
insert into hotels (slug, name, location, timezone, wifi_ssid, wifi_password, wifi_username)
values ('amartha-hotel', 'Amartha Hotel', 'Kuta, Bali', 'Asia/Jakarta', 'HotelABC', 'stayinhereforwhile', 'Guest');

-- Insert room types
insert into room_types (hotel_id, name, description)
select id, 'Deluxe', 'Deluxe sea view room' from hotels where slug = 'amartha-hotel';

insert into room_types (hotel_id, name, description)
select id, 'Suite', 'Premium suite with private terrace' from hotels where slug = 'amartha-hotel';

-- Insert a sample room
insert into rooms (hotel_id, room_code, pin, guest_name, is_occupied)
select id, '417', '1234', 'Mr. Stephen Hawk', true from hotels where slug = 'amartha-hotel';
```

---

## 📁 Project File Structure

Generate the following file/folder structure:

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, providers)
│   ├── page.tsx                      # Root redirect (→ /admin or hotel)
│   ├── [hotelSlug]/
│   │   ├── layout.tsx                # Hotel layout shell
│   │   ├── page.tsx                  # Hotel management dashboard
│   │   ├── login/
│   │   │   └── page.tsx              # Staff login page
│   │   ├── frontoffice/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── [roomCode]/
│   │           ├── page.tsx          # Room TV welcome screen
│   │           └── main/
│   │               └── page.tsx      # Room TV main dashboard
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx
│       └── login/
│           └── page.tsx
├── components/
│   ├── tv/
│   ├── frontoffice/
│   ├── management/
│   ├── admin/
│   └── ui/                           # shadcn/ui
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── types.ts                  # Generated DB types
│   ├── hooks/
│   └── utils/
├── stores/                           # Zustand stores
│   ├── roomStore.ts
│   └── offlineQueueStore.ts
├── types/
│   └── index.ts
└── middleware.ts                     # Auth + role redirects
```

---

## 🔐 Auth Middleware

Create `src/middleware.ts`:

```typescript
// Route protection rules:
// /[hotelSlug]/dashboard/[roomCode]/* → requires room session (localStorage PIN)
// /[hotelSlug]/frontoffice/*          → requires auth, role: 'frontoffice' or 'manager', matching hotel_id
// /[hotelSlug]/*                      → requires auth, role: 'manager', matching hotel_id
// /admin/*                            → requires auth, role: 'superadmin'
//
// Redirects:
// - Unauthenticated staff → /[hotelSlug]/login
// - Wrong role → /unauthorized
// - Unauthenticated admin → /admin/login
//
// Use createServerClient from @supabase/ssr for middleware
// Read role from user.user_metadata.role
// Read hotel_id from user.user_metadata.hotel_id
// Compare hotel_id against the [hotelSlug] param by joining with hotels table
```

---

## 📱 PWA Setup

### `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-storage',
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
      }
    },
    {
      urlPattern: /\/api\/room-data/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'room-data',
        expiration: { maxEntries: 10, maxAgeSeconds: 3600 }
      }
    }
  ]
});

module.exports = withPWA({
  // your next config
});
```

### `public/manifest.json`

```json
{
  "name": "Neotiv Hotel TV",
  "short_name": "Neotiv",
  "description": "Hotel room TV dashboard",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🔑 Room TV Login Page

**File:** `src/app/[hotelSlug]/dashboard/[roomCode]/page.tsx`

This is the welcome + login screen combined. Behavior:

1. On load, check `localStorage` for an existing room session key: `neotiv_room_{hotelSlug}_{roomCode}`
2. If session exists and is valid → immediately show the welcome animation and transition to `/main`
3. If no session → show a PIN entry screen (4-digit numeric pad, D-pad navigable)
4. On PIN submit → call API route `POST /api/room/login` with `{ hotelSlug, roomCode, pin }`
5. API route verifies PIN against `rooms.pin` in Supabase (using service role key)
6. On success → store session in localStorage, redirect to welcome screen then `/main`
7. On failure → show error shake animation

**PIN entry UI:**
- Full-screen dark background with hotel logo centered
- "Room [roomCode]" label
- 4 dot indicators (filled/empty)
- Numeric keypad (1–9, 0, backspace) — all D-pad navigable
- No timeout

---

## 🎨 Global Design Tokens

In `src/app/globals.css`, define:

```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
  --font-staff: 'IBM Plex Sans', sans-serif;

  --color-teal: #14b8a6;
  --color-teal-light: #5eead4;
  --color-glass-bg: rgba(15, 23, 42, 0.55);
  --color-glass-border: rgba(255, 255, 255, 0.12);

  --tv-width: 1920px;
  --tv-height: 1080px;
}
```

Add Google Fonts import in `layout.tsx`:
- `Playfair Display` (weights: 400, 700)
- `DM Sans` (weights: 400, 500)
- `IBM Plex Sans` (weights: 400, 500, 600)

---

## ✅ Acceptance Criteria for Phase 1

- [ ] `npm run dev` starts without errors
- [ ] Supabase tables all exist and RLS is enabled
- [ ] Navigating to `/amartha-hotel/dashboard/417` shows PIN login screen
- [ ] Correct PIN (1234) stores session in localStorage and redirects
- [ ] Navigating to `/amartha-hotel/frontoffice` without auth redirects to `/amartha-hotel/login`
- [ ] Navigating to `/admin` without auth redirects to `/admin/login`
- [ ] PWA manifest is served at `/manifest.json`
- [ ] Lighthouse PWA score ≥ 80 (basic)
