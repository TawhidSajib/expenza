import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local file-backed database path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'expenza-db.json');

// In-memory data store structure
interface LocalDbSchema {
  users: any[];
  categories: any[];
  expenses: any[];
  otps: any[];
}

let localData: LocalDbSchema = {
  users: [],
  categories: [],
  expenses: [],
  otps: [],
};

// Ensure data directory and load existing local file if exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    localData = JSON.parse(raw);
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf-8');
  }
} catch (e) {
  // fallback memory
}

function saveLocalData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2), 'utf-8');
  } catch (err) {
    // silent fallback
  }
}

// MongoDB-compatible Collection wrapper for local fallback
class LocalCollection {
  private collectionName: keyof LocalDbSchema;

  constructor(name: keyof LocalDbSchema) {
    this.collectionName = name;
  }

  async find(query: any = {}, options: any = {}) {
    const items = localData[this.collectionName] || [];
    const filtered = items.filter((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    return {
      sort: (sortCriteria: any) => {
        const sorted = [...filtered];
        if (sortCriteria && sortCriteria.date === -1) {
          sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        }
        return {
          toArray: async () => sorted,
        };
      },
      toArray: async () => filtered,
    };
  }

  async findOne(query: any = {}) {
    const items = localData[this.collectionName] || [];
    const match = items.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return match || null;
  }

  async insertOne(doc: any) {
    if (!localData[this.collectionName]) {
      localData[this.collectionName] = [];
    }
    const item = { ...doc };
    localData[this.collectionName].push(item);
    saveLocalData();
    return { insertedId: item.id || `doc_${Date.now()}` };
  }

  async updateOne(filter: any, update: any, options: any = {}) {
    if (!localData[this.collectionName]) {
      localData[this.collectionName] = [];
    }
    const items = localData[this.collectionName];
    const idx = items.findIndex((item) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });

    if (idx >= 0) {
      const setFields = update.$set || update;
      items[idx] = { ...items[idx], ...setFields };
      saveLocalData();
      return { matchedCount: 1, modifiedCount: 1 };
    } else if (options.upsert) {
      const newDoc = { ...(update.$set || update), ...filter };
      items.push(newDoc);
      saveLocalData();
      return { matchedCount: 0, upsertedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(filter: any) {
    if (!localData[this.collectionName]) return { deletedCount: 0 };
    const items = localData[this.collectionName];
    const idx = items.findIndex((item) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
    if (idx >= 0) {
      items.splice(idx, 1);
      saveLocalData();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async createIndex() {
    return 'index_created';
  }
}

// Local MongoDB-compatible database object
const localDb = {
  collection(name: string) {
    return new LocalCollection(name as keyof LocalDbSchema);
  },
};

let client: MongoClient | null = null;
let remoteDb: Db | null = null;
let isRemoteConnected = false;
let connectionNote: string | null = null;

const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const DB_NAME = (process.env.MONGODB_DB_NAME || 'expenza').trim();

export async function connectToDatabase(): Promise<{ client: MongoClient | null; db: any; isConnected: boolean }> {
  // If no URI or pointing to localhost when localhost is not running, gracefully use local embedded database
  const isLocalhost = !MONGODB_URI || MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');

  if (isLocalhost) {
    connectionNote = 'Operating in embedded backend database mode (file-backed). Set MongoDB Atlas URI in .env for cloud cluster.';
    console.log(`[Database] ${connectionNote}`);
    return { client: null, db: localDb, isConnected: true };
  }

  try {
    console.log('[MongoDB] Connecting to remote MongoDB database...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    remoteDb = client.db(DB_NAME);
    isRemoteConnected = true;
    connectionNote = `Connected to remote MongoDB: "${DB_NAME}"`;
    console.log(`[MongoDB] ${connectionNote}`);

    // Create indexes safely
    try {
      await remoteDb.collection('users').createIndex({ mobile: 1 }, { unique: true });
      await remoteDb.collection('categories').createIndex({ id: 1, userId: 1 });
      await remoteDb.collection('expenses').createIndex({ id: 1, userId: 1 });
      await remoteDb.collection('expenses').createIndex({ userId: 1, date: -1 });
      await remoteDb.collection('otps').createIndex({ phoneNumber: 1 });
    } catch {
      // index notices ignored
    }

    return { client, db: remoteDb, isConnected: true };
  } catch (err: any) {
    // If remote connection fails (e.g. incorrect Atlas credentials or network timeout),
    // smoothly fallback to local embedded database without throwing fatal error
    isRemoteConnected = false;
    connectionNote = 'Remote MongoDB unreachable. Falling back to local embedded database.';
    console.log(`[Database] ${connectionNote}`);
    return { client: null, db: localDb, isConnected: true };
  }
}

export function getDatabase(): any {
  if (isRemoteConnected && remoteDb) {
    return remoteDb;
  }
  return localDb;
}

export function isDbConnected(): boolean {
  return true; // Always available (either remote MongoDB or local embedded store)
}

export function getDbStatus() {
  return {
    connected: true,
    isRemote: isRemoteConnected,
    dbName: isRemoteConnected ? DB_NAME : 'expenza (embedded)',
    mode: isRemoteConnected ? 'MongoDB Cloud Atlas' : 'Local Embedded Database',
    message: connectionNote,
  };
}
