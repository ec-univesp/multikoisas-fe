export const SESSION_COOKIE_NAME = 'multikoisas_session';
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;

const MINIMUM_SECRET_LENGTH = 32;
const TOKEN_PATTERN = /^(\d+)\.([A-Za-z0-9_-]+)$/;

const hasValidSecret = (secret: string | undefined): secret is string =>
  secret !== undefined && secret.length >= MINIMUM_SECRET_LENGTH;

const importSigningKey = (secret: string) =>
  crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);

const toBase64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

const fromBase64Url = (text: string) => {
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

export const createSessionToken = async (secret: string | undefined, now: number): Promise<string | null> => {
  if (!hasValidSecret(secret)) return null;

  const expiresAt = String(now + SESSION_DURATION_SECONDS * 1000);
  const signature = await crypto.subtle.sign('HMAC', await importSigningKey(secret), new TextEncoder().encode(expiresAt));
  return `${expiresAt}.${toBase64Url(signature)}`;
};

export const verifySessionToken = async (
  token: string | undefined,
  secret: string | undefined,
  now: number,
): Promise<boolean> => {
  if (!token || !hasValidSecret(secret)) return false;

  const match = TOKEN_PATTERN.exec(token);
  if (!match) return false;

  const [, expiresAt, encodedSignature] = match;
  const signature = fromBase64Url(encodedSignature);
  if (!signature) return false;

  const signatureMatches = await crypto.subtle.verify(
    'HMAC',
    await importSigningKey(secret),
    signature,
    new TextEncoder().encode(expiresAt),
  );
  return signatureMatches && Number(expiresAt) > now;
};
