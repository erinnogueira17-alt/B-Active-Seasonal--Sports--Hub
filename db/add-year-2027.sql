-- Adds a season year to allocations and the Seasonal Log so 2026 and 2027 can coexist.
-- Existing rows are tagged 2026. Safe to run once; re-running is a no-op.
-- Run in the Neon SQL editor (Vercel → Storage → your Postgres → Query).

ALTER TABLE allocations ADD COLUMN IF NOT EXISTS year integer NOT NULL DEFAULT 2026;
ALTER TABLE live_log    ADD COLUMN IF NOT EXISTS year integer NOT NULL DEFAULT 2026;

-- Sanity check: every existing row should now be 2026.
SELECT 'allocations' AS tbl, year, count(*) FROM allocations GROUP BY year
UNION ALL
SELECT 'live_log', year, count(*) FROM live_log GROUP BY year;
