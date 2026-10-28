import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { text } from 'node:stream/consumers';

const readHiddenLine = (prompt) =>
  new Promise((resolve) => {
    process.stderr.write(prompt);
    const mutedOutput = new Writable({ write: (_chunk, _encoding, callback) => callback() });
    const lineReader = createInterface({ input: process.stdin, output: mutedOutput, terminal: true });
    lineReader.question('', (answer) => {
      lineReader.close();
      process.stderr.write('\n');
      resolve(answer);
    });
  });

const USAGE = 'Uso: node scripts/hash-password.mjs <usuário> (digite a senha quando pedir, ou envie pela entrada padrão)';

const username = process.argv[2];

if (!username || !/^[A-Za-z0-9._@-]+$/.test(username)) {
  console.error(USAGE);
  console.error('O usuário aceita só letras sem acento, números e . _ @ -');
  process.exit(1);
}

const readPipedPassword = async () => (await text(process.stdin)).replace(/\r?\n$/, '');

const password = process.stdin.isTTY ? await readHiddenLine('Senha: ') : await readPipedPassword();

if (!password) {
  console.error(USAGE);
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`${username}=scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);
