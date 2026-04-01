-- Migration: Add JSONB config to hotels

ALTER TABLE hotels
ADD COLUMN tv_layout_config JSONB DEFAULT '{}'::jsonb;

-- Example initial valid state:
-- {
--   "theme": { "opacityLight": 0.82, "opacityDark": 0.60 },
--   "apps": [
--     { "id": "netflix", "name": "Netflix", "url": "https://netflix.com", "icon": "/apps/netflix.png" }
--   ],
--   "layout": {
--     "analogClocks": { "visible": true },
--     "digitalClock": { "visible": true },
--     "flightSchedule": { "visible": true },
--     "hotelDeals": { "visible": true },
--     "mapWidget": { "visible": true },
--     "appGrid": { "visible": true },
--     "guestCard": { "visible": true },
--     "wifiCard": { "visible": true },
--     "notificationCard": { "visible": true },
--     "hotelService": { "visible": true },
--     "hotelInfo": { "visible": true }
--   }
-- }
