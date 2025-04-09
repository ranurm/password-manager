import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/server/crypto';

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

      // Check if the challenge has been approved by the mobile app or if the verification code matches
      // Special case: if the verification code is "approved", check the challenge status instead
      if (verificationCode === "approved") {
        // For mobile app verification, we need to check if the challenge status is approved
        const challengeStatus = challenge.status || 'pending';
        if (challengeStatus !== 'approved') {
          return NextResponse.json({ success: false, error: 'Challenge not yet approved' });
        }
      }
      // If not the special "approved" value, check the verification code as usual
      else if (challenge.verificationCode !== verificationCode) {
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

    // Update the password using the same hashing method as registration
    // Get the salt from the user record
    const { passwordSalt } = user;
    
    // Hash the new password with the existing salt
    const { hash: passwordHash } = hashPassword(newPassword, passwordSalt);

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