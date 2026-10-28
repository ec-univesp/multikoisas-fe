// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/features/admin-auth/session';
import { config, proxy } from './proxy';

const secret = 'a-session-secret-with-at-least-32-characters';

const buildRequest = (path: string, sessionToken?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: sessionToken ? { cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` } : {},
  });

const validToken = async () => (await createSessionToken(secret, Date.now())) ?? '';

describe('proxy', () => {
  beforeEach(() => vi.stubEnv('SESSION_SECRET', secret));
  afterEach(() => vi.unstubAllEnvs());

  it('runs only on the admin pages and the login page', () => {
    expect(config.matcher).toEqual(['/admin/:path*', '/panel']);
  });

  it.each(['/admin', '/admin/produtos'])('redirects %s to the login page without a session', async (path) => {
    const response = await proxy(buildRequest(path));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('redirects to the login page when the session token is invalid', async () => {
    const response = await proxy(buildRequest('/admin/produtos', 'tampered.token'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('lets an admin page through with a valid session', async () => {
    const response = await proxy(buildRequest('/admin/produtos', await validToken()));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects the login page to the products panel with a valid session', async () => {
    const response = await proxy(buildRequest('/panel', await validToken()));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/produtos');
  });

  it('lets the login page through without a session', async () => {
    const response = await proxy(buildRequest('/panel'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('lets other paths through without a session', async () => {
    const response = await proxy(buildRequest('/administrator'));

    expect(response.headers.get('location')).toBeNull();
  });
});
