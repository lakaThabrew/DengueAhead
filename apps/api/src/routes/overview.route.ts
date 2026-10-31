import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { DbClient } from '../repositories/mongo.js';
import { createPredictionsRepository } from '../repositories/predictions.repository.js';
import { createAreasRepository } from '../repositories/areas.repository.js';
import { AreaSchema, PredictionSchema } from '@dengueahead/contracts';

const QuerySchema = z.object({
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be YYYY-MM-DD')
    .optional()
});

export function createOverviewRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/overview', async (req: Request, res: Response) => {
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
      const predsRepo = createPredictionsRepository(db);
      const areasRepo = createAreasRepository(db);

      // Resolve issueDate: use provided or latest
      let issueDate = parseResult.data.issueDate;
      if (!issueDate) {
        const latest = await predsRepo.getLatestIssueDate();
        if (!latest) {
          res.json({
            issueDate: null,
            targetWeek: null,
            monitoredAreasCount: 0,
            emergingHotspotsCount: 0,
            persistentHotspotsCount: 0,
            stableAreasCount: 0,
            coolingAreasCount: 0,
            withheldCount: 0,
            topEmergingAreas: []
          });
          return;
        }
        issueDate = latest;
      }

      const d = new Date(issueDate);
      d.setDate(d.getDate() + 7);
      const targetWeek = d.toISOString().slice(0, 10);

      const [counts, topEmerging, allAreas] = await Promise.all([
        predsRepo.getOverviewCounts(issueDate),
        predsRepo.getTopEmergingAreas(issueDate, 5),
        areasRepo.listAreas(100, 0)
      ]);

      // Build topEmergingAreas with full area detail
      const topEmergingAreas = [];
      for (const pred of topEmerging) {
        const p = pred as { areaId?: string };
        if (p.areaId) {
          const area = await areasRepo.getArea(p.areaId);
          if (area) {
            const parsedArea = AreaSchema.safeParse(area);
            const parsedPred = PredictionSchema.safeParse(pred);
            if (parsedArea.success && parsedPred.success) {
              topEmergingAreas.push({ area: parsedArea.data, prediction: parsedPred.data });
            }
          }
        }
      }

      res.json({
        issueDate,
        targetWeek,
        monitoredAreasCount: (allAreas as unknown[]).length,
        emergingHotspotsCount: counts['EMERGING'] ?? 0,
        persistentHotspotsCount: counts['PERSISTENT'] ?? 0,
        stableAreasCount: counts['STABLE'] ?? 0,
        coolingAreasCount: counts['COOLING'] ?? 0,
        withheldCount: counts['WITHHELD'] ?? 0,
        topEmergingAreas
      });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query overview',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
