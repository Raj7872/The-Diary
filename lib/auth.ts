export const SESSION_COOKIE = "diary_session";
const SESSION_SUFFIX = ":movie-diary-session-v1";

function bufferToHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function pbkdf2Hex(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bufferToHex(derived);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

/** Reads DIARY_PASSWORD_HASH from Cloudflare env (edge) or process.env (local dev) */
export async function getPasswordHash(): Promise<string | null> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const hash = (ctx.env as Record<string, unknown>).DIARY_PASSWORD_HASH as string | undefined;
    if (hash) return hash;
  } catch {
    /* not on Cloudflare */
  }
  return process.env.DIARY_PASSWORD_HASH ?? null;
}

/**
 * Verifies a plaintext password against the stored hash.
 * Stored format: "iterations:saltHex:hashHex"
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await getPasswordHash();
  if (!stored) return false;

  const parts = stored.split(":");
  if (parts.length !== 3) return false;

  const [iterStr, saltHex, expectedHex] = parts;
  const iterations = parseInt(iterStr, 10);
  if (isNaN(iterations)) return false;

  try {
    const salt = hexToBuffer(saltHex);
    const computedHex = await pbkdf2Hex(password, salt, iterations);
    return timingSafeEqual(computedHex, expectedHex);
  } catch {
    return false;
  }
}

/**
 * The session token is a deterministic SHA-256 derived from the password
 * hash. It's unguessable without server-side knowledge of DIARY_PASSWORD_HASH,
 * and lets middleware verify sessions without a database.
 */
export async function getExpectedSessionToken(): Promise<string | null> {
  const hash = await getPasswordHash();
  if (!hash) return null;
  return sha256Hex(hash + SESSION_SUFFIX);
}

export async function isValidSession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await getExpectedSessionToken();
  if (!expected) return false;
  return timingSafeEqual(token, expected);
}