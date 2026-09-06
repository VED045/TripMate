-- =============================================================================
-- TripMate Database Migrations
-- Run these in your Supabase SQL Editor in order
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TRIPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  cover_image_path TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  access_code TEXT, -- optional 6-digit code for trip access
  created_by UUID, -- will reference members after members table created
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_slug ON trips(slug);

-- =============================================================================
-- MEMBERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  upi_id TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT, -- hex color for avatar placeholder
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_trip_id ON members(trip_id);

-- Add FK from trips to members for created_by
ALTER TABLE trips ADD CONSTRAINT fk_trips_created_by
  FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE SET NULL;

-- =============================================================================
-- TRIP ACCESS LOG (for future auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trip_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_trip_access_trip_id ON trip_access(trip_id);

-- =============================================================================
-- CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE, -- NULL = global defaults
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_trip_id ON categories(trip_id);

-- Insert default categories (global, trip_id = NULL)
INSERT INTO categories (id, name, icon, color, is_default) VALUES
  (uuid_generate_v4(), 'Food', 'utensils', '#f97316', TRUE),
  (uuid_generate_v4(), 'Stay', 'home', '#8b5cf6', TRUE),
  (uuid_generate_v4(), 'Travel', 'plane', '#0ea5e9', TRUE),
  (uuid_generate_v4(), 'Fuel', 'fuel', '#eab308', TRUE),
  (uuid_generate_v4(), 'Activities', 'zap', '#10b981', TRUE),
  (uuid_generate_v4(), 'Shopping', 'shopping-bag', '#ec4899', TRUE),
  (uuid_generate_v4(), 'Drinks', 'coffee', '#f59e0b', TRUE),
  (uuid_generate_v4(), 'Tickets', 'ticket', '#06b6d4', TRUE),
  (uuid_generate_v4(), 'Miscellaneous', 'more-horizontal', '#64748b', TRUE);

-- =============================================================================
-- EXPENSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount_paise BIGINT NOT NULL, -- stored in paise (1 INR = 100 paise) to avoid float errors
  paid_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  note TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  receipt_path TEXT,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- =============================================================================
-- EXPENSE SPLITS
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  amount_paise BIGINT NOT NULL, -- each person's share in paise
  percentage NUMERIC(5,2), -- for percentage splits
  shares INTEGER, -- for shares-based splits
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_member_id ON expense_splits(member_id);
CREATE UNIQUE INDEX idx_expense_splits_unique ON expense_splits(expense_id, member_id);

-- =============================================================================
-- SETTLEMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  amount_paise BIGINT NOT NULL,
  upi_ref TEXT, -- UPI transaction reference if paid via UPI
  note TEXT,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlements_trip_id ON settlements(trip_id);
CREATE INDEX idx_settlements_from_member ON settlements(from_member_id);
CREATE INDEX idx_settlements_to_member ON settlements(to_member_id);

-- =============================================================================
-- ALBUMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_media_id UUID, -- will FK to media after media table created
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_albums_trip_id ON albums(trip_id);

-- =============================================================================
-- MEDIA
-- =============================================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES members(id) ON DELETE SET NULL,
  
  -- Storage info
  storage_provider TEXT NOT NULL DEFAULT 'cloudinary' CHECK (storage_provider IN ('cloudinary', 'supabase', 'google_drive')),
  storage_path TEXT NOT NULL, -- Cloudinary public_id or Supabase path
  external_file_id TEXT, -- Google Drive file ID if applicable
  
  -- File info
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  size_bytes BIGINT,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC(10,2), -- for videos
  
  -- URLs (cached, may expire for signed URLs)
  url TEXT, -- public/signed URL
  thumbnail_url TEXT, -- optimized thumbnail
  
  -- Metadata
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  taken_at TIMESTAMPTZ, -- from EXIF if available
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_trip_id ON media(trip_id);
CREATE INDEX idx_media_uploader_id ON media(uploader_id);
CREATE INDEX idx_media_created_at ON media(created_at);
CREATE INDEX idx_media_type ON media(media_type);
CREATE INDEX idx_media_storage_provider ON media(storage_provider);

-- Add FK from albums to media
ALTER TABLE albums ADD CONSTRAINT fk_albums_cover_media
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL;

-- =============================================================================
-- MEDIA TAGS (many-to-many: media ↔ members)
-- =============================================================================
CREATE TABLE IF NOT EXISTS media_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tagged_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX idx_media_tags_member_id ON media_tags(member_id);
CREATE UNIQUE INDEX idx_media_tags_unique ON media_tags(media_id, member_id);

-- =============================================================================
-- ALBUM MEDIA (many-to-many: albums ↔ media)
-- =============================================================================
CREATE TABLE IF NOT EXISTS album_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  added_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_album_media_album_id ON album_media(album_id);
CREATE INDEX idx_album_media_media_id ON album_media(media_id);
CREATE UNIQUE INDEX idx_album_media_unique ON album_media(album_id, media_id);

-- =============================================================================
-- MEDIA FAVORITES
-- =============================================================================
CREATE TABLE IF NOT EXISTS media_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_media_favorites_unique ON media_favorites(media_id, member_id);

-- =============================================================================
-- TIMELINE EVENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'manual' CHECK (event_type IN (
    'manual', 'expense_created', 'media_uploaded', 'album_created',
    'member_added', 'settlement_recorded', 'trip_started', 'trip_ended'
  )),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'circle',
  color TEXT DEFAULT '#6366f1',
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional references
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_trip_id ON timeline_events(trip_id);
CREATE INDEX idx_timeline_event_time ON timeline_events(event_time);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_access ENABLE ROW LEVEL SECURITY;

-- For now: open read access (trip slug acts as the access mechanism)
-- These policies will be tightened when auth is added

-- TRIPS: anyone can read by slug (access is through URL), server manages writes
CREATE POLICY "trips_read_policy" ON trips FOR SELECT USING (true);
CREATE POLICY "trips_insert_policy" ON trips FOR INSERT WITH CHECK (true);
CREATE POLICY "trips_update_policy" ON trips FOR UPDATE USING (true);
CREATE POLICY "trips_delete_policy" ON trips FOR DELETE USING (true);

-- MEMBERS
CREATE POLICY "members_all_policy" ON members FOR ALL USING (true);

-- CATEGORIES
CREATE POLICY "categories_all_policy" ON categories FOR ALL USING (true);

-- EXPENSES
CREATE POLICY "expenses_all_policy" ON expenses FOR ALL USING (true);

-- EXPENSE SPLITS
CREATE POLICY "expense_splits_all_policy" ON expense_splits FOR ALL USING (true);

-- SETTLEMENTS
CREATE POLICY "settlements_all_policy" ON settlements FOR ALL USING (true);

-- MEDIA
CREATE POLICY "media_all_policy" ON media FOR ALL USING (true);

-- MEDIA TAGS
CREATE POLICY "media_tags_all_policy" ON media_tags FOR ALL USING (true);

-- ALBUMS
CREATE POLICY "albums_all_policy" ON albums FOR ALL USING (true);

-- ALBUM MEDIA
CREATE POLICY "album_media_all_policy" ON album_media FOR ALL USING (true);

-- MEDIA FAVORITES
CREATE POLICY "media_favorites_all_policy" ON media_favorites FOR ALL USING (true);

-- TIMELINE EVENTS
CREATE POLICY "timeline_all_policy" ON timeline_events FOR ALL USING (true);

-- TRIP ACCESS
CREATE POLICY "trip_access_all_policy" ON trip_access FOR ALL USING (true);

-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- Member balances view
CREATE OR REPLACE VIEW member_balances AS
SELECT
  m.id AS member_id,
  m.trip_id,
  m.name,
  COALESCE(paid.total_paid, 0) AS total_paid_paise,
  COALESCE(owed.total_owed, 0) AS total_owed_paise,
  COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) AS net_balance_paise,
  COALESCE(settled_paid.total_settled_out, 0) AS total_settled_out_paise,
  COALESCE(settled_received.total_settled_in, 0) AS total_settled_in_paise
FROM members m
LEFT JOIN (
  SELECT paid_by AS member_id, SUM(amount_paise) AS total_paid
  FROM expenses
  GROUP BY paid_by
) paid ON paid.member_id = m.id
LEFT JOIN (
  SELECT es.member_id, SUM(es.amount_paise) AS total_owed
  FROM expense_splits es
  GROUP BY es.member_id
) owed ON owed.member_id = m.id
LEFT JOIN (
  SELECT from_member_id AS member_id, SUM(amount_paise) AS total_settled_out
  FROM settlements
  GROUP BY from_member_id
) settled_paid ON settled_paid.member_id = m.id
LEFT JOIN (
  SELECT to_member_id AS member_id, SUM(amount_paise) AS total_settled_in
  FROM settlements
  GROUP BY to_member_id
) settled_received ON settled_received.member_id = m.id;

-- Media count per member (tagged in)
CREATE OR REPLACE VIEW member_media_counts AS
SELECT
  m.id AS member_id,
  m.trip_id,
  COUNT(mt.id) AS total_tagged,
  COUNT(CASE WHEN med.media_type = 'photo' THEN 1 END) AS photo_count,
  COUNT(CASE WHEN med.media_type = 'video' THEN 1 END) AS video_count
FROM members m
LEFT JOIN media_tags mt ON mt.member_id = m.id
LEFT JOIN media med ON med.id = mt.media_id
GROUP BY m.id, m.trip_id;
