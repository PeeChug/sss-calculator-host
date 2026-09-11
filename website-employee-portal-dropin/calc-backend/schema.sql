CREATE TABLE IF NOT EXISTS reps (
  id TEXT PRIMARY KEY,
  initials TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  last_sign_in_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  rep_id TEXT NOT NULL,
  label TEXT,
  token_sig TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  expires_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (rep_id) REFERENCES reps(id)
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  quote_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  payload TEXT NOT NULL,
  rep_id TEXT,
  chalk_quote_id TEXT,
  chalk_quote_number INTEGER,
  chalk_web_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  date_finished TEXT,
  date_archived TEXT,
  date_trashed TEXT
);

CREATE TABLE IF NOT EXISTS pricing (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  rules TEXT NOT NULL DEFAULT '{}',
  rules_sw TEXT NOT NULL DEFAULT '{}',
  discounts TEXT NOT NULL DEFAULT '[]',
  last_edited_by TEXT,
  last_edited_at TEXT
);

CREATE TABLE IF NOT EXISTS tech_notes (
  id TEXT PRIMARY KEY,
  note TEXT NOT NULL,
  rep TEXT,
  context TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS pipeline_cards (
  id TEXT PRIMARY KEY,
  card_key TEXT,
  card TEXT NOT NULL
);

INSERT OR IGNORE INTO pricing (id, rules, rules_sw, discounts) VALUES (1, '{}', '{}', '[]');
