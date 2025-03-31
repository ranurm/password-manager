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
    const { registrationCode, deviceName, publicKey } = data;

    if (!registrationCode || !deviceName || !publicKey) {
      console.error('Missing required fields:', { registrationCode, deviceName, publicKey });
      return NextResponse.json({ success: false, error: 'Missing required fields' });
    }

    // Find the user with a device matching this registration code
    const user = await collection.findOne({
      'devices': { 
        $elemMatch: { 
          registrationCode,
          isVerified: false
        }
      }
    });

    if (!user) {
      console.error('No pending device found with registration code:', registrationCode);
      return NextResponse.json({ success: false, error: 'Invalid registration code' });
    }

    // Find the specific device
    const device = user.devices.find((d: Device) => d.registrationCode === registrationCode);
    if (!device) {
      console.error('Device not found with registration code:', registrationCode);
      return NextResponse.json({ success: false, error: 'Invalid registration code' });
    }

    // Update the device
    const updateResult = await collection.updateOne(
      { 
        'id': user.id,
        'devices.registrationCode': registrationCode
      },
      { 
        $set: { 
          'devices.$.isVerified': true,
          'devices.$.name': deviceName,
          'devices.$.publicKey': publicKey,
          'devices.$.lastUsed': new Date(),
          'devices.$.registrationCode': null
        }
      }
    );

    if (!updateResult.acknowledged) {
      console.error('Failed to update device');
      return NextResponse.json({ success: false, error: 'Failed to update device' });
    }

    return NextResponse.json({ 
      success: true,
      deviceId: device.id
    });
  } catch (error) {
    console.error('Device verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Device verification failed'
    });
  }
} 