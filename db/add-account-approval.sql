-- ============================================================
-- Account approval: new sign-ups must be approved by an admin.
-- Run once in the Neon SQL Editor.
-- ============================================================

-- Add the flag (defaults to false = pending for anyone created from now on).
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Approve every account that already exists, so no current user (including
-- you, the admin) is locked out. New sign-ups after this will start pending.
UPDATE users SET approved = true;
