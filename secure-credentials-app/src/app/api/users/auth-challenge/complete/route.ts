import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const data = await request.json();
    const { challengeId } = data;

    if (!challengeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge ID is required' 
      });
    }

    // Find user with this challenge
    const user = await usersCollection.findOne({ 
      'authChallenge.challenge': challengeId 
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge not found' 
      });
    }

    // Check if challenge is expired
    if (new Date() > new Date(user.authChallenge.expiresAt)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge expired' 
      });
    }

    // Clear the challenge and update last login
    await usersCollection.updateOne(
      { username: user.username },
      { 
        $set: { 
          'authChallenge': null,
          'lastLoginAt': new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      status: 'approved',
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Complete 2FA error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete authentication' 
    });
  }
} 