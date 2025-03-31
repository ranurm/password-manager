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
    const collection = db.collection('users');
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' });
    }
    
    const user = await collection.findOne({ username });
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' });
  }
} 