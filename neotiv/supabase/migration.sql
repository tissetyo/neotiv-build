-- ================================================
-- NEOTIV — Full Database Migration
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- Migration 001 — Core Tables
-- =============================================

create table if not exists hotels (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  logo_url text,
  location text,
  timezone text not null default 'Asia/Jakarta',
  default_background_url text,
  wifi_ssid text,
  wifi_password text,
  wifi_username text,
  clock_timezone_1 text default 'America/New_York',
  clock_label_1 text default 'New York',
  clock_timezone_2 text default 'Europe/Paris',
  clock_label_2 text default 'France',
  clock_timezone_3 text default 'Asia/Shanghai',
  clock_label_3 text default 'China',
  airport_iata_code text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists room_types (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_type_id uuid references room_types(id) on delete set null,
  room_code text not null,
  is_occupied boolean default false,
  pin text,
  background_url text,
  guest_name text,
  guest_photo_url text,
  custom_welcome_message text,
  checkin_date date,
  checkout_date date,
  created_at timestamptz default now(),
  unique(hotel_id, room_code)
);

create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('frontoffice', 'manager')),
  name text,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean default false,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  sender_role text not null check (sender_role in ('guest', 'frontoffice')),
  sender_name text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists alarms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  scheduled_time timestamptz not null,
  note text,
  is_acknowledged boolean default false,
  created_at timestamptz default now()
);

create table if not exists promos (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  title text not null,
  description text,
  poster_url text,
  valid_from date,
  valid_until date,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  name text not null,
  icon text,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists service_requests (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid references hotels(id) on delete cascade,
  text text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists platform_settings (
  id int primary key default 1,
  maintenance_mode boolean default false,
  maintenance_message text default 'We are currently under maintenance.',
  updated_at timestamptz default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid,
  actor_email text,
  action text,
  target_type text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- Migration 002 — Row Level Security
-- =============================================

alter table hotels enable row level security;
alter table room_types enable row level security;
alter table rooms enable row level security;
alter table staff enable row level security;
alter table notifications enable row level security;
alter table chat_messages enable row level security;
alter table alarms enable row level security;
alter table promos enable row level security;
alter table services enable row level security;
alter table service_requests enable row level security;
alter table announcements enable row level security;
alter table platform_settings enable row level security;
alter table activity_log enable row level security;

-- Helper functions
create or replace function get_my_hotel_id()
returns uuid as $$
  select (raw_user_meta_data->>'hotel_id')::uuid
  from auth.users
  where id = auth.uid();
$$ language sql security definer;

create or replace function get_my_role()
returns text as $$
  select raw_user_meta_data->>'role'
  from auth.users
  where id = auth.uid();
$$ language sql security definer;

-- RLS Policies
create policy "superadmin all" on hotels for all using (get_my_role() = 'superadmin');
create policy "manager read own hotel" on hotels for select using (id = get_my_hotel_id());
create policy "manager update own hotel" on hotels for update using (id = get_my_hotel_id());

create policy "staff see own hotel rooms" on rooms for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "manager manage staff" on staff for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff notifications" on notifications for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff chat" on chat_messages for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff alarms" on alarms for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff promos" on promos for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff services" on services for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff service_requests" on service_requests for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff announcements" on announcements for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "staff room_types" on room_types for all using (hotel_id = get_my_hotel_id() or get_my_role() = 'superadmin');
create policy "admin platform_settings" on platform_settings for all using (get_my_role() = 'superadmin');
create policy "read platform_settings" on platform_settings for select using (auth.uid() is not null);
create policy "admin activity_log" on activity_log for all using (get_my_role() = 'superadmin');

-- =============================================
-- Migration 003 — Seed Data (dev only)
-- =============================================

insert into hotels (slug, name, location, timezone, wifi_ssid, wifi_password, wifi_username, airport_iata_code)
values ('amartha-hotel', 'Amartha Hotel', 'Kuta, Bali', 'Asia/Jakarta', 'HotelABC', 'stayinhereforwhile', 'Guest', 'DPS')
on conflict (slug) do nothing;

insert into room_types (hotel_id, name, description)
select id, 'Deluxe', 'Deluxe sea view room' from hotels where slug = 'amartha-hotel'
on conflict do nothing;

insert into room_types (hotel_id, name, description)
select id, 'Suite', 'Premium suite with private terrace' from hotels where slug = 'amartha-hotel'
on conflict do nothing;

insert into rooms (hotel_id, room_code, pin, guest_name, is_occupied)
select id, '417', '1234', 'Mr. Stephen Hawk', true from hotels where slug = 'amartha-hotel'
on conflict (hotel_id, room_code) do nothing;

insert into platform_settings default values on conflict do nothing;

-- Default services for seed hotel
insert into services (hotel_id, name, icon, sort_order)
select id, 'Room Service', '🍽️', 0 from hotels where slug = 'amartha-hotel'
on conflict do nothing;
insert into services (hotel_id, name, icon, sort_order)
select id, 'Restaurant', '🍴', 1 from hotels where slug = 'amartha-hotel'
on conflict do nothing;
insert into services (hotel_id, name, icon, sort_order)
select id, 'Car Rental', '🚗', 2 from hotels where slug = 'amartha-hotel'
on conflict do nothing;
insert into services (hotel_id, name, icon, sort_order)
select id, 'Spa', '💆', 3 from hotels where slug = 'amartha-hotel'
on conflict do nothing;
insert into services (hotel_id, name, icon, sort_order)
select id, 'Laundry', '👕', 4 from hotels where slug = 'amartha-hotel'
on conflict do nothing;
