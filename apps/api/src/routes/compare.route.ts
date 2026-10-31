import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CompareResponseSchema, AreaSchema, PredictionSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

function normalizeArea(
  doc?: Record<string, unknown>
): Record<string, unknown> {
  if (!doc) return {};
  let centroid = doc.centroid as
    | { latitude?: number; longitude?: number }
    | [number, number]
    | undefined;
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
  areaIds: z.string().min(1, 'areaIds parameter is required'),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
    .optional()
});

export function createCompareRouter(db?: DbClient): Router {
  const router = Router();

  router.get('/compare', async (req: Request, res: Response) => {
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

    const rawAreaIds = parseResult.data.areaIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawAreaIds.length === 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'At least one areaId must be provided',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    if (rawAreaIds.length > 3) {
      res.status(400).json({
        error: {
          code: 'TOO_MANY_AREAS',
          message: 'Maximum of 3 areas can be compared at once',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    // Validate area ID format (API-04 injection safety)
    const areaIdRegex = /^[A-Z]{2}-\d{1,2}$/;
    for (const aId of rawAreaIds) {
      if (!areaIdRegex.test(aId)) {
        res.status(400).json({
          error: {
            code: 'INVALID_AREA_ID',
            message: `Invalid areaId format: '${aId}'`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }
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
      if (!targetIssueDate) {
        const latestDoc = await db
          .collection('predictions')
          .find({}, { projection: { issueDate: 1 } })
          .sort({ issueDate: -1 })
          .limit(1)
          .toArray();

        targetIssueDate =
          latestDoc.length > 0 && latestDoc[0].issueDate
            ? latestDoc[0].issueDate
            : new Date().toISOString().slice(0, 10);
      }

      // Query areas metadata
      const areaDocs = await db
        .collection('areas')
        .find({ areaId: { $in: rawAreaIds } }, { projection: { _id: 0 } })
        .toArray();

      const areaMap = new Map<string, Record<string, unknown>>();
      for (const a of areaDocs) {
        areaMap.set(a.areaId, a);
      }

      // Check if any requested areaId is completely missing from registry
      for (const reqId of rawAreaIds) {
        if (!areaMap.has(reqId)) {
          res.status(404).json({
            error: {
              code: 'AREA_NOT_FOUND',
              message: `Area '${reqId}' does not exist in area registry`,
              requestId: (req as Request & { requestId?: string }).requestId
            }
          });
          return;
        }
      }

      // Query predictions for requested areas
      const predDocs = await db
        .collection('predictions')
        .find(
          { areaId: { $in: rawAreaIds }, issueDate: targetIssueDate },
          { projection: { _id: 0 } }
        )
        .toArray();

      const predMap = new Map<string, Record<string, unknown>>();
      for (const p of predDocs) {
        predMap.set(p.areaId, p);
      }

      let targetWeek = targetIssueDate;
      if (predDocs.length > 0 && predDocs[0].targetWeek) {
        targetWeek = predDocs[0].targetWeek;
      }

      // Query recent trends (last 8 weeks up to targetIssueDate)
      const trendDocs = await db
        .collection('dengue_weekly')
        .find(
          { areaId: { $in: rawAreaIds }, weekStart: { $lte: targetIssueDate } },
          { projection: { _id: 0, areaId: 1, weekStart: 1, cases: 1 } }
        )
        .sort({ weekStart: -1 })
        .limit(200)
        .toArray();

      const trendsByArea = new Map<string, Array<{ weekStart: string; cases: number | null }>>();
      for (const td of trendDocs) {
        if (!trendsByArea.has(td.areaId)) {
          trendsByArea.set(td.areaId, []);
        }
        const list = trendsByArea.get(td.areaId)!;
        if (list.length < 8) {
          list.push({ weekStart: td.weekStart, cases: td.cases ?? null });
        }
      }

      const comparisons = rawAreaIds.map((id) => {
        const areaDoc = areaMap.get(id);
        const area = AreaSchema.parse(normalizeArea(areaDoc));

        let predRaw = predMap.get(id);
        if (!predRaw) {
          // Construct fallback WITHHELD prediction
          predRaw = {
            areaId: id,
            geographicLevel: area.level,
            issueDate: targetIssueDate,
            targetWeek,
            asOfDate: targetIssueDate,
            modelVersion: 'fallback',
            status: 'WITHHELD',
            confidenceStatus: 'NOT_AVAILABLE',
            pointForecast: null,
            interval: null,
            riskProbability: null,
            qualityFlags: ['INSUFFICIENT_HISTORY'],
            sourceSnapshotIds: []
          };
        }
        const prediction = PredictionSchema.parse(predRaw);

        const recentTrend = (trendsByArea.get(id) || []).reverse();

        return {
          area,
          prediction,
          recentTrend
        };
      });

      const response = CompareResponseSchema.parse({
        issueDate: targetIssueDate,
        targetWeek,
        comparisons
      });

      res.json(response);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to generate comparison',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
