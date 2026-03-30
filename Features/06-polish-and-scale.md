# Phase 6 — Polish & Scale Preparation

> **Prerequisite:** Phases 1–5 complete and all panels working end-to-end.  
> **Goal:** Integrate remaining external APIs, harden the app for production, optimize performance, and put scaling infrastructure in place.

---

## 📋 Tasks

- [ ] Flight Schedule: integrate AviationStack API
- [ ] Google Map widget: real embed with hotel pin
- [ ] App grid: fullscreen iframe launcher + TV mode event
- [ ] PWA audit + Lighthouse score optimization
- [ ] Supabase RLS security audit
- [ ] Upstash Redis caching for weather + flight API calls
- [ ] Image optimization (Supabase Storage + Next.js Image)
- [ ] Error boundaries + loading skeletons for all widgets
- [ ] Offline UX polish (sync indicators, queue feedback)
- [ ] Production deployment checklist
- [ ] Escalation runbook documentation

---

## ✈️ Task 1 — Flight Schedule Widget (AviationStack API)

**Files:** `src/components/tv/FlightSchedule.tsx`, `src/app/api/flights/route.ts`

### API Route (server-side, key is secret)

```typescript
// GET /api/flights?airport=DPS&type=departure
// Calls: http://api.aviationstack.com/v1/flights
//   ?access_key={AVIATIONSTACK_API_KEY}
//   &dep_iata={airport}
//   &limit=12
//
// Response mapping:
// flight_date, flight.iata → Flight
// departure.scheduled (time only) → Time
// arrival.airport → Destination
// departure.gate → Gate
// flight_status → Remarks (map to: scheduled → ON SCHEDULE, delayed → DELAY,
//   cancelled → CLOSED, active → GATE OPEN, landed → CHECK-IN, etc.)
//
// Cache response for 5 minutes (use Upstash Redis, see Task 6)
// Return mapped array to client
```

### Widget Update

```typescript
// In FlightSchedule.tsx:
// - Fetch from /api/flights on mount
// - Refetch every 5 minutes
// - Show loading skeleton while fetching
// - Show "No flight data available" if API fails
// - Airport code configurable per hotel (add airports field to hotels table or use location)
```

### Airport Field (DB update)

```sql
alter table hotels add column if not exists airport_iata_code text;
-- e.g., 'DPS' for Ngurah Rai Bali
```

Add this field to the Hotel Settings → General tab.

---

## 🗺️ Task 2 — Google Map Widget

**File:** `src/components/tv/MapWidget.tsx`

### Implementation

```typescript
// Use Google Maps Embed API (no JS SDK needed, just an iframe)
// URL: https://www.google.com/maps/embed/v1/place
//   ?key={NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}
//   &q={encodeURIComponent(hotelName + ', ' + hotelLocation)}
//   &zoom=15
//
// Widget: iframe inside a fixed card, pointer-events-none (no interaction in mini view)
// On D-pad Enter → expand to fullscreen overlay with pointer-events-auto (interactive)
// Fullscreen has close button (Escape key)
```

### Hotel Coordinates (optional precision)

```sql
alter table hotels add column if not exists latitude decimal(10, 8);
alter table hotels add column if not exists longitude decimal(11, 8);
```

If lat/lng provided, use `&center={lat},{lng}&zoom=16` for more precise pin.  
Add lat/lng inputs to Hotel Settings → General tab.

---

## 📱 Task 3 — App Grid Fullscreen Launcher

**File:** `src/components/tv/AppGrid.tsx`, `src/components/tv/AppLauncher.tsx`

### Fullscreen Iframe Apps

For apps that support web embedding (YouTube TV, Spotify):

```typescript
// AppLauncher component:
// - Renders a full-screen portal overlay (fixed inset-0, z-50, bg-black)
// - Contains an <iframe> with the app URL
// - "Back" button in top-left corner (semi-transparent, auto-hides after 3s)
// - Press Escape → close launcher
// - D-pad focus: when launcher is open, only focus the "Back" button (trap focus)
//
// Apps using window.open (Netflix, Disney+, etc.):
// - Show a QR code overlay: "Scan to open on your device"
// - Display QR pointing to the app URL
// - Also show "Open in browser" button
```

### TV Mode

```typescript
// TV app tile:
// - Dispatch a custom DOM event: new CustomEvent('neotiv:switch-to-tv', { bubbles: true })
// - Set-top box native app listens for this event and switches HDMI/TV signal
// - Show a brief "Switching to TV..." overlay while transition happens
```

### YouTube App

```typescript
// URL: https://www.youtube.com/tv
// Opens in fullscreen iframe
// Note: YouTube TV mode works best on TV-capable browsers
// Fallback: show QR code pointing to https://youtube.com/tv
```

---

## 🔒 Task 4 — Supabase RLS Audit

Review and verify all RLS policies:

### Checklist

```
[ ] hotels:
    - superadmin: full CRUD ✓
    - manager: SELECT own, UPDATE own ✓
    - NO public read (hotel wifi passwords must be private) ✓

[ ] rooms:
    - staff: full CRUD filtered by hotel_id ✓
    - Guest (no auth): rooms must be readable via service_role_key only (from API route) ✓
    - NO anon SELECT on rooms (PIN in rooms.pin is sensitive) ✓

[ ] notifications:
    - staff: full CRUD by hotel_id ✓
    - Realtime: enable replication on notifications table ✓

[ ] chat_messages:
    - staff: full CRUD by hotel_id ✓
    - Realtime: enable replication ✓

[ ] alarms:
    - staff: full CRUD by hotel_id ✓

[ ] service_requests:
    - staff: full CRUD by hotel_id ✓

[ ] promos:
    - staff: full CRUD by hotel_id ✓
    - Public preview (for future marketing pages): SELECT where is_active = true (optional)

[ ] platform_settings:
    - superadmin: full CRUD ✓
    - All authenticated users: SELECT only ✓

[ ] activity_log:
    - superadmin: full CRUD ✓
    - managers: SELECT only for their hotel's entries ✓
```

### Enable Realtime Replication

In Supabase dashboard → Database → Replication, enable for:
- `notifications`
- `chat_messages`
- `alarms`
- `service_requests`

---

## ⚡ Task 5 — Upstash Redis Caching

**Purpose:** Reduce external API calls (OpenWeatherMap, AviationStack) and protect free tier quotas.

### Setup

```bash
npm install @upstash/redis
```

```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Cache Utility

**File:** `src/lib/utils/cache.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  const fresh = await fetcher();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
```

### Apply to API Routes

```typescript
// Weather API route: cache for 10 minutes per location
const weather = await getCached(
  `weather:${city}`,
  () => fetchWeatherFromOpenWeather(city),
  600
);

// Flight API route: cache for 5 minutes per airport
const flights = await getCached(
  `flights:${airportCode}`,
  () => fetchFlightsFromAviationStack(airportCode),
  300
);
```

---

## 🖼️ Task 6 — Image Optimization

### Next.js Image Component

Replace all `<img>` tags with `next/image` in staff panels:

```typescript
import Image from 'next/image';

// Guest photo
<Image
  src={guestPhotoUrl}
  alt={guestName}
  width={64}
  height={64}
  className="rounded-full object-cover"
/>
```

### Supabase Storage Image Transforms

For promo poster thumbnails, use Supabase image transforms to avoid loading full-size images:

```typescript
// Transform URL for thumbnails
const thumbnailUrl = supabase.storage
  .from('promos')
  .getPublicUrl(posterPath, {
    transform: { width: 300, height: 200, resize: 'cover' }
  }).data.publicUrl;
```

### `next.config.js` Image Domains

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: 'openweathermap.org',
    }
  ]
}
```

---

## 🧱 Task 7 — Error Boundaries + Loading States

### Error Boundary Component

**File:** `src/components/ui/ErrorBoundary.tsx`

```typescript
// Class component error boundary (React requirement)
// Props: { children, fallback?: ReactNode }
// On error: render fallback or default "Something went wrong" card
// Log error to console (or Sentry in production)
```

### TV Dashboard Widget Skeletons

Each widget should have a `<WidgetSkeleton />` loading state:

```typescript
// Skeleton: same dimensions as the real widget
// Animated shimmer: bg-white/10 with animate-pulse
// Show while data is loading (SWR isLoading or Suspense fallback)
```

### Wrap all widgets

```tsx
<ErrorBoundary fallback={<WidgetError name="Flight Schedule" />}>
  <Suspense fallback={<FlightScheduleSkeleton />}>
    <FlightSchedule />
  </Suspense>
</ErrorBoundary>
```

---

## 📶 Task 8 — Offline UX Polish

### Connection Status Indicator

**File:** `src/components/tv/ConnectionStatus.tsx`

```typescript
// Small indicator in dashboard corner (not intrusive)
// Online: invisible (no indicator)
// Offline: small amber dot + "Offline" text, fades in
// Reconnecting: pulsing dot
// Syncing: "Syncing [X] items..." with spinner
// Synced: brief green checkmark then disappears
```

### Offline Queue Visual Feedback

When a service request or chat is queued offline:

```typescript
// Show a toast: "Saved offline. Will send when connected."
// Service request submit button: shows "Queued" state if offline
// Chat send button: shows "Queued" state if offline
// When queue flushes: "✓ [X] items synced"
```

---

## 🚀 Task 9 — Production Deployment Checklist

### Environment Variables (Production)

```env
# Required for production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Never expose to client
NEXT_PUBLIC_OPENWEATHER_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=
AVIATIONSTACK_API_KEY=              # Server-side only
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Supabase Production Setup

```
[ ] Enable email confirmations in Auth settings
[ ] Set JWT expiry to 7 days (or appropriate for hotel use case)
[ ] Configure email templates (invite, password reset)
[ ] Set up daily backups (Supabase Pro)
[ ] Enable Supabase logging (Query performance)
[ ] Review all RLS policies one final time
[ ] Enable pg_cron for any scheduled cleanup (old alarms, expired promos)
```

### Vercel Deployment (recommended)

```
[ ] Connect GitHub repo to Vercel
[ ] Set all environment variables in Vercel dashboard
[ ] Configure custom domain
[ ] Enable Vercel Analytics
[ ] Set Node.js version to 20.x
[ ] Confirm PWA service worker generates correctly in production build
```

### Pre-Launch Testing

```
[ ] Test PIN login on actual TV/set-top box browser
[ ] Test D-pad navigation with physical remote
[ ] Test offline mode: disconnect WiFi → dashboard stays functional
[ ] Reconnect WiFi → offline queue flushes correctly
[ ] Test on Chrome (TV browser), Safari (iPad), Firefox
[ ] Load test: 20 simultaneous room dashboards connected
[ ] Verify Supabase Realtime works across multiple concurrent connections
```

---

## 📖 Task 10 — Escalation Runbook

**File:** `docs/escalation-runbook.md` (in project repo)

Document the following:

### When to escalate from Supabase Free → Pro
- Trigger: >500 MAU, or >500MB database, or >1GB storage
- Action: Upgrade plan in Supabase dashboard. No code changes required.

### When to enable read replicas
- Trigger: Dashboard queries slow (>500ms), read-heavy load
- Action: Supabase dashboard → Settings → Read Replicas → Enable
- Code change: Route read queries to replica URL via `SUPABASE_REPLICA_URL` env var

### When to migrate images to Cloudflare R2
- Trigger: Storage costs high or CDN speed needed globally
- Action:
  1. Create Cloudflare R2 bucket
  2. Migrate existing images via rclone
  3. Update `NEXT_PUBLIC_STORAGE_BASE_URL` env var
  4. All image URLs in DB should use relative paths (not full Supabase URLs) to make migration easy

### When to add PgBouncer
- Trigger: "Too many connections" errors
- Action: Already built into Supabase. Enable in Settings → Database → Connection Pooling

### When to self-host Supabase
- Trigger: >$500/month on managed Supabase, or data sovereignty requirement
- Action: Deploy [supabase/supabase](https://github.com/supabase/supabase) on VPS using Docker Compose
- Same API, same client libraries, zero code changes

### When to add Redis caching
- Already done in Phase 6 via Upstash
- Upstash free tier: 10k requests/day. Upgrade when exceeded.

---

## ✅ Acceptance Criteria for Phase 6

- [ ] Flight schedule shows real flight data from AviationStack (or graceful mock fallback)
- [ ] Flight data refreshes every 5 minutes without page reload
- [ ] Google Maps widget shows correct hotel pin in mini + fullscreen mode
- [ ] YouTube TV opens fullscreen with back button visible
- [ ] Offline apps (Netflix, Disney+) show QR code overlay
- [ ] TV mode dispatches correct custom event
- [ ] All RLS policies verified — no unauthorized data access
- [ ] Realtime replication enabled on notification + chat tables
- [ ] Weather data is cached in Redis (verify: second request returns cached result)
- [ ] Flight data is cached in Redis
- [ ] All widgets have loading skeletons (no layout shift)
- [ ] All widgets wrapped in error boundaries (simulate error → fallback shows)
- [ ] Offline indicator appears when network drops
- [ ] Queued items sync and confirm when reconnected
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Performance score ≥ 80 on TV dashboard page
- [ ] Production build deploys to Vercel without errors
- [ ] Escalation runbook committed to repo
