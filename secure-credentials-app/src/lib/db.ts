import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectToDatabase(retryCount = 0): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      // Test if the cached connection is still alive
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.warn('Cached connection is stale, creating new connection...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const options: MongoClientOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    };

    const client = await MongoClient.connect(uri, options);
    const db = client.db('secure-credentials');

    // Test the connection
    await db.command({ ping: 1 });
    console.log('Successfully connected to MongoDB');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error(`MongoDB connection attempt ${retryCount + 1} failed:`, error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_DELAY_MS}ms...`);
      await delay(RETRY_DELAY_MS);
      return connectToDatabase(retryCount + 1);
    }

    throw new Error(
      `Failed to connect to database after ${MAX_RETRIES} attempts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
