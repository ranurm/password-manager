import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function generateDeviceKeys(): Promise<string> {
  try {
    // Generate a key pair
    const keyPair = await Crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export the public key
    const publicKeyBuffer = await Crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );

    // Export the private key
    const privateKeyBuffer = await Crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );

    // Store the private key securely
    await AsyncStorage.setItem(
      'privateKey',
      Buffer.from(privateKeyBuffer).toString('base64')
    );

    // Return the public key as base64
    return Buffer.from(publicKeyBuffer).toString('base64');
  } catch (error) {
    console.error('Error generating keys:', error);
    throw error;
  }
}

export async function signChallenge(challenge: string): Promise<string> {
  try {
    // Get the stored private key
    const privateKeyBase64 = await AsyncStorage.getItem('privateKey');
    if (!privateKeyBase64) {
      throw new Error('Private key not found');
    }

    // Convert the private key back to buffer
    const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

    // Import the private key
    const privateKey = await Crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign']
    );

    // Create challenge buffer
    const challengeBuffer = Buffer.from(challenge);

    // Sign the challenge
    const signature = await Crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      privateKey,
      challengeBuffer
    );

    // Return the signature as base64
    return Buffer.from(signature).toString('base64');
  } catch (error) {
    console.error('Error signing challenge:', error);
    throw error;
  }
} 