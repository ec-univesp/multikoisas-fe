// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetApiToken } from '@/features/admin-auth/apiToken';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/features/admin-auth/session';
import { TEST_API_CREDENTIALS } from '@/test/msw/handlers';
import { recordApiRequests } from '@/test/msw/server';
import { config, proxy } from '../../proxy';

const secret = 'a-session-secret-with-at-least-32-characters';
const adminUsers = `emerson=scrypt:${'ab'.repeat(16)}:${'cd'.repeat(64)}`;

const buildRequest = (path: string, sessionToken?: string, method = 'GET') =>
  new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: sessionToken ? { cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` } : {},
  });

const forwardedAuthorization = (response: Response) => response.headers.get('x-middleware-request-authorization');

const validToken = async () => (await createSessionToken(secret, adminUsers, Date.now())) ?? '';

describe('proxy', () => {
  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET', secret);
    vi.stubEnv('ADMIN_USERS', adminUsers);
    vi.stubEnv('MULTIKOISAS_API_USERNAME', TEST_API_CREDENTIALS.username);
    vi.stubEnv('MULTIKOISAS_API_PASSWORD', TEST_API_CREDENTIALS.password);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    forgetApiToken();
  });

  it('runs only on the admin pages, the login page, the site settings page and the api proxy', () => {
    expect(config.matcher).toEqual(['/admin/:path*', '/panel', '/store', '/api/:path*']);
  });

  it.each(['/admin', '/admin/produtos'])('redirects %s to the login page without a session', async (path) => {
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
    const response = await proxy(buildRequest('/admin/produtos', 'tampered.token'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
  });

  it('lets an admin page through with a valid session', async () => {
    const response = await proxy(buildRequest('/admin/produtos', await validToken()));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects to the login page after the user list changes', async () => {
    const token = await validToken();
    vi.stubEnv('ADMIN_USERS', `${adminUsers},multeste=scrypt:${'ef'.repeat(16)}:${'01'.repeat(64)}`);

    const response = await proxy(buildRequest('/admin/produtos', token));

    expect(response.headers.get('location')).toBe('http://localhost:3000/panel');
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

    it('forwards a write with the api token of the panel account', async () => {
      const response = await proxy(buildRequest('/api/produto', await validToken(), 'POST'));

      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(forwardedAuthorization(response)).toBe(`Bearer ${TEST_API_CREDENTIALS.token}`);
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

    it('logs into the api only once for writes that arrive together', async () => {
      const apiRequests = recordApiRequests();
      const token = await validToken();

      await Promise.all([
        proxy(buildRequest('/api/produto', token, 'POST')),
        proxy(buildRequest('/api/categoria', token, 'POST')),
      ]);

      expect(apiRequests).toEqual(['POST /auth/login']);
    });

    it('logs into the api once and reuses the token on the next writes', async () => {
      const apiRequests = recordApiRequests();
      const token = await validToken();

      await proxy(buildRequest('/api/produto', token, 'POST'));
      const secondWrite = await proxy(buildRequest('/api/categoria', token, 'POST'));

      expect(forwardedAuthorization(secondWrite)).toBe(`Bearer ${TEST_API_CREDENTIALS.token}`);
      expect(apiRequests).toEqual(['POST /auth/login']);
    });

    it('logs into the api again once the token is close to expiring', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const apiRequests = recordApiRequests();

      await proxy(buildRequest('/api/produto', await validToken(), 'POST'));
      vi.setSystemTime(Date.now() + 11 * 60 * 1000);
      await proxy(buildRequest('/api/produto', await validToken(), 'POST'));

      expect(apiRequests).toEqual(['POST /auth/login', 'POST /auth/login']);
      vi.useRealTimers();
    });

    it.each([
      ['wrong', { MULTIKOISAS_API_PASSWORD: 'errada' }],
      ['missing', { MULTIKOISAS_API_USERNAME: '' }],
    ])('answers 503 when the api account is %s', async (_case, environment) => {
      for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);

      const response = await proxy(buildRequest('/api/produto', await validToken(), 'POST'));

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'O painel não conseguiu entrar na API para salvar.' });
    });
  });
});
