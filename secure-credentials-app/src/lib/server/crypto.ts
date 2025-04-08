import crypto from 'crypto';

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  // Generate a random number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const code = min + (randomNumber % (max - min + 1));
  return code.toString();
} 