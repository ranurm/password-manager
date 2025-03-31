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
    const { userId, credential } = await request.json();
    
    const newCredential = {
      id: credential.id,
      ...credential,
      favorite: credential.favorite || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.updateOne(
      { id: userId },
      { 
        $push: { credentials: newCredential },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({ success: true, credential: newCredential });
  } catch (error) {
    console.error('Add credential error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add credential' });
  }
} 