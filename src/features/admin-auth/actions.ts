'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, timingSafeEqual } from 'node:crypto';
import { resolvePanelUsername, resolveSessionKey } from './authEnvironment';
import { createSessionToken, SESSION_COOKIE_NAME } from './session';

export type LoginState = { error: string | null; username?: string };

const MISSING_FIELDS_MESSAGE = 'Informe usuário e senha.';
const INVALID_CREDENTIALS_MESSAGE = 'Usuário ou senha incorretos.';
const NOT_CONFIGURED_MESSAGE = 'O login do painel não está configurado neste ambiente.';
const SESSION_DURATION_MILLISECONDS = 8 * 60 * 60 * 1000;
const FAILED_LOGIN_DELAY_MILLISECONDS = 500;

const waitAfterFailedLogin = () => new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MILLISECONDS));

const digestOf = (text: string) => createHash('sha256').update(text).digest();

const matches = (received: string, expected: string) => timingSafeEqual(digestOf(received), digestOf(expected));

export const loginAction = async (_previousState: LoginState, formData: FormData): Promise<LoginState> => {
  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return { error: MISSING_FIELDS_MESSAGE, username: typeof username === 'string' ? username : '' };
  }

  const sessionKey = resolveSessionKey(process.env);
  const panelUsername = resolvePanelUsername(process.env);
  const panelPassword = process.env.PANEL_PASSWORD;
  if (!sessionKey || !panelUsername || !panelPassword) return { error: NOT_CONFIGURED_MESSAGE, username };

  const usernameMatches = matches(username.trim(), panelUsername);
  const passwordMatches = matches(password, panelPassword);
  if (!usernameMatches || !passwordMatches) {
    await waitAfterFailedLogin();
    return { error: INVALID_CREDENTIALS_MESSAGE, username };
  }

  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MILLISECONDS;
  const sessionToken = await createSessionToken(sessionKey, now, expiresAt);
  if (!sessionToken) return { error: NOT_CONFIGURED_MESSAGE, username };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MILLISECONDS / 1000,
  });
  redirect('/admin/products');
};

export const logoutAction = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/panel');
};
