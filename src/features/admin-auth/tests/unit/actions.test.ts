// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_API_CREDENTIALS } from '@/test/msw/handlers';
import { recordApiRequests, server } from '@/test/msw/server';
import { loginAction, logoutAction } from '../../actions';
import { API_TOKEN_COOKIE_NAME, SESSION_COOKIE_NAME, verifySessionToken } from '../../session';

const { cookieStore, redirect } = vi.hoisted(() => ({
  cookieStore: { set: vi.fn(), delete: vi.fn() },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({ redirect }));

const secret = 'a-session-secret-with-at-least-32-characters';
const now = Date.UTC(2026, 10, 6, 12, 0, 0);
const initialState = { error: null };
const unavailableMessage = 'Não foi possível entrar agora. Tente de novo em instantes.';

const encodeSegment = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const buildJwt = (payload: object) => `${encodeSegment({ alg: 'HS256' })}.${encodeSegment(payload)}.signature`;

const answerLoginWith = (response: () => Response) => server.use(http.post('*/auth/login', response));

const buildFormData = (username: string, password: string) => {
  const formData = new FormData();
  formData.set('username', username);
  formData.set('password', password);
  return formData;
};

const logInWithTestAccount = () =>
  loginAction(initialState, buildFormData(TEST_API_CREDENTIALS.username, TEST_API_CREDENTIALS.password));

const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge });

describe('loginAction', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    vi.stubEnv('SESSION_SECRET', secret);
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
  ])('asks for username and password without calling the api (%j, %j)', async (username, password) => {
    const apiRequests = recordApiRequests();

    expect(await loginAction(initialState, buildFormData(username, password))).toEqual({
      error: 'Informe usuário e senha.',
      username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(apiRequests).toEqual([]);
  });

  it('asks for username and password when the fields are absent', async () => {
    expect(await loginAction(initialState, new FormData())).toEqual({
      error: 'Informe usuário e senha.',
      username: '',
    });
  });

  it('stores the session and the api token until the token expires, then opens the products panel', async () => {
    const token = buildJwt({ sub: 'admin', exp: now / 1000 + 3600 });
    answerLoginWith(() => HttpResponse.json({ token }));

    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT /admin/products');

    expect(cookieStore.set).toHaveBeenCalledWith(API_TOKEN_COOKIE_NAME, token, cookieOptions(3600));
    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), cookieOptions(3600));
    const sessionToken = cookieStore.set.mock.calls.find(([name]) => name === SESSION_COOKIE_NAME)?.[1];
    expect(await verifySessionToken(sessionToken, secret, now + 3600 * 1000 - 1)).toBe(true);
    expect(await verifySessionToken(sessionToken, secret, now + 3600 * 1000)).toBe(false);
  });

  it('accepts a token whose expiry has a fraction of a second', async () => {
    answerLoginWith(() => HttpResponse.json({ token: buildJwt({ exp: now / 1000 + 3600.5 }) }));

    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT /admin/products');

    const sessionToken = cookieStore.set.mock.calls.find(([name]) => name === SESSION_COOKIE_NAME)?.[1];
    expect(await verifySessionToken(sessionToken, secret, now + 3600 * 1000 - 1)).toBe(true);
  });

  it('does not send the password to the api when the session secret is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '');
    const apiRequests = recordApiRequests();

    expect(await logInWithTestAccount()).toEqual({
      error: unavailableMessage,
      username: TEST_API_CREDENTIALS.username,
    });
    expect(apiRequests).toEqual([]);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('keeps the cookies for 2 hours when the token has no readable expiry', async () => {
    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT /admin/products');

    expect(cookieStore.set).toHaveBeenCalledWith(
      API_TOKEN_COOKIE_NAME,
      TEST_API_CREDENTIALS.token,
      cookieOptions(2 * 60 * 60),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), cookieOptions(2 * 60 * 60));
  });

  it('keeps the cookies for 2 hours when the token payload has no expiry', async () => {
    answerLoginWith(() => HttpResponse.json({ token: buildJwt({ sub: 'admin' }) }));

    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT');

    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), cookieOptions(2 * 60 * 60));
  });

  it('never keeps the cookies for more than 8 hours', async () => {
    answerLoginWith(() => HttpResponse.json({ token: buildJwt({ exp: now / 1000 + 30 * 24 * 3600 }) }));

    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT');

    expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, expect.any(String), cookieOptions(8 * 60 * 60));
    expect(cookieStore.set).toHaveBeenCalledWith(API_TOKEN_COOKIE_NAME, expect.any(String), cookieOptions(8 * 60 * 60));
  });

  it('marks both cookies as secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(logInWithTestAccount()).rejects.toThrow('NEXT_REDIRECT');

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      API_TOKEN_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it('says the username or password is wrong when the api refuses them', async () => {
    expect(await loginAction(initialState, buildFormData(TEST_API_CREDENTIALS.username, 'errada'))).toEqual({
      error: 'Usuário ou senha incorretos.',
      username: TEST_API_CREDENTIALS.username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('says the username or password is wrong when the api answers 401', async () => {
    answerLoginWith(() => HttpResponse.json({ message: 'Bad credentials' }, { status: 401 }));

    expect(await logInWithTestAccount()).toEqual({
      error: 'Usuário ou senha incorretos.',
      username: TEST_API_CREDENTIALS.username,
    });
  });

  it.each([
    ['the api is unreachable', () => HttpResponse.error()],
    ['the api fails', () => HttpResponse.text('java.lang.NullPointerException at AuthController', { status: 500 })],
    ['the api answers without a token', () => HttpResponse.json({ message: 'ok' })],
    ['the api answers an empty token', () => HttpResponse.json({ token: '' })],
    ['the api answers something other than json', () => HttpResponse.text('<html>sleeping</html>')],
    ['the token is already expired', () => HttpResponse.json({ token: buildJwt({ exp: now / 1000 - 1 }) })],
  ])('asks to try again later when %s, without showing the api text', async (_case, response) => {
    answerLoginWith(response);

    expect(await logInWithTestAccount()).toEqual({
      error: unavailableMessage,
      username: TEST_API_CREDENTIALS.username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('asks to try again later when the api takes longer than 30 seconds to answer', async () => {
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(AbortSignal.abort(new DOMException('The operation timed out.', 'TimeoutError')));

    expect(await logInWithTestAccount()).toEqual({
      error: unavailableMessage,
      username: TEST_API_CREDENTIALS.username,
    });
    expect(timeout).toHaveBeenCalledWith(30 * 1000);
    expect(cookieStore.set).not.toHaveBeenCalled();
    timeout.mockRestore();
  });

  it('asks to try again later when the session secret is missing', async () => {
    vi.stubEnv('SESSION_SECRET', '');

    expect(await logInWithTestAccount()).toEqual({
      error: unavailableMessage,
      username: TEST_API_CREDENTIALS.username,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe('logoutAction', () => {
  it('deletes the session and api token cookies and redirects to the login page', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT /panel');

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    expect(cookieStore.delete).toHaveBeenCalledWith(API_TOKEN_COOKIE_NAME);
  });
});
