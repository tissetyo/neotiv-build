// Shared TypeScript interfaces for Neotiv
// Matches ERD.md schema definitions

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  timezone: string;
  default_background_url: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  wifi_username: string | null;
  clock_timezone_1: string;
  clock_label_1: string;
  clock_timezone_2: string;
  clock_label_2: string;
  clock_timezone_3: string;
  clock_label_3: string;
  airport_iata_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string | null;
  room_code: string;
  is_occupied: boolean;
  pin: string | null;
  background_url: string | null;
  guest_name: string | null;
  guest_photo_url: string | null;
  custom_welcome_message: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  created_at: string;
  room_types?: RoomType;
}

export interface Staff {
  id: string;
  hotel_id: string;
  user_id: string;
  role: 'frontoffice' | 'manager';
  name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  hotel_id: string;
  room_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  hotel_id: string;
  room_id: string;
  sender_role: 'guest' | 'frontoffice';
  sender_name: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Alarm {
  id: string;
  hotel_id: string;
  room_id: string;
  scheduled_time: string;
  note: string | null;
  is_acknowledged: boolean;
  created_at: string;
}

export interface Promo {
  id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  hotel_id: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  hotel_id: string;
  room_id: string;
  service_id: string | null;
  note: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  created_at: string;
  updated_at: string;
  services?: Service;
  rooms?: Room;
}

export interface Announcement {
  id: string;
  hotel_id: string | null;
  text: string;
  is_active: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface FlightData {
  flightNumber: string;
  airline: string;
  time: string;
  destination: string;
  gate: string;
  status: 'on_schedule' | 'delay' | 'cancelled' | 'gate_open' | 'last_call' | 'check_in' | 'closed';
}

export interface WeatherData {
  temp: number;
  icon: string;
  description: string;
  city: string;
}
