/**
 * Legacy localStorage keys from the pre-Cookie auth scheme.
 * Cleared once on startup so old tokens are not left behind.
 */
const LEGACY_KEYS = [
  'tangyuan_access_token',
  'tangyuan_refresh_token',
  'tangyuan_user',
] as const;

/** Remove leftover JWT keys from the localStorage era. Safe to call repeatedly. */
export function clearLegacyAuthStorage(): void {
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}
