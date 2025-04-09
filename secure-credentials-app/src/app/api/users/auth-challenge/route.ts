import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import { generateVerificationCode } from '@/lib/server/crypto';
import type { AuthenticationChallenge } from '@/types';
import crypto from 'crypto';

interface ChallengeRequest {
  userId: string;
  deviceId: string;
  isPasswordReset?: boolean;
}

// Create a new authentication challenge
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('challenges');
    const data: ChallengeRequest = await request.json();
    const { userId, deviceId, isPasswordReset } = data;

    if (!userId || !deviceId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    // Generate a unique challenge ID
    const challengeId = crypto.randomUUID();
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create the challenge document
    const challenge = {
      id: challengeId,
      userId,
      deviceId,
      verificationCode,
      isPasswordReset: isPasswordReset || false,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };

    await collection.insertOne(challenge);

    return NextResponse.json({ 
      success: true, 
      challengeId,
      verificationCode
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create challenge' });
  }
}

// Verify a challenge response
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const challengesCollection = db.collection('challenges');
    const data = await request.json();
    const { challengeId, response, deviceId, userId } = data;

    console.log("challengeId", challengeId);
    console.log("response", response);
    console.log("deviceId", deviceId);
    console.log("userId", userId);

    // First try to find challenge by id
    let challenge = await challengesCollection.findOne({ id: challengeId });
    
    // If not found, try to find by verificationCode (used by mobile app)
    if (!challenge) {
      challenge = await challengesCollection.findOne({ verificationCode: challengeId });
      console.log("Searching by verificationCode instead:", challengeId);
    }
    
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' });
    }
    
    console.log("Found challenge:", challenge);

    if (challenge.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Challenge is no longer valid' });
    }

    if (new Date() > new Date(challenge.expiresAt)) {
      await challengesCollection.updateOne(
        { id: challenge.id },
        { $set: { status: 'expired' } }
      );
      return NextResponse.json({ success: false, error: 'Challenge has expired' });
    }

    // Verify the device and user match
    if (challenge.deviceId !== deviceId || challenge.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Invalid device or user' });
    }

    // In a real application, you would validate the cryptographic signature here
    // For now, we'll just accept any response
    
    // Mark the challenge as approved
    await challengesCollection.updateOne(
      { id: challenge.id },
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
    const challengesCollection = db.collection('challenges');
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