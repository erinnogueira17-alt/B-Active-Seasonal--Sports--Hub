-- ============================================================
-- Sync the Term 3 leaderboard (Seasonal Log) to match the old hub
-- exactly, as of the latest old-hub screenshots. Safe to re-run.
--
-- Replaces the Term 3 points table with these authoritative values.
-- Other terms are untouched. Going forward, new planner submissions
-- in this hub add +2 on top of these totals.
-- ============================================================

DELETE FROM live_log WHERE term = 'term3';

INSERT INTO live_log (entity_name, term, points) VALUES
  ('Daniel',     'term3', 6),
  ('Lungile',    'term3', 6),
  ('Mpho',       'term3', 6),
  ('Shalom',     'term3', 6),
  ('Thembi',     'term3', 6),
  ('Ross',       'term3', 6),
  ('Lebogang',   'term3', 4),
  ('Deon',       'term3', 4),
  ('Sipho',      'term3', 4),
  ('Justin',     'term3', 3),
  ('Siseko',     'term3', 3),
  ('Mamello',    'term3', 2),
  ('Mahlatsi',   'term3', 2),
  ('Akimi',      'term3', 2),
  ('Na''eel',    'term3', 2),
  ('Jolie',      'term3', 2),
  ('Keatlegile', 'term3', 2),
  ('Musa',       'term3', 2),
  ('Bahle',      'term3', 2),
  ('Abbey',      'term3', 2),
  ('Azande',     'term3', 0),
  ('Busani',     'term3', 0),
  ('Sergio',     'term3', 0),
  ('Edgar',      'term3', 0),
  ('Paballo',    'term3', 0),
  ('Dylan',      'term3', 0),
  ('Lasley',     'term3', 0),
  ('Nhlanhla',   'term3', 0),
  ('Jerome',     'term3', 0),
  ('Samokelo',   'term3', 0),
  ('Mikael',     'term3', 0),
  ('Breyton',    'term3', 0),
  ('Welcome',    'term3', 0),
  ('Tapiwa',     'term3', 0),
  ('Nosipho',    'term3', 0),
  ('Elizabeth',  'term3', 0),
  ('Kabelo',     'term3', 0),
  ('Remi',       'term3', 0),
  ('Sanele',     'term3', 0),
  ('Tshepiso',   'term3', 0),
  ('Jean',       'term3', 0),
  ('Harnu',      'term3', 0),
  ('Khanya',     'term3', 0);
