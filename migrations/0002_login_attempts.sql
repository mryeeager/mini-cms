-- Phase 2: brute-force protection for the admin login form
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,        -- e.g. "ip:1.2.3.4" or "user:admin"
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
