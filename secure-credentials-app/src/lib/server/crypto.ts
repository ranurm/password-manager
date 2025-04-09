import * as crypto from 'crypto';

// Constants for key derivation
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

/**
 * Generates a random salt for password hashing
 */
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Hashes a password using PBKDF2 with a random salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || generateSalt();
  const hash = crypto.pbkdf2Sync(
    password,
    generatedSalt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString('hex');
  
  return { hash, salt: generatedSalt };
}

/**
 * Verifies a password against a stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encryptData(data: string, key: Buffer, iv: Buffer): { encryptedData: string; authTag: string } {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return { encryptedData: encrypted, authTag };
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decryptData(encryptedData: string, key: Buffer, iv: Buffer, authTag: string): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Derives an encryption key from the master password
 */
export function deriveEncryptionKey(masterPassword: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(
    masterPassword,
    salt,
    ITERATIONS,
    32, // 256 bits
    DIGEST
  );
}

/**
 * Generates a random initialization vector for encryption
 */
export function generateIV(): Buffer {
  return crypto.randomBytes(16);
}

/**
 * Generates a 6-digit verification code for 2FA
 */
export function generateVerificationCode(): string {
  const array = new Uint8Array(1);
  crypto.randomFillSync(array);
  const code = 100000 + (array[0] % 900000);
  return code.toString();
} 