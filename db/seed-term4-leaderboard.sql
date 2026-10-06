-- ============================================================
-- Start Term 4: carry the coach roster into the Term 4 leaderboard
-- at 0 points, so the Term 4 log shows everyone from day one.
-- New coaches add themselves automatically on their first planner.
-- Safe to re-run (skips coaches already in Term 4). Term 3 is untouched.
-- ============================================================

INSERT INTO live_log (entity_name, term, points)
SELECT DISTINCT entity_name, 'term4', 0
FROM live_log
WHERE term = 'term3'
  AND entity_name NOT IN (SELECT entity_name FROM live_log WHERE term = 'term4');
