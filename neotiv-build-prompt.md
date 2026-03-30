# NEOTIV — Hotel Hospitality TV Dashboard Platform
### Full Product Build Prompt — v1.0

---

## 1. Product Overview

Neotiv is a web-based hotel hospitality platform (PWA with offline mode) that powers interactive TV dashboards inside hotel rooms. It replaces traditional in-room TV systems with a rich, personalized guest experience. The platform supports multi-hotel management with role-based access across four user types.

**Core value proposition:**
- A stunning TV dashboard displayed on the guest's room TV (running in a set-top box browser)
- Real-time communication between guests and front office
- Hotel management of multiple properties from a single platform
- Fully offline-capable room dashboard (PWA) — works even with poor connectivity

---

## 2. Recommended Tech Stack

### Frontend
- **Next.js 14+** (App Router) — handles both the TV dashboard and all admin panels
- **TypeScript** — required throughout
- **Tailwind CSS** — for styling
- **Framer Motion** — for TV dashboard animations and transitions
- **next-pwa / Workbox** — for PWA and offline support
- **Zustand** — lightweight global state for the TV dashboard
- **React Query (TanStack Query)** — data fetching and caching

### Backend
- **Supabase** — PostgreSQL database, Auth, Realtime, and Storage
- **Supabase Realtime** — live notifications, chat, and alarm sync
- **Supabase Storage** — guest photos, backgrounds, promo posters
- **Next.js API Routes** — for any custom server logic

### External Integrations
- **OpenWeatherMap API** — weather widget
- **Google Maps Embed API** — location preview widget
- **AviationStack (or similar)** — flight schedule widget
- **YouTube IFrame API** — fullscreen YouTube embed
- **qrcode.react** — WiFi QR code generation

### Deployment
- **Vercel** — Next.js hosting
- Custom subdomain routing: each hotel gets `/{hotelSlug}/*` routes

---

## 3. URL & Route Architecture

| Route | Description |
|-------|-------------|
| `/{hotelSlug}/dashboard/{roomId}` | Guest TV dashboard (welcome screen → main dashboard) |
| `/{hotelSlug}/frontoffice` | Front office staff panel |
| `/{hotelSlug}` | Hotel management panel |
| `/admin` | Super admin panel |

---

## 4. User Roles & Permissions

### 4.1 Guest (Room TV)
- **Access:** `/{hotelSlug}/dashboard/{roomId}`
- Authentication via room PIN (4–6 digits) — no session timeout
- No self-registration — credentials managed by front office
- **D-pad navigation only** (arrow keys + enter) — no mouse/touch required
- Full offline support via PWA service worker

### 4.2 Front Office Staff
- **Access:** `/{hotelSlug}/frontoffice`
- Email + password login (accounts created by hotel management)
- Manages rooms within their assigned hotel only

### 4.3 Hotel Management
- **Access:** `/{hotelSlug}`
- Email + password login
- Full control over their own hotel(s), including staff and settings

### 4.4 Super Admin
- **Access:** `/admin`
- Full platform control — all hotels, all users

---

## 5. Database Schema (Supabase / PostgreSQL)

Use UUID primary keys everywhere. Enable Row Level Security (RLS) on all tables.

| Table | Key Fields |
|-------|-----------|
| `hotels` | id, name, slug (unique), logo_url, bg_image_url, wifi_ssid, wifi_password, wifi_username, location_lat, location_lng, address, airport_iata |
| `hotel_services` | id, hotel_id, name, icon, is_active, sort_order |
| `room_types` | id, hotel_id, name, description |
| `rooms` | id, hotel_id, room_type_id, room_number, floor, status (vacant/occupied), bg_image_url |
| `guests` | id, room_id, hotel_id, name, photo_url, check_in, check_out, pin_hash |
| `staff` | id, hotel_id, email, name, role (frontoffice/manager) |
| `notifications` | id, hotel_id, room_id (null = broadcast), title, body, sent_at, read_at |
| `chat_messages` | id, hotel_id, room_id, sender_role (guest/staff), message, created_at |
| `alarms` | id, hotel_id, room_id, alarm_time, label, acknowledged_at |
| `promos` | id, hotel_id, title, description, image_url, valid_from, valid_to, is_active |
| `service_requests` | id, hotel_id, room_id, service_id, note, status (pending/done) |
| `timezones` | id, hotel_id, label, tz_string, sort_order (max 3 per hotel) |
| `ticker_texts` | id, hotel_id, content, is_active |

---

## 6. Room TV Dashboard — Detailed Spec

### 6.1 Welcome / Splash Screen

Shown automatically on TV startup or first session load.

- Full-screen background image (per room or hotel default)
- Centered **frosted-glass card** — `backdrop-filter: blur(10px)`, semi-transparent dark bg
- Guest circular avatar photo slightly overflowing card top edge
- Hotel name and location: *"Welcome in Amartha Hotel, Bali!"*
- Guest name in bold: *"Mr. Stephen Hawk"*
- Horizontal divider line
- Welcome message body (configurable by front office)
- Room number top-right corner in large white text (`Room` label small, number large — see Figma)
- Auto-transitions to main dashboard after **8 seconds** or on any d-pad keypress

### 6.2 Main Dashboard Layout

Single-screen layout — **no scrolling**. All widgets visible simultaneously. 16:9 aspect ratio. Dark semi-transparent widget cards over full-screen background image.

**Layout zones (reference Figma screenshots):**

```
┌─────────────────┬──────────────────────────────┬───────────────────┐
│  Analog Clocks  │    Digital Clock + Weather   │ Guest Info + WiFi │
├─────────────────┼──────────────────────────────┼───────────────────┤
│ Flight Schedule │     (background visible)     │   Notification    │
├─────────────────┼──────────────────────────────┼───────────────────┤
│  Hotel Deals    │ Hotel Service | Hotel Info   │  Map  │ Media Apps│
└─────────────────┴──────────────────────────────┴───────────────────┘
│          Scrolling Ticker / Marquee Announcement Bar               │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 Widget Specifications

#### Analog Clocks (3 Timezones)
- Three SVG analog clocks side-by-side, ticking in real-time
- Each has a configurable city label below (e.g. New York, France, China)
- White minimalist clock face matching Figma design

#### Digital Clock + Weather
- Large digital time: current local time at hotel (e.g. `09.17 AM`)
- Full date below (e.g. `Sunday, 16 January 2026`)
- Top of widget: weather icon + temperature + city (e.g. `24°C • Kuta, Bali`)
- Data from OpenWeatherMap API, refreshed every 10 minutes
- Cached in localStorage for offline fallback

#### Guest Info Card (Top-Right)
- `Hello` label + guest first name in pill/badge + circular avatar
- Room number in large text (e.g. `Room 417`)

#### WiFi QR Access Card
- WiFi icon + `Wifi Access` label
- QR code generated from: `WIFI:S:{SSID};T:WPA;P:{password};;`
- SSID, Username, Password shown as readable text beside QR

#### Flight Schedule Widget
- Tabbed — airport name as label (e.g. `I Gusti Ngurah Rai`)
- Table: Flight, Time, Destination, Gate, Remarks
- Remarks color-coded:
  - 🔴 `LAST CALL`, `CLOSED`
  - 🟢 `ON SCHEDULE`, `GATE OPEN`, `CHECK-IN`
  - 🟠 `DELAY`
- Refreshed every 5 minutes, cached offline

#### Notification Card
- Most recent notification from front office
- Red `Notification` badge + timestamp
- Bold title + body text
- D-pad navigate between multiple notifications

#### Hotel Deals Carousel
- `Hotel Deals` header with arrow to view all
- Horizontally scrollable promo poster thumbnails
- On select: fullscreen overlay with poster image + title + description

#### Hotel Service Widget
- `Hotel Service` label + row of service icons
- Icons for: food, dining, vehicle, bike, spa, laundry (show active services only)
- On select: service request modal — guest submits request to front office

#### Hotel Info Widget
- Hotel name + background hotel photo
- On select: full hotel details overlay (address, amenities, description)

#### Map Widget
- Google Maps embed showing hotel pin location
- Static embed cached for offline
- On select: expand to fullscreen map

#### Media Apps Grid (Bottom-Right)
| App | Behavior |
|-----|----------|
| YouTube | Embedded fullscreen YouTube player (IFrame API, same page) |
| Netflix | Opens netflix.com |
| Disney+ | Opens disneyplus.com |
| Prime Video | Opens primevideo.com |
| Spotify | Opens spotify.com |
| TikTok | Opens tiktok.com |
| TV | Triggers set-top box TV mode switch (postMessage or keyboard event) |
| Alarm | Opens alarm input modal |
| Chat | Opens real-time chat panel with front office |

#### Alarm Modal
- Guest inputs: time + optional label
- Saved to Supabase — appears in front office alarm schedule
- Front office is responsible for calling the room at that time

#### Chat Panel
- Fullscreen overlay or side panel
- Real-time via Supabase Realtime
- Guest messages right, front office left
- D-pad navigable with on-screen keyboard
- Unread badge on chat icon

#### Bottom Ticker / Marquee
- Smooth CSS horizontal scroll of hotel announcements
- Content managed by front office
- Loops continuously

### 6.4 D-Pad Navigation

The entire room dashboard must be operable with a TV remote d-pad only.

- Custom focus management system using React context
- All widgets and buttons focusable via arrow keys
- Focused element: visible highlight ring (white or accent color)
- `Enter`: activates focused element
- `Back/Escape`: closes modals, returns to main dashboard
- Use `tabIndex` and `onKeyDown` handlers throughout
- No cursor-dependent interactions

### 6.5 Offline / PWA Mode

- Register service worker via `next-pwa`
- Cache all dashboard assets, fonts, icons on first load
- Weather + flight data: `StaleWhileRevalidate`, 24h max age
- Images: `CacheFirst`, 7 day max age
- Sync notifications and chat on reconnect
- Login state in IndexedDB — no expiry, survives reload
- Subtle `Offline Mode` banner when connection is lost

---

## 7. Front Office Panel — Detailed Spec

**URL:** `/{hotelSlug}/frontoffice`

### 7.1 Authentication
- Email + password (account created by hotel management)
- Supabase Auth with JWT in cookies

### 7.2 Dashboard Overview
- Summary cards: total rooms, occupied rooms, pending requests, unread messages
- Sidebar navigation

### 7.3 Room Management
- List all rooms with status badges (Occupied / Vacant)
- Toggle room status
- Click room → see: guest info, notifications, chat, alarms
- Set per-room: guest name, photo, background image
- Set global defaults: background + welcome message

### 7.4 Notifications
- Send to specific room or broadcast to all rooms
- Form: title + body text
- View notification history
- Receive guest service requests (room, service type, note)

### 7.5 Chat
- Inbox: list of rooms with unread counts
- Click room → real-time chat thread
- Send/receive text messages

### 7.6 Alarm Schedule
- All guest alarms sorted by time
- Shows: room number, guest name, alarm time, label
- Mark as `acknowledged` after calling the room

### 7.7 Promo / Deals Management
- Upload poster image (Supabase Storage)
- Title + description + validity dates + active toggle
- Promos appear in room TV deals carousel

### 7.8 Ticker Management
- Edit the scrolling announcement text shown across all room dashboards

---

## 8. Hotel Management Panel — Detailed Spec

**URL:** `/{hotelSlug}`

### 8.1 Hotel Setup Wizard (First-Time)
1. Hotel name, slug (custom URL), logo, address, location pin
2. WiFi credentials (SSID, username, password)
3. Select active services (food, spa, laundry, vehicle, etc.)
4. Configure 3 timezone labels for analog clocks
5. Set default background image and welcome message
6. Set airport IATA code for flight schedule widget

### 8.2 Multiple Hotel Management
- Hotel owners can manage multiple hotels
- Hotel switcher in sidebar
- Each hotel is fully independent

### 8.3 Room & Room Type Management
- Create room types (Standard, Deluxe, Suite, etc.)
- Add rooms: number, floor, type, custom background
- Bulk-add rooms by floor range
- Delete rooms (vacant only)

### 8.4 Staff Management
- Invite front office staff by email
- Staff receives invite link to set password
- List, deactivate, remove staff

### 8.5 Guest Check-in / Check-out
- Assign guest to room: name, photo, check-in/check-out dates
- Generate room PIN for TV login
- Check-out: marks room vacant, clears guest data

### 8.6 All Front Office Features
Hotel management has all front office capabilities plus the above.

---

## 9. Super Admin Panel — Detailed Spec

**URL:** `/admin`

- View all registered hotels with status
- Create new hotel accounts + assign hotel manager
- Suspend or delete hotels
- Platform-wide usage statistics
- Platform-level announcements
- No access to individual room/guest data by default

---

## 10. UI/UX Design Guidelines

### Room TV Dashboard
- **Design reference:** See attached Figma screenshots
- **Background:** Full-screen photo behind all widgets
- **Cards:** Frosted glass — `backdrop-filter: blur(10px)` + `background: rgba(255,255,255,0.1)`
- **Typography:** Inter or similar clean sans-serif
- **Minimum text size:** 18px (optimized for TV viewing distance)
- **Card radius:** 12–16px rounded corners
- **No scrolling** on main dashboard — single 16:9 viewport

### Admin Panels
- Clean, professional SaaS aesthetic
- Sidebar navigation
- Fully responsive (desktop + tablet)
- Light mode default, optional dark mode

---

## 11. Real-Time & Sync Architecture

- **Supabase Realtime channels** for: chat, notifications, alarms, room status
- Room dashboard subscribes to: `hotel:{hotelId}:room:{roomId}`
- Front office subscribes to: `hotel:{hotelId}`
- On reconnect after offline: re-sync from `created_at > last_seen_at`
- **Optimistic UI** for chat messages — show instantly, confirm on server

---

## 12. PWA & Offline Configuration

- `next.config.js`: configure `next-pwa` with `runtimeCaching` rules
- `manifest.json`: `name: "Neotiv Room"`, `display: "fullscreen"`, `orientation: "landscape"`
- Handle `beforeinstallprompt` for set-top box Chrome auto-install
- Offline fallback page showing cached dashboard state

---

## 13. Authentication Flow

### Guest (Room TV)
1. Visit `/{hotelSlug}/dashboard/{roomId}`
2. If no session → PIN login screen
3. On success → store session in IndexedDB (no expiry)
4. Logout: manual only (or remote by front office)

### Staff / Management
1. Standard Supabase Auth (email + password)
2. JWT in httpOnly cookies via Supabase SSR helper
3. Role checked from `staff` / `hotels` table on each request
4. Middleware protects all `/frontoffice` and management routes

---

## 14. Suggested Project File Structure

```
/app
  /[hotelSlug]
    /dashboard/[roomId]/page.tsx     ← Guest TV dashboard
    /frontoffice/page.tsx            ← Front office panel
    /page.tsx                        ← Hotel management panel
  /admin/page.tsx                    ← Super admin
  /api/...                           ← API routes
/components
  /tv/                               ← TV dashboard widgets
  /frontoffice/                      ← Front office UI
  /management/                       ← Hotel management UI
  /shared/                           ← Shared UI components
/lib
  /supabase/                         ← Supabase client + queries
  /hooks/                            ← Custom React hooks
  /store/                            ← Zustand stores
/public
  /icons/                            ← PWA icons
  manifest.json                      ← PWA manifest
```

---

## 15. Key Behaviors & Edge Cases

- **Vacant room:** TV shows hotel branding only — no guest info until check-in
- **Multi-hotel isolation:** RLS enforces staff see only their hotel's data
- **Hotel slug format:** URL-safe, lowercase, hyphens only, 3–30 characters
- **Background priority:** Per-room override > hotel default
- **Broadcast notification:** `room_id = null` sends to all rooms in hotel
- **All timestamps:** Store UTC, display in hotel's local timezone
- **Service request flow:** Guest submits → front office inbox → staff marks resolved
- **YouTube:** Embedded IFrame same-page — no new tab
- **Streaming apps:** Open in new tab or trigger set-top box app
- **TV mode:** Send `postMessage` or keyboard event for set-top box HDMI switch

---

## 16. Build Phases (Recommended Order)

| Phase | Scope |
|-------|-------|
| **1 — Foundation** | Next.js + Supabase setup, DB schema, RLS, auth middleware, URL routing |
| **2 — TV Dashboard** | Build each widget individually, then assemble into single-screen layout |
| **3 — Front Office** | CRUD for rooms, notifications, chat, alarms, promos |
| **4 — Hotel Management** | Setup wizard, room types, staff management, multi-hotel |
| **5 — Super Admin** | Platform overview and hotel account management |
| **6 — Polish** | Offline sync, D-pad nav, animations, error states, loading states |

> **How to use with AI coding assistants:** Provide this document as context and reference section numbers in your prompt. Example: *"Using the Neotiv spec, implement Section 6.3 — the Analog Clocks widget."*

---

*Neotiv — Hotel TV Dashboard Platform | Build Prompt v1.0*
