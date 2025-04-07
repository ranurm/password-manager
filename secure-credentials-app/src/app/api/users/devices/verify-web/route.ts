import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { Device } from '@/types';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const collection = db.collection('users');
    const data = await request.json();
    const { deviceName, publicKey } = data;

    console.log('Received web verification request:', {
      deviceName,
      publicKey: publicKey ? 'present' : 'missing'
    });

    if (!deviceName || !publicKey) {
      console.error('Missing required fields:', { deviceName, publicKey });
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    // Find the user with a verified device matching the name and public key
    const user = await collection.findOne({
      'devices': { 
        $elemMatch: { 
          name: deviceName,
          publicKey: publicKey,
          isVerified: true
        }
      }
    });

    if (!user) {
      console.error('No verified device found with name and public key:', { deviceName, publicKey });
      return NextResponse.json({ success: false, error: 'Device not found or not verified' });
    }

    console.log('Found user with verified device:', {
      userId: user.id,
      deviceCount: user.devices?.length || 0
    });

    // Find the specific device
    const device = user.devices.find((d: Device) => 
      d.name === deviceName && 
      d.publicKey === publicKey && 
      d.isVerified === true
    );

    if (!device) {
      console.error('Device not found with name and public key:', { deviceName, publicKey });
      return NextResponse.json({ success: false, error: 'Device not found or not verified' });
    }

    console.log('Found matching device:', {
      deviceId: device.id,
      deviceName: device.name
    });

    // Update the device's last used timestamp
    const updateResult = await collection.updateOne(
      { 
        'id': user.id,
        'devices.name': deviceName,
        'devices.publicKey': publicKey
      },
      { 
        $set: { 
          'devices.$.lastUsed': new Date(),
          'lastLoginAt': new Date(),
          'updatedAt': new Date()
        }
      }
    );

    if (!updateResult.acknowledged) {
      console.error('Failed to update device:', updateResult);
      return NextResponse.json({ success: false, error: 'Failed to update device' });
    }

    console.log('Device verification successful:', {
      deviceId: device.id,
      deviceName: deviceName
    });

    // Return the user data for automatic login
    const updatedUser = await collection.findOne({ id: user.id });
    if (!updatedUser) {
      console.error('Failed to fetch updated user data');
      return NextResponse.json({ success: false, error: 'Failed to fetch user data' });
    }

    // Remove sensitive data before sending
    const { masterPassword, securityAnswer, ...safeUserData } = updatedUser;

    return NextResponse.json({ 
      success: true,
      deviceId: device.id,
      user: safeUserData
    });
  } catch (error) {
    console.error('Device verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Device verification failed'
    });
  }
} 