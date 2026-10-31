import { Router, Request, Response } from 'express';
import { MetaResponseSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

export function createMetaRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/meta', async (req: Request, res: Response) => {
    if (!db) {
      res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'No database connection',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    try {
      // Find latest prediction
      const latestPred = await db
        .collection('predictions')
        .find({}, { projection: { _id: 0, issueDate: 1, targetWeek: 1, modelVersion: 1 } })
        .sort({ issueDate: -1 })
        .limit(1)
        .toArray();

      // Find latest snapshot or dengue report update
      const latestSnapshot = await db
        .collection('source_snapshots')
        .find({}, { projection: { _id: 0, retrievedAt: 1 } })
        .sort({ retrievedAt: -1 })
        .limit(1)
        .toArray();

      const latestObs = await db
        .collection('dengue_weekly')
        .find({}, { projection: { _id: 0, weekStart: 1, reportedAt: 1 } })
        .sort({ weekStart: -1 })
        .limit(1)
        .toArray();

      const issueDate = latestPred.length > 0 ? latestPred[0].issueDate : null;
      const targetWeek = latestPred.length > 0 ? latestPred[0].targetWeek : null;
      const activeModelVersion = latestPred.length > 0 ? latestPred[0].modelVersion : null;
      const lastUpdated = latestSnapshot.length > 0 ? latestSnapshot[0].retrievedAt : null;

      let freshness: 'CURRENT' | 'STALE' | 'UNAVAILABLE' = 'UNAVAILABLE';
      if (latestObs.length > 0 && latestObs[0].weekStart) {
        freshness = 'CURRENT';
      }

      const meta = MetaResponseSchema.parse({
        geographicLevel: 'district',
        latestIssueDate: issueDate,
        latestTargetWeek: targetWeek,
        activeModelVersion: activeModelVersion,
        lastUpdated: lastUpdated || new Date().toISOString(),
        sourceFreshnessStatus: freshness
      });

      res.json(meta);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query system metadata',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
