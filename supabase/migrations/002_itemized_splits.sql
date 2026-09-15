-- =============================================================================
-- TripMate Migration 002: Itemized Bill Splitting + GST Support
-- Run in Supabase SQL Editor AFTER 001_initial_schema.sql
-- This is ADDITIVE ONLY — no existing data is affected.
-- =============================================================================

-- =============================================================================
-- STEP 1: Extend expenses table with itemized + GST columns
-- =============================================================================
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS subtotal_paise BIGINT,         -- sum of items before GST
  ADD COLUMN IF NOT EXISTS gst_rate_percent NUMERIC(5,2), -- e.g. 5, 12, 18, 28
  ADD COLUMN IF NOT EXISTS gst_amount_paise BIGINT,        -- calculated GST in paise
  ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'exclusive' CHECK (gst_type IN ('exclusive', 'inclusive')),
  ADD COLUMN IF NOT EXISTS discount_paise BIGINT DEFAULT 0; -- optional discount

-- Extend split_type to allow 'itemized'
-- PostgreSQL doesn't support CHECK constraint modification directly, so we drop and re-add
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_split_type_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_split_type_check
  CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares', 'itemized', 'custom'));

-- =============================================================================
-- STEP 2: EXPENSE ITEMS — individual line items on a bill
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price_paise BIGINT NOT NULL,          -- price per single unit
  total_price_paise BIGINT NOT NULL,         -- quantity × unit_price_paise
  gst_rate_percent NUMERIC(5,2),             -- item-level GST override (null = use expense GST)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_items_expense_id ON expense_items(expense_id);

-- RLS
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_items_all_policy" ON expense_items FOR ALL USING (true);

-- =============================================================================
-- STEP 3: EXPENSE ITEM ASSIGNMENTS — who gets which item / how much
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_item_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_item_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,  -- how much of this item this person gets
  amount_paise BIGINT NOT NULL,                -- member's share for this item (no GST)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_assignments_item_id ON expense_item_assignments(expense_item_id);
CREATE INDEX idx_item_assignments_member_id ON expense_item_assignments(member_id);
CREATE UNIQUE INDEX idx_item_assignments_unique ON expense_item_assignments(expense_item_id, member_id);

-- RLS
ALTER TABLE expense_item_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_item_assignments_all_policy" ON expense_item_assignments FOR ALL USING (true);

-- =============================================================================
-- STEP 4: EXPENSE PARTICIPANTS — per-participant payment tracking
-- This is SEPARATE from expense_splits. It tracks what each participant owes
-- and how much they've paid (for partial payments).
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  base_amount_paise BIGINT NOT NULL DEFAULT 0,  -- share before GST
  gst_amount_paise BIGINT NOT NULL DEFAULT 0,   -- proportional GST share
  total_amount_paise BIGINT NOT NULL,            -- base + gst
  paid_paise BIGINT NOT NULL DEFAULT 0,          -- amount actually paid/settled
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_member_id ON expense_participants(member_id);
CREATE UNIQUE INDEX idx_expense_participants_unique ON expense_participants(expense_id, member_id);

-- RLS
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_participants_all_policy" ON expense_participants FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_expense_participants_updated_at
  BEFORE UPDATE ON expense_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 5: Backfill expense_participants from existing expense_splits
-- This ensures existing expenses have participant records.
-- =============================================================================
INSERT INTO expense_participants (expense_id, member_id, total_amount_paise, base_amount_paise, gst_amount_paise)
SELECT
  es.expense_id,
  es.member_id,
  es.amount_paise AS total_amount_paise,
  es.amount_paise AS base_amount_paise,
  0 AS gst_amount_paise
FROM expense_splits es
ON CONFLICT (expense_id, member_id) DO NOTHING;

-- =============================================================================
-- DONE
-- =============================================================================
