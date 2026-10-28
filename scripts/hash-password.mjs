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

const readPipedPassword = async () => (await text(process.stdin)).replace(/\r?\n$/, '');

const password = process.stdin.isTTY ? await readHiddenLine('Senha: ') : await readPipedPassword();

if (!password) {
  console.error('Uso: node scripts/hash-password.mjs (digite a senha quando pedir, ou envie pela entrada padrão)');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);
