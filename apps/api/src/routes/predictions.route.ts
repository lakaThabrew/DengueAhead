import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PredictionSchema, PredictionStatusSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';
import { createPredictionsRepository } from '../repositories/predictions.repository.js';

const QuerySchema = z.object({
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be YYYY-MM-DD')
    .optional(),
  status: PredictionStatusSchema.optional(),
  areaId: z
    .string()
    .regex(/^[A-Z]{2}-\d{1,2}$/, 'areaId must match LK-NN format')
    .optional(),
  modelVersion: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export function createPredictionsRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/predictions', async (req: Request, res: Response) => {
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

    const { issueDate, status, areaId, modelVersion, limit, offset } = parseResult.data;

    try {
      const repo = createPredictionsRepository(db);
      const { data: docs, total } = await repo.queryPredictions({
        issueDate,
        status,
        areaId,
        modelVersion,
        limit,
        offset
      });

      const validated = docs.map((d) => {
        const r = PredictionSchema.safeParse(d);
        return r.success ? r.data : d;
      });

      res.json({ data: validated, count: validated.length, total });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query predictions',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
