-- Parlons — initial schema (Cloudflare D1 / SQLite)
-- Note: table `exercises` holds practice SITUATIONS and `scores` holds private
-- session correction reports (names kept from the fork's original schema).

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  first_name  TEXT,
  last_name   TEXT,
  avatar_key  TEXT,               -- R2 object key, or NULL for initials avatar
  role        TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_tokens (
  token_hash  TEXT PRIMARY KEY,   -- sha-256 of the emailed token
  email       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,   -- random id stored in the cookie
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS exercises (
  id                    TEXT PRIMARY KEY,
  theme                 TEXT NOT NULL,
  difficulty            TEXT NOT NULL,
  gender                TEXT NOT NULL,
  title_en              TEXT, title_fr              TEXT,
  product_en            TEXT, product_fr            TEXT,
  prospect_profile_en   TEXT, prospect_profile_fr   TEXT,
  research_brief_en     TEXT, research_brief_fr     TEXT,
  goal_en               TEXT, goal_fr               TEXT,
  prospect_persona      TEXT NOT NULL,              -- server-only acting brief
  created_by            TEXT NOT NULL,
  visibility            TEXT NOT NULL DEFAULT 'public',  -- 'public' | 'private'
  is_builtin            INTEGER NOT NULL DEFAULT 0,
  created_at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercises_visibility ON exercises(visibility);
CREATE INDEX IF NOT EXISTS idx_exercises_creator ON exercises(created_by);

CREATE TABLE IF NOT EXISTS scores (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  exercise_id     TEXT,                 -- NULL for custom / private-training calls
  exercise_title  TEXT NOT NULL,        -- snapshot for display
  theme           TEXT,
  total           INTEGER NOT NULL,
  band            TEXT NOT NULL,
  booked          INTEGER NOT NULL DEFAULT 0,
  scorecard       TEXT NOT NULL,        -- full ScoreCard JSON
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_total ON scores(total);

CREATE TABLE IF NOT EXISTS meta ( key TEXT PRIMARY KEY, value TEXT );
