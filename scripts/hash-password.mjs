import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/hash-password.mjs 'senha'");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);
