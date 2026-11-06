// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_TOKEN_COOKIE_NAME, createSessionToken, SESSION_COOKIE_NAME } from '@/features/admin-auth/session';
import { recordApiRequests } from '@/test/msw/server';
import { config, proxy } from '../../proxy';

const secret = 'a-session-secret-with-at-least-32-characters';
const apiToken = 'jwt-guardado-no-login';
const oneHourInMs = 60 * 60 * 1000;

type RequestOptions = { apiToken?: string | null; authorization?: string };

const buildRequest = (path: string, sessionToken?: string, method = 'GET', options: RequestOptions = {}) => {
  const headers = new Headers();
  const storedApiToken = options.apiToken === undefined ? apiToken : options.apiToken;
  const cookies = [
    sessionToken ? `${SESSION_COOKIE_NAME}=${sessionToken}` : null,
    sessionToken && storedApiToken ? `${API_TOKEN_COOKIE_NAME}=${storedApiToken}` : null,
  ].filter((cookie) => cookie !== null);
  if (cookies.length > 0) headers.set('cookie', cookies.join('; '));
  if (options.authorization) headers.set('authorization', options.authorization);
  return new NextRequest(`http://localhost:3000${path}`, { method, headers });
};

const forwardedAuthorization = (response: Response) => response.headers.get('x-middleware-request-authorization');

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

  describe('api proxy', () => {
    it('lets reads through without a session and without the api token', async () => {
      const response = await proxy(buildRequest('/api/produto'));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedAuthorization(response)).toBeNull();
    });

    it.each(['POST', 'PUT', 'DELETE'])(
      'refuses a %s without a panel session before reaching the api',
      async (method) => {
        const apiRequests = recordApiRequests();

        const response = await proxy(buildRequest('/api/produto/1', undefined, method));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Entre no painel para salvar.' });
        expect(apiRequests).toEqual([]);
      },
    );

    it('refuses a write without the api token cookie before reaching the api', async () => {
      const apiRequests = recordApiRequests();

      const response = await proxy(buildRequest('/api/produto', await validToken(), 'POST', { apiToken: null }));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Entre no painel para salvar.' });
      expect(forwardedAuthorization(response)).toBeNull();
      expect(apiRequests).toEqual([]);
    });

    it('forwards a write with the api token stored at login', async () => {
      const response = await proxy(buildRequest('/api/produto', await validToken(), 'POST'));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedAuthorization(response)).toBe(`Bearer ${apiToken}`);
    });

    it('replaces an authorization header sent by the browser with the stored api token', async () => {
      const response = await proxy(
        buildRequest('/api/produto/1', await validToken(), 'PUT', { authorization: 'Bearer token-do-navegador' }),
      );

      expect(forwardedAuthorization(response)).toBe(`Bearer ${apiToken}`);
    });

    it.each(['/api/user', '/api/user/emerson', '/api/auth/login', '/api'])(
      'refuses a write to %s, which the panel never makes, without using the api token',
      async (path) => {
        const apiRequests = recordApiRequests();

        const response = await proxy(buildRequest(path, await validToken(), 'POST'));

        expect(response.status).toBe(403);
        expect(forwardedAuthorization(response)).toBeNull();
        expect(apiRequests).toEqual([]);
      },
    );
  });
});
