-- =============================================================================
-- TripMate Migration 006: User Profiles + Auth Integration
-- Run in Supabase SQL Editor AFTER 005_whatsapp_group.sql
-- This is ADDITIVE ONLY — no existing data is affected.
-- =============================================================================

-- =============================================================================
-- STEP 1: PROFILES — linked to auth.users
-- Each authenticated user has a profile row.
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  default_upi_id TEXT,
  upi_display_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 2: USER TRIPS — links auth users to trips they own/created
-- This allows multi-trip management per user.
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL, -- their member record in this trip
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  claimed_at TIMESTAMPTZ,  -- when they claimed an anonymous trip
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trip_id)
);

CREATE INDEX idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX idx_user_trips_trip_id ON user_trips(trip_id);

-- RLS — users can only see their own trip links
ALTER TABLE user_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_trips_select_own" ON user_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_trips_insert_own" ON user_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_trips_update_own" ON user_trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_trips_delete_own" ON user_trips FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 3: Extend members table with auth_user_id link
-- When a user claims a trip, their member record is linked to their auth user.
-- =============================================================================
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);

-- =============================================================================
-- STEP 4: Extend trips with owner_user_id (auth user who created it)
-- Anonymous trips have NULL owner_user_id.
-- =============================================================================
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trips_owner_user_id ON trips(owner_user_id);

-- =============================================================================
-- STEP 5: Update RLS policies for trips
-- Anonymous trips (owner_user_id IS NULL): anyone can read by slug (existing behavior).
-- Owned trips: only the owner and trip members can access.
-- For now keeping it permissive since trips are still slug-access based.
-- =============================================================================

-- Drop old open policies first (they already exist from migration 001)
DROP POLICY IF EXISTS "trips_read_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

-- New policies: anonymous trips readable by anyone, owned trips by owner or member
CREATE POLICY "trips_read_policy" ON trips FOR SELECT USING (
  owner_user_id IS NULL  -- anonymous trip, slug-based access
  OR owner_user_id = auth.uid()  -- owner
  OR id IN (SELECT trip_id FROM user_trips WHERE user_id = auth.uid())  -- linked member
);

CREATE POLICY "trips_insert_policy" ON trips FOR INSERT WITH CHECK (true);

CREATE POLICY "trips_update_policy" ON trips FOR UPDATE USING (
  owner_user_id IS NULL
  OR owner_user_id = auth.uid()
  OR id IN (SELECT trip_id FROM user_trips WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "trips_delete_policy" ON trips FOR DELETE USING (
  owner_user_id = auth.uid()
);

-- =============================================================================
-- DONE
-- =============================================================================
