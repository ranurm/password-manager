import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Device } from '@/types';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const loginConfirmationsCollection = db.collection('loginConfirmations');
    const data = await request.json();
    const { userId, deviceId } = data;

    if (!userId || !deviceId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    const device = user.devices?.find((d: Device) => d.id === deviceId);
    if (!device) {
      return NextResponse.json({ success: false, error: 'Device not found' });
    }

    // Create a new login confirmation
    const confirmationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Confirmation expires in 5 minutes

    await loginConfirmationsCollection.insertOne({
      id: confirmationId,
      userId,
      deviceId,
      createdAt: new Date(),
      expiresAt,
      status: 'pending'
    });

    return NextResponse.json({ 
      success: true, 
      confirmationId,
      message: 'Login confirmation request sent to your device'
    });
  } catch (error) {
    console.error('Login confirmation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create login confirmation' });
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const loginConfirmationsCollection = db.collection('loginConfirmations');
    const data = await request.json();
    const { confirmationId, approved } = data;

    if (!confirmationId) {
      return NextResponse.json({ success: false, error: 'Confirmation ID is required' });
    }

    const confirmation = await loginConfirmationsCollection.findOne({ id: confirmationId });
    if (!confirmation) {
      return NextResponse.json({ success: false, error: 'Confirmation not found' });
    }

    if (confirmation.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Confirmation is no longer valid' });
    }

    if (new Date() > new Date(confirmation.expiresAt)) {
      await loginConfirmationsCollection.updateOne(
        { id: confirmationId },
        { $set: { status: 'expired' } }
      );
      return NextResponse.json({ success: false, error: 'Confirmation has expired' });
    }

    // Update confirmation status
    await loginConfirmationsCollection.updateOne(
      { id: confirmationId },
      { $set: { status: approved ? 'approved' : 'rejected' } }
    );

    if (approved) {
      // Update user's last login time
      await usersCollection.updateOne(
        { id: confirmation.userId },
        { 
          $set: { 
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      status: approved ? 'approved' : 'rejected'
    });
  } catch (error) {
    console.error('Confirm login error:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm login' });
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const loginConfirmationsCollection = db.collection('loginConfirmations');
    const { searchParams } = new URL(request.url);
    const confirmationId = searchParams.get('confirmationId');

    if (!confirmationId) {
      return NextResponse.json({ success: false, error: 'Confirmation ID is required' });
    }

    const confirmation = await loginConfirmationsCollection.findOne({ id: confirmationId });
    if (!confirmation) {
      return NextResponse.json({ success: false, error: 'Confirmation not found' });
    }

    return NextResponse.json({ 
      success: true, 
      status: confirmation.status,
      expiresAt: confirmation.expiresAt
    });
  } catch (error) {
    console.error('Get confirmation status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get confirmation status' });
  }
} 