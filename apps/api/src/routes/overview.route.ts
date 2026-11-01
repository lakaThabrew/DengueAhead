import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OverviewSummarySchema, AreaSchema, PredictionSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

function normalizeArea(doc?: Record<string, unknown>): Record<string, unknown> {
  if (!doc) return {};
  let centroid = doc.centroid as
    { latitude?: number; longitude?: number } | [number, number] | undefined;
  if (Array.isArray(centroid)) {
    centroid = {
      latitude: centroid[0] ?? 6.9271,
      longitude: centroid[1] ?? 79.8612
    };
  } else if (!centroid || typeof centroid.latitude !== 'number') {
    centroid = { latitude: 6.9271, longitude: 79.8612 };
  }
  return {
    ...doc,
    centroid
  };
}

const QuerySchema = z.object({
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
    .optional()
});

export function createOverviewRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/overview', async (req: Request, res: Response) => {
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
      let targetIssueDate = parseResult.data.issueDate;

      // If no issueDate specified, find the latest issueDate
      if (!targetIssueDate) {
        const latestDoc = await db
          .collection('predictions')
          .find({}, { projection: { issueDate: 1 } })
          .sort({ issueDate: -1 })
          .limit(1)
          .toArray();

        if (latestDoc.length > 0 && latestDoc[0].issueDate) {
          targetIssueDate = latestDoc[0].issueDate;
        } else {
          // If no predictions exist yet, default to today's date
          targetIssueDate = new Date().toISOString().slice(0, 10);
        }
      }

      // Fetch all predictions for targetIssueDate
      const rawPredictions = await db
        .collection('predictions')
        .find({ issueDate: targetIssueDate }, { projection: { _id: 0 } })
        .toArray();

      const predictions = rawPredictions.map((p) => PredictionSchema.parse(p));

      // Resolve targetWeek
      const targetWeek = predictions.length > 0 ? predictions[0].targetWeek : targetIssueDate;

      // Compute status breakdown
      let emerging = 0;
      let persistent = 0;
      let stable = 0;
      let cooling = 0;
      let withheld = 0;

      for (const p of predictions) {
        if (p.status === 'EMERGING') emerging++;
        else if (p.status === 'PERSISTENT') persistent++;
        else if (p.status === 'STABLE') stable++;
        else if (p.status === 'COOLING') cooling++;
        else if (p.status === 'WITHHELD') withheld++;
      }

      // Find top emerging areas (sorted by riskProbability desc, then pointForecast desc)
      const emergingPreds = predictions
        .filter((p) => p.status === 'EMERGING')
        .sort((a, b) => {
          const probA = a.riskProbability ?? -1;
          const probB = b.riskProbability ?? -1;
          if (probB !== probA) return probB - probA;
          return (b.pointForecast ?? 0) - (a.pointForecast ?? 0);
        })
        .slice(0, 5);

      // Fetch Area details for top emerging areas
      const topAreaIds = emergingPreds.map((p) => p.areaId);
      const areaDocs =
        topAreaIds.length > 0
          ? await db
              .collection('areas')
              .find({ areaId: { $in: topAreaIds } }, { projection: { _id: 0 } })
              .toArray()
          : [];

      const areaMap = new Map<string, Record<string, unknown>>();
      for (const a of areaDocs) {
        areaMap.set(a.areaId, a);
      }

      const topEmergingAreas = emergingPreds.map((p) => {
        const areaRaw = areaMap.get(p.areaId) || {
          areaId: p.areaId,
          name: p.areaId,
          level: 'district'
        };
        return {
          area: AreaSchema.parse(normalizeArea(areaRaw)),
          prediction: p
        };
      });

      const summary = OverviewSummarySchema.parse({
        issueDate: targetIssueDate,
        targetWeek,
        monitoredAreasCount: predictions.length,
        emergingHotspotsCount: emerging,
        persistentHotspotsCount: persistent,
        stableAreasCount: stable,
        coolingAreasCount: cooling,
        withheldCount: withheld,
        topEmergingAreas
      });

      res.json(summary);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to generate overview summary',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
