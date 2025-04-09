import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { encryptData, deriveEncryptionKey, generateIV } from '@/lib/server/crypto';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { userId, credential } = await request.json();
    
    // Find the user to get their encryption key salt
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }
    
    // Derive the encryption key from the master password
    const encryptionKey = deriveEncryptionKey(credential.masterPassword, user.encryptionKeySalt);
    
    // Generate a new IV for this credential
    const iv = generateIV();
    
    // Encrypt the password
    const { encryptedData, authTag } = encryptData(credential.password, encryptionKey, iv);
    
    // Create the encrypted credential
    const encryptedCredential = {
      id: crypto.randomUUID(),
      userId,
      title: credential.title,
      username: credential.username,
      encryptedPassword: encryptedData,
      passwordIV: iv.toString('hex'),
      passwordAuthTag: authTag,
      url: credential.url,
      notes: credential.notes,
      category: credential.category,
      favorite: credential.favorite || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store the encrypted credential
    await db.collection('credentials').insertOne(encryptedCredential);
    
    // Don't send sensitive data back to client
    const { encryptedPassword: _, passwordIV: __, passwordAuthTag: ___, ...safeCredential } = encryptedCredential;
    
    return NextResponse.json({ success: true, credential: safeCredential });
  } catch (error) {
    console.error('Add credential error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add credential' });
  }
} 