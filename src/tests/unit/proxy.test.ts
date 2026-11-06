// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_TOKEN_COOKIE_NAME, createSessionToken, SESSION_COOKIE_NAME } from '@/features/admin-auth/session';
import { recordApiRequests } from '@/test/msw/server';
import { config, proxy } from '../../proxy';

const secret = 'a-session-secret-with-at-least-32-characters';
const apiToken = 'jwt-guardado-no-login';
const oneHourInMs = 60 * 60 * 1000;

type RequestOptions = { apiToken?: string | null };

const buildRequest = (path: string, sessionToken?: string, method = 'GET', options: RequestOptions = {}) => {
  const headers = new Headers();
  const storedApiToken = options.apiToken === undefined ? apiToken : options.apiToken;
  const cookies = [
    sessionToken ? `${SESSION_COOKIE_NAME}=${sessionToken}` : null,
    sessionToken && storedApiToken ? `${API_TOKEN_COOKIE_NAME}=${storedApiToken}` : null,
  ].filter((cookie) => cookie !== null);
  if (cookies.length > 0) headers.set('cookie', cookies.join('; '));
  return new NextRequest(`http://localhost:3000${path}`, { method, headers });
};

const validToken = async () => (await createSessionToken(secret, Date.now(), Date.now() + oneHourInMs)) ?? '';

describe('proxy', () => {
  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', secret);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('runs only on the admin pages, the login page, the site settings page and the api proxy', () => {
    expect(config.matcher).toEqual(['/admin/:path*', '/panel', '/store', '/api/:path*']);
  });

  it.each(['/admin', '/admin/products'])('redirects %s to the login page without a session', async (path) => {
    const response = await proxy(buildRequest(path));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('redirects /store to the login page without a session', async () => {
    const response = await proxy(buildRequest('/store'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('redirects to the login page when the session token is invalid', async () => {
    const response = await proxy(buildRequest('/admin/products', 'tampered.token'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('lets an admin page through with a valid session', async () => {
    const response = await proxy(buildRequest('/admin/products', await validToken()));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects to the login page once the session expires', async () => {
    const expiredToken = (await createSessionToken(secret, Date.now() - 2 * oneHourInMs, Date.now() - 1)) ?? '';

    const response = await proxy(buildRequest('/admin/products', expiredToken));

    expect(expiredToken).not.toBe('');
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('treats a session whose api token cookie is gone as signed out, so the person can sign in again', async () => {
    const sessionWithoutToken = await validToken();

    const adminPage = await proxy(buildRequest('/admin/products', sessionWithoutToken, 'GET', { apiToken: null }));
    const loginPage = await proxy(buildRequest('/panel', sessionWithoutToken, 'GET', { apiToken: null }));

    expect(adminPage.headers.get('location')).toBe('http://localhost:3000/panel');
    expect(loginPage.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects the login page to the products panel with a valid session', async () => {
    const response = await proxy(buildRequest('/panel', await validToken()));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/products');
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

  describe('api requests', () => {
    it.each(['GET', 'HEAD', 'POST', 'PUT', 'DELETE'])(
      'answers a %s with 503 and never forwards it to the api, even with a panel session',
      async (method) => {
        const apiRequests = recordApiRequests();

        for (const sessionToken of [undefined, await validToken()]) {
          const response = await proxy(buildRequest('/api/produto/1', sessionToken, method));

          expect(response.status).toBe(503);
          expect(response.headers.get('x-middleware-next')).toBeNull();
          expect(await response.json()).toEqual({ error: 'A API local não está disponível neste navegador.' });
        }
        expect(apiRequests).toEqual([]);
      },
    );
  });
});
