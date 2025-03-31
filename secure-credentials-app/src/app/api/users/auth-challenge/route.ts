import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import { generateChallenge, verifyChallenge } from '@/lib/crypto';
import type { AuthenticationChallenge } from '@/types';

// Create a new authentication challenge
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const challengesCollection = db.collection('authChallenges');
    const data = await request.json();
    const { userId, deviceId } = data;

    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    const device = user.devices?.find(d => d.id === deviceId);
    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not found' });
    }

    // Generate a new challenge
    const challenge = generateChallenge();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Challenge expires in 5 minutes

    const authChallenge: AuthenticationChallenge = {
      id: uuidv4(),
      userId,
      deviceId,
      challenge,
      createdAt: new Date(),
      expiresAt,
      status: 'pending'
    };

    await challengesCollection.insertOne(authChallenge);

    return NextResponse.json({ 
      success: true, 
      challengeId: authChallenge.id,
      challenge: authChallenge.challenge
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
    const usersCollection = db.collection('users');
    const challengesCollection = db.collection('authChallenges');
    const data = await request.json();
    const { challengeId, response } = data;

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

    const user = await usersCollection.findOne({ id: challenge.userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    const device = user.devices?.find(d => d.id === challenge.deviceId);
    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not found' });
    }

    // Verify the challenge response using the device's public key
    const isValid = await verifyChallenge(challenge.challenge, response, device.publicKey);
    
    await challengesCollection.updateOne(
      { id: challengeId },
      { $set: { status: isValid ? 'approved' : 'rejected' } }
    );

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid challenge response' });
    }

    // Update device last used timestamp
    await usersCollection.updateOne(
      { id: user.id, 'devices.id': device.id },
      { 
        $set: { 
          'devices.$.lastUsed': new Date(),
          updatedAt: new Date()
        }
      }
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