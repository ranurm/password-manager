import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';

interface ResetPasswordRequest {
  username: string;
  email: string;
  newPassword: string;
  challengeId?: string;
  verificationCode?: string;
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const challengesCollection = db.collection('challenges');
    const data: ResetPasswordRequest = await request.json();
    const { username, email, newPassword, challengeId, verificationCode } = data;

    if (!username || !email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    // Find the user
    const user = await usersCollection.findOne({ username, email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    // If 2FA is enabled, verify the challenge
    if (user.twoFactorEnabled) {
      if (!challengeId || !verificationCode) {
        return NextResponse.json({ success: false, error: 'Authentication required' });
      }

      const challenge = await challengesCollection.findOne({ 
        id: challengeId,
        userId: user.id,
        isPasswordReset: true
      });

      if (!challenge) {
        return NextResponse.json({ success: false, error: 'Invalid challenge' });
      }

      if (challenge.verificationCode !== verificationCode) {
        return NextResponse.json({ success: false, error: 'Invalid verification code' });
      }

      if (new Date() > new Date(challenge.expiresAt)) {
        return NextResponse.json({ success: false, error: 'Challenge expired' });
      }

      // Mark challenge as used
      await challengesCollection.updateOne(
        { id: challengeId },
        { $set: { status: 'used' } }
      );
    }

    // Update the password
    const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newPassword));
    const passwordHash = Buffer.from(hashedPassword).toString('hex');

    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          passwordHash,
          lastPasswordChangeAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully. Please sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset password' });
  }
} 