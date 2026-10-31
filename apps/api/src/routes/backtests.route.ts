import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EvaluationMetricsSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';
import { createModelRunsRepository } from '../repositories/model-runs.repository.js';

const QuerySchema = z.object({
  modelVersion: z.string().min(1).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
    .optional()
});

export function createBacktestsRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/backtests', async (req: Request, res: Response) => {
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

    try {
      const repo = createModelRunsRepository(db);
      const docs = await repo.listRuns({ ...parseResult.data, limit: 50 });
      const validated = docs.map((d) => {
        const r = EvaluationMetricsSchema.safeParse(d);
        return r.success ? r.data : d;
      });
      res.json({ data: validated, count: validated.length });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query backtest records',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
