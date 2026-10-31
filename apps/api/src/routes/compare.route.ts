import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AreaSchema, PredictionSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';
import { createAreasRepository, isValidAreaId } from '../repositories/areas.repository.js';
import { createPredictionsRepository } from '../repositories/predictions.repository.js';
import { createDengueRepository } from '../repositories/dengue.repository.js';

const QuerySchema = z.object({
  areaIds: z
    .string()
    .min(1, 'areaIds is required')
    .transform((s) => s.split(',').map((id) => id.trim())),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be YYYY-MM-DD')
    .optional()
});

export function createCompareRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/compare', async (req: Request, res: Response) => {
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

    const { areaIds, issueDate } = parseResult.data;

    if (areaIds.length > 3) {
      res.status(400).json({
        error: {
          code: 'TOO_MANY_AREAS',
          message: 'Compare accepts at most 3 area IDs',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    const invalidIds = areaIds.filter((id) => !isValidAreaId(id));
    if (invalidIds.length > 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_AREA_ID',
          message: `Invalid area IDs: ${invalidIds.join(', ')}`,
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    try {
      const areasRepo = createAreasRepository(db);
      const predsRepo = createPredictionsRepository(db);
      const dengueRepo = createDengueRepository(db);

      // Resolve issueDate
      let resolvedIssueDate = issueDate;
      if (!resolvedIssueDate) {
        const latest = await predsRepo.getLatestIssueDate();
        resolvedIssueDate = latest ?? undefined;
      }

      const comparisons = [];
      for (const areaId of areaIds) {
        const [areaDoc, predDoc, trend] = await Promise.all([
          areasRepo.getArea(areaId),
          predsRepo.getLatestPrediction(areaId, resolvedIssueDate),
          dengueRepo.getSeries(areaId, { limit: 4 })
        ]);

        const parsedArea = AreaSchema.safeParse(areaDoc);
        const parsedPred = PredictionSchema.safeParse(predDoc);

        if (!parsedArea.success || !parsedPred.success) continue;

        const recentTrend = (trend as Array<{ weekStart?: string; cases?: number | null }>).map(
          (t) => ({
            weekStart: t.weekStart ?? '',
            cases: t.cases ?? null
          })
        );

        comparisons.push({ area: parsedArea.data, prediction: parsedPred.data, recentTrend });
      }

      const targetWeek = resolvedIssueDate
        ? (() => {
            const d = new Date(resolvedIssueDate);
            d.setDate(d.getDate() + 7);
            return d.toISOString().slice(0, 10);
          })()
        : null;

      res.json({
        issueDate: resolvedIssueDate ?? null,
        targetWeek,
        comparisons
      });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query comparison data',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
