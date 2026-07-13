import http from '@/lib/axios';

const PUBLIC_KEY_CACHE_TTL_MS = 60 * 60 * 1000;
const ENC_PREFIX = 'enc:v1:';

interface PublicKeyPayload {
  public_jwk: JsonWebKey;
  public_key_pem?: string;
}

let cachedJwk: JsonWebKey | null = null;
let cachedAt = 0;
let inflight: Promise<JsonWebKey> | null = null;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64UrlEncodeUtf8(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isAlreadyEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

async function fetchPublicJwk(): Promise<JsonWebKey> {
  const now = Date.now();
  if (cachedJwk && now - cachedAt < PUBLIC_KEY_CACHE_TTL_MS) {
    return cachedJwk;
  }

  if (inflight) return inflight;

  inflight = (http.get('/crypto/public-key') as Promise<PublicKeyPayload>)
    .then((res) => {
      const jwk = res.public_jwk;
      if (!jwk) {
        throw new Error('公钥响应缺少 public_jwk');
      }
      cachedJwk = jwk;
      cachedAt = Date.now();
      return jwk;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Clear cached transport public key (e.g. after crypto key rotation). */
export function clearTransportPublicKeyCache(): void {
  cachedJwk = null;
  cachedAt = 0;
}

/**
 * Encrypt a plaintext secret for transport:
 * RSA-OAEP-SHA256 + AES-256-GCM → `enc:v1:` + base64url(JSON)
 */
export async function encryptSensitive(plain: string, jwk?: JsonWebKey): Promise<string> {
  if (!plain) return plain;
  if (isAlreadyEncrypted(plain)) return plain;

  const publicJwk = jwk ?? (await fetchPublicJwk());
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      new TextEncoder().encode(plain),
    ),
  );
  const rawAes = new Uint8Array(await crypto.subtle.exportKey('raw', aesKey));
  const encryptedKey = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAes),
  );

  const payload = JSON.stringify({
    ek: bytesToBase64(encryptedKey),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(ciphertext),
  });

  return `${ENC_PREFIX}${base64UrlEncodeUtf8(payload)}`;
}

/** Encrypt if value is a non-empty string; leave empty/undefined as-is. */
export async function encryptOptional(value: string | undefined | null): Promise<string | undefined> {
  if (value == null || value === '') return value ?? undefined;
  return encryptSensitive(value);
}
