-- ============================================================
-- Remove duplicate CURATED resource links (the resources-seed.sql
-- was run more than once). Safe to run repeatedly.
--
-- Only touches curated links (file_key = 'external'); your own
-- uploaded files (which carry a real Blob key) are never affected.
-- De-dupes on full identity so the two distinct FIBA entries
-- (refereeing vs coaching, same URL) are both preserved.
-- ============================================================

-- 1) OPTIONAL — preview how many rows will be removed before deleting:
-- SELECT count(*) AS duplicates_to_remove
-- FROM resources a
-- JOIN resources b
--   ON a.file_key = 'external' AND b.file_key = 'external'
--  AND a.title = b.title
--  AND a.category = b.category
--  AND a.file_url = b.file_url
--  AND a.subcategory IS NOT DISTINCT FROM b.subcategory
--  AND a.id > b.id;

-- 2) Remove the duplicates, keeping the earliest (lowest id) of each:
DELETE FROM resources a
USING resources b
WHERE a.file_key = 'external'
  AND b.file_key = 'external'
  AND a.title = b.title
  AND a.category = b.category
  AND a.file_url = b.file_url
  AND a.subcategory IS NOT DISTINCT FROM b.subcategory
  AND a.id > b.id;

-- 3) OPTIONAL — verify one of each remains (should be 17 rows):
-- SELECT count(*) AS curated_links FROM resources WHERE file_key = 'external';
