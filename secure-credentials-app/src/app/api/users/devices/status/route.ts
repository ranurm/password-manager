import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const data = await request.json();
    const { username, deviceId } = data;

    if (!username || !deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
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

    // Find the device
    const device = user.devices?.find(d => d.id === deviceId);
    if (!device) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device not found' 
      });
    }

    return NextResponse.json({ 
      success: true,
      isVerified: device.isVerified
    });
  } catch (error) {
    console.error('Check device status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check device status' 
    });
  }
} 