import { createHash } from 'node:crypto';
import { hasValidSecret } from './session';

type AuthEnvironment = Record<string, string | undefined>;

// Only for `pnpm dev` on a machine without .env.local: production and tests never get here.
const DEVELOPMENT_SESSION_SECRET = 'multikoisas-dev-session-secret-nao-usar-em-producao';

export const resolveSessionSecret = (environment: AuthEnvironment): string | undefined => {
  if (environment.SESSION_SECRET || environment.NODE_ENV !== 'development') return environment.SESSION_SECRET;
  return DEVELOPMENT_SESSION_SECRET;
};

export const resolvePanelUsername = (environment: AuthEnvironment): string | undefined =>
  environment.PANEL_USERNAME?.trim() || undefined;

// Signing with the account fingerprint makes a password change sign every open session out.
export const resolveSessionKey = (environment: AuthEnvironment): string | undefined => {
  const secret = resolveSessionSecret(environment);
  const username = resolvePanelUsername(environment);
  const password = environment.PANEL_PASSWORD;
  if (!hasValidSecret(secret) || !username || !password) return undefined;
  const accountFingerprint = createHash('sha256').update(`${username}:${password}`).digest('hex');
  return `${secret}:${accountFingerprint}`;
};
