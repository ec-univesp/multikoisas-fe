'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_URL } from '@/shared/api/getFromApi';
import { resolveSessionSecret } from './authEnvironment';
import { API_TOKEN_COOKIE_NAME, createSessionToken, hasValidSecret, SESSION_COOKIE_NAME } from './session';

export type LoginState = { error: string | null; username?: string };

type ApiLoginResult = { token: string } | { error: string };

const MISSING_FIELDS_MESSAGE = 'Informe usuário e senha.';
const INVALID_CREDENTIALS_MESSAGE = 'Usuário ou senha incorretos.';
const UNAVAILABLE_MESSAGE = 'Não foi possível entrar agora. Tente de novo em instantes.';
const LOGIN_TIMEOUT_MILLISECONDS = 30 * 1000;
const DEFAULT_TOKEN_DURATION_MILLISECONDS = 2 * 60 * 60 * 1000;
const MAXIMUM_SESSION_DURATION_MILLISECONDS = 8 * 60 * 60 * 1000;

const logIntoApi = async (username: string, password: string): Promise<ApiLoginResult> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(LOGIN_TIMEOUT_MILLISECONDS),
    });
    if (response.status === 401 || response.status === 403) return { error: INVALID_CREDENTIALS_MESSAGE };
    if (!response.ok) return { error: UNAVAILABLE_MESSAGE };
    const { token }: { token?: unknown } = await response.json();
    return typeof token === 'string' && token ? { token } : { error: UNAVAILABLE_MESSAGE };
  } catch {
    return { error: UNAVAILABLE_MESSAGE };
  }
};

const readTokenExpiry = (token: string): number | null => {
  try {
    const { exp }: { exp?: unknown } = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
    return typeof exp === 'number' && Number.isFinite(exp) ? Math.floor(exp * 1000) : null;
  } catch {
    return null;
  }
};

export const loginAction = async (_previousState: LoginState, formData: FormData): Promise<LoginState> => {
  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return { error: MISSING_FIELDS_MESSAGE, username: typeof username === 'string' ? username : '' };
  }

  const sessionSecret = resolveSessionSecret(process.env);
  if (!hasValidSecret(sessionSecret)) return { error: UNAVAILABLE_MESSAGE, username };

  const loginResult = await logIntoApi(username, password);
  if ('error' in loginResult) return { error: loginResult.error, username };

  const now = Date.now();
  const expiresAt = Math.min(
    readTokenExpiry(loginResult.token) ?? now + DEFAULT_TOKEN_DURATION_MILLISECONDS,
    now + MAXIMUM_SESSION_DURATION_MILLISECONDS,
  );
  const sessionToken = await createSessionToken(sessionSecret, now, expiresAt);
  if (!sessionToken) return { error: UNAVAILABLE_MESSAGE, username };

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor((expiresAt - now) / 1000),
  } as const;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, cookieOptions);
  cookieStore.set(API_TOKEN_COOKIE_NAME, loginResult.token, cookieOptions);
  redirect('/admin/products');
};

export const logoutAction = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(API_TOKEN_COOKIE_NAME);
  redirect('/panel');
};
