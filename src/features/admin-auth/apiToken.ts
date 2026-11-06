import { API_URL } from '@/shared/api/getFromApi';

type AuthEnvironment = Record<string, string | undefined>;
type CachedToken = { value: string; renewAt: number };

// O proxy não vê a resposta da API: um token recusado (conta removida, segredo trocado) só sai do cache ao vencer.
const TOKEN_REUSE_MILLISECONDS = 10 * 60 * 1000;
const LOGIN_TIMEOUT_MILLISECONDS = 30 * 1000;

let cachedToken: CachedToken | null = null;
let pendingLogin: Promise<string | null> | null = null;

export const forgetApiToken = () => {
  cachedToken = null;
  pendingLogin = null;
};

const logIntoApi = async (username: string, password: string): Promise<string | null> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    cache: 'no-store',
    signal: AbortSignal.timeout(LOGIN_TIMEOUT_MILLISECONDS),
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
  pendingLogin ??= logIntoApi(username, password)
    .catch(() => null)
    .then((token) => {
      cachedToken = token ? { value: token, renewAt: now + TOKEN_REUSE_MILLISECONDS } : null;
      pendingLogin = null;
      return token;
    });
  return pendingLogin;
};
