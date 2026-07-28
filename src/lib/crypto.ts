// Runs on Cloudflare Workers/Pages Edge runtime -> only Web Crypto APIs, no Node 'crypto'.
//
// Note: newer TypeScript versions type Uint8Array as generic over ArrayBufferLike
// (which could theoretically be a SharedArrayBuffer), so it no longer structurally
// matches BufferSource/ArrayBuffer params without a cast. At runtime this is always
// a plain ArrayBuffer here — Workers/browsers never hand back a SharedArrayBuffer
// from crypto.getRandomValues() or TextEncoder.encode() — so the cast is safe.

const PBKDF2_ITERATIONS = 210_000;

function toHex(buf: ArrayBufferLike): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

/** Generates a cryptographically random hex token (used for salts, session ids, csrf tokens). */
export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

/** Returns "salt:hash" — store this whole string in users.password_hash */
export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${toHex(salt.buffer)}:${toHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex] = stored.split(":");
  const recomputed = await hashPassword(password, saltHex);
  // constant-time-ish compare
  if (recomputed.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < recomputed.length; i++) diff |= recomputed.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}
