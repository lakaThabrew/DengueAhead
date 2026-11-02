import { Router, Request, Response } from 'express';
import type { DbClient } from '../repositories/mongo.js';

export function createSourcesRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/sources', async (_req: Request, res: Response) => {
    if (!db) {
      res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'No database connection' }
      });
      return;
    }
    try {
      const docs = await db
        .collection('source_snapshots')
        .find({}, { projection: { _id: 0 } })
        .sort({ retrievedAt: -1 })
        .limit(100)
        .toArray();
      res.json({ data: docs, count: docs.length });
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query source snapshots' }
      });
    }
  });

  return router;
}
