import { createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

type CredentialsEnvironment = Record<string, string | undefined>;

type AdminUser = { username: string; salt: Buffer; hash: Buffer };

const scryptAsync: (password: string, salt: Buffer, keyLength: number) => Promise<Buffer> = promisify(scrypt);

const USERNAME_PATTERN = /^[A-Za-z0-9._@-]+$/;
const PASSWORD_HASH_PATTERN = /^scrypt:((?:[0-9a-f]{2})+):([0-9a-f]{128})$/;
const UNKNOWN_USER_SALT = Buffer.alloc(16);
const UNKNOWN_USER_HASH = Buffer.alloc(64);

const sha256 = (text: string) => createHash('sha256').update(text).digest();

const textsMatch = (received: string, expected: string) => timingSafeEqual(sha256(received), sha256(expected));

const parseUserEntry = (entry: string): AdminUser | null => {
  const separatorIndex = entry.indexOf('=');
  if (separatorIndex < 0) return null;

  const username = entry.slice(0, separatorIndex).trim();
  const passwordHashMatch = PASSWORD_HASH_PATTERN.exec(entry.slice(separatorIndex + 1).trim());
  if (!USERNAME_PATTERN.test(username) || !passwordHashMatch) return null;

  const [, saltHex, hashHex] = passwordHashMatch;
  return { username, salt: Buffer.from(saltHex, 'hex'), hash: Buffer.from(hashHex, 'hex') };
};

const parseAdminUsers = (adminUsers: string | undefined) =>
  (adminUsers ?? '').split(',').flatMap((entry, index) => {
    if (entry.trim() === '') return [];
    const user = parseUserEntry(entry);
    if (user) return [user];
    console.warn(`ADMIN_USERS: entrada de índice ${index} mal formada, ignorada.`);
    return [];
  });

const findUser = (users: AdminUser[], username: string) => users.filter((user) => textsMatch(username, user.username))[0];

export const verifyCredentials = async (
  username: string,
  password: string,
  environment: CredentialsEnvironment,
): Promise<boolean> => {
  const user = findUser(parseAdminUsers(environment.ADMIN_USERS), username);
  const expectedHash = user?.hash ?? UNKNOWN_USER_HASH;
  const receivedHash = await scryptAsync(password, user?.salt ?? UNKNOWN_USER_SALT, expectedHash.length);
  const passwordMatches = timingSafeEqual(receivedHash, expectedHash);
  return user !== undefined && passwordMatches;
};
