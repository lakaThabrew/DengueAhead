import { Router, Request, Response } from 'express';
import type { DbClient } from '../repositories/mongo.js';

export function createAreasRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/areas', async (_req: Request, res: Response) => {
    if (!db) {
      res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'No database connection' }
      });
      return;
    }
    try {
      const docs = await db
        .collection('areas')
        .find({}, { projection: { _id: 0 } })
        .sort({ areaId: 1 })
        .toArray();
      res.json({ data: docs, count: docs.length });
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query areas' }
      });
    }
  });

  return router;
}
