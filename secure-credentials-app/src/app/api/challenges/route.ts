import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const { deviceName, code, userId } = await request.json();

    // Create a new challenge
    const challenge = {
      id: uuidv4(),
      userId,
      deviceName,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      status: 'pending'
    };

    await db.collection('challenges').insertOne(challenge);

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create challenge' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const code = searchParams.get('code');

    if (!userId || !code) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' });
    }

    // Find the challenge
    const challenge = await db.collection('challenges').findOne({
      userId,
      code,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Invalid or expired challenge' });
    }

    // Update the challenge status
    await db.collection('challenges').updateOne(
      { id: challenge.id },
      { $set: { status: 'completed' } }
    );

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('Verify challenge error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify challenge' }, { status: 500 });
  }
} 