-- =============================================================================
-- Migration 004: Soft Deletion & Active Status for Members
-- Enables safe member removal without corrupting historical financial logs
-- =============================================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
