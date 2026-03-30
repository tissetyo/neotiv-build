# 🎨 Neotiv — UI/UX Guide, Design System & UX Flows

> This document covers design system tokens, component guidelines, UX flows for all panels, and wireframes in text format.  
> Follow this document for every UI screen generated.

---

## 🎨 Design System

### Color Palette

```css
/* Primary brand */
--color-teal:          #14b8a6;   /* Primary action, focus rings, active states */
--color-teal-light:    #5eead4;   /* Hover, highlights */
--color-teal-dark:     #0f766e;   /* Pressed states */

/* TV Dashboard */
--color-glass-bg:      rgba(15, 23, 42, 0.55);   /* Widget card background */
--color-glass-border:  rgba(255, 255, 255, 0.12); /* Widget card border */
--color-glass-light:   rgba(255, 255, 255, 0.08); /* Subtle dividers */

/* Staff Panels */
--color-sidebar-bg:    #0f172a;   /* slate-950 */
--color-sidebar-hover: #1e293b;   /* slate-800 */
--color-content-bg:    #f8fafc;   /* slate-50 */
--color-border:        #e2e8f0;   /* slate-200 */

/* Status Colors */
--color-success:       #22c55e;   /* green-500 — ON SCHEDULE, done */
--color-warning:       #f59e0b;   /* amber-500 — DELAY, pending */
--color-danger:        #ef4444;   /* red-500 — LAST CALL, CLOSED, urgent */
--color-info:          #3b82f6;   /* blue-500 — IN PROGRESS, gate open */
--color-neutral:       #94a3b8;   /* slate-400 — inactive */

/* Super Admin accent (distinct from hotel panels) */
--color-admin-accent:  #f43f5e;   /* rose-500 */
```

### Typography

```css
/* TV Dashboard */
--font-display: 'Playfair Display', Georgia, serif;
--font-body:    'DM Sans', system-ui, sans-serif;

/* Staff & Admin Panels */
--font-staff:   'IBM Plex Sans', system-ui, sans-serif;

/* Scale (TV Dashboard — fixed px) */
--text-xs:    14px;
--text-sm:    16px;
--text-base:  18px;
--text-lg:    22px;
--text-xl:    28px;
--text-2xl:   36px;
--text-3xl:   48px;
--text-hero:  96px;   /* Digital clock */

/* Scale (Staff panels — Tailwind rem) */
/* Use standard Tailwind: text-sm, text-base, text-lg, etc. */
```

### Spacing & Radius

```css
/* TV Dashboard */
--widget-gap:    16px;     /* Gap between widgets */
--widget-pad:    20px;     /* Inner padding of widget cards */
--widget-radius: 16px;     /* Border radius of cards */

/* Staff panels */
/* Use Tailwind spacing: p-4, p-6, gap-4, rounded-lg, rounded-xl */
```

### Shadows

```css
/* TV Widget cards */
--shadow-widget: 0 8px 32px rgba(0, 0, 0, 0.4);

/* Staff modals/dialogs */
--shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.3);
```

---

## 🖼️ TV Dashboard — Component Anatomy

### Widget Card

Every TV dashboard widget is a "glass card":

```
┌──────────────────────────────────┐
│ [icon] Widget Title              │  ← header row, 16px DM Sans, white/70%
│ ─────────────────────────────── │  ← 1px divider, white/10%
│                                  │
│  [widget content]                │
│                                  │
└──────────────────────────────────┘

CSS:
  background: var(--color-glass-bg);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--widget-radius);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: var(--widget-pad);
  box-shadow: var(--shadow-widget);
```

### Focus State (D-pad)

```css
/* Applied to every focusable widget/button on TV */
.tv-focusable:focus,
.tv-focusable:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 4px;
  border-color: var(--color-teal);
}
```

### Status Badges (TV)

```
ON SCHEDULE  → white text, no bg
DELAY        → amber-400 text
LAST CALL    → red-400 text, subtle red bg
CLOSED       → red-600 text
GATE OPEN    → green-400 text
CHECK-IN     → green-300 text
```

### Status Badges (Staff panels)

```
pending     → amber badge:    bg-amber-100 text-amber-800
in_progress → blue badge:     bg-blue-100 text-blue-800
done        → green badge:    bg-green-100 text-green-800
cancelled   → slate badge:    bg-slate-100 text-slate-600
occupied    → teal badge:     bg-teal-100 text-teal-800
vacant      → slate badge:    bg-slate-100 text-slate-600
```

---

## 📐 TV Dashboard Layout (1920×1080)

### Grid Definition

```
Total: 1920px wide × 1080px tall
Outer padding: 24px all sides

Columns: [480px] [gap 16px] [flexible: auto] [gap 16px] [340px]
Rows:
  Row 1: 220px  (clocks, weather, guest info, wifi)
  Row 2: 300px  (flight schedule + notification)
  Row 3: 240px  (deals, service, map, app grid)
  Row 4: 48px   (marquee)
  Gaps: 16px between rows
```

### Pixel Map

```
x=0                x=504             x=1564            x=1920
│                  │                 │                 │
▼                  ▼                 ▼                 ▼
┌──────────────────┬─────────────────┬─────────────────┐ y=24
│                  │                 │                 │
│  Clocks + Time   │                 │  Guest Info     │ h=220px
│  + Weather       │   Background    │  + WiFi QR      │
│                  │   (fills all    │                 │
├──────────────────┤   remaining     ├─────────────────┤ y=260
│                  │   space)        │                 │
│  Flight Schedule │                 │  Notification   │ h=300px
│                  │                 │  Card           │
│                  │                 │                 │
├──────────────────┴─────────────────┴─────────────────┤ y=576
│                                                       │
│  [Deals 180px] [Service 200px] [Map 220px] [AppGrid] │ h=240px
│                                                       │
├───────────────────────────────────────────────────────┤ y=832
│  ══════════════ MARQUEE ══════════════════════════════│ h=48px
└───────────────────────────────────────────────────────┘ y=880 + 24 padding = 1056 ≈ 1080
```

---

## 📱 Staff Panel Layout

### Sidebar Width: 240px (collapsed: 64px)

```
┌────────────────────────────────────────────────────────┐
│  [logo] Hotel Name                  [👤 Staff] [🔔 3] │  navbar: h-16
├─────────────────────┬──────────────────────────────────┤
│  ← 240px sidebar →  │                                  │
│                     │   Page Title                     │
│  🏠 Rooms       ●  │   ─────────────────────────      │
│  🔔 Notifications   │   [page content]                 │
│  💬 Chat       🔴2 │                                  │
│  ⏰ Alarms       ●  │                                  │
│  🛎 Requests        │                                  │
│  🎟 Promos          │                                  │
│  ─── Manager ────   │                                  │
│  ⚙️  Settings        │                                  │
│  🛏  Room Types      │                                  │
│  👥  Staff           │                                  │
│  📊  Analytics       │                                  │
│                     │                                  │
│  [logout]           │                                  │
└─────────────────────┴──────────────────────────────────┘
```

---

## 🔄 UX Flows

### Flow 1: Guest TV Experience

```
Power on TV
    │
    ▼
/[hotelSlug]/dashboard/[roomCode]
    │
    ├── Session in localStorage?
    │       YES → Welcome Screen (5s) → Main Dashboard
    │       NO  → PIN Entry Screen
    │                   │
    │                   ├── Correct PIN → store session → Welcome Screen → Main Dashboard
    │                   └── Wrong PIN → shake animation → retry
    │
    ▼
Main Dashboard (stays here until logout)
    │
    ├── Press Enter on Alarm → Alarm Modal
    ├── Press Enter on Chat → Chat Modal
    ├── Press Enter on Service → Service Request Modal
    ├── Press Enter on Notification → Full notification view
    ├── Press Enter on YouTube → Fullscreen YouTube iframe
    ├── Press Enter on Netflix → QR code overlay
    ├── Press Enter on TV → switch-to-tv event
    └── Press Enter on Map → Fullscreen Google Map
```

### Flow 2: Front Office Daily Operations

```
Login (/[hotelSlug]/login)
    │
    ▼
Front Office Dashboard (/frontoffice)
    │
    ├── Rooms tab
    │       │
    │       ├── View room list → click room → side panel
    │       │       ├── Edit guest → Personalization form → save → TV updates
    │       │       ├── Send notification → Compose modal → send → TV shows it
    │       │       └── View chat → Chat section pre-filtered to this room
    │       │
    │       └── Toggle occupancy → confirm → rooms.is_occupied updated
    │
    ├── Alarms tab
    │       │
    │       └── View pending alarms sorted by time
    │               → Call room physically → Mark as acknowledged
    │
    ├── Chat tab
    │       │
    │       └── Select room → read messages → type reply → send
    │               → Message appears on room TV in real time
    │
    └── Service Requests tab
            │
            └── View pending requests → update status → guest informed (future v2)
```

### Flow 3: Hotel Manager Setup

```
First-time setup:
Receive invite email
    │
    ▼
Set password (Supabase Auth redirect)
    │
    ▼
Login → Hotel Management Panel (/[hotelSlug])
    │
    ▼
Settings → General: set name, logo, timezone
    │
    ├── Settings → WiFi: set credentials (shows QR preview)
    ├── Settings → Clocks: configure 3 timezone clocks
    ├── Settings → Backgrounds: upload default background
    │
    ▼
Room Types: create room types
    │
    ▼
Rooms: add rooms with codes and PINs
    │
    ▼
Services: configure available services
    │
    ▼
Staff: invite front office staff
    │
    ▼
Hotel is live ✓
```

### Flow 4: Super Admin Hotel Onboarding

```
Super Admin (/admin)
    │
    ▼
Hotels → Create Hotel
    │
    ├── Fill: name, slug (auto-generated), location, timezone
    ├── Submit → hotel row created, default services seeded
    │
    ▼
Accounts → Create Manager Account
    │
    ├── Fill: email, name, role: Manager, hotel: [new hotel]
    ├── Submit → invite email sent
    │
    ▼
Manager receives invite → sets up hotel (Flow 3)
```

---

## 🪟 Screen Wireframes (Text)

### Screen: TV PIN Entry

```
┌──────────────────── 1920×1080 ────────────────────────┐
│                  [dark blurred BG]                     │
│                                                        │
│              ┌─────────────────────┐                  │
│              │   [Hotel Logo]      │                  │
│              │                     │                  │
│              │   Room 417          │                  │
│              │                     │                  │
│              │   Enter PIN         │                  │
│              │   ● ● ○ ○           │  (4 dots)        │
│              │                     │                  │
│              │  [1] [2] [3]        │                  │
│              │  [4] [5] [6]        │  (numpad)        │
│              │  [7] [8] [9]        │                  │
│              │      [0]  [⌫]       │                  │
│              └─────────────────────┘                  │
└────────────────────────────────────────────────────────┘
```

### Screen: TV Welcome Splash

```
┌──────────────────── 1920×1080 ────────────────────────┐
│  [full-bleed hotel background photo]          Room    │
│                                                417    │
│                                                       │
│              [circular avatar — overlaps card top]    │
│         ┌─────────────────────────────────┐          │
│         │  Welcome in Amartha Hotel, Bali!│          │
│         │  Mr. Stephen Hawk               │          │
│         │  ─────────────────────────────  │          │
│         │  We hope you enjoy your Trip!   │          │
│         │  We always ready whenever you   │          │
│         │  want, let us know what you     │          │
│         │  needed.                        │          │
│         │                                 │          │
│         │  Your comfort is our priority!  │          │
│         │  ▓▓▓▓▓░░░░░  (5s progress bar) │          │
│         └─────────────────────────────────┘          │
└───────────────────────────────────────────────────────┘
```

### Screen: TV Main Dashboard (abbreviated)

```
┌──────────────────────────────────────────────────── 1920×1080 ──┐
│  [🕐NY] [🕐FR] [🕐CN]   ☁ 24°C Kuta, Bali         Hello  ⊙  Room│
│  [clock][clock][clock]   09.17 AM                 Stephen  417 │
│                          Sunday, 16 Jan 2026       [photo]      │
│  ┌──────────────────┐                             ┌───────────┐ │
│  │ ✈ Flight Schedule│   [surf aerial photo]       │📶 Wifi    │ │
│  │ CK-123  19:15  ..│   [full bleed background]   │[QR code]  │ │
│  │ KL-123  DELAY  ..│                             │HotelABC   │ │
│  │ ...              │                             │Guest      │ │
│  └──────────────────┘                             └───────────┘ │
│                                             ┌─────────────────┐ │
│                                             │🔔 Notification  │ │
│                                             │Title here       │ │
│                                             │body text...     │ │
│                                             └─────────────────┘ │
├──────┬─────────────────┬────────────┬───────────────────────────┤
│Deals │ Hotel Service   │ [Map]      │ [YT][D+][NF][YTM]        │
│[img] │ 🍽 🍴 🚗 🛵 💆 👕│            │ [SP][PV][TV][TK]         │
│      │ Hotel Info      │            │ [⏰][💬][🔔][⚙]           │
├──────┴─────────────────┴────────────┴───────────────────────────┤
│ ══ Promo text scrolling... • Hotel announcement scrolling... ══ │
└─────────────────────────────────────────────────────────────────┘
```

### Screen: Front Office Room List

```
┌──────────────────────────────────────────────────────────────┐
│ Neotiv  Amartha Hotel                     [Staff Name] [🔔3] │
├───────────┬──────────────────────────────────────────────────┤
│🏠 Rooms ● │  Rooms                    [+ Add Room]           │
│🔔 Notif   │  ┌─────────────────────────────────────────────┐ │
│💬 Chat 🔴2│  │ [All] [Occupied] [Vacant]   🔍 Search...    │ │
│⏰ Alarms  │  └─────────────────────────────────────────────┘ │
│🛎 Service │                                                   │
│🎟 Promos  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│           │  │ 101 │ │ 102 │ │ 103 │ │ 104 │ │ 105 │      │
│── Mgr ──  │  │OCCUP│ │VACAN│ │OCCUP│ │VACAN│ │OCCUP│      │
│⚙ Settings │  │Smith│ │     │ │Jones│ │     │ │Kim  │      │
│🛏 Types   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│👥 Staff   │                                                   │
│📊 Stats   │  ┌─────┐ ┌─────┐ ...                            │
│           │  │ 201 │ │ 202 │                                 │
│[logout]   │  │VACAN│ │OCCUP│                                 │
└───────────┴──┴─────┴─┴─────┴───────────────────────────────-┘
```

### Screen: Front Office Chat

```
┌──────────────────────────────────────────────────────────────┐
│ Neotiv  Amartha Hotel                     [Staff Name] [🔔1] │
├───────────┬──────────────────────────────────────────────────┤
│           │  Chat                                            │
│           │ ┌────────────────┬───────────────────────────┐  │
│           │ │ Room 101     ◉ │                           │  │
│           │ │ "Need towels"  │      Room 417             │  │
│           │ ├────────────────┤  ┌─────────────────────┐  │  │
│           │ │ Room 201     ◉ │  │ Guest: Can I get... │  │  │
│           │ │ "Thank you"    │  └────────────────   ──┘  │  │
│           │ ├────────────────┤     ┌─────────────────┐   │  │
│           │ │ Room 417 🔴3  │     │   Staff: Of     │   │  │
│           │ │ "Can I get..." │     │   course! We'll │   │  │
│           │ │                │     │   send someone  │   │  │
│           │ │                │     └─────────────────┘   │  │
│           │ │                │  [Type a message...] [Send]│  │
│           │ └────────────────┴───────────────────────────┘  │
└───────────┴──────────────────────────────────────────────────┘
```

### Screen: Hotel Settings (Manager)

```
┌──────────────────────────────────────────────────────────────┐
│ Neotiv  Amartha Hotel                     [Manager] [🔔]     │
├───────────┬──────────────────────────────────────────────────┤
│           │  Hotel Settings                                  │
│  [nav]    │  ┌──────────────────────────────────────────┐   │
│           │  │ [General] [Appearance] [WiFi] [Clocks]   │   │
│           │  │                        [Announcements]   │   │
│           │  └──────────────────────────────────────────┘   │
│           │                                                  │
│           │  General                                         │
│           │  Hotel Name     [Amartha Hotel         ]        │
│           │  Location       [Kuta, Bali             ]        │
│           │  Timezone       [Asia/Jakarta        ▾  ]        │
│           │  Logo           [📎 Upload image]                │
│           │                 [current logo preview]           │
│           │  Airport Code   [DPS                   ]        │
│           │                                                  │
│           │  [Save Changes]                                  │
└───────────┴──────────────────────────────────────────────────┘
```

### Screen: Super Admin Hotel List

```
┌──────────────────────────────────────────────────────────────┐
│ [N] Neotiv Admin                      [admin@neotiv.com] 🔔  │
├───────────┬──────────────────────────────────────────────────┤
│🏨 Hotels ●│  Hotels                          [+ Create Hotel]│
│👤 Accounts│  🔍 Search hotels...                             │
│📢 Announce│  ┌──────────────────────────────────────────┐   │
│⚙ Settings │  │ Hotel Name    │ Slug     │ Rooms │ Status │   │
│📊 Monitor  │  ├──────────────────────────────────────────┤   │
│           │  │ Amartha Hotel │ amartha  │  25   │ 🟢 Active│  │
│           │  │ Grand Bali    │ grand-b  │  48   │ 🟢 Active│  │
│           │  │ Kuta Resort   │ kuta-res │  12   │ 🔴 Inactive│ │
│           │  └──────────────────────────────────────────┘   │
└───────────┴──────────────────────────────────────────────────┘
```

---

## 🔔 Micro-interactions & Animations

### TV Dashboard
- **Widget mount:** Staggered fade-in + translateY(20px→0) with 100ms delay per widget
- **Focus transition:** Smooth 150ms outline color transition
- **Clock hands:** `transition: transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)` (slight bounce)
- **Notification arrival:** Widget pulses once (scale 1→1.02→1, 300ms)
- **Modal open:** Scale from 0.95 + fade in, 200ms ease-out
- **Marquee:** Linear infinite scroll, speed = `text_length / 50` seconds

### Staff Panels
- **Table row hover:** Subtle bg-slate-50 transition 100ms
- **Status badge change:** Fade cross-dissolve 200ms
- **Toast notifications:** Slide in from bottom-right, auto-dismiss after 4s
- **Sidebar active item:** Teal left border animates width 0→4px on navigation

---

## ♿ Accessibility

### TV Dashboard
- All widgets have `role="region"` + `aria-label`
- D-pad navigation announced via `aria-live="polite"` region
- Focus always visible (never hidden)
- Color status indicators always have text labels (not color alone)

### Staff Panels
- All form inputs have associated `<label>` elements
- Error messages use `role="alert"`
- Data tables have proper `<th scope="col">` headers
- Modals trap focus and return focus on close
- Keyboard shortcuts documented in tooltip on hover

---

## 📏 Responsive Strategy

| Panel | Breakpoints |
|---|---|
| TV Dashboard | Fixed 1920×1080 only. No breakpoints. |
| Front Office | `md` (768px) minimum. Sidebar collapses to icons at `md`. Full at `lg`. |
| Hotel Management | Same as Front Office |
| Super Admin | Same as Front Office |

For staff panels, sidebar collapses to icon-only at `< 1024px`:
```
≥ 1024px: full sidebar (240px) with labels
< 1024px: icon sidebar (64px), labels in tooltip
< 768px:  bottom tab bar (mobile fallback)
```
