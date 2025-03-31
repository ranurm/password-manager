import { NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

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
    const data = await request.json();
    
    const existingUser = await collection.findOne({
      $or: [{ username: data.username }, { email: data.email }]
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: existingUser.username === data.username ? 'Username already exists' : 'Email already exists' 
      });
    }
    
    const newUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      masterPassword: data.masterPassword,
      securityQuestion: data.securityQuestion,
      securityAnswer: data.securityAnswer,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      lastPasswordChangeAt: new Date(),
      credentials: []
    };
    
    await collection.insertOne(newUser);
    
    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed' });
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const loginAttemptsCollection = db.collection('loginAttempts');
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' });
    }
    
    const user = await usersCollection.findOne({ username });
    
    // Log the login attempt
    const loginAttempt = {
      id: uuidv4(),
      username,
      success: !!user,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      error: user ? undefined : 'User not found'
    };
    
    await loginAttemptsCollection.insertOne(loginAttempt);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }
    
    // Update last login time
    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    // Update the user object with the new lastLoginAt
    user.lastLoginAt = new Date();
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log the failed attempt due to error
    const { db } = await connectToDatabase();
    const loginAttemptsCollection = db.collection('loginAttempts');
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (username) {
      await loginAttemptsCollection.insertOne({
        id: uuidv4(),
        username,
        success: false,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json({ success: false, error: 'Login failed' });
  }
} 