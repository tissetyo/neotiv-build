# 🏨 Neotiv — Build Prompt Index

> A web-based hospitality platform powering in-room hotel TV dashboards and hotel management workflows.  
> Built as a PWA with offline mode, real-time communication, and multi-tenant hotel support.

---

## 📦 How to Use These Files

Each file is a **self-contained prompt** for an AI code generator (Claude Code, Cursor, Lovable, etc.).  
Feed them **in order**, one phase at a time. Each phase assumes the previous phase is complete.

Always include this README + the relevant phase file when prompting.

---

## 📁 File Index

| File | Phase | Description |
|---|---|---|
| `01-foundation.md` | Phase 1 | Project setup, Supabase schema, auth, PWA |
| `02-tv-dashboard.md` | Phase 2 | Room TV welcome screen + main dashboard widgets |
| `03-frontoffice.md` | Phase 3 | Front office staff panel |
| `04-hotel-management.md` | Phase 4 | Hotel management panel (rooms, staff, settings) |
| `05-super-admin.md` | Phase 5 | Super admin panel (all hotels, accounts) |
| `06-polish-and-scale.md` | Phase 6 | External APIs, performance, scaling prep |

---

## 🗺️ Architecture Summary

### User Roles & URLs

| Role | URL Pattern | Device |
|---|---|---|
| Hotel Guest (Room TV) | `/[hotelSlug]/dashboard/[roomCode]` | TV / Set-top box |
| Front Office Staff | `/[hotelSlug]/frontoffice` | Desktop browser |
| Hotel Management | `/[hotelSlug]` | Desktop browser |
| Super Admin | `/admin` | Desktop browser |

### Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Multi-tenant routing, Server Actions, SSR/SSG |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible |
| State | Zustand | Lightweight, offline-friendly |
| Database | Supabase (PostgreSQL) | Auth + Realtime + Storage in one |
| PWA | next-pwa | Service worker + offline caching |
| Animation | Framer Motion | TV dashboard transitions |
| Realtime | Supabase Realtime | Chat + notifications |

### Supabase Escalation Path
1. **Now:** Supabase Pro plan (~100k MAU)
2. **Growing:** Enable read replicas + PgBouncer
3. **Scaling:** Supabase Edge Functions for API calls (weather, flights)
4. **Large scale:** Self-host Supabase on VPS/Kubernetes + Cloudflare R2 for assets
5. **High traffic:** Upstash Redis caching layer for external API responses

---

## 🔐 Auth Model

```
Supabase Auth User
  └── user_metadata: {
        role: 'manager' | 'frontoffice' | 'superadmin',
        hotel_id: uuid
      }

Room TV (Guest):
  - No Supabase Auth user
  - Static room PIN login
  - Session in localStorage (no timeout)
  - Offline-capable via service worker
```

---

## 🗄️ Core Database Tables

```
hotels          — hotel profiles, wifi, timezone, background
room_types      — Deluxe / Suite / Standard etc.
rooms           — individual rooms, guest info, occupancy
staff           — frontoffice + manager accounts per hotel
notifications   — from front office → room(s)
chat_messages   — guest ↔ front office realtime chat
alarms          — guest-set wake-up calls for front office
promos          — hotel deal posters with validity
services        — configurable service types per hotel
service_requests — guest requests submitted from room TV
```

---

## 🎨 Design Principles

### TV Dashboard (1920×1080)
- Fixed pixel layout — no responsive breakpoints
- Full-bleed background image (hotel-configurable)
- Frosted glass widget cards (`backdrop-blur`)
- Font: `Playfair Display` (display) + `DM Sans` (data)
- D-pad navigation with visible teal focus ring
- Ticking SVG analog clocks

### Staff Panels (Desktop)
- Dark sidebar + light content area
- Font: `Geist` or `IBM Plex Sans`
- Teal accent color
- Color-coded status badges

---

## 📝 Global AI Coding Rules

Apply these rules in **every phase**:

1. **Multi-tenancy first** — Always filter Supabase queries by `hotel_id`. Never trust client-side filtering alone; RLS is the real security layer.
2. **TypeScript strict mode** — All files must be `.tsx` / `.ts` with proper types. No `any`.
3. **Server Components by default** — Use React Server Components for data fetching; use `'use client'` only when needed (interactivity, hooks, browser APIs).
4. **Error boundaries** — Wrap every major section in an error boundary or `try/catch` with user-facing fallback UI.
5. **Environment variables** — All API keys go in `.env.local`. Never hardcode secrets.
6. **Supabase client pattern** — Use `createServerClient` for Server Components/API routes and `createBrowserClient` for Client Components. Never mix.
