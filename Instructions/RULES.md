# 📏 Neotiv — Rules

> These rules are **non-negotiable**. Apply every single one in every file you generate.  
> If a rule conflicts with a user request, follow the rule and explain why.

---

## 🔒 Security Rules

### RULE-S1: Never Expose Service Role Key
`SUPABASE_SERVICE_ROLE_KEY` is server-side only. It must never appear in:
- Any `'use client'` component
- Any file that gets bundled to the browser
- Any `NEXT_PUBLIC_` environment variable

Only use it in: API routes (`/api/...`), Server Actions, `middleware.ts`.

### RULE-S2: RLS Is the Security Layer
Row Level Security (RLS) must be enabled on every table. Client-side `hotel_id` filtering is UX convenience, not security. Assume any client can send any `hotel_id` — RLS must block unauthorized access at the DB level.

Always test: "Would a manager from Hotel A be able to read Hotel B's data?" The answer must be NO.

### RULE-S3: Room PIN Verification Is Server-Side Only
Room PINs are verified in an API route using `service_role_key`. Never fetch the `rooms.pin` column to the client and compare it in the browser.

```typescript
// ❌ WRONG — exposes PIN to browser
const { data } = await supabase.from('rooms').select('pin').eq('room_code', roomCode);
if (data[0].pin === enteredPin) { ... }

// ✅ CORRECT — server-side API route only
// POST /api/room/login → verifies PIN using service role key → returns session token
```

### RULE-S4: No Hardcoded Secrets
All API keys, tokens, and credentials live in `.env.local` (dev) and environment variables (production). No secrets in source code, no secrets in comments.

### RULE-S5: Auth Middleware on Every Protected Route
Every route under `/[hotelSlug]/frontoffice`, `/[hotelSlug]`, and `/admin` must be protected by `middleware.ts`. An unauthenticated request always redirects to the login page.

---

## 🏗️ Architecture Rules

### RULE-A1: Multi-Tenancy by hotel_id
Every query that touches hotel-specific data must include `.eq('hotel_id', hotelId)`. No exceptions. The `hotelId` must come from the authenticated user's metadata, not from a URL param alone.

```typescript
// ❌ WRONG — hotel_id from URL, unverified
const hotelId = params.hotelSlug; // This is a slug, not an ID, and unverified

// ✅ CORRECT — hotel_id from auth user metadata
const user = await getUser();
const hotelId = user.user_metadata.hotel_id;
const { data } = await supabase.from('rooms').select('*').eq('hotel_id', hotelId);
```

### RULE-A2: Server Components by Default
Use React Server Components for all data fetching. Only add `'use client'` when the component genuinely needs:
- `useState` / `useEffect` / `useReducer`
- Browser APIs (`window`, `navigator`, `localStorage`)
- Event listeners (click, keydown)
- Supabase Realtime subscriptions

### RULE-A3: Supabase Client Separation
Never mix server and browser Supabase clients.

```typescript
// Server Components / API Routes / Middleware
import { createServerClient } from '@supabase/ssr'

// Client Components ('use client')
import { createBrowserClient } from '@supabase/ssr'
```

### RULE-A4: Environment Variable Naming
- `NEXT_PUBLIC_` prefix: safe to expose to browser (anon key, public URLs, map keys, weather keys)
- No prefix: server-side only (service role key, flight API key, Redis token)

### RULE-A5: API Routes for Sensitive Operations
Operations that require `service_role_key` must go through Next.js API routes or Server Actions:
- Room PIN verification
- Staff invitation
- Role changes
- Hotel deactivation

---

## 💻 Code Quality Rules

### RULE-C1: TypeScript Strict Mode — No `any`
All files are `.ts` or `.tsx`. TypeScript strict mode is enabled. Do not use `any`. Use proper types, `unknown` with type guards, or generate Supabase types with:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

### RULE-C2: Explicit Return Types on Functions
All exported functions and async functions must have explicit return types.

```typescript
// ❌ 
async function getRooms(hotelId: string) { ... }

// ✅
async function getRooms(hotelId: string): Promise<Room[]> { ... }
```

### RULE-C3: Error Handling Is Mandatory
Every `async` operation must have a `try/catch` or handle Supabase's `{ data, error }` pattern:

```typescript
const { data, error } = await supabase.from('rooms').select('*');
if (error) {
  console.error('Failed to fetch rooms:', error.message);
  throw new Error('Could not load rooms');
}
```

Never silently swallow errors.

### RULE-C4: No Direct DOM Manipulation
Never use `document.getElementById` or `document.querySelector`. Use React refs (`useRef`) instead.

### RULE-C5: Cleanup Realtime Subscriptions
Every Supabase Realtime subscription must be cleaned up:

```typescript
useEffect(() => {
  const channel = supabase.channel('room-notifications')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // ← always cleanup
  };
}, []);
```

---

## 🎨 UI / Design Rules

### RULE-D1: No Responsive Breakpoints on TV Pages
TV dashboard pages (`/[hotelSlug]/dashboard/[roomCode]/*`) are fixed at 1920×1080px. Do not add `sm:`, `md:`, `lg:`, or `xl:` Tailwind prefixes on TV pages. Use fixed `px` or viewport units calibrated for 1920×1080.

### RULE-D2: Approved Font Families
- TV Dashboard: `Playfair Display` (headings) + `DM Sans` (body/data)
- Staff panels: `IBM Plex Sans` (all text)
- Do NOT use: `Inter`, `Roboto`, `Arial`, `system-ui`, `sans-serif` as primary fonts

### RULE-D3: Every Widget Has a Loading State
Every dashboard widget must render a skeleton/shimmer while data loads. No raw blank spaces or spinners without context.

```tsx
// Every widget:
{isLoading ? <WidgetNameSkeleton /> : <WidgetName data={data} />}
```

### RULE-D4: Every Widget Has an Error State
Every widget wrapped in an error boundary. Display a minimal, friendly fallback — not a raw error stack trace.

### RULE-D5: D-pad Focus Ring Is Always Visible
Every focusable element on the TV dashboard must have a visible focus indicator:
```css
.focusable:focus {
  outline: 2px solid #14b8a6;
  outline-offset: 4px;
}
```
Never use `outline: none` or `outline: 0` on TV pages.

### RULE-D6: Color Tokens via CSS Variables
Do not hardcode hex colors in components. Use CSS variables defined in `globals.css`:
```css
--color-teal: #14b8a6;
--color-glass-bg: rgba(15, 23, 42, 0.55);
```

---

## 📦 State Management Rules

### RULE-ST1: Zustand for Global TV State
Room-level data (guest info, hotel config, widget data) lives in Zustand `roomStore`. This enables offline access — data survives page navigation.

### RULE-ST2: Offline Queue Uses localStorage
Service requests and chat messages submitted while offline are stored in `localStorage` key `neotiv_offline_queue_{hotelSlug}_{roomCode}`. The queue flushes automatically when `navigator.onLine` becomes `true`.

### RULE-ST3: Server State via SWR or Server Components
Data that doesn't need to be in Zustand (tables, lists, forms) uses SWR (`useSWR`) for client components or React Server Components for server rendering. Don't duplicate server state in Zustand.

---

## 🧪 Testing Rules

### RULE-T1: Acceptance Criteria = Definition of Done
Each phase file has an "Acceptance Criteria" section. All items must be checked before a phase is considered complete.

### RULE-T2: Test Multi-Tenancy Manually
After any data feature is built, manually test:
1. Log in as Manager A (Hotel A) → should see only Hotel A data
2. Log in as Manager B (Hotel B) → should see only Hotel B data
3. Attempt to fetch Hotel A's rooms with Hotel B's auth token → should return 0 rows or error

### RULE-T3: Test Offline Manually
For TV dashboard features:
1. Load the dashboard with Wi-Fi on → data loads
2. Disable Wi-Fi → dashboard still renders (from cache)
3. Submit a service request offline → queued indicator shown
4. Re-enable Wi-Fi → request submits, confirmation shown
