// @vitest-environment node
import { scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyCredentials } from './credentials';

const salt = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
const passwordHash = `scrypt:${salt.toString('hex')}:${scryptSync('senha-da-loja', salt, 64).toString('hex')}`;
const environment = { ADMIN_USERNAME: 'loja', ADMIN_PASSWORD_HASH: passwordHash };

describe('verifyCredentials', () => {
  it('accepts the configured username and password', () => {
    expect(verifyCredentials('loja', 'senha-da-loja', environment)).toBe(true);
  });

  it('rejects a wrong username', () => {
    expect(verifyCredentials('admin', 'senha-da-loja', environment)).toBe(false);
  });

  it('rejects a wrong password', () => {
    expect(verifyCredentials('loja', 'senha-errada', environment)).toBe(false);
  });

  it.each([
    { ADMIN_PASSWORD_HASH: passwordHash },
    { ADMIN_USERNAME: 'loja' },
    { ADMIN_USERNAME: '', ADMIN_PASSWORD_HASH: passwordHash },
    {},
  ])('fails closed when an environment variable is missing: %o', (incompleteEnvironment) => {
    expect(verifyCredentials('loja', 'senha-da-loja', incompleteEnvironment)).toBe(false);
  });

  it.each([
    'senha-da-loja',
    `bcrypt:${salt.toString('hex')}:${'ab'.repeat(64)}`,
    `scrypt::${'ab'.repeat(64)}`,
    `scrypt:${salt.toString('hex')}:${'ab'.repeat(32)}`,
    `scrypt:abc:${'ab'.repeat(64)}`,
    `scrypt:${salt.toString('hex')}:${'zz'.repeat(64)}`,
  ])('fails closed when the password hash is malformed: %s', (malformedHash) => {
    expect(verifyCredentials('loja', 'senha-da-loja', { ADMIN_USERNAME: 'loja', ADMIN_PASSWORD_HASH: malformedHash })).toBe(
      false,
    );
  });
});
