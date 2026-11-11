type AuthEnvironment = Record<string, string | undefined>;

// Only for `vlt run dev` on a machine without .env.local: production and tests never get here.
const DEVELOPMENT_SESSION_SECRET = 'multikoisas-dev-session-secret-nao-usar-em-producao';

export const resolveSessionSecret = (environment: AuthEnvironment): string | undefined => {
  if (environment.SESSION_SECRET || environment.NODE_ENV !== 'development') return environment.SESSION_SECRET;
  return DEVELOPMENT_SESSION_SECRET;
};
