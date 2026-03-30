# 📘 Neotiv — AI Instruction Guide

> This file explains **how to read and use** all documents in this project.  
> Give this file to the AI at the start of every session, alongside the relevant document for the task.

---

## 🧠 What is Neotiv?

Neotiv is a **multi-tenant hotel hospitality platform** with two core products:

1. **Room TV Dashboard** — A PWA displayed on hotel room TVs via set-top boxes. Guests see a personalized welcome screen, weather, clocks, flight info, hotel services, streaming apps, and more. Controlled by D-pad remote.

2. **Hotel Management Suite** — A web dashboard for hotel staff (front office, managers) and a platform-level super admin. Handles room personalization, notifications, chat, service requests, promos, and hotel configuration.

---

## 📁 Document Map

| File | Purpose | When to Use |
|---|---|---|
| `INSTRUCTION.md` | This file. How to use all documents. | Always include with any prompt |
| `RULES.md` | Non-negotiable coding + architecture rules | Always include with any prompt |
| `ERD.md` | Entity Relationship Diagram + all table schemas | Include when working on DB, API, or data models |
| `BACKEND.md` | Backend architecture, API routes, data flow, stack | Include when working on API routes, server logic, auth |
| `FRONTEND.md` | Frontend architecture, component structure, state | Include when building UI components or pages |
| `UI-UX.md` | Design system, UI guidelines, UX flows, wireframes | Include when building any UI screen |
| `TASKS.md` | Master task list broken into phases | Include to understand what's done and what's next |
| `00-README.md` | Project overview + quick reference | Include as context for any session |
| `01-foundation.md` | Phase 1 build prompt | When building project foundation |
| `02-tv-dashboard.md` | Phase 2 build prompt | When building TV dashboard |
| `03-frontoffice.md` | Phase 3 build prompt | When building front office panel |
| `04-hotel-management.md` | Phase 4 build prompt | When building hotel management panel |
| `05-super-admin.md` | Phase 5 build prompt | When building super admin panel |
| `06-polish-and-scale.md` | Phase 6 build prompt | When polishing and scaling |

---

## 🔄 Recommended Session Workflow

### Starting a new feature or phase:

```
Prompt = INSTRUCTION.md + RULES.md + [relevant phase file] + [optional: ERD.md or BACKEND.md]
```

### Fixing a bug or editing existing code:

```
Prompt = INSTRUCTION.md + RULES.md + [the file(s) with the bug]
```

### Building a new UI screen:

```
Prompt = INSTRUCTION.md + RULES.md + UI-UX.md + FRONTEND.md + [relevant phase file]
```

### Working on database or API:

```
Prompt = INSTRUCTION.md + RULES.md + ERD.md + BACKEND.md
```

---

## 🎯 Project Scope Summary

### 4 User Panels

| Panel | URL | Auth |
|---|---|---|
| Room TV (Guest) | `/[hotelSlug]/dashboard/[roomCode]` | PIN login (no Supabase Auth) |
| Front Office | `/[hotelSlug]/frontoffice` | Supabase Auth, role: `frontoffice` or `manager` |
| Hotel Management | `/[hotelSlug]` | Supabase Auth, role: `manager` |
| Super Admin | `/admin` | Supabase Auth, role: `superadmin` |

### Key Technical Concepts

**Multi-tenancy:** Every database query must be scoped by `hotel_id`. Supabase RLS enforces this at the database level. Never rely only on client-side filtering.

**PWA + Offline:** The Room TV dashboard must work when the internet drops. Guest info, widgets, and layout are cached by the service worker. Actions (chat, service requests) queue offline and sync on reconnect.

**Realtime:** Notifications and chat use Supabase Realtime (WebSocket). Always clean up subscriptions in `useEffect` return.

**D-pad Navigation:** The Room TV is controlled by a TV remote. All interactive elements must be keyboard-navigable via arrow keys + Enter. No mouse interaction assumed.

**Fixed Layout for TV:** The TV dashboard is exactly 1920×1080px. Do not use responsive CSS breakpoints on TV pages. Use fixed `px` or `vw/vh` units calibrated for 16:9.

---

## 🚫 What AI Should NOT Do

- Do not add `any` TypeScript types
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- Do not skip RLS — never add `{ count: 'exact' }` to bypass row limits without RLS consideration
- Do not use `localStorage` for sensitive data (PIN is verified server-side, only session token stored)
- Do not add responsive breakpoints to TV dashboard pages
- Do not use `Inter` or `Roboto` fonts — see `UI-UX.md` for font choices
- Do not skip error boundaries on widgets
- Do not hardcode hotel IDs or slugs

---

## ✅ Definition of Done (per feature)

A feature is complete when:
1. TypeScript compiles with no errors
2. The feature matches the wireframe/spec in `UI-UX.md`
3. RLS is enforced (test with a different hotel's token — should return 0 rows)
4. Loading state (skeleton) is shown while data fetches
5. Error state is handled with a user-facing message
6. Offline behavior is correct (if applicable)
7. D-pad navigation works (if TV panel)
8. Acceptance criteria in the phase file are met
