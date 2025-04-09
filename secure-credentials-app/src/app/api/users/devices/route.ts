import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';
import type { Device } from '@/types';
import { Document, WithId } from 'mongodb';

interface UserDocument extends WithId<Document> {
  id: string;
  devices?: Device[];
  twoFactorEnabled?: boolean;
  updatedAt?: Date;
}

function generateRegistrationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register a new device
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const collection = db.collection('users');
    const data = await request.json();
    const { userId, deviceName, publicKey } = data;

    if (!userId || !deviceName || !publicKey) {
      console.error('Missing required fields:', { userId, deviceName, publicKey });
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    const user = await collection.findOne({ id: userId });
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    const registrationCode = generateRegistrationCode();
    
    const newDevice: Device = {
      id: uuidv4(),
      name: deviceName,
      publicKey,
      lastUsed: new Date(),
      createdAt: new Date(),
      isVerified: false,
      registrationCode
    };

    const updateResult = await collection.updateOne(
      { id: userId },
      { 
        $push: { 'devices': newDevice } as any,
        $set: { 
          twoFactorEnabled: true,
          updatedAt: new Date()
        }
      }
    );

    if (!updateResult.acknowledged) {
      console.error('Failed to update user document');
      return NextResponse.json({ success: false, error: 'Failed to update user document' });
    }

    return NextResponse.json({ 
      success: true, 
      device: newDevice,
      registrationCode
    });
  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register device' });
  }
}

// Get user's devices
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' });
    }

    const user = await collection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    return NextResponse.json({ 
      success: true, 
      devices: user.devices || [],
      twoFactorEnabled: user.twoFactorEnabled || false
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get devices' });
  }
}

// Delete a device
export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const deviceId = searchParams.get('deviceId');

    if (!userId || !deviceId) {
      return NextResponse.json({ success: false, error: 'User ID and Device ID are required' });
    }

    const user = await collection.findOne({ id: userId });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    // Remove the device
    await collection.updateOne(
      { id: userId },
      { 
        $pull: { 'devices': { id: deviceId } } as any,
        $set: { updatedAt: new Date() }
      }
    );

    // If no devices left, disable 2FA
    const remainingDevices = user.devices?.filter((d: Device) => d.id !== deviceId) || [];
    if (remainingDevices.length === 0) {
      await collection.updateOne(
        { id: userId },
        { $set: { twoFactorEnabled: false } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete device error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete device' });
  }
} 