-- ============================================================
-- Populate the Term 4 coach roster. This is what the Submit Planner
-- name dropdown and the Analytics "Submitted / Missing" lists use.
--
-- Seeds Term 4 from the coaches actually allocated this term (accurate),
-- so it matches the Term 4 allocations. Re-runnable (skips existing).
-- Requires the Term 4 allocations to be loaded first (db/term4-allocations.sql).
-- ============================================================

INSERT INTO coaches (name, term)
SELECT DISTINCT coach_name, 'term4'
FROM allocations
WHERE term = 'term4'
  AND lower(coach_name) NOT IN (SELECT lower(name) FROM coaches WHERE term = 'term4');
