// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from './session';

const secret = 'a-session-secret-with-at-least-32-characters';
const passwordHash = `scrypt:${'ab'.repeat(16)}:${'cd'.repeat(64)}`;
const now = Date.UTC(2026, 9, 28, 12, 0, 0);
const eightHoursInMs = 8 * 60 * 60 * 1000;

describe('session token', () => {
  it('accepts a token signed with the same secret before it expires', async () => {
    const token = await createSessionToken(secret, passwordHash, now);

    expect(token).toMatch(new RegExp(`^${now + eightHoursInMs}\\.[A-Za-z0-9_-]+$`));
    expect(await verifySessionToken(token ?? undefined, secret, passwordHash, now + eightHoursInMs - 1)).toBe(true);
  });

  it('rejects a token whose signature was tampered with', async () => {
    const token = (await createSessionToken(secret, passwordHash, now)) ?? '';
    const [expiresAt, signature] = token.split('.');
    const tamperedSignature = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;

    expect(await verifySessionToken(`${expiresAt}.${tamperedSignature}`, secret, passwordHash, now)).toBe(false);
    expect(await verifySessionToken(`${Number(expiresAt) + 1}.${signature}`, secret, passwordHash, now)).toBe(false);
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createSessionToken(`${secret}-other`, passwordHash, now);

    expect(await verifySessionToken(token ?? undefined, secret, passwordHash, now)).toBe(false);
  });

  it('rejects every session issued before the password hash changed', async () => {
    const token = await createSessionToken(secret, passwordHash, now);
    const newPasswordHash = `scrypt:${'ef'.repeat(16)}:${'01'.repeat(64)}`;

    expect(await verifySessionToken(token ?? undefined, secret, newPasswordHash, now)).toBe(false);
  });

  it('rejects an expired token', async () => {
    const token = await createSessionToken(secret, passwordHash, now);

    expect(await verifySessionToken(token ?? undefined, secret, passwordHash, now + eightHoursInMs)).toBe(false);
  });

  it.each([undefined, '', 'no-dot', '123.', '.abc', 'abc.def', '1.2.3', '123.not+base64', '123.a'])(
    'rejects the malformed token %s',
    async (token) => {
      expect(await verifySessionToken(token, secret, passwordHash, now)).toBe(false);
    },
  );

  it.each([undefined, '', 'short-secret'])('fails closed when the secret is %s', async (invalidSecret) => {
    const token = await createSessionToken(secret, passwordHash, now);

    expect(await createSessionToken(invalidSecret, passwordHash, now)).toBeNull();
    expect(await verifySessionToken(token ?? undefined, invalidSecret, passwordHash, now)).toBe(false);
  });

  it.each([undefined, ''])('fails closed when the password hash is %s', async (missingPasswordHash) => {
    const token = await createSessionToken(secret, passwordHash, now);

    expect(await createSessionToken(secret, missingPasswordHash, now)).toBeNull();
    expect(await verifySessionToken(token ?? undefined, secret, missingPasswordHash, now)).toBe(false);
  });
});
