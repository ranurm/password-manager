import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import { generateVerificationCode } from '@/lib/server/crypto';
import type { AuthenticationChallenge } from '@/types';

// Create a new authentication challenge
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const challengesCollection = db.collection('authChallenges');
    const data = await request.json();
    const { userId, deviceId } = data;

    if (!userId || !deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId and deviceId are required' 
      });
    }

    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const device = user.devices?.find((d: { id: string }) => d.id === deviceId);
    if (!device) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device not found' 
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Code expires in 5 minutes

    const authChallenge: AuthenticationChallenge = {
      id: uuidv4(),
      userId,
      deviceId,
      challenge: verificationCode,
      createdAt: new Date(),
      expiresAt,
      status: 'pending'
    };

    try {
      await challengesCollection.insertOne(authChallenge);
    } catch (dbError) {
      console.error('Database error when creating challenge:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create challenge in database' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      challengeId: authChallenge.id,
      verificationCode: authChallenge.challenge
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Verify a challenge response
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const challengesCollection = db.collection('authChallenges');
    const data = await request.json();
    const { challengeId, verificationCode } = data;

    const challenge = await challengesCollection.findOne({ id: challengeId });
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' });
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Challenge is no longer valid' });
    }

    if (new Date() > new Date(challenge.expiresAt)) {
      await challengesCollection.updateOne(
        { id: challengeId },
        { $set: { status: 'expired' } }
      );
      return NextResponse.json({ success: false, error: 'Challenge has expired' });
    }

    // Verify the code matches
    if (challenge.challenge !== verificationCode) {
      return NextResponse.json({ success: false, error: 'Invalid verification code' });
    }

    // Mark the challenge as approved
    await challengesCollection.updateOne(
      { id: challengeId },
      { $set: { status: 'approved' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify challenge error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify challenge' });
  }
}

// Get challenge status
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const challengesCollection = db.collection('authChallenges');
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ success: false, error: 'Challenge ID is required' });
    }

    const challenge = await challengesCollection.findOne({ id: challengeId });
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' });
    }

    return NextResponse.json({ 
      success: true, 
      status: challenge.status,
      expiresAt: challenge.expiresAt
    });
  } catch (error) {
    console.error('Get challenge status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get challenge status' });
  }
} 