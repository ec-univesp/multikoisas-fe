// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from '../../session';

const secret = 'a-session-secret-with-at-least-32-characters';
const now = Date.UTC(2026, 9, 28, 12, 0, 0);
const expiresAt = now + 2 * 60 * 60 * 1000;

describe('session token', () => {
  it('accepts a token signed with the same secret before it expires', async () => {
    const token = await createSessionToken(secret, now, expiresAt);

    expect(token).toMatch(new RegExp(`^${expiresAt}\\.[A-Za-z0-9_-]+$`));
    expect(await verifySessionToken(token ?? undefined, secret, expiresAt - 1)).toBe(true);
  });

  it('rejects a token whose signature was tampered with', async () => {
    const token = (await createSessionToken(secret, now, expiresAt)) ?? '';
    const [signedExpiry, signature] = token.split('.');
    const tamperedSignature = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;

    expect(await verifySessionToken(`${signedExpiry}.${tamperedSignature}`, secret, now)).toBe(false);
    expect(await verifySessionToken(`${Number(signedExpiry) + 1}.${signature}`, secret, now)).toBe(false);
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createSessionToken(`${secret}-other`, now, expiresAt);

    expect(await verifySessionToken(token ?? undefined, secret, now)).toBe(false);
  });

  it('rejects an expired token', async () => {
    const token = await createSessionToken(secret, now, expiresAt);

    expect(await verifySessionToken(token ?? undefined, secret, expiresAt)).toBe(false);
  });

  it('refuses to create a session that is already expired', async () => {
    expect(await createSessionToken(secret, now, now)).toBeNull();
  });

  it.each([undefined, '', 'no-dot', '123.', '.abc', 'abc.def', '1.2.3', '123.not+base64', '123.a'])(
    'rejects the malformed token %s',
    async (token) => {
      expect(await verifySessionToken(token, secret, now)).toBe(false);
    },
  );

  it.each([undefined, '', 'short-secret'])('fails closed when the secret is %s', async (invalidSecret) => {
    const token = await createSessionToken(secret, now, expiresAt);

    expect(await createSessionToken(invalidSecret, now, expiresAt)).toBeNull();
    expect(await verifySessionToken(token ?? undefined, invalidSecret, now)).toBe(false);
  });
});
