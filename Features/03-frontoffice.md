# Phase 3 — Front Office Dashboard

> **Prerequisite:** Phase 1 complete. Phase 2 TV dashboard should exist for testing end-to-end flows.  
> **Goal:** Build the full front office staff panel — the primary daily-use interface for hotel staff to manage guests, communicate, and handle requests.  
> **Device:** Desktop browser (1280px+ wide). Responsive down to tablet (768px) is a bonus.

---

## 📋 Tasks

- [ ] Staff login page (email + password via Supabase Auth)
- [ ] Sidebar navigation layout
- [ ] Section: Room Overview (all rooms, occupancy status)
- [ ] Section: Guest Personalization (per room)
- [ ] Section: Notifications (compose + history)
- [ ] Section: Alarm Manager (guest-set alarms)
- [ ] Section: Chat (per-room inbox with realtime)
- [ ] Section: Service Requests (incoming, status update)
- [ ] Section: Promo Management (upload + CRUD)

---

## 🔐 Auth

**File:** `src/app/[hotelSlug]/login/page.tsx`

- Email + password form
- On submit: `supabase.auth.signInWithPassword({ email, password })`
- On success: check `user.user_metadata.role`
  - `frontoffice` or `manager` → redirect to `/{hotelSlug}/frontoffice`
  - `manager` → redirect to `/{hotelSlug}` (management panel)
  - Other/unauthorized → show error
- Validate that `user.user_metadata.hotel_id` matches the hotel in the URL slug
- Show loading state during sign-in

---

## 🏗️ Layout

**File:** `src/app/[hotelSlug]/frontoffice/layout.tsx`

### Sidebar + Main Layout

```
┌──────────────────────────────────────────────────────┐
│  [Neotiv logo]  Amartha Hotel     [staff name]  [🔔] │  ← top navbar
├───────────┬──────────────────────────────────────────┤
│           │                                          │
│  Sidebar  │  Main Content Area                       │
│  240px    │                                          │
│           │                                          │
│  🏠 Rooms │                                          │
│  🔔 Notif │                                          │
│  💬 Chat  │                                          │
│  ⏰ Alarm │                                          │
│  🛎 Service│                                          │
│  🎟 Promos│                                          │
│           │                                          │
│  [logout] │                                          │
└───────────┴──────────────────────────────────────────┘
```

- Sidebar: `bg-slate-900`, white text, active item highlighted with teal left border
- Navbar: hotel name, staff name, notification bell with unread count badge
- Use Next.js Link for navigation between sections
- Each section is a sub-route: `/frontoffice/rooms`, `/frontoffice/notifications`, etc.

---

## 🏠 Section 1 — Room Overview

**File:** `src/app/[hotelSlug]/frontoffice/rooms/page.tsx`

### Features

**Room Grid View:**
- Display all rooms as cards in a responsive grid
- Card shows: room code, room type, guest name (if occupied), check-in/check-out dates
- Status badge: `Occupied` (teal) / `Vacant` (slate)
- Quick toggle: click status badge → `rooms.is_occupied` toggled in Supabase
- Click room card → opens side panel (Sheet component from shadcn/ui)

**Room Side Panel:**
- Room code + type header
- Guest info: name, photo (thumbnail), check-in/check-out
- Quick links: "Edit Guest" → navigates to personalization form
- "Send Notification" → opens compose modal pre-filled with this room
- "View Chat" → opens chat for this room
- Recent service requests for this room (latest 3)

**Filters:**
- Toggle: All / Occupied / Vacant
- Search: by room code or guest name

---

## 🎨 Section 2 — Guest Personalization

**File:** `src/app/[hotelSlug]/frontoffice/rooms/[roomId]/personalize/page.tsx`  
(also accessible from Room Overview side panel)

### Form Fields

```
Guest Name          [text input]
Guest Photo         [file upload → Supabase Storage → rooms.guest_photo_url]
Welcome Message     [textarea, optional override]
Background Image    [file upload OR select from library → rooms.background_url]
Check-in Date       [date picker]
Check-out Date      [date picker]
Room Status         [toggle: occupied / vacant]
```

### Background Library
- Hotel-level background images (stored in Supabase Storage: `hotel-backgrounds/`)
- Show thumbnails, click to select
- "Upload new" → uploads to storage and adds to library

### Bulk Apply
- Toggle: "Apply background to all rooms in this hotel"
- Confirmation dialog before bulk update

### Save
- Update `rooms` row via Supabase
- On success: show toast "Room updated. TV dashboard will reflect changes."

---

## 🔔 Section 3 — Notifications

**File:** `src/app/[hotelSlug]/frontoffice/notifications/page.tsx`

### Compose Notification
- **To:** dropdown → "All Rooms" OR specific room (searchable select)
- **Title:** text input (max 60 chars)
- **Body:** textarea (max 300 chars)
- **Send button** → insert to `notifications` table
- Room TV will receive this live via Supabase Realtime

### Notification History
- Table: Room | Title | Sent By | Sent At | Status (Read/Unread)
- Sort by newest first
- Filter by room
- Click row → expand to see full body

---

## ⏰ Section 4 — Alarm Manager

**File:** `src/app/[hotelSlug]/frontoffice/alarms/page.tsx`

### Alarm List
- Table: Room | Guest Name | Scheduled Time | Note | Status
- Status: `Pending` (amber badge) / `Acknowledged` (green badge)
- Sorted by scheduled time ascending (soonest first)
- Highlight rows where scheduled time is within the next 30 minutes (amber row bg)

### Acknowledge
- Button per row: "Mark as Called"
- Updates `alarms.is_acknowledged = true`
- Moves row to "Done" section at the bottom

### Realtime
- Subscribe to new alarms for this hotel
- Show toast notification when a new alarm is set by a guest: "⏰ Room [X] set an alarm for [time]"

---

## 💬 Section 5 — Chat

**File:** `src/app/[hotelSlug]/frontoffice/chat/page.tsx`

### Layout

```
┌───────────────────┬───────────────────────────────────┐
│  Room list        │  Chat window                      │
│  ─────────────    │  ─────────────────────────────    │
│  Room 101 • 2    │  [guest messages right-aligned]   │
│  Room 107        │  [staff messages left-aligned]    │
│  Room 201 • 1    │                                   │
│  Room 417 • 3    │  [input + send button]            │
└───────────────────┴───────────────────────────────────┘
```

- Left sidebar: list of all rooms, sorted by latest message timestamp
- Unread badge count per room
- Click room → load chat history for that room
- Realtime: new messages appear instantly (Supabase Realtime subscription)
- Send message: insert to `chat_messages` with `sender_role: 'frontoffice'`, `sender_name: staff.name`
- Mark messages as read when room chat is opened

---

## 🛎️ Section 6 — Service Requests

**File:** `src/app/[hotelSlug]/frontoffice/service-requests/page.tsx`

### Request Queue

- Table: Room | Service Type | Note | Requested At | Status
- Status filter tabs: All / Pending / In Progress / Done
- Color-coded status:
  - `pending` → amber badge
  - `in_progress` → blue badge
  - `done` → green badge
  - `cancelled` → slate badge

### Status Update
- Inline status dropdown per row (or click → modal)
- Updates `service_requests.status` + `updated_at`

### Realtime
- Subscribe to new service requests for this hotel
- Show toast: "🛎 Room [X] requested [service name]"

---

## 🎟️ Section 7 — Promo Management

**File:** `src/app/[hotelSlug]/frontoffice/promos/page.tsx`

### Promo List
- Grid of promo cards (poster thumbnail + title + validity + active/inactive badge)
- "Add Promo" button → opens form dialog

### Add/Edit Promo Form

```
Poster Image    [file upload → Supabase Storage → promos.poster_url]
Title           [text input]
Description     [rich textarea]
Valid From      [date picker]
Valid Until     [date picker]
Active          [toggle switch]
```

### Delete Promo
- Confirm dialog → soft delete or hard delete

---

## 🗄️ Data Patterns

### Supabase Client Usage in Front Office

All data operations use `createBrowserClient` (client component) or `createServerClient` (server component/action).

```typescript
// Example: fetch rooms for this hotel
const { data: rooms } = await supabase
  .from('rooms')
  .select('*, room_types(name)')
  .eq('hotel_id', hotelId)
  .order('room_code');

// Example: send notification
await supabase.from('notifications').insert({
  hotel_id: hotelId,
  room_id: selectedRoomId || null,  // null = broadcast
  title,
  body,
  created_by: staffId,
});

// Example: realtime subscription for new service requests
supabase
  .channel('service-requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'service_requests',
    filter: `hotel_id=eq.${hotelId}`,
  }, (payload) => {
    // show toast, add to list
  })
  .subscribe();
```

---

## ✅ Acceptance Criteria for Phase 3

- [ ] Staff can log in with email/password and land on front office panel
- [ ] Room grid shows all rooms with correct occupancy status
- [ ] Toggle room occupancy status — change reflects immediately (no page reload)
- [ ] Guest personalization saves: name, photo, background update on TV dashboard within 5 seconds
- [ ] Bulk background apply works across all rooms
- [ ] Notification sent to specific room appears live on that room's TV dashboard
- [ ] Broadcast notification appears on all rooms
- [ ] Alarm manager shows alarms sorted by time, highlights upcoming alarms
- [ ] Acknowledging alarm updates status correctly
- [ ] Chat: message from front office appears on room TV in realtime; reply from TV appears in front office
- [ ] Unread chat count badge updates in real time
- [ ] Service requests appear when submitted from TV room
- [ ] Status update on service request reflects immediately
- [ ] Promo upload stores image in Supabase Storage, appears in TV hotel deals widget
