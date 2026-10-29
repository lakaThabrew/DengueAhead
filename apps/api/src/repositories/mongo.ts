import { MongoClient } from 'mongodb';

export interface DbClient {
  ping(): Promise<{ latencyMs: number }>;
  close(): Promise<void>;
}

export function createMongoClient(uri: string): DbClient {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
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
    }
  };
}
