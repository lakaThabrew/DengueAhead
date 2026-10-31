import { Router, Request, Response } from 'express';
import type { DbClient } from '../repositories/mongo.js';
import { createPredictionsRepository } from '../repositories/predictions.repository.js';
import { createModelRunsRepository } from '../repositories/model-runs.repository.js';

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
      const predsRepo = createPredictionsRepository(db);
      const runsRepo = createModelRunsRepository(db);

      const [latestIssueDate, activeModelVersion] = await Promise.all([
        predsRepo.getLatestIssueDate(),
        runsRepo.getLatestActiveModelVersion()
      ]);

      // Derive latestTargetWeek: +7 days from issueDate
      let latestTargetWeek: string | null = null;
      if (latestIssueDate) {
        const d = new Date(latestIssueDate);
        d.setDate(d.getDate() + 7);
        latestTargetWeek = d.toISOString().slice(0, 10);
      }

      res.json({
        geographicLevel: 'district',
        latestIssueDate,
        latestTargetWeek,
        activeModelVersion,
        lastUpdated: latestIssueDate ? `${latestIssueDate}T00:00:00.000Z` : null,
        sourceFreshnessStatus: latestIssueDate ? 'CURRENT' : 'UNAVAILABLE'
      });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query metadata',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
