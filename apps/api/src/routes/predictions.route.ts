import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PredictionSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

const QuerySchema = z.object({
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be in YYYY-MM-DD format')
    .optional(),
  areaId: z.string().min(1).optional(),
  modelVersion: z.string().min(1).optional()
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

    const { asOf, areaId, modelVersion } = parseResult.data;
    const filter: Record<string, string> = {};
    if (asOf) filter.asOfDate = asOf;
    if (areaId) filter.areaId = areaId;
    if (modelVersion) filter.modelVersion = modelVersion;

    try {
      const docs = await db
        .collection('predictions')
        .find(filter, { projection: { _id: 0 } })
        .sort({ areaId: 1 })
        .limit(500)
        .toArray();

      const validated = docs.map((d) => PredictionSchema.parse(d));

      res.json({
        data: validated,
        count: validated.length
      });
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
