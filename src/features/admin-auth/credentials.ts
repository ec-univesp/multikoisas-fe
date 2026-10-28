import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';

type CredentialsEnvironment = Record<string, string | undefined>;

const PASSWORD_HASH_PATTERN = /^scrypt:((?:[0-9a-f]{2})+):([0-9a-f]{128})$/;

const sha256 = (text: string) => createHash('sha256').update(text).digest();

const textsMatch = (received: string, expected: string) => timingSafeEqual(sha256(received), sha256(expected));

export const verifyCredentials = (username: string, password: string, environment: CredentialsEnvironment): boolean => {
  const { ADMIN_USERNAME: expectedUsername, ADMIN_PASSWORD_HASH: passwordHash } = environment;
  if (!expectedUsername || !passwordHash) return false;

  const match = PASSWORD_HASH_PATTERN.exec(passwordHash);
  if (!match) return false;

  const [, saltHex, hashHex] = match;
  const expectedHash = Buffer.from(hashHex, 'hex');
  const receivedHash = scryptSync(password, Buffer.from(saltHex, 'hex'), expectedHash.length);
  const usernameMatches = textsMatch(username, expectedUsername);
  const passwordMatches = timingSafeEqual(receivedHash, expectedHash);
  return usernameMatches && passwordMatches;
};
