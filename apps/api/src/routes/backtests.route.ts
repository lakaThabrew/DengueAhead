import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BacktestsResponseSchema, EvaluationMetricsSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

const QuerySchema = z.object({
  modelVersion: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export function createBacktestsRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/backtests', async (req: Request, res: Response) => {
    const parseResult = QuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: parseResult.error.issues.map((i) => i.message).join('; '),
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

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
      const { modelVersion, limit } = parseResult.data;
      const filter: Record<string, string> = {};
      if (modelVersion) filter.modelVersion = modelVersion;

      const docs = await db
        .collection('model_runs')
        .find(filter, { projection: { _id: 0 } })
        .sort({ trainedAt: -1 })
        .limit(limit)
        .toArray();

      const validated = docs.map((d) => EvaluationMetricsSchema.parse(d));

      const response = BacktestsResponseSchema.parse({
        data: validated,
        count: validated.length
      });

      res.json(response);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query backtest runs',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
