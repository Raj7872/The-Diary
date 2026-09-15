-- Migration: 0008_login_attempts.sql
-- Tracks failed login attempts per IP so /api/auth/login can be rate limited.

CREATE TABLE IF NOT EXISTS login_attempts (
  ip           TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, attempted_at);
