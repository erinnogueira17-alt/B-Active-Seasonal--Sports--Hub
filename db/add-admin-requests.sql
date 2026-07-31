-- ============================================================
-- Team model: coaches self-serve; admin seats are approved by an
-- existing admin. This adds the "admin requested" flag used by the
-- Team & Accounts page. Run once in the Neon SQL Editor.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_requested boolean NOT NULL DEFAULT false;

-- The earlier "approved" column (from add-account-approval.sql) is no longer
-- used — coaches don't need approval anymore. It's harmless to leave in place.
-- If you'd like to remove it entirely, uncomment the next line:
-- ALTER TABLE users DROP COLUMN IF EXISTS approved;
