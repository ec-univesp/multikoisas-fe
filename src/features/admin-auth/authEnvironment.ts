import { scryptSync } from 'node:crypto';

type AuthEnvironment = Record<string, string | undefined>;

// Só para `pnpm dev` numa máquina sem .env.local: produção e testes nunca entram aqui.
const DEVELOPMENT_USERS: ReadonlyArray<readonly [username: string, password: string]> = [
  ['admin', 'admin'],
  ['multeste', 'mult1234'],
];
const DEVELOPMENT_SALT = Buffer.from('multikoisas-dev-salt'.padEnd(16).slice(0, 16));
const DEVELOPMENT_SESSION_SECRET = 'multikoisas-dev-session-secret-nao-usar-em-producao';

const toUserEntry = ([username, password]: readonly [string, string]) =>
  `${username}=scrypt:${DEVELOPMENT_SALT.toString('hex')}:${scryptSync(password, DEVELOPMENT_SALT, 64).toString('hex')}`;

let developmentAdminUsers: string | undefined;

const getDevelopmentAdminUsers = () => {
  developmentAdminUsers ??= DEVELOPMENT_USERS.map(toUserEntry).join(',');
  return developmentAdminUsers;
};

export const resolveAuthEnvironment = (environment: AuthEnvironment): AuthEnvironment => {
  if (environment.NODE_ENV !== 'development' || environment.ADMIN_USERS) return environment;
  return {
    ...environment,
    ADMIN_USERS: getDevelopmentAdminUsers(),
    SESSION_SECRET: environment.SESSION_SECRET || DEVELOPMENT_SESSION_SECRET,
  };
};
