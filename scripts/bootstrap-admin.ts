import 'dotenv/config';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { storage } from '../server/storage';

const scrypt = promisify(_scrypt) as (password: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer>;

// Match the hashing scheme used in server/auth.ts: "<hash>.<salt>"
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scrypt(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';

  let user = await storage.getUserByUsername(username);
  if (!user) {
    const hashed = await hashPassword(password);
    user = await storage.createUser({
      username,
      email,
      password: hashed,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
    });
    console.log(`Created admin user: ${user.username}`);
  } else {
    const hashed = await hashPassword(password);
    await storage.updateUser(user.id, { password: hashed, isAdmin: true });
    console.log(`Updated existing user to admin: ${user.username}`);
  }
}

main().then(() => {
  console.log('Bootstrap admin completed.');
  process.exit(0);
}).catch((err) => {
  console.error('Bootstrap admin failed:', err);
  process.exit(1);
});