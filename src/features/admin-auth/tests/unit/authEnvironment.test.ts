// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveAuthEnvironment } from '../../authEnvironment';
import { verifyCredentials } from '../../credentials';

const configuredUsers = `emerson=scrypt:${'ab'.repeat(16)}:${'cd'.repeat(64)}`;

describe('resolveAuthEnvironment', () => {
  it('keeps the environment untouched when the panel users are configured', () => {
    const environment = { NODE_ENV: 'development', ADMIN_USERS: configuredUsers, SESSION_SECRET: 'x'.repeat(32) };

    expect(resolveAuthEnvironment(environment)).toBe(environment);
  });

  it('never fills in users outside development', () => {
    const environment = { NODE_ENV: 'production' };

    expect(resolveAuthEnvironment(environment)).toBe(environment);
  });

  it('provides the admin and multeste users in development when none are configured', async () => {
    const resolved = resolveAuthEnvironment({ NODE_ENV: 'development' });

    expect(await verifyCredentials('admin', 'admin', resolved)).toBe(true);
    expect(await verifyCredentials('multeste', 'mult1234', resolved)).toBe(true);
    expect(await verifyCredentials('admin', 'outra', resolved)).toBe(false);
    expect(resolved.SESSION_SECRET?.length).toBeGreaterThanOrEqual(32);
  });

  it('keeps the development values stable between calls so sessions survive', () => {
    const first = resolveAuthEnvironment({ NODE_ENV: 'development' });
    const second = resolveAuthEnvironment({ NODE_ENV: 'development' });

    expect(second.ADMIN_USERS).toBe(first.ADMIN_USERS);
    expect(second.SESSION_SECRET).toBe(first.SESSION_SECRET);
  });

  it('keeps a session secret set by the developer', () => {
    const resolved = resolveAuthEnvironment({ NODE_ENV: 'development', SESSION_SECRET: 'segredo-escolhido-pelo-dev-com-32-chars!' });

    expect(resolved.SESSION_SECRET).toBe('segredo-escolhido-pelo-dev-com-32-chars!');
  });
});
