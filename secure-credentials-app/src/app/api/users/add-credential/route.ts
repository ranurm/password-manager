import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { encryptData, generateIV } from '@/lib/server/crypto';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { userId, credential } = await request.json();
    
    // Find the user
    const user = await db.collection('users').findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }
    
    // Generate a random encryption key for this credential
    const encryptionKey = crypto.randomBytes(32);
    
    // Generate a new IV for this credential
    const iv = generateIV();
    
    // Encrypt the password
    const { encryptedData, authTag } = encryptData(credential.password, encryptionKey, iv);
    
    // Create the encrypted credential
    const encryptedCredential = {
      id: uuidv4(),
      userId,
      title: credential.title,
      username: credential.username,
      encryptedPassword: encryptedData,
      passwordIV: iv.toString('hex'),
      passwordAuthTag: authTag,
      encryptionKey: encryptionKey.toString('hex'),
      url: credential.url || '',
      notes: credential.notes || '',
      category: credential.category || '',
      favorite: credential.favorite || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store the encrypted credential
    await db.collection('credentials').insertOne(encryptedCredential);
    
    // Create a safe credential object to return to the client
    const safeCredential = {
      id: encryptedCredential.id,
      userId: encryptedCredential.userId,
      title: encryptedCredential.title,
      username: encryptedCredential.username,
      password: credential.password, // Send back the original password
      url: encryptedCredential.url,
      notes: encryptedCredential.notes,
      category: encryptedCredential.category,
      favorite: encryptedCredential.favorite,
      createdAt: encryptedCredential.createdAt,
      updatedAt: encryptedCredential.updatedAt
    };
    
    return NextResponse.json({ success: true, credential: safeCredential });
  } catch (error) {
    console.error('Add credential error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add credential' });
  }
} 