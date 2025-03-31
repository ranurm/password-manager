import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);
  const db = client.db('secure-credentials');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    const { username, email, securityAnswer, newPassword } = await request.json();
    
    console.log('Reset password attempt for:', { username, email });
    
    // Find user by username and email
    const user = await collection.findOne({ 
      username,
      email
    });
    
    if (!user) {
      console.log('User not found or email mismatch');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found or email does not match' 
      });
    }
    
    // Verify security answer
    if (user.securityAnswer !== securityAnswer) {
      console.log('Incorrect security answer');
      return NextResponse.json({ 
        success: false, 
        error: 'Incorrect security answer' 
      });
    }
    
    console.log('Updating password for user:', user.id);
    
    // Update password
    const updateResult = await collection.updateOne(
      { id: user.id },
      { 
        $set: { 
          masterPassword: newPassword,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('Update result:', updateResult);
    
    if (updateResult.matchedCount === 0) {
      console.log('No user found to update');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found for update' 
      });
    }
    
    // Return updated user (excluding sensitive data)
    const { masterPassword, ...updatedUser } = user;
    updatedUser.masterPassword = newPassword;
    
    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Reset password error details:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reset password' 
    });
  }
} 