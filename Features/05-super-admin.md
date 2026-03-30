# Phase 5 — Super Admin Panel

> **Prerequisite:** Phases 1–4 complete.  
> **Goal:** Build the super admin panel for platform-level management — create hotels, manage all accounts, broadcast announcements, and monitor platform health.  
> **Auth:** Requires `role: 'superadmin'` in Supabase user metadata.  
> **URL:** `/admin`

---

## 📋 Tasks

- [ ] Super admin login page
- [ ] Admin panel layout (sidebar + main)
- [ ] Section: Hotel Management (list, create, deactivate)
- [ ] Section: Account Management (all managers, assign to hotels)
- [ ] Section: Global Announcements (broadcast marquee to all hotels)
- [ ] Section: Platform Settings (service icons library, timezone presets)
- [ ] Section: Usage Monitoring (counts, storage, escalation alerts)

---

## 🔐 Auth

**File:** `src/app/admin/login/page.tsx`

- Same email + password form as staff login
- On success: check `user.user_metadata.role === 'superadmin'`
- Redirect to `/admin` on success
- Show "Access denied" if role is not superadmin

**Seeding a superadmin (one-time setup):**

```sql
-- Run in Supabase SQL editor after creating the user manually in Auth dashboard
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "superadmin"}'::jsonb
where email = 'admin@neotiv.com';
```

---

## 🏗️ Layout

**File:** `src/app/admin/layout.tsx`

```
┌───────────────────────────────────────────────────────┐
│  [N] Neotiv Admin                  [admin name] [🔔]  │
├───────────┬───────────────────────────────────────────┤
│           │                                           │
│  🏨 Hotels │                                           │
│  👤 Accounts│                                          │
│  📢 Announce│                                          │
│  ⚙️ Settings│                                          │
│  📊 Monitor │                                          │
│           │                                           │
│  [logout] │                                           │
└───────────┴───────────────────────────────────────────┘
```

- Sidebar: `bg-slate-950`, accent color: red/rose (distinct from hotel panels which use teal)
- Label "Super Admin" in sidebar header to visually distinguish
- Default route `/admin` → redirects to `/admin/hotels`

---

## 🏨 Section 1 — Hotel Management

**File:** `src/app/admin/hotels/page.tsx`

### Hotel List

- Table with columns: Hotel Name | Slug | Location | Rooms | Managers | Status | Created | Actions
- Status badge: `Active` (green) / `Inactive` (slate)
- Search by name or slug
- Sort by name or created date

### Create Hotel

Full-page form or large dialog:

```
Hotel Name      [text input, required]
URL Slug        [text input, auto-generated from name, editable]
                Preview: neotiv.com/[slug]/dashboard/[room]
Location        [text input]
Timezone        [timezone select]
```

On submit:
1. Validate slug is unique (`hotels.slug` unique constraint)
2. Insert to `hotels` table
3. Insert default services (Room Service, Laundry, Spa, Car, Bike) for the new hotel
4. Show success: "Hotel created! Share this URL with the hotel manager: /[slug]"

### View Hotel Detail

Click hotel name → detail page:

```
/admin/hotels/[hotelId]
```

Shows:
- Hotel info summary (name, slug, location, timezone)
- Rooms count + list (read-only)
- Manager accounts linked to this hotel
- Promo count, service count
- "Edit Hotel" button → same form as Hotel Settings (Phase 4)
- "Deactivate Hotel" button

### Deactivate Hotel

- Sets `hotels.is_active = false`
- Disables login for all staff of this hotel
- TV dashboards show "Hotel temporarily unavailable" message
- Confirm dialog with warning: "All [X] staff members will lose access."
- "Reactivate" button in hotel detail page if already inactive

### Delete Hotel (danger zone)

- Only shown if hotel has 0 occupied rooms and 0 active staff
- Hard delete with cascading removal of all related data
- Requires typing the hotel slug to confirm

---

## 👤 Section 2 — Account Management

**File:** `src/app/admin/accounts/page.tsx`

### Account List

- Table: Name | Email | Role | Hotel | Status | Last Login | Actions
- Filter by role: All / Manager / Front Office / Superadmin
- Filter by hotel

### Create Manager Account

Dialog:
```
Name          [text input]
Email         [email input]
Role          [select: Manager / Front Office]
Hotel         [hotel select dropdown]
```

Flow:
1. `supabase.auth.admin.inviteUserByEmail(email, { data: { role, hotel_id, name } })`
2. Insert to `staff` table
3. Show: "Invite sent to [email]"

### Edit Account

- Change role (dropdown)
- Change assigned hotel
- Updates both `staff` table and `auth.users.user_metadata` via admin API

### Reset Password

- Button: "Send Password Reset Email"
- Calls `supabase.auth.admin.generateLink({ type: 'recovery', email })`
- Shows the reset link (copy to clipboard) or sends directly to email

### Suspend / Reactivate Account

- Toggle: Active / Suspended
- Suspended: `supabase.auth.admin.updateUserById(userId, { ban_duration: '876600h' })` (100 years)
- Reactivate: `supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })`

---

## 📢 Section 3 — Global Announcements

**File:** `src/app/admin/announcements/page.tsx`

### Announcement Composer

```
Target         [radio: All Hotels / Specific Hotel]
Hotel          [hotel select, shown if Specific Hotel]
Text           [textarea, the marquee message]
Active         [toggle, default on]
[Broadcast]
```

- Inserts to `announcements` table with `hotel_id = null` for all hotels or specific `hotel_id`
- TV marquee bars: query `announcements WHERE (hotel_id = myHotelId OR hotel_id IS NULL) AND is_active = true`

### Active Announcements List

- Table: Text | Target | Created By | Created At | Active toggle | Delete
- Toggle active/inactive per announcement

---

## ⚙️ Section 4 — Platform Settings

**File:** `src/app/admin/settings/page.tsx`

### Tab 1: Service Icon Library

- Grid of all available preset service icons (emoji + label)
- Add new preset: emoji + label name
- These become the preset options in hotel service configuration (Phase 4)
- Store in a `service_icon_presets` table or as a JSON config

```sql
create table service_icon_presets (
  id uuid primary key default uuid_generate_v4(),
  emoji text not null,
  label text not null,
  is_active boolean default true,
  sort_order int default 0
);

-- Seed
insert into service_icon_presets (emoji, label) values
('🍽️', 'Room Service'),
('🍴', 'Restaurant'),
('🚗', 'Car Rental'),
('🛵', 'Scooter'),
('💆', 'Spa'),
('👕', 'Laundry'),
('🧹', 'Housekeeping'),
('🏊', 'Pool'),
('📞', 'Concierge'),
('🧴', 'Toiletries'),
('🅿️', 'Parking'),
('✈️', 'Airport Transfer');
```

### Tab 2: Timezone Presets

- List of timezone options shown in hotel clock config dropdowns
- Based on IANA timezone database
- Admin can add/remove from the selectable list

### Tab 3: Maintenance Mode

```
Maintenance Mode    [toggle]
Message             [textarea: "We'll be back shortly..."]
```

- When ON: all TV dashboards show maintenance overlay
- All staff panels show banner: "Platform in maintenance mode"
- Store in a `platform_settings` table (single row):

```sql
create table platform_settings (
  id int primary key default 1,
  maintenance_mode boolean default false,
  maintenance_message text default 'We are currently under maintenance.',
  updated_at timestamptz default now()
);

insert into platform_settings default values;
```

---

## 📊 Section 5 — Usage Monitoring

**File:** `src/app/admin/monitor/page.tsx`

### Summary Cards

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Hotels│ Total Rooms │ Occupied Now│ Active Staff│
│     12      │    340      │    218      │     48      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Hotel Health Table

- Table: Hotel Name | Rooms | Occupied % | Pending Requests | Unread Chats | Last Activity
- Color-code occupancy: <30% (slate), 30-70% (amber), >70% (green)

### Storage Usage

- Call Supabase Management API or estimate from known file counts
- Show: "Supabase Storage: ~1.2 GB used"
- Warn if approaching limits

### Escalation Alerts

Auto-show banners when thresholds are exceeded:

```typescript
const alerts = [
  {
    condition: totalRooms > 500,
    message: "⚠️ 500+ rooms detected. Consider enabling Supabase read replicas.",
    action: "View Escalation Guide",
    link: "/admin/settings/escalation"
  },
  {
    condition: storageGb > 4,
    message: "⚠️ Storage approaching 5GB. Consider migrating to Cloudflare R2.",
    action: "View Guide"
  },
  {
    condition: dailyActiveConnections > 80,
    message: "⚠️ High DB connections. Enable PgBouncer in Supabase dashboard.",
    action: "Open Supabase"
  }
];
```

### Activity Log

- Recent platform events: hotel created, staff invited, hotel deactivated
- Store in an `activity_log` table:

```sql
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid,
  actor_email text,
  action text,       -- 'hotel.created', 'staff.invited', 'hotel.deactivated'
  target_type text,  -- 'hotel', 'staff', 'room'
  target_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);
```

Log entries on: hotel creation, staff invite, hotel deactivation, role changes.

---

## 🗄️ Key API Routes (Admin)

### `POST /api/admin/hotels`
- Create a new hotel + seed default services
- Requires superadmin auth

### `PATCH /api/admin/hotels/[hotelId]/status`
- Body: `{ is_active: boolean }`
- Bans/unbans all staff for that hotel

### `POST /api/admin/accounts`
- Invite new manager/frontoffice account
- Requires superadmin auth

### `PATCH /api/admin/accounts/[userId]/role`
- Change role + hotel assignment

---

## ✅ Acceptance Criteria for Phase 5

- [ ] Super admin can log in at `/admin/login`
- [ ] Non-superadmin users cannot access `/admin` (redirect to `/admin/login`)
- [ ] Create hotel → hotel appears in list, slug works, default services created
- [ ] Deactivate hotel → staff login fails, TV shows offline message
- [ ] Reactivate hotel → restores access
- [ ] Invite manager → email received, manager can log in and access their hotel panel
- [ ] Change role from manager → frontoffice → manager loses access to hotel settings immediately
- [ ] Suspend account → user cannot log in
- [ ] Global announcement → appears in marquee on all hotel TV dashboards
- [ ] Hotel-specific announcement → appears only on that hotel's TV dashboards
- [ ] Maintenance mode ON → all TV dashboards show maintenance overlay
- [ ] Usage monitoring shows real hotel + room counts
- [ ] Escalation alert appears when threshold exceeded
- [ ] Activity log records hotel creation and staff invite actions
