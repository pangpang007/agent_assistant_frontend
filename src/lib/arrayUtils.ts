/**
 * Normalize API list payloads that may be:
 * - a bare array
 * - an object with a list field that is array | null | undefined
 * - null / undefined
 */

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Prefer the first matching key that exists on the object; fall back to bare array. */
export function pickList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return asArray<T>(obj[key]);
      }
    }
  }
  return [];
}

export function pickObject<T extends object>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return { ...fallback, ...(payload as T) };
  }
  return fallback;
}
