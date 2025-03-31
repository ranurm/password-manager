'use client';

// Use browser's native crypto API
const getCrypto = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.crypto;
};

// Generate a random challenge string
export function generateChallenge(): string {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(Array.from(array).map(byte => String.fromCharCode(byte)).join(''));
}

// Generate backup codes for 2FA recovery
export function generateBackupCodes(count = 8): string[] {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
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
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a key pair for a new device
export async function generateDeviceKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk)
  };
}

// Verify a challenge response using the device's public key
export async function verifyChallenge(
  challenge: string,
  response: string,
  publicKeyJwk: string
): Promise<boolean> {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(publicKeyJwk),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['verify']
    );

    const signatureArray = Uint8Array.from(atob(response), c => c.charCodeAt(0));
    const challengeArray = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signatureArray,
      challengeArray
    );
  } catch (error) {
    console.error('Challenge verification error:', error);
    return false;
  }
}

// Sign a challenge with a device's private key
export async function signChallenge(
  challenge: string,
  privateKeyJwk: string
): Promise<string> {
  const crypto = getCrypto();
  if (!crypto) {
    throw new Error('Crypto API is not available');
  }
  try {
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(privateKeyJwk),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign']
    );

    const challengeArray = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      privateKey,
      challengeArray
    );

    return btoa(Array.from(new Uint8Array(signature)).map(byte => String.fromCharCode(byte)).join(''));
  } catch (error) {
    console.error('Challenge signing error:', error);
    throw error;
  }
} 