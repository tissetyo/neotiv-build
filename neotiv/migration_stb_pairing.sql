-- Migration: STB Pairing Codes for QR-based setup
-- Run this on your Supabase SQL editor

CREATE TABLE IF NOT EXISTS stb_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID REFERENCES rooms(id),
  room_code VARCHAR(20),
  hotel_slug VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paired', 'expired')),
  session_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  paired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '15 minutes'
);

CREATE INDEX IF NOT EXISTS idx_pairing_code ON stb_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_pairing_status ON stb_pairing_codes(status, expires_at);

-- Auto-expire old codes (optional cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_pairing_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM stb_pairing_codes 
  WHERE expires_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for this table (server-side only access via service role)
ALTER TABLE stb_pairing_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (check existence first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stb_pairing_codes' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access" ON stb_pairing_codes
          FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;
