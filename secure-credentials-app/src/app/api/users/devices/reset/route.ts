import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const data = await request.json();
    const { username } = data;

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required' 
      });
    }

    // Find user
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Reset all devices to unverified state
    await usersCollection.updateOne(
      { username },
      { 
        $set: { 
          'devices.$[].isVerified': false,
          'devices.$[].registrationCode': null,
          'authChallenge': null,
          'updatedAt': new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Device registration reset successfully'
    });
  } catch (error) {
    console.error('Reset device registration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset device registration' 
    });
  }
} 