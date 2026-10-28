import { createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

type CredentialsEnvironment = Record<string, string | undefined>;

const scryptAsync: (password: string, salt: Buffer, keyLength: number) => Promise<Buffer> = promisify(scrypt);

const PASSWORD_HASH_PATTERN = /^scrypt:((?:[0-9a-f]{2})+):([0-9a-f]{128})$/;

const sha256 = (text: string) => createHash('sha256').update(text).digest();

const textsMatch = (received: string, expected: string) => timingSafeEqual(sha256(received), sha256(expected));

export const verifyCredentials = async (
  username: string,
  password: string,
  environment: CredentialsEnvironment,
): Promise<boolean> => {
  const { ADMIN_USERNAME: expectedUsername, ADMIN_PASSWORD_HASH: passwordHash } = environment;
  if (!expectedUsername || !passwordHash) return false;

  const match = PASSWORD_HASH_PATTERN.exec(passwordHash);
  if (!match) return false;

  const [, saltHex, hashHex] = match;
  const expectedHash = Buffer.from(hashHex, 'hex');
  const receivedHash = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expectedHash.length);
  const usernameMatches = textsMatch(username, expectedUsername);
  const passwordMatches = timingSafeEqual(receivedHash, expectedHash);
  return usernameMatches && passwordMatches;
};
