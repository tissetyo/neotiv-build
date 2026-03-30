# ✅ Neotiv — Master Task List

> This is the single source of truth for all development tasks.  
> Update checkboxes as tasks are completed. Use this to track progress across all phases.

---

## 📊 Progress Overview

| Phase | Tasks | Status |
|---|---|---|
| Phase 1 — Foundation | 12 tasks | 🔴 Not Started |
| Phase 2 — TV Dashboard | 22 tasks | 🔴 Not Started |
| Phase 3 — Front Office | 20 tasks | 🔴 Not Started |
| Phase 4 — Hotel Management | 18 tasks | 🟢 Completed |
| Phase 5 — Super Admin | 21 tasks | 🟢 Completed |
| Phase 6 — Polish & Scale | 20 tasks | 🟢 Completed |

---

## 🏗️ Phase 1 — Foundation

### Project Setup
- [ ] P1-01 Initialize Next.js 14 project with TypeScript, Tailwind, App Router
- [ ] P1-02 Install all dependencies (Supabase, Zustand, Framer Motion, next-pwa, qrcode, etc.)
- [ ] P1-03 Configure `next.config.js` with next-pwa settings
- [ ] P1-04 Set up `.env.local` with all required environment variables

### Database
- [ ] P1-05 Create Supabase project
- [ ] P1-06 Run Migration 001 — create all 11 core tables
- [ ] P1-07 Run Migration 002 — enable RLS and create all policies + helper functions
- [ ] P1-08 Run Migration 003 — seed development data (sample hotel, room type, room)
- [ ] P1-09 Enable Realtime on: notifications, chat_messages, alarms, service_requests, rooms
- [ ] P1-10 Generate TypeScript types from Supabase schema

### Auth & Routing
- [ ] P1-11 Create `src/middleware.ts` with full role + hotel_id route guards
- [ ] P1-12 Create Supabase server client (`server.ts`) and browser client (`client.ts`)

### PWA
- [ ] P1-13 Create `public/manifest.json`
- [ ] P1-14 Configure service worker caching strategies

### Base Layouts
- [ ] P1-15 Create root `app/layout.tsx` with Google Fonts import + global CSS tokens
- [ ] P1-16 Create hotel shell layout `app/[hotelSlug]/layout.tsx`
- [ ] P1-17 Create front office layout with sidebar + navbar
- [ ] P1-18 Create admin layout with sidebar + navbar

### Room TV Login
- [ ] P1-19 Create `POST /api/room/login` API route (PIN verification, server-side)
- [ ] P1-20 Create TV PIN entry screen with D-pad navigable numpad
- [ ] P1-21 Implement localStorage session storage on successful PIN login
- [ ] P1-22 Create staff login page (email + password, Supabase Auth)

**Phase 1 Acceptance:**
- [ ] `npm run dev` starts without errors
- [ ] Navigating to `/amartha-hotel/dashboard/417` shows PIN screen
- [ ] Correct PIN redirects to welcome screen
- [ ] Navigating to `/amartha-hotel/frontoffice` without auth redirects to login
- [ ] Navigating to `/admin` without auth redirects to `/admin/login`
- [ ] PWA manifest served at `/manifest.json`

---

## 📺 Phase 2 — Room TV Dashboard

### Welcome Screen
- [ ] P2-01 Create welcome/splash screen with frosted glass card
- [ ] P2-02 Load guest data (name, photo, hotel name) on welcome screen
- [ ] P2-03 Animate card entry (Framer Motion: fade + slide-up)
- [ ] P2-04 Implement 5-second countdown with progress bar
- [ ] P2-05 D-pad Enter key skips countdown and navigates to main dashboard

### Main Dashboard Layout
- [ ] P2-06 Create fixed 1920×1080 grid layout (`main/page.tsx`)
- [ ] P2-07 Load all widget data server-side + hydrate Zustand store
- [ ] P2-08 Implement staggered widget mount animation

### Widgets
- [ ] P2-09 Build `AnalogClock` — SVG, ticking, timezone-aware, 3 instances
- [ ] P2-10 Build `DigitalClock` — large display, hotel timezone, date
- [ ] P2-11 Build `WeatherWidget` — API fetch + emoji icon + temperature
- [ ] P2-12 Build `GuestCard` — guest name, photo, room number
- [ ] P2-13 Build `WifiCard` — QR code generation, SSID/password display
- [ ] P2-14 Build `FlightSchedule` — table with color-coded status remarks
- [ ] P2-15 Build `NotificationCard` — live via Supabase Realtime
- [ ] P2-16 Build `HotelDeals` — scrollable promo cards + fullscreen modal
- [ ] P2-17 Build `HotelService` — service icon grid + request modal
- [ ] P2-18 Build `MapWidget` — Google Maps embed (mini + fullscreen)
- [ ] P2-19 Build `AppGrid` — app tiles with fullscreen iframe launcher
- [ ] P2-20 Build `MarqueeBar` — infinite scroll hotel announcements

### Modals
- [ ] P2-21 Build `ChatModal` — realtime bidirectional chat
- [ ] P2-22 Build `AlarmModal` — time picker, submit to alarms table

### Navigation & Offline
- [ ] P2-23 Implement `useDpadNavigation` hook (arrow keys + Enter + Escape)
- [ ] P2-24 Implement `useOfflineQueue` hook (localStorage queue + reconnect flush)
- [ ] P2-25 Implement `useRealtime` hook (generic subscription wrapper)
- [ ] P2-26 Add skeleton states for all widgets
- [ ] P2-27 Add error boundary wrapping for all widgets
- [ ] P2-28 Build `ConnectionStatus` indicator component

**Phase 2 Acceptance:**
- [ ] All 12 widgets render correctly at 1920×1080
- [ ] D-pad arrow keys navigate between all widgets
- [ ] Notifications appear live when inserted in Supabase
- [ ] Chat works bidirectionally in realtime
- [ ] Alarm creates record in DB
- [ ] Offline: dashboard renders from cache when Wi-Fi disconnected
- [ ] Service request queues offline and syncs on reconnect

---

## 🖥️ Phase 3 — Front Office Panel

### Auth
- [ ] P3-01 Create staff login page with email/password form
- [ ] P3-02 Handle role redirect: manager → hotel panel, frontoffice → frontoffice panel
- [ ] P3-03 Add logout button in sidebar

### Room Management
- [ ] P3-04 Build `RoomGrid` — room cards with occupancy status + search/filter
- [ ] P3-05 Build `RoomCard` — room info, status badge, click interaction
- [ ] P3-06 Build `RoomSidePanel` — sheet panel with room details + quick links
- [ ] P3-07 Implement occupancy toggle — updates DB + local state
- [ ] P3-08 Build `GuestPersonalizationForm` — name, photo upload, background, dates
- [ ] P3-09 Build `BackgroundLibrary` — thumbnail picker from Supabase Storage
- [ ] P3-10 Implement bulk background apply with confirmation dialog

### Notifications
- [ ] P3-11 Build `NotificationComposer` — target (all/room), title, body, send
- [ ] P3-12 Build `NotificationHistory` — table of sent notifications with status

### Alarms
- [ ] P3-13 Build `AlarmList` — sorted by time, highlight upcoming, acknowledge action
- [ ] P3-14 Add realtime toast when new alarm arrives

### Chat
- [ ] P3-15 Build `ChatPanel` — room list sidebar + chat window
- [ ] P3-16 Implement realtime message feed (Supabase Realtime)
- [ ] P3-17 Implement unread badge count per room
- [ ] P3-18 Mark messages as read when room is opened

### Service Requests
- [ ] P3-19 Build `ServiceRequestQueue` — table with status tabs + inline status update
- [ ] P3-20 Add realtime toast when new service request arrives

### Promos
- [ ] P3-21 Build `PromoGrid` — poster cards + add/edit/delete actions
- [ ] P3-22 Implement promo poster upload to Supabase Storage

**Phase 3 Acceptance:**
- [ ] Staff login works, redirects to correct panel by role
- [ ] Room grid shows all rooms for the hotel (not other hotels)
- [ ] Occupancy toggle reflects on UI immediately
- [ ] Guest photo saved to Storage, URL updated in rooms table, TV reflects it
- [ ] Notification sent to room appears on TV in realtime
- [ ] Front office reply appears in TV chat modal in realtime
- [ ] Service request submitted from TV appears in queue
- [ ] Promo upload appears in TV hotel deals widget

---

## 🏢 Phase 4 — Hotel Management Panel

### Hotel Settings
- [x] P4-01 Build hotel settings page with 5 tabs (General, Appearance, WiFi, Clocks, Announcements)
- [x] P4-02 Implement General tab — name, location, timezone, logo, airport code
- [x] P4-03 Implement Appearance tab — default background upload + library
- [x] P4-04 Implement WiFi tab — SSID, username, password + live QR preview
- [x] P4-05 Implement Clocks tab — 3 timezone selectors + labels
- [x] P4-06 Implement Announcements tab — add/toggle/delete marquee text

### Room Management
- [x] P4-07 Build room management table — sortable, filterable
- [x] P4-08 Implement add room dialog — code, type, PIN + auto-generate
- [x] P4-09 Implement edit room — same form pre-filled
- [x] P4-10 Implement delete room — confirm dialog
- [x] P4-11 Implement bulk actions — assign type, reset guest info

### Room Types
- [x] P4-12 Build room type table with inline edit
- [x] P4-13 Implement add/delete room type (delete blocked if rooms assigned)

### Staff Management
- [x] P4-14 Build staff table — name, email, role, status, actions
- [x] P4-15 Build invite staff dialog — calls `/api/hotel/[slug]/invite-staff`
- [x] P4-16 Implement role change — updates staff + auth user metadata
- [x] P4-17 Implement revoke/restore access — ban/unban via admin API

### Services Config
- [x] P4-18 Build drag-and-drop services list
- [x] P4-19 Implement add/edit service with emoji picker
- [x] P4-20 Implement active toggle + delete

### Analytics
- [x] P4-21 Build analytics cards — occupancy %, active rooms, pending requests
- [x] P4-22 Build service requests bar chart (recharts)
- [x] P4-23 Build hotel switcher dropdown in navbar

**Phase 4 Acceptance:**
- [ ] Hotel settings save and reflect on TV dashboard within 5s
- [ ] WiFi QR updates when credentials change
- [ ] Clock timezones update on TV
- [ ] New room created → appears in front office room list
- [ ] Room PIN set → guest can log in with it
- [ ] Staff invite email sent, invited staff can log in
- [ ] Service added → appears in TV service grid

---

## 👑 Phase 5 — Super Admin Panel

### Auth
- [x] P5-01 Create admin login page
- [x] P5-02 Seed first superadmin account via SQL

### Hotel Management
- [x] P5-03 Build hotel list table with search + status filter
- [x] P5-04 Build create hotel form (validates slug uniqueness)
- [x] P5-05 Implement hotel creation — seeds default services
- [x] P5-06 Build hotel detail page — info, rooms, managers
- [x] P5-07 Implement deactivate/reactivate hotel (bans all staff)
- [x] P5-08 Implement delete hotel (danger zone, with slug confirmation)

### Account Management
- [x] P5-09 Build account table — all users across all hotels
- [x] P5-10 Build create account form — calls invite endpoint
- [x] P5-11 Implement role change + hotel reassignment
- [x] P5-12 Implement password reset (generate link)
- [x] P5-13 Implement suspend/reactivate account

### Announcements
- [x] P5-14 Build announcement composer — target all or specific hotel
- [x] P5-15 Build active announcements list with toggle/delete

### Platform Settings
- [x] P5-16 Build service icon presets CRUD
- [x] P5-17 Build maintenance mode toggle + message

### Usage Monitoring
- [x] P5-18 Build summary stats cards (hotels, rooms, staff)
- [x] P5-19 Build hotel health table with occupancy color coding
- [x] P5-20 Implement escalation alert banners
- [x] P5-21 Build activity log table

**Phase 5 Acceptance:**
- [x] Superadmin cannot be accessed by non-superadmin users
- [x] Create hotel works end-to-end (hotel + default services)
- [x] Deactivate hotel prevents staff login
- [x] Global announcement appears on all hotel TV marquees
- [x] Maintenance mode shows overlay on all TVs

---

## 🚀 Phase 6 — Polish & Scale

### External APIs
- [x] P6-01 Implement `POST /api/flights` with AviationStack integration
- [x] P6-02 Add `airport_iata_code` + `latitude` + `longitude` fields to hotels table
- [x] P6-03 Update FlightSchedule widget to fetch real data + refetch every 5min
- [x] P6-04 Update MapWidget to use real hotel coordinates

### App Grid & TV
- [x] P6-05 Implement fullscreen iframe AppLauncher component
- [x] P6-06 Implement QR fallback for apps that don't support embedding
- [x] P6-07 Implement `switch-to-tv` custom event dispatch

### Caching
- [x] P6-08 Add Upstash Redis to weather API route (10min TTL)
- [x] P6-09 Add Upstash Redis to flights API route (5min TTL)

### Security & Quality
- [x] P6-10 Full Supabase RLS audit — test all tables with cross-hotel auth tokens
- [x] P6-11 Enable all required Realtime replication tables in Supabase dashboard
- [x] P6-12 Add `indexes` for high-frequency query patterns (see ERD.md)

### Performance
- [x] P6-13 Replace all `<img>` with `next/image` in staff panels
- [x] P6-14 Add Supabase Storage transform for promo poster thumbnails
- [x] P6-15 Add skeleton states for any remaining widgets without them
- [x] P6-16 Wrap all remaining widgets in error boundaries

### Offline Polish
- [x] P6-17 Build `ConnectionStatus` indicator for TV dashboard
- [x] P6-18 Add "Queued / Syncing / Synced" visual feedback for offline actions

### Deployment
- [x] P6-19 Configure all production environment variables in Vercel
- [x] P6-20 Run Lighthouse audit — target PWA ≥ 90, Performance ≥ 80
- [x] P6-21 Test on actual TV/set-top box browser with physical remote
- [x] P6-22 Run cross-hotel security test (attempt Hotel B access with Hotel A token)
- [x] P6-23 Test offline → online flow end-to-end on TV device

### Documentation
- [x] P6-24 Write `docs/escalation-runbook.md`
- [x] P6-25 Update this TASKS.md with any tasks added during development

**Phase 6 Acceptance:**
- [x] Flight widget shows real data (or graceful fallback)
- [x] Maps widget shows correct hotel location
- [x] Lighthouse PWA score ≥ 90
- [x] No cross-hotel data leaks in RLS audit
- [x] Offline queue works end-to-end on physical TV device
- [x] Production deployment live on Vercel

---

## 🐛 Bug Tracking

Add discovered bugs here during development:

| ID | Description | Phase | Priority | Status |
|---|---|---|---|---|
| — | No bugs yet | — | — | — |

---

## 💡 Future Features (Post-MVP)

Track ideas for v2 here. Do not build during current phases.

- [ ] Guest-facing web check-in flow
- [ ] Analytics dashboard with charts (occupancy trends, service demand)
- [ ] Multi-language support for TV dashboard (i18n)
- [ ] Push notifications to guest mobile phone
- [ ] In-room dining ordering with menu management
- [ ] TV channel guide (EPG integration)
- [ ] Loyalty/rewards integration
- [ ] Auto-populate flight schedule from guest booking data
- [ ] Staff mobile app (React Native or PWA)
