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
    const { userId, credentialId } = await request.json();
    
    await collection.updateOne(
      { id: userId },
      { 
        $pull: { credentials: { id: credentialId } },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete credential error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete credential' });
  }
} 