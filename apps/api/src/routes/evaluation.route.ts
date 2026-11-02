import { Router, Request, Response } from 'express';
import { EvaluationMetricsSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

export function createEvaluationRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/evaluation', async (req: Request, res: Response) => {
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
      const docs = await db
        .collection('model_runs')
        .find({}, { projection: { _id: 0 } })
        .sort({ trainedAt: -1 })
        .limit(20)
        .toArray();

      // Validate each document against contract schema
      const validated = docs.map((d) => EvaluationMetricsSchema.parse(d));

      res.json({
        data: validated,
        count: validated.length
      });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query model evaluation records',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
