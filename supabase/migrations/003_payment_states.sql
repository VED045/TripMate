-- =============================================================================
-- TripMate Migration 003: Payment States + Proof Storage
-- Run in Supabase SQL Editor AFTER 002_itemized_splits.sql
-- This is ADDITIVE ONLY — no existing data is affected.
-- =============================================================================

-- =============================================================================
-- STEP 1: Extend settlements table with status + proof fields
-- =============================================================================
ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'verified'
    CHECK (status IN ('pending', 'payment_initiated', 'proof_submitted', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_path TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi'
    CHECK (payment_method IN ('upi', 'cash', 'bank_transfer', 'other'));

-- Existing settlements are already completed/verified
UPDATE settlements SET status = 'verified' WHERE status IS NULL OR status = 'verified';

-- =============================================================================
-- STEP 2: PAYMENT PROOFS — screenshot/receipt for UPI payments
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Storage
  storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,

  -- OCR extracted data (all nullable — manual override always allowed)
  ocr_amount_paise BIGINT,
  ocr_transaction_id TEXT,
  ocr_date DATE,
  ocr_payer TEXT,
  ocr_receiver TEXT,
  ocr_confidence NUMERIC(3,2), -- 0.00 to 1.00

  -- User confirmed values (after OCR review)
  confirmed_amount_paise BIGINT,
  confirmed_transaction_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_proofs_settlement_id ON payment_proofs(settlement_id);

-- RLS
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_proofs_all_policy" ON payment_proofs FOR ALL USING (true);

-- =============================================================================
-- STEP 3: EXPENSE DISPUTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (reason IN ('didnt_participate', 'wrong_amount', 'wrong_split', 'already_paid', 'other')),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  resolved_by UUID REFERENCES members(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_expense_id ON expense_disputes(expense_id);

-- RLS
ALTER TABLE expense_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_disputes_all_policy" ON expense_disputes FOR ALL USING (true);

-- =============================================================================
-- STEP 4: EXPENSE AUDIT LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_expense_id ON expense_audit_log(expense_id);

-- RLS
ALTER TABLE expense_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_audit_log_all_policy" ON expense_audit_log FOR ALL USING (true);

-- =============================================================================
-- STEP 5: Extend members with additional profile fields
-- =============================================================================
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS upi_display_name TEXT,    -- display name for UPI (can differ from member name)
  ADD COLUMN IF NOT EXISTS phone TEXT,                -- for reminders
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE; -- soft delete

-- =============================================================================
-- STEP 6: Extend trips with budget + status
-- =============================================================================
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS total_budget_paise BIGINT,   -- optional trip budget
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('planning', 'active', 'completed', 'archived')),
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;     -- 6-char invite code

-- Generate invite codes for existing trips
UPDATE trips
SET invite_code = UPPER(SUBSTRING(MD5(id::text || RANDOM()::text) FROM 1 FOR 6))
WHERE invite_code IS NULL;

-- =============================================================================
-- DONE
-- =============================================================================
