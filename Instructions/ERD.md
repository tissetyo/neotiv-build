# 🗄️ Neotiv — Entity Relationship Diagram (ERD)

> This document defines all database tables, columns, types, relationships, and constraints.  
> Use this as the single source of truth for all database work.

---

## 📊 ERD Diagram (Text)

```
platform_settings (1 row)
  └── global config

activity_log
  └── actor: auth.users

hotels
  ├── room_types (1:N)
  │     └── rooms (1:N)
  ├── rooms (1:N)
  │     ├── notifications (1:N)
  │     ├── chat_messages (1:N)
  │     ├── alarms (1:N)
  │     └── service_requests (1:N)
  │           └── services (N:1)
  ├── staff (1:N)
  │     └── auth.users (N:1)
  ├── promos (1:N)
  ├── services (1:N)
  └── announcements (1:N)

service_icon_presets (global, no hotel_id)
```

---

## 📐 Full Schema Reference

### `hotels`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default uuid_generate_v4() | Primary key |
| slug | text | UNIQUE, NOT NULL | URL slug e.g. `amartha-hotel` |
| name | text | NOT NULL | Display name |
| logo_url | text | nullable | Supabase Storage URL |
| location | text | nullable | City, Country |
| timezone | text | NOT NULL, default `Asia/Jakarta` | IANA timezone string |
| default_background_url | text | nullable | Hotel-wide TV background |
| wifi_ssid | text | nullable | WiFi network name |
| wifi_password | text | nullable | WiFi password |
| wifi_username | text | nullable | WiFi username (if required) |
| clock_timezone_1 | text | default `America/New_York` | Analog clock 1 timezone |
| clock_label_1 | text | default `New York` | Analog clock 1 label |
| clock_timezone_2 | text | default `Europe/Paris` | Analog clock 2 timezone |
| clock_label_2 | text | default `France` | Analog clock 2 label |
| clock_timezone_3 | text | default `Asia/Shanghai` | Analog clock 3 timezone |
| clock_label_3 | text | default `China` | Analog clock 3 label |
| airport_iata_code | text | nullable | e.g. `DPS` for Ngurah Rai |
| latitude | decimal(10,8) | nullable | Hotel GPS lat |
| longitude | decimal(11,8) | nullable | Hotel GPS lng |
| is_active | boolean | default true | Soft disable hotel |
| created_at | timestamptz | default now() | |

**Relationships:**
- `hotels` → `room_types` (1:N via `room_types.hotel_id`)
- `hotels` → `rooms` (1:N via `rooms.hotel_id`)
- `hotels` → `staff` (1:N via `staff.hotel_id`)
- `hotels` → `promos` (1:N)
- `hotels` → `services` (1:N)
- `hotels` → `announcements` (1:N)

---

### `room_types`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| name | text | NOT NULL | e.g. `Deluxe`, `Suite` |
| description | text | nullable | |
| created_at | timestamptz | default now() | |

---

### `rooms`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| room_type_id | uuid | FK → room_types.id ON DELETE SET NULL | nullable |
| room_code | text | NOT NULL | e.g. `417`, `101A` |
| is_occupied | boolean | default false | Current occupancy status |
| pin | text | nullable | 4-digit PIN for TV login |
| background_url | text | nullable | Room-specific override |
| guest_name | text | nullable | Current guest full name |
| guest_photo_url | text | nullable | Supabase Storage URL |
| custom_welcome_message | text | nullable | Override default message |
| checkin_date | date | nullable | |
| checkout_date | date | nullable | |
| created_at | timestamptz | default now() | |

**Unique constraint:** `(hotel_id, room_code)`

---

### `staff`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| user_id | uuid | FK → auth.users(id) ON DELETE CASCADE | Supabase Auth user |
| role | text | CHECK IN ('frontoffice', 'manager') | |
| name | text | nullable | Display name |
| email | text | nullable | For display only (source of truth is auth.users) |
| is_active | boolean | default true | Revoke access |
| created_at | timestamptz | default now() | |

---

### `notifications`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| room_id | uuid | FK → rooms.id ON DELETE CASCADE | null = broadcast to all rooms |
| title | text | NOT NULL | Max 60 chars |
| body | text | nullable | Max 300 chars |
| is_read | boolean | default false | Read by guest |
| created_by | uuid | FK → staff.id ON DELETE SET NULL | Staff who sent it |
| created_at | timestamptz | default now() | |

---

### `chat_messages`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| room_id | uuid | FK → rooms.id ON DELETE CASCADE | |
| sender_role | text | CHECK IN ('guest', 'frontoffice') | |
| sender_name | text | nullable | Staff name or guest name |
| message | text | NOT NULL | |
| is_read | boolean | default false | Read by the other party |
| created_at | timestamptz | default now() | |

---

### `alarms`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| room_id | uuid | FK → rooms.id ON DELETE CASCADE | |
| scheduled_time | timestamptz | NOT NULL | When to call the room |
| note | text | nullable | Guest's note to staff |
| is_acknowledged | boolean | default false | Staff marked as done |
| created_at | timestamptz | default now() | |

---

### `promos`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| title | text | NOT NULL | Promo name |
| description | text | nullable | Full description |
| poster_url | text | nullable | Supabase Storage URL |
| valid_from | date | nullable | |
| valid_until | date | nullable | |
| is_active | boolean | default true | Show/hide in TV deals |
| created_at | timestamptz | default now() | |

---

### `services`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| name | text | NOT NULL | e.g. `Room Service` |
| icon | text | nullable | Emoji or icon identifier |
| description | text | nullable | |
| sort_order | int | default 0 | Display order in TV grid |
| is_active | boolean | default true | |
| created_at | timestamptz | default now() | |

---

### `service_requests`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE | |
| room_id | uuid | FK → rooms.id ON DELETE CASCADE | |
| service_id | uuid | FK → services.id ON DELETE SET NULL | |
| note | text | nullable | Guest's additional note |
| status | text | CHECK IN ('pending', 'in_progress', 'done', 'cancelled'), default 'pending' | |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

---

### `announcements`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| hotel_id | uuid | FK → hotels.id ON DELETE CASCADE, nullable | null = all hotels |
| text | text | NOT NULL | Marquee scrolling text |
| is_active | boolean | default true | |
| created_at | timestamptz | default now() | |

---

### `platform_settings`

Single-row configuration table (enforced by `id = 1` check constraint).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | int | PK, default 1 | Always 1 |
| maintenance_mode | boolean | default false | Global maintenance toggle |
| maintenance_message | text | default 'Under maintenance.' | Shown on TV when ON |
| updated_at | timestamptz | default now() | |

---

### `activity_log`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| actor_id | uuid | FK → auth.users(id) ON DELETE SET NULL | Who did the action |
| actor_email | text | nullable | Cached for display |
| action | text | NOT NULL | e.g. `hotel.created`, `staff.invited` |
| target_type | text | nullable | `hotel`, `staff`, `room` |
| target_id | uuid | nullable | ID of the affected record |
| meta | jsonb | nullable | Extra context (e.g., `{ hotel_name: "Amartha" }`) |
| created_at | timestamptz | default now() | |

**Common action strings:**
- `hotel.created` / `hotel.deactivated` / `hotel.reactivated` / `hotel.deleted`
- `staff.invited` / `staff.role_changed` / `staff.suspended` / `staff.reactivated`
- `room.created` / `room.deleted`
- `announcement.broadcast`

---

### `service_icon_presets`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| emoji | text | NOT NULL | Emoji character |
| label | text | NOT NULL | Display name |
| is_active | boolean | default true | |
| sort_order | int | default 0 | |

---

## 🔗 Relationship Summary

```
auth.users (Supabase managed)
    └── staff.user_id (1:1)

hotels (1)
    ├──< room_types (N)
    │       └──< rooms.room_type_id (N)
    ├──< rooms (N)
    │       ├──< notifications (N)
    │       ├──< chat_messages (N)
    │       ├──< alarms (N)
    │       └──< service_requests (N)
    │               └──> services (1)
    ├──< staff (N)
    │       └──> auth.users (1)
    ├──< promos (N)
    ├──< services (N)
    └──< announcements (N)  [hotel_id nullable for global announcements]

platform_settings (singleton)
activity_log (append-only log)
service_icon_presets (global, no hotel)
```

---

## 🗂️ Storage Buckets (Supabase Storage)

| Bucket | Path Pattern | Access | Contents |
|---|---|---|---|
| `hotel-assets` | `/{hotel_id}/logo.*` | Private (staff only) | Hotel logos |
| `hotel-assets` | `/{hotel_id}/backgrounds/{filename}` | Public | Background images |
| `room-assets` | `/{hotel_id}/{room_id}/guest-photo.*` | Private (staff only) | Guest photos |
| `promos` | `/{hotel_id}/{promo_id}/poster.*` | Public | Promo poster images |

All files uploaded via Supabase Storage JS client using `service_role_key` on server-side routes.  
Public URLs used for TV display (backgrounds, promos). Private URLs accessed via signed URLs for guest photos.

---

## 🔁 Indexes (Performance)

```sql
-- High-frequency queries
create index idx_rooms_hotel_id on rooms(hotel_id);
create index idx_notifications_room_id on notifications(room_id);
create index idx_notifications_hotel_id_created on notifications(hotel_id, created_at desc);
create index idx_chat_messages_room_id_created on chat_messages(room_id, created_at);
create index idx_service_requests_hotel_status on service_requests(hotel_id, status);
create index idx_alarms_hotel_time on alarms(hotel_id, scheduled_time) where is_acknowledged = false;
create index idx_staff_user_id on staff(user_id);
create index idx_activity_log_created on activity_log(created_at desc);
```

---

## 🔄 Realtime Tables

Enable Supabase Realtime publication for these tables:

```sql
-- Enable realtime replication
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table alarms;
alter publication supabase_realtime add table service_requests;
alter publication supabase_realtime add table rooms; -- for occupancy updates
```
