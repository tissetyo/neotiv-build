-- Migration to add color_theme to services
alter table public.services
add column if not exists color_theme text default 'teal';
