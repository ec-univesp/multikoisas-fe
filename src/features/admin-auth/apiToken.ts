import { API_URL } from '@/shared/api/getFromApi';

type AuthEnvironment = Record<string, string | undefined>;
type CachedToken = { value: string; renewAt: number };

// O token da multikoisas-api vale 2 horas; renovar antes evita gravação recusada no fim da validade.
const TOKEN_REUSE_MILLISECONDS = 90 * 60 * 1000;

let cachedToken: CachedToken | null = null;

export const forgetApiToken = () => {
  cachedToken = null;
};

const logIntoApi = async (username: string, password: string): Promise<string | null> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const { token }: { token?: string } = await response.json();
  return token || null;
};

export const getApiToken = async (environment: AuthEnvironment, now: number): Promise<string | null> => {
  if (cachedToken && cachedToken.renewAt > now) return cachedToken.value;
  const username = environment.MULTIKOISAS_API_USERNAME;
  const password = environment.MULTIKOISAS_API_PASSWORD;
  if (!username || !password) return null;
  const token = await logIntoApi(username, password).catch(() => null);
  cachedToken = token ? { value: token, renewAt: now + TOKEN_REUSE_MILLISECONDS } : null;
  return token;
};
