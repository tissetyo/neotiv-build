# Phase 2 — Room TV Dashboard

> **Prerequisite:** Phase 1 complete. Supabase tables exist, auth works, room PIN login works.  
> **Goal:** Build the full TV dashboard — welcome/splash screen and the full-screen widget dashboard.  
> **Important:** This UI is rendered on a **1920×1080 TV screen via set-top box**. Do NOT use responsive breakpoints. All sizing in `px` or `vw/vh` calibrated for 16:9.

---

## 📋 Tasks

- [ ] Welcome / splash screen (animated)
- [ ] Main dashboard fixed-grid layout
- [ ] Widget: 3 Analog Clocks (SVG, ticking)
- [ ] Widget: Digital Clock + Weather
- [ ] Widget: Guest Info + Room Number
- [ ] Widget: WiFi QR Access Card
- [ ] Widget: Flight Schedule Table
- [ ] Widget: Notification Card (Supabase Realtime)
- [ ] Widget: Hotel Deals (scrollable)
- [ ] Widget: Hotel Service (icon grid + request modal)
- [ ] Widget: Google Map preview
- [ ] Widget: App Grid (YouTube, Netflix, Disney+, etc.)
- [ ] Widget: Scrolling Marquee Bar
- [ ] Modal: Chat (Supabase Realtime)
- [ ] Modal: Alarm setter
- [ ] D-pad navigation hook
- [ ] Offline mode (service worker + Zustand)

---

## 🖼️ Screen A — Welcome / Splash Screen

**File:** `src/app/[hotelSlug]/dashboard/[roomCode]/page.tsx`  
(This page is shown after PIN login before auto-navigating to `/main`)

### Layout (1920×1080)

```
┌─────────────────────────────────────────────────────────┐
│                                                 Room    │
│                                                  417    │ ← top-right, white, large
│                                                         │
│              ┌─────────────────────┐                   │
│         ┌────┤  [avatar photo]     │                   │
│         │ O  │  Welcome in         │                   │
│         └────┤  Amartha Hotel,     │                   │
│              │  Bali!              │                   │
│              │  Mr. Stephen Hawk   │                   │ ← bold
│              │  ─────────────────  │                   │
│              │  We hope you enjoy  │                   │
│              │  your Trip!...      │                   │
│              │                     │                   │
│              │  Your comfort is    │                   │
│              │  our priority!      │                   │
│              └─────────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Behavior
- Full-screen hotel background image (fetch from `rooms.background_url` or `hotels.default_background_url`)
- Guest avatar: circular, 96px, positioned to overlap the top edge of the card
- Card: frosted glass (`backdrop-blur-md`, `bg-white/10`, `border border-white/20`, `rounded-2xl`)
- Card animation: fade-in + slide-up on mount using Framer Motion
- Room number: top-right, `font-display`, white, bold, large (~72px)
- After **5 seconds** (or user presses Enter/OK on D-pad) → navigate to `/main`
- Show a subtle progress bar or dot timer at the bottom of the card counting down 5s

---

## 🖥️ Screen B — Main Dashboard

**File:** `src/app/[hotelSlug]/dashboard/[roomCode]/main/page.tsx`

### Fixed Grid Layout (1920×1080)

Use CSS Grid with fixed pixel columns/rows. No scrolling on the main screen.

```
Grid columns: 500px | auto | 340px
Grid rows:    auto  | auto | auto | 48px

┌─────────────────┬────────────────────┬──────────────────┐
│ Clocks + Time   │                    │ Guest + Room +   │ row 1 ~200px
│ + Weather       │  Background image  │ WiFi QR          │
├─────────────────┤  (center, fills    ├──────────────────┤
│ Flight Schedule │  remaining space)  │ Notification     │ row 2 ~300px
│ Widget          │                    │ Card             │
├─────────────────┴────────────────────┴──────────────────┤
│ Deals │ Hotel Service │ Hotel Info │ Map │ App Grid      │ row 3 ~280px
├────────────────────────────────────────────────────────-─┤
│ 🔁 Scrolling Marquee                                     │ row 4 48px
└──────────────────────────────────────────────────────────┘
```

### Data Loading
On mount, fetch from Supabase (use Server Component or SWR):
- `rooms` — guest name, photo, background, welcome message, room_code
- `hotels` — hotel name, wifi, timezone, clock timezones, location
- `notifications` — latest 1 unread notification for this room
- `promos` — active promos for this hotel
- `services` — active services for this hotel
- `announcements` — active announcements for this hotel
- `chat_messages` — unread count for this room

Store all in Zustand `roomStore` for offline access.

---

## ⚙️ Shared Hooks

### `src/lib/hooks/useDpadNavigation.ts`

```typescript
// Implement a hook that:
// 1. Maintains a registry of focusable elements (via data-focusable="true" attribute)
// 2. Tracks currently focused element index
// 3. Listens to keydown events: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Escape
// 4. On arrow key: move focus to the next focusable element in that direction
//    (use getBoundingClientRect() to determine spatial neighbors)
// 5. On Enter: trigger onClick of focused element
// 6. On Escape: close any open modal, return focus to main grid
// 7. Returns { focusedId, setFocusedId, registerElement }
// 8. Each focusable element should have a visible ring:
//    className="focus-ring" → apply `outline: 2px solid #14b8a6; outline-offset: 4px;`
```

### `src/lib/hooks/useOfflineQueue.ts`

```typescript
// Implement a hook that:
// 1. Listens to navigator.onLine changes
// 2. Maintains a queue in localStorage key 'neotiv_offline_queue'
// 3. Queue items: { type: 'chat' | 'service_request' | 'alarm', payload, timestamp }
// 4. When online: flush queue by sending each item to Supabase in order
// 5. Returns { isOnline, addToQueue, queueLength }
```

### `src/lib/hooks/useRealtime.ts`

```typescript
// Implement a hook that:
// 1. Subscribes to Supabase Realtime on:
//    - notifications table WHERE room_id = currentRoomId → update notification state
//    - chat_messages table WHERE room_id = currentRoomId → append new message
// 2. Cleans up subscription on unmount
// 3. Returns { latestNotification, newMessage }
```

---

## 🧩 Widget Specifications

### Widget 1 — Analog Clocks

**File:** `src/components/tv/AnalogClock.tsx`

```typescript
// Props: { timezone: string, label: string }
//
// Render an SVG analog clock (200×200px) showing current time in given timezone
// Clock face: clean, minimal — white/light tick marks on dark background
// Hour hand: thick, short
// Minute hand: medium, longer  
// Second hand: thin, red/teal, full length
// All hands rotate via CSS transform: rotate(Xdeg)
// Update every second via setInterval
// Label below: city name, white, small font
// 3 clocks side by side, timezone pulled from hotels.clock_timezone_1/2/3
```

### Widget 2 — Digital Clock + Weather

**File:** `src/components/tv/DigitalClock.tsx`

```typescript
// Display:
//   [weather icon] 24°C • Kuta, Bali    ← small, above
//   09.17 AM                             ← huge, ~96px, font-display
//   Sunday, 16 January 2026             ← medium, below
//
// Time: use hotel timezone (hotels.timezone)
// Update every second
// Weather: fetch from OpenWeatherMap API on mount, cache in Zustand
//   GET https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=metric
// Show weather icon (use OpenWeatherMap icon or emoji fallback)
```

### Widget 3 — Guest Info + Room Number

**File:** `src/components/tv/GuestCard.tsx`

```typescript
// Top-right panel containing:
//   Row: "Hello" label | [Guest Name] button/pill | [circular guest photo 64px]
//   Large "Room" text + large room number (e.g., "417")
//
// Guest photo: from rooms.guest_photo_url (Supabase Storage URL)
// Fallback: initials avatar if no photo
// Room number: font-display, white, ~72px
```

### Widget 4 — WiFi QR Card

**File:** `src/components/tv/WifiCard.tsx`

```typescript
// Card showing:
//   [WiFi icon] "Wifi Access" header
//   QR code (generated client-side from wifi string)
//   SSID: HotelABC
//   Username: Guest
//   Password: stayinhereforwhile
//
// QR code: generate using react-qr-code
// WiFi QR string format: WIFI:S:{ssid};T:WPA;P:{password};U:{username};;
// Card: frosted glass, ~300px wide
```

### Widget 5 — Flight Schedule

**File:** `src/components/tv/FlightSchedule.tsx`

```typescript
// Table widget showing flight info:
// Columns: Flight | Time | Destination | Gate | Remarks
// Remarks color coding:
//   LAST CALL  → text-red-400
//   CLOSED     → text-red-600
//   ON SCHEDULE → text-white
//   GATE OPEN  → text-green-400
//   DELAY      → text-amber-400
//   CHECK-IN   → text-green-300
//
// Header: plane icon + "Flight Schedule" + airport badge pill
// Airport name from hotels.location or a configured airport field
// Data source (Phase 6): AviationStack API
// For now: show placeholder/mock data with the correct visual format
// Scrollable if > 8 rows (auto-scroll every 3s)
```

### Widget 6 — Notification Card

**File:** `src/components/tv/NotificationCard.tsx`

```typescript
// Shows the latest unread notification sent to this room (or broadcast)
// Layout:
//   [red "Notification" badge]  [timestamp top-right]
//   Title (bold)
//   Body text (truncated to 4 lines)
//
// Subscribe via useRealtime hook — updates live when front office sends a notification
// On D-pad select → expand to full-screen notification view
// Mark as read on expand
```

### Widget 7 — Hotel Deals

**File:** `src/components/tv/HotelDeals.tsx`

```typescript
// Left panel, bottom row:
//   "Hotel Deals" header with settings icon + arrow
//   Horizontal list of promo poster cards (poster_url as background image)
//   Each card: ~160×100px, shows title overlay
//   D-pad navigable left/right
//   On Enter: open full-screen promo detail modal (poster image + description)
```

### Widget 8 — Hotel Service

**File:** `src/components/tv/HotelService.tsx`

```typescript
// Card showing:
//   "Hotel Service" header
//   Grid of service icons (2 rows × N cols)
//   Icons: 🍽️ food, 🍴 restaurant, 🚗 car, 🛵 bike, 💆 spa, 👕 laundry (from services table)
//   D-pad navigable
//   On Enter → open Service Request Modal:
//     - Service name + icon
//     - Optional note textarea (keyboard input, auto-opens OSK or use virtual keyboard)
//     - Submit button → insert to service_requests table
//     - If offline → add to offline queue
```

### Widget 9 — Google Map

**File:** `src/components/tv/MapWidget.tsx`

```typescript
// Embedded Google Maps iframe showing hotel location pin
// Zoom level 15, hotel coordinates from hotel data
// On D-pad select → expand to full-screen map
// Use Google Maps Embed API:
//   https://www.google.com/maps/embed/v1/place?key={KEY}&q={hotel name + location}
```

### Widget 10 — App Grid

**File:** `src/components/tv/AppGrid.tsx`

```typescript
// Grid of app launcher tiles (2 rows × 4 cols approximately):
// Row 1: YouTube, Disney+, Netflix, YouTube Music
// Row 2: Spotify, Prime Video, TV (live), TikTok
// Row 3 (small icons): Alarm, Chat, Notifications, Settings
//
// Each tile: app logo/icon + label
// On Enter:
//   YouTube      → open fullscreen iframe: https://www.youtube.com/tv
//   Netflix      → window.open('https://netflix.com')
//   Disney+      → window.open('https://disneyplus.com')
//   Prime Video  → window.open('https://primevideo.com')
//   Spotify      → open fullscreen iframe: https://open.spotify.com
//   TikTok       → window.open('https://tiktok.com')
//   TV           → dispatch custom event 'switch-to-tv' (set-top box handles this)
//   Alarm        → open AlarmModal
//   Chat         → open ChatModal
//   Notifications→ open full notification list modal
//
// Fullscreen iframes: rendered in a portal overlay with an X/Back button to close
```

### Widget 11 — Scrolling Marquee

**File:** `src/components/tv/MarqueeBar.tsx`

```typescript
// Fixed 48px bar at the very bottom of the screen
// Dark semi-transparent background
// Horizontally scrolling text: hotel announcements joined with " • " separator
// CSS animation: @keyframes marquee { from: translateX(100vw); to: translateX(-100%) }
// Infinite loop, speed proportional to text length
// Text from: announcements table (is_active = true, filtered by hotel_id)
```

---

## 💬 Modal — Chat

**File:** `src/components/tv/ChatModal.tsx`

```typescript
// Full-screen modal overlay
// Header: "Chat with Front Office" + unread badge + close button
// Messages list (scrollable):
//   Guest messages: right-aligned, teal bubble
//   Front office messages: left-aligned, dark bubble
//   Timestamp per message
// Input area at bottom:
//   Virtual keyboard or text input (focus on open)
//   Send button (Enter key)
// Realtime: subscribe to chat_messages for this room
// Send: insert to chat_messages with sender_role: 'guest'
// Offline: add to offline queue
```

---

## ⏰ Modal — Alarm

**File:** `src/components/tv/AlarmModal.tsx`

```typescript
// Modal for guest to set a wake-up call
// Fields:
//   Time picker (hour/minute, D-pad spinners)
//   Optional note (e.g., "Flight at 9am")
//   Confirm button
// On submit: insert to alarms table
// Front office will see this in their panel and call the room at the specified time
// List of existing alarms for this room (can delete)
```

---

## 🗄️ Zustand Store

**File:** `src/stores/roomStore.ts`

```typescript
interface RoomStore {
  // Room data
  roomId: string | null;
  roomCode: string;
  hotelSlug: string;
  hotelId: string | null;
  guestName: string;
  guestPhotoUrl: string | null;
  backgroundUrl: string | null;

  // Hotel data
  hotelName: string;
  hotelTimezone: string;
  hotelLocation: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiUsername: string;
  clockTimezones: [string, string, string];
  clockLabels: [string, string, string];

  // Widget data
  latestNotification: Notification | null;
  promos: Promo[];
  services: Service[];
  announcements: Announcement[];
  unreadChatCount: number;

  // Actions
  setRoomData: (data: Partial<RoomStore>) => void;
  markNotificationRead: (id: string) => void;
  incrementUnreadChat: () => void;
  clearUnreadChat: () => void;
}
```

---

## ✅ Acceptance Criteria for Phase 2

- [ ] Welcome screen shows guest name, photo, hotel name, room number with animation
- [ ] Auto-transitions to main dashboard after 5 seconds
- [ ] All 3 analog clocks tick correctly in their respective timezones
- [ ] Digital clock updates every second in hotel timezone
- [ ] Weather data loads from API (or graceful fallback)
- [ ] WiFi QR code is scannable and correct
- [ ] Notification card updates live when a test notification is inserted in Supabase
- [ ] Hotel Deals scrollable, opens promo modal on Enter
- [ ] Hotel Service grid opens service request modal, submits request to DB
- [ ] App grid launches apps (YouTube / Netflix etc.)
- [ ] Chat modal sends and receives messages in realtime
- [ ] Alarm modal creates alarm record in DB
- [ ] Marquee scrolls continuously
- [ ] D-pad arrow keys navigate between all widgets
- [ ] Enter/Escape open/close modals correctly
- [ ] Disconnect Wi-Fi → dashboard still renders from cached data
- [ ] Offline service request queues and sends when reconnected
