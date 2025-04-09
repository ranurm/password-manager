import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { Collection } from 'mongodb';

interface Challenge {
  id: string;
  userId: string;
  deviceId: string;
  verificationCode: string;
  status: string;
  expiresAt: string | Date;
  createdAt: string | Date;
  isPasswordReset?: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  masterPassword?: string;
  credentials?: unknown[];
  devices?: unknown[];
  lastLoginAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  twoFactorEnabled?: boolean;
  deviceRegistrationRequired?: boolean;
  [key: string]: unknown; // For other properties
}

export async function POST(request: Request) {
  try {
    console.log("Complete-auth endpoint called");
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users') as Collection<User>;
    const challengesCollection = db.collection('challenges') as Collection<Challenge>;
    
    let data;
    try {
      data = await request.json();
      console.log("Request data:", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to parse request body:", err);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }
    
    const { challengeId, verificationCode } = data;

    if (!challengeId) {
      console.error("Missing required field: challengeId");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required field: challengeId' 
      }, { status: 400 });
    }

    // Find the challenge
    console.log("Looking for challenge with ID:", challengeId);
    const challenge = await challengesCollection.findOne({ 
      id: challengeId 
    });

    if (!challenge) {
      console.error("Challenge not found with ID:", challengeId);
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge not found' 
      }, { status: 404 });
    }

    console.log("Processing challenge:", {
      id: challenge.id,
      userId: challenge.userId,
      status: challenge.status,
      expiresAt: challenge.expiresAt,
      isPasswordReset: challenge.isPasswordReset || false
    });

    // Check if challenge is expired
    if (new Date() > new Date(challenge.expiresAt)) {
      console.error("Challenge expired:", challenge.id);
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge expired' 
      }, { status: 400 });
    }

    // For login (not password reset), we check if the challenge is approved
    // rather than checking the verification code
    const isLogin = !challenge.isPasswordReset;
    
    if (isLogin) {
      // For login, we check if the challenge status is approved or pending
      if (challenge.status !== 'approved') {
        console.log("Challenge not yet approved:", challenge.id);
        return NextResponse.json({ 
          success: false, 
          error: 'Challenge not yet approved' 
        }, { status: 400 });
      }
    } else {
      // For password reset, verify the code
      if (!verificationCode) {
        console.error("Missing required field: verificationCode");
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required field: verificationCode' 
        }, { status: 400 });
      }
      
      if (challenge.verificationCode !== verificationCode) {
        console.error("Invalid verification code:", {
          expected: challenge.verificationCode,
          received: verificationCode
        });
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid verification code' 
        }, { status: 400 });
      }
    }

    // Find the user
    const user = await usersCollection.findOne({ id: challenge.userId });
    if (!user) {
      console.error("User not found with ID:", challenge.userId);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log("Found user:", user.username);

    // Mark the challenge as completed
    await challengesCollection.updateOne(
      { id: challenge.id },
      { $set: { 
        status: 'completed',
        completedAt: new Date()
      }}
    );

    // Update user's last login and device verification status if needed
    interface UpdateFields {
      lastLoginAt: Date;
      updatedAt: Date;
      twoFactorEnabled?: boolean;
      deviceRegistrationRequired?: boolean;
    }

    const updateFields: UpdateFields = {
      lastLoginAt: new Date(),
      updatedAt: new Date()
    };

    // If this is a login, assume the user has verified devices
    if (isLogin) {
      updateFields.twoFactorEnabled = true;
      updateFields.deviceRegistrationRequired = false;
    }

    await usersCollection.updateOne(
      { id: user.id },
      { $set: updateFields }
    );

    // Create a safe user object without sensitive fields
    const secureUser = { ...user };
    if (secureUser.masterPassword) delete secureUser.masterPassword;

    // Make sure to include the updated fields in the returned user object
    secureUser.twoFactorEnabled = true;
    secureUser.deviceRegistrationRequired = false;

    console.log("Authentication completed successfully for user:", user.username);
    return NextResponse.json({ 
      success: true,
      message: 'Authentication completed successfully',
      user: secureUser
    }, { status: 200 });
  } catch (error) {
    console.error('Complete auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete authentication' 
    }, { status: 500 });
  }
} 