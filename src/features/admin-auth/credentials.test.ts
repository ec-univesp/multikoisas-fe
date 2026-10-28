// @vitest-environment node
import { scryptSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    scryptCalls.count = 0;
    vi.restoreAllMocks();
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

  it.each(['Emerson', ' emerson', 'emerson '])(
    'matches the typed username exactly, without case folding or trimming: %o',
    async (typedUsername) => {
      expect(await verifyCredentials(typedUsername, 'senha-do-emerson', environment)).toBe(false);
    },
  );

  const salt = '0123456789abcdef0123456789abcdef';
  const hashOf = (password: string, saltHex: string, keyLength = 64) =>
    scryptSync(password, Buffer.from(saltHex, 'hex'), keyLength).toString('hex');

  it.each([
    { malformedEntry: 'senha-do-multeste', username: 'multeste', password: 'senha-do-multeste' },
    { malformedEntry: `multeste:scrypt:${salt}:${hashOf('x', salt)}`, username: 'multeste', password: 'x' },
    { malformedEntry: `=scrypt:${salt}:${hashOf('x', salt)}`, username: '', password: 'x' },
    { malformedEntry: `multe ste=scrypt:${salt}:${hashOf('x', salt)}`, username: 'multe ste', password: 'x' },
    { malformedEntry: `multesté=scrypt:${salt}:${hashOf('x', salt)}`, username: 'multesté', password: 'x' },
    { malformedEntry: `multeste=bcrypt:${salt}:${hashOf('x', salt)}`, username: 'multeste', password: 'x' },
    { malformedEntry: `multeste=scrypt::${hashOf('x', '')}`, username: 'multeste', password: 'x' },
    { malformedEntry: `multeste=scrypt:abc:${hashOf('x', 'abc')}`, username: 'multeste', password: 'x' },
    { malformedEntry: `multeste=scrypt:${'zz'.repeat(16)}:${hashOf('x', '')}`, username: 'multeste', password: 'x' },
    { malformedEntry: `multeste=scrypt:${salt}:${hashOf('x', salt, 32)}`, username: 'multeste', password: 'x' },
    { malformedEntry: `multeste=scrypt:${salt}:${hashOf('x', salt).toUpperCase()}`, username: 'multeste', password: 'x' },
  ])(
    'ignores the malformed entry $malformedEntry even with the password its hash was built from',
    async ({ malformedEntry, username, password }) => {
      const mixedEnvironment = { ADMIN_USERS: `${malformedEntry},${emersonEntry}` };

      expect(await verifyCredentials(username, password, mixedEnvironment)).toBe(false);
      expect(await verifyCredentials('emerson', 'senha-do-emerson', mixedEnvironment)).toBe(true);
    },
  );

  it('warns once per malformed entry with its index and never its content', async () => {
    const malformedEntry = `multe ste=scrypt:${salt}:${hashOf('x', salt)}`;
    const mixedEnvironment = { ADMIN_USERS: `${emersonEntry},${malformedEntry}, ,senha-solta` };

    await verifyCredentials('emerson', 'senha-do-emerson', mixedEnvironment);

    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ['ADMIN_USERS: entrada de índice 1 mal formada, ignorada.'],
      ['ADMIN_USERS: entrada de índice 3 mal formada, ignorada.'],
    ]);
  });

  it('does not warn when every entry is valid or blank', async () => {
    await verifyCredentials('emerson', 'senha-do-emerson', { ADMIN_USERS: ` ${emersonEntry} , ` });
    await verifyCredentials('emerson', 'senha-do-emerson', {});

    expect(console.warn).not.toHaveBeenCalled();
  });
});
