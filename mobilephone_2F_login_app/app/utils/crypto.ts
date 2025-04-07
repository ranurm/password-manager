import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export async function generateDeviceKeys() {
  try {
    // Generate a random private key using UUID
    const privateKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Crypto.randomUUID()
    );

    // For demonstration purposes, we'll use the private key as the public key
    // In a real implementation, you would use proper asymmetric key generation
    const publicKey = JSON.stringify({
      kty: 'EC',
      crv: 'P-256',
      x: privateKey.slice(0, 32),
      y: privateKey.slice(32, 64),
      ext: true,
      key_ops: ['verify']
    });

    // Store the private key securely
    await SecureStore.setItemAsync('device_private_key', privateKey);

    return publicKey;
  } catch (error) {
    console.error('Error generating keys:', error);
    throw new Error('Failed to generate device keys');
  }
}

export async function signChallenge(challengeId: string) {
  try {
    const privateKey = await SecureStore.getItemAsync('device_private_key');
    if (!privateKey) {
      throw new Error('No private key found');
    }

    // Create a signature by hashing the challenge with the private key
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      challengeId + privateKey
    );

    return signature;
  } catch (error) {
    console.error('Error signing challenge:', error);
    throw new Error('Failed to sign challenge');
  }
} 