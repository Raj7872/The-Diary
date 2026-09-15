import { getDb } from "@/lib/db-adapter";

const LOGIN_ATTEMPT_LIMIT     = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Simple per-IP fixed-window rate limit for the login endpoint, backed by D1.
 * Returns { allowed: false, retryAfterSeconds } once the IP has too many
 * recent failed attempts.
 */
export async function checkLoginRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const db = await getDb();
  if (!db) return { allowed: true }; // fail open if DB is unavailable

  const now = Date.now();
  const windowStart = now - LOGIN_ATTEMPT_WINDOW_MS;

  await db.execute("DELETE FROM login_attempts WHERE attempted_at < ?", [windowStart]);

  const row = await db.queryFirst<{ cnt: number; oldest: number }>(
    "SELECT COUNT(*) as cnt, MIN(attempted_at) as oldest FROM login_attempts WHERE ip = ? AND attempted_at >= ?",
    [ip, windowStart]
  );

  const count = Number(row?.cnt ?? 0);
  if (count >= LOGIN_ATTEMPT_LIMIT) {
    const oldest = Number(row?.oldest ?? now);
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + LOGIN_ATTEMPT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export async function recordFailedLogin(ip: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute("INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)", [ip, Date.now()]);
}

export async function clearLoginAttempts(ip: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute("DELETE FROM login_attempts WHERE ip = ?", [ip]);
}
