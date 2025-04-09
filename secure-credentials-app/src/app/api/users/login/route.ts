import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { generateVerificationCode } from '@/lib/server/crypto';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const { username, password } = await request.json();
    
    // Find the user
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    // Verify password (in a real app, you would use bcrypt or similar)
    if (user.masterPassword !== password) {
      return NextResponse.json({ success: false, error: 'Invalid password' });
    }

    // If 2FA is enabled, create a challenge
    if (user.twoFactorEnabled) {
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Code expires in 5 minutes

      // Create a new challenge
      const challenge = {
        id: crypto.randomUUID(),
        userId: user.id,
        deviceId: user.devices?.[0]?.id,
        code: verificationCode,
        createdAt: new Date(),
        expiresAt,
        status: 'pending'
      };

      await db.collection('challenges').insertOne(challenge);

      return NextResponse.json({
        success: true,
        user,
        requiresTwoFactor: true,
        verificationCode,
        challengeId: challenge.id
      });
    }

    // If no 2FA, return success
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' });
  }
} 