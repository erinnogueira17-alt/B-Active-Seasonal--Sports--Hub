-- ============================================================
-- Notice Board: short universal messages to all coaches, shown on
-- the homepage. Run once in the Neon SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS notices (
  id          serial PRIMARY KEY,
  body        text NOT NULL,
  created_by  integer REFERENCES users(id),
  created_at  timestamptz DEFAULT now()
);
