# Phase 4 — Hotel Management Panel

> **Prerequisite:** Phase 1 (foundation + auth) and Phase 3 (front office) complete.  
> **Goal:** Build the hotel management panel for hotel managers. This panel includes all front office features PLUS hotel-level configuration, room/type management, staff management, and multi-hotel support.  
> **Auth:** Requires `role: 'manager'` and matching `hotel_id` in user metadata.

---

## 📋 Tasks

- [ ] Management dashboard layout (extends front office layout)
- [ ] Section: Hotel Settings (name, logo, background, wifi, timezones)
- [ ] Section: Room Management (add/edit/delete rooms)
- [ ] Section: Room Type Management (CRUD)
- [ ] Section: Staff Management (invite, assign role, revoke)
- [ ] Section: Service Configuration (define service types)
- [ ] Section: Analytics Overview (occupancy, requests)
- [ ] Multi-hotel switcher (if manager manages multiple hotels)
- [ ] All Front Office sections (inherit from Phase 3)

---

## 🏗️ Layout

**File:** `src/app/[hotelSlug]/layout.tsx`

The management panel shares the same sidebar layout as front office but with **additional nav items** visible only to managers.

### Extended Sidebar

```
─── Guest Operations ───────────
  🏠 Rooms
  🔔 Notifications
  💬 Chat
  ⏰ Alarms
  🛎 Service Requests
  🎟 Promos

─── Hotel Management ───────────  ← manager-only section
  ⚙️  Hotel Settings
  🛏  Room Types
  👥  Staff
  🔧  Services Config
  📊  Analytics
```

Manager accessing `/[hotelSlug]` goes to the Hotel Settings overview page by default.  
Front office staff cannot see or access the "Hotel Management" nav section.

---

## ⚙️ Section 1 — Hotel Settings

**File:** `src/app/[hotelSlug]/settings/page.tsx`

### Tab 1: General

```
Hotel Name          [text input]
Logo                [image upload → Supabase Storage]
Location / City     [text input]
Timezone            [timezone select dropdown (IANA zones)]
Hotel Description   [textarea, optional]
```

### Tab 2: Appearance

```
Default Background  [image upload or library select]
                    Preview: full-screen thumbnail
```

### Tab 3: WiFi

```
SSID                [text input]
Username            [text input]
Password            [text input + show/hide toggle]
Preview: shows how WiFi card will look on TV dashboard
```

### Tab 4: Clock Timezones

```
Clock 1 Label       [text input] (default: "New York")
Clock 1 Timezone    [timezone select]
Clock 2 Label       [text input]
Clock 2 Timezone    [timezone select]
Clock 3 Label       [text input]
Clock 3 Timezone    [timezone select]
```

### Tab 5: Announcements (Marquee)

```
List of active announcements with text + active toggle
[Add Announcement] button → text input → save
Delete button per item
```

All saves: update `hotels` row via Supabase. Show save confirmation toast.

---

## 🛏️ Section 2 — Room Management

**File:** `src/app/[hotelSlug]/settings/rooms/page.tsx`

### Room List

- Table: Room Code | Room Type | Status | Guest Name | Check-in | Check-out | Actions
- Sortable by room code
- Filter by room type or status

### Add Room

Dialog form:
```
Room Code     [text input, e.g., "417"]
Room Type     [select from room_types]
PIN           [4-digit input, auto-generate button]
```
On save: insert to `rooms` table.

### Edit Room
- Click edit icon → same form pre-filled
- Also shows: Guest Info section (same as front office personalization)

### Delete Room
- Confirm dialog: "This will permanently remove Room [X] and all its data."
- Hard delete from `rooms` table

### Bulk Actions
- Select multiple rooms → "Assign Room Type" bulk update
- Select multiple → "Reset Guest Info" (clear guest name, photo, set is_occupied = false)

---

## 🏷️ Section 3 — Room Type Management

**File:** `src/app/[hotelSlug]/settings/room-types/page.tsx`

### Room Type List

- Simple table: Name | Description | Room Count | Actions
- Inline edit (click name to edit)

### Add Room Type

Dialog:
```
Name          [text input, e.g., "Deluxe Sea View"]
Description   [textarea]
```

### Delete
- Only allowed if no rooms are currently assigned to this type
- Otherwise: "Reassign [X] rooms first" warning

---

## 👥 Section 4 — Staff Management

**File:** `src/app/[hotelSlug]/settings/staff/page.tsx`

### Staff List

- Table: Name | Email | Role | Joined | Status (Active/Inactive) | Actions
- Roles: `frontoffice` | `manager`

### Invite Staff

Dialog:
```
Email         [email input]
Name          [text input]
Role          [select: Front Office / Manager]
```

Flow:
1. Click "Invite" → call API route `POST /api/hotel/[hotelSlug]/invite-staff`
2. API uses Supabase Admin (`service_role_key`) to:
   - Create auth user if not exists: `supabase.auth.admin.inviteUserByEmail(email, { data: { role, hotel_id } })`
   - Insert to `staff` table
3. User receives email invite link from Supabase
4. On first login, user sets their password

### Change Role
- Dropdown per row to change between `frontoffice` and `manager`
- Updates both `staff.role` and `auth.users.user_metadata.role` via admin API

### Revoke Access
- Toggle `staff.is_active = false`
- Call `supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })` to disable login
- Confirm dialog before action

---

## 🔧 Section 5 — Services Configuration

**File:** `src/app/[hotelSlug]/settings/services/page.tsx`

### Service List

- Drag-and-drop sortable list (reorder changes `sort_order`)
- Each item: Icon | Name | Description | Active toggle | Delete button

### Add/Edit Service

Dialog:
```
Name          [text input, e.g., "Room Service"]
Icon          [emoji picker OR icon select from preset list]
              Presets: 🍽️ 🍴 🚗 🛵 💆 👕 🧹 🌊 🏊 📞 🧴
Description   [text input, optional]
Active        [toggle]
```

### Preset Icons
Provide at least 12 preset service icons. User can also type any emoji.

---

## 📊 Section 6 — Analytics Overview

**File:** `src/app/[hotelSlug]/analytics/page.tsx`

> Note: This is a v1 simple analytics page. No external analytics service needed — use Supabase queries.

### Metrics Cards (top row)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Occupancy    │ Active Rooms │ Pending Reqs │ Unread Chats │
│    72%       │   18 / 25    │      4       │      7       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Charts

1. **Occupancy over time** (last 30 days) — line chart
   - Data: count of `rooms.is_occupied = true` per day (use Supabase daily snapshots or approximate from check-in/out dates)

2. **Service requests by type** (last 30 days) — bar chart
   - Group by `service_id`, join with `services.name`

3. **Most active rooms** (by service requests + chat messages)

Use a lightweight chart library: `recharts` or `chart.js`.

---

## 🏨 Multi-Hotel Switcher

If `staff.hotel_id` is an array (future support) OR if a manager is linked to multiple hotels in the `staff` table:

### Hotel Switcher in Navbar

```
[Hotel Logo] Amartha Hotel ▾   ← dropdown
  ✓ Amartha Hotel (current)
    Grand Bali Hotel
    Kuta Beach Resort
  ──────────────────
  + Create New Hotel (superadmin only)
```

- Switching hotel: redirect to `/[newHotelSlug]`
- Each hotel's data is fully isolated via `hotel_id` RLS

For Phase 4, implement the dropdown UI even if a manager only has one hotel — it's ready for expansion.

---

## 🔗 Shared with Front Office

The following sections from Phase 3 are accessible from the same layout:
- Room Overview (with additional manager controls like delete room)
- Notifications
- Chat
- Alarm Manager
- Service Requests
- Promo Management

Managers see all the same views as front office, plus the "Hotel Management" nav section.

---

## 🗄️ Key API Routes

### `POST /api/hotel/[hotelSlug]/invite-staff`

```typescript
// Body: { email, name, role }
// Uses SUPABASE_SERVICE_ROLE_KEY (server-side only)
// 1. Check caller is authenticated with role: 'manager' for this hotel
// 2. Call supabase.auth.admin.inviteUserByEmail(email, {
//      data: { role, hotel_id, name }
//    })
// 3. Insert to staff table
// 4. Return { success: true }
```

### `PATCH /api/hotel/[hotelSlug]/staff/[staffId]/role`

```typescript
// Body: { role: 'frontoffice' | 'manager' }
// 1. Authenticate caller (manager only)
// 2. Update staff.role
// 3. Update auth user metadata via admin API
```

---

## ✅ Acceptance Criteria for Phase 4

- [ ] Manager logs in and lands on Hotel Settings
- [ ] Hotel name, timezone, wifi, logo all save correctly
- [ ] Clock timezones update on TV dashboard after save
- [ ] WiFi card on TV dashboard reflects updated credentials
- [ ] Room added via management panel appears in front office room list
- [ ] Room PIN set via management → guest can log in with that PIN on TV
- [ ] Room type CRUD works (cannot delete type with assigned rooms)
- [ ] Staff invite sends email; invited staff can log in and access front office
- [ ] Role change reflects immediately (staff re-login may be needed)
- [ ] Revoke access prevents staff from logging in
- [ ] Service config: new service appears in TV room dashboard service grid
- [ ] Reorder services → order reflected on TV dashboard
- [ ] Analytics page loads with real occupancy and service data
- [ ] Multi-hotel dropdown shows all hotels for the manager
