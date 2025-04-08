import crypto from 'crypto';

// Verify that a public key is in the correct JWK format
export async function verifyPublicKey(publicKeyJwk: string): Promise<boolean> {
  try {
    const key = JSON.parse(publicKeyJwk);
    return (
      key.kty === 'EC' &&
      key.crv === 'P-256' &&
      typeof key.x === 'string' &&
      typeof key.y === 'string'
    );
  } catch (error) {
    return false;
  }
}

// Generate a random challenge string
export function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.randomFillSync(array);
  return Buffer.from(array).toString('base64');
}

// Generate backup codes for 2FA recovery
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.randomFillSync(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code.match(/.{4}/g)!.join('-'));
  }
  return codes;
}

// Hash a backup code for storage
export async function hashBackupCode(code: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('hex');
} 