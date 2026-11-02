import { MongoClient, Collection, Document } from 'mongodb';

export interface DbClient {
  ping(): Promise<{ latencyMs: number }>;
  close(): Promise<void>;
  collection<T extends Document = Document>(name: string): Collection<T>;
}

export function createMongoClient(uri: string): DbClient {
  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 5000
  });

  client.on('close', () => {
    console.warn('[MongoDB] Connection closed');
  });

  client.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
  });

  const appDb = client.db('dengueahead');
  let connected = false;

  return {
    async ping(): Promise<{ latencyMs: number }> {
      const start = Date.now();
      if (!connected) {
        await client.connect();
        connected = true;
      }
      await client.db('admin').command({ ping: 1 });
      return { latencyMs: Date.now() - start };
    },
    async close(): Promise<void> {
      await client.close();
    },
    collection<T extends Document = Document>(name: string): Collection<T> {
      return appDb.collection<T>(name);
    }
  };
}
