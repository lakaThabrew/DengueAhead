import { createApp } from './app.js';
import { env } from './config/env.js';
import { createMongoClient } from './repositories/mongo.js';
import { ensureIndexes } from './repositories/indexes.js';

const db = createMongoClient(env.MONGODB_URI);
const app = createApp(db);

// Initialize database schema indexes in background
void ensureIndexes(db).then(({ created, errors }) => {
  if (errors.length > 0) {
    console.warn(`[DengueAhead API] Index creation warnings (${errors.length}):`, errors);
  } else {
    console.log(`[DengueAhead API] Verified ${created.length} MongoDB schema indexes`);
  }
});

const server = app.listen(env.PORT, () => {
  console.log(`[DengueAhead API] Service started on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`[DengueAhead API] Health: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
});

async function shutdown(signal: string) {
  console.log(`[DengueAhead API] ${signal} received — shutting down`);
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
