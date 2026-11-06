// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordApiRequests } from '@/test/msw/server';
import { loginAction, logoutAction } from '../../actions';
import { resolveSessionKey } from '../../authEnvironment';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../session';

const { cookieStore, redirect } = vi.hoisted(() => ({
  cookieStore: { set: vi.fn(), delete: vi.fn() },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({ redirect }));

const secret = 'a-session-secret-with-at-least-32-characters';
const panelUsername = 'loja';
const panelPassword = 'senha-do-painel';
const now = Date.UTC(2026, 10, 6, 12, 0, 0);
const eightHoursInSeconds = 8 * 60 * 60;
const initialState = { error: null };
const invalidMessage = 'Usuário ou senha incorretos.';
const notConfiguredMessage = 'O login do painel não está configurado neste ambiente.';

const buildFormData = (username: string, password: string) => {
  const formData = new FormData();
  formData.set('username', username);
  formData.set('password', password);
  return formData;
};

const logIn = (username = panelUsername, password = panelPassword) =>
  loginAction(initialState, buildFormData(username, password));

describe('loginAction', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    vi.stubEnv('SESSION_SECRET', secret);
    vi.stubEnv('PANEL_USERNAME', panelUsername);
    vi.stubEnv('PANEL_PASSWORD', panelPassword);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each([
    ['', 'senha'],
    ['loja', ''],
    ['   ', 'senha'],
  ])('asks for username and password (%j, %j)', async (username, password) => {
    expect(await logIn(username, password)).toEqual({ error: 'Informe usuário e senha.', username });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('asks for username and password when the fields are absent', async () => {
    expect(await loginAction(initialState, new FormData())).toEqual({
      error: 'Informe usuário e senha.',
      username: '',
    });
  });

  it('stores an 8-hour session for the panel account and opens the products panel, without calling any api', async () => {
    const apiRequests = recordApiRequests();

    await expect(logIn()).rejects.toThrow('NEXT_REDIRECT /admin/products');

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: eightHoursInSeconds,
    });
    const sessionToken = cookieStore.set.mock.calls[0]?.[1];
    const key = resolveSessionKey(process.env);
    expect(await verifySessionToken(sessionToken, key, now + eightHoursInSeconds * 1000 - 1)).toBe(true);
    expect(await verifySessionToken(sessionToken, key, now + eightHoursInSeconds * 1000)).toBe(false);
    expect(apiRequests).toEqual([]);
  });

  it('marks the session cookie as secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(logIn()).rejects.toThrow('NEXT_REDIRECT');

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it.each([
    ['a wrong password', panelUsername, 'errada'],
    ['a wrong username', 'outra', panelPassword],
    ['a password that only starts the same', panelUsername, `${panelPassword}x`],
  ])('says the username or password is wrong for %s', async (_case, username, password) => {
    expect(await logIn(username, password)).toEqual({ error: invalidMessage, username });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('ignores spaces around the username, typed or configured', async () => {
    vi.stubEnv('PANEL_USERNAME', ` ${panelUsername}\n`);
    await expect(logIn(`  ${panelUsername}  `)).rejects.toThrow('NEXT_REDIRECT /admin/products');
  });

  it('waits half a second before saying the credentials are wrong, to slow down guessing', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    expect(await logIn(panelUsername, 'errada')).toEqual({ error: invalidMessage, username: panelUsername });

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  it.each([['PANEL_USERNAME'], ['PANEL_PASSWORD'], ['SESSION_SECRET']])(
    'explains that the login is not configured when %s is missing',
    async (variable) => {
      vi.stubEnv(variable, '');

      expect(await logIn()).toEqual({ error: notConfiguredMessage, username: panelUsername });
      expect(cookieStore.set).not.toHaveBeenCalled();
    },
  );
});

describe('logoutAction', () => {
  it('deletes the session cookie and redirects to the login page', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT /panel');

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});
