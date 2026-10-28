'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyCredentials } from './credentials';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from './session';

export type LoginState = { error: string | null };

const MISSING_FIELDS_MESSAGE = 'Informe usuário e senha.';
const INVALID_CREDENTIALS_MESSAGE = 'Usuário ou senha incorretos.';

export const loginAction = async (_previousState: LoginState, formData: FormData): Promise<LoginState> => {
  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return { error: MISSING_FIELDS_MESSAGE };
  }

  if (!verifyCredentials(username, password, process.env)) return { error: INVALID_CREDENTIALS_MESSAGE };

  const sessionToken = await createSessionToken(process.env.SESSION_SECRET, Date.now());
  if (!sessionToken) return { error: INVALID_CREDENTIALS_MESSAGE };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
  redirect('/admin/produtos');
};

export const logoutAction = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/panel');
};
