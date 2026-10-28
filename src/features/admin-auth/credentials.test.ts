// @vitest-environment node
import { scryptSync } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCredentials } from './credentials';

const { scryptCalls } = vi.hoisted(() => ({ scryptCalls: { count: 0 } }));

vi.mock('node:crypto', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:crypto')>();
  return {
    ...original,
    scrypt: (...parameters: Parameters<typeof original.scrypt>) => {
      scryptCalls.count += 1;
      return original.scrypt(...parameters);
    },
  };
});

const buildEntry = (username: string, password: string, saltHex: string) =>
  `${username}=scrypt:${saltHex}:${scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex')}`;

const emersonEntry = buildEntry('emerson', 'senha-do-emerson', '0123456789abcdef0123456789abcdef');
const multesteEntry = buildEntry('multeste', 'senha-do-multeste', 'fedcba9876543210fedcba9876543210');
const environment = { ADMIN_USERS: `${emersonEntry},${multesteEntry}` };

describe('verifyCredentials', () => {
  afterEach(() => {
    scryptCalls.count = 0;
  });

  it('returns a promise so the key derivation does not block the event loop', () => {
    expect(verifyCredentials('emerson', 'senha-do-emerson', environment)).toBeInstanceOf(Promise);
  });

  it('accepts every configured user with their own password', async () => {
    expect(await verifyCredentials('emerson', 'senha-do-emerson', environment)).toBe(true);
    expect(await verifyCredentials('multeste', 'senha-do-multeste', environment)).toBe(true);
  });

  it('rejects a wrong password for an existing user', async () => {
    expect(await verifyCredentials('emerson', 'senha-errada', environment)).toBe(false);
    expect(await verifyCredentials('emerson', 'senha-do-multeste', environment)).toBe(false);
  });

  it('rejects an unknown user and still derives one key so timing does not reveal valid usernames', async () => {
    expect(await verifyCredentials('admin', 'senha-do-emerson', environment)).toBe(false);
    expect(scryptCalls.count).toBe(1);
  });

  it('derives exactly one key for a known user', async () => {
    await verifyCredentials('multeste', 'senha-do-multeste', environment);

    expect(scryptCalls.count).toBe(1);
  });

  it('trims spaces around entries, usernames and hashes', async () => {
    const [username, hash] = multesteEntry.split('=');
    const spacedEnvironment = { ADMIN_USERS: ` ${emersonEntry} , ${username} = ${hash} ` };

    expect(await verifyCredentials('emerson', 'senha-do-emerson', spacedEnvironment)).toBe(true);
    expect(await verifyCredentials('multeste', 'senha-do-multeste', spacedEnvironment)).toBe(true);
  });

  it('uses the first entry when a username is repeated', async () => {
    const duplicateEntry = buildEntry('emerson', 'outra-senha', 'abababababababababababababababab');
    const duplicateEnvironment = { ADMIN_USERS: `${emersonEntry},${duplicateEntry}` };

    expect(await verifyCredentials('emerson', 'senha-do-emerson', duplicateEnvironment)).toBe(true);
    expect(await verifyCredentials('emerson', 'outra-senha', duplicateEnvironment)).toBe(false);
  });

  it.each([{}, { ADMIN_USERS: '' }, { ADMIN_USERS: ' , ' }])(
    'fails closed when there is no user configured: %o',
    async (emptyEnvironment) => {
      expect(await verifyCredentials('emerson', 'senha-do-emerson', emptyEnvironment)).toBe(false);
      expect(await verifyCredentials('', '', emptyEnvironment)).toBe(false);
    },
  );

  const salt = '0123456789abcdef0123456789abcdef';
  it.each([
    'senha-do-multeste',
    `multeste:scrypt:${salt}:${'ab'.repeat(64)}`,
    `=scrypt:${salt}:${'ab'.repeat(64)}`,
    `multe ste=scrypt:${salt}:${'ab'.repeat(64)}`,
    `multeste=bcrypt:${salt}:${'ab'.repeat(64)}`,
    `multeste=scrypt::${'ab'.repeat(64)}`,
    `multeste=scrypt:${salt}:${'ab'.repeat(32)}`,
    `multeste=scrypt:abc:${'ab'.repeat(64)}`,
    `multeste=scrypt:${salt}:${'zz'.repeat(64)}`,
  ])('ignores the malformed entry %s and keeps the valid ones working', async (malformedEntry) => {
    const mixedEnvironment = { ADMIN_USERS: `${malformedEntry},${emersonEntry}` };

    expect(await verifyCredentials('emerson', 'senha-do-emerson', mixedEnvironment)).toBe(true);
    expect(await verifyCredentials('multeste', 'senha-do-multeste', mixedEnvironment)).toBe(false);
  });
});
