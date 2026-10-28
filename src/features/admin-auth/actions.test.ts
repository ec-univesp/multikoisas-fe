// @vitest-environment node
import { scryptSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginAction, logoutAction } from './actions';
import { SESSION_COOKIE_NAME, verifySessionToken } from './session';

const { cookieStore, redirect } = vi.hoisted(() => ({
  cookieStore: { set: vi.fn(), delete: vi.fn() },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({ redirect }));

const secret = 'a-session-secret-with-at-least-32-characters';
const salt = Buffer.from('fedcba9876543210fedcba9876543210', 'hex');
const passwordHash = `scrypt:${salt.toString('hex')}:${scryptSync('senha-da-loja', salt, 64).toString('hex')}`;
const initialState = { error: null };

const buildFormData = (username: string, password: string) => {
  const formData = new FormData();
  formData.set('username', username);
  formData.set('password', password);
  return formData;
};

describe('loginAction', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_USERNAME', 'loja');
    vi.stubEnv('ADMIN_PASSWORD_HASH', passwordHash);
    vi.stubEnv('SESSION_SECRET', secret);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each([
    ['', 'senha-da-loja'],
    ['loja', ''],
    ['   ', 'senha-da-loja'],
  ])('asks for username and password when a field is empty (%j, %j)', async (username, password) => {
    expect(await loginAction(initialState, buildFormData(username, password))).toEqual({
      error: 'Informe usuário e senha.',
      username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('asks for username and password when the fields are absent', async () => {
    expect(await loginAction(initialState, new FormData())).toEqual({ error: 'Informe usuário e senha.', username: '' });
  });

  it.each([
    ['admin', 'senha-da-loja'],
    ['loja', 'senha-errada'],
  ])('returns the same message for a wrong username or password (%j, %j)', async (username, password) => {
    expect(await loginAction(initialState, buildFormData(username, password))).toEqual({
      error: 'Usuário ou senha incorretos.',
      username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('fails closed with the generic message when the session secret is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '');

    expect(await loginAction(initialState, buildFormData('loja', 'senha-da-loja'))).toEqual({
      error: 'Usuário ou senha incorretos.',
      username: 'loja',
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('stores a signed session cookie and redirects to the products panel', async () => {
    await expect(loginAction(initialState, buildFormData('loja', 'senha-da-loja'))).rejects.toThrow(
      'NEXT_REDIRECT /admin/produtos',
    );

    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    const [, token] = cookieStore.set.mock.calls[0];
    expect(await verifySessionToken(token, secret, passwordHash, Date.now())).toBe(true);
  });

  it('marks the cookie as secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(loginAction(initialState, buildFormData('loja', 'senha-da-loja'))).rejects.toThrow('NEXT_REDIRECT');

    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), expect.objectContaining({ secure: true }));
  });
});

describe('logoutAction', () => {
  it('deletes the session cookie and redirects to the login page', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT /panel');

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});
