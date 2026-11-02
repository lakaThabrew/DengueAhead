import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  AreaSchema,
  AreaSeriesResponseSchema,
  AreaForecastResponseSchema,
  PredictionSchema
} from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';

const NON_CAUSAL_DISCLAIMER =
  'Feature attributions indicate statistical association in historical surveillance data, not clinical or biological causation.';

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

const ListQuerySchema = z.object({
  query: z.string().optional(),
  level: z.enum(['district', 'moh']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

const SeriesQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be in YYYY-MM-DD format')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be in YYYY-MM-DD format')
    .optional(),
  limit: z.coerce.number().int().min(1).max(520).default(104)
});

const ForecastQuerySchema = z.object({
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
    .optional(),
  modelVersion: z.string().min(1).optional()
});

export function createAreasRouter(db?: DbClient): Router {
  const router = Router();

  // ── GET /areas ─────────────────────────────────────────────────────────────
  router.get('/areas', async (req: Request, res: Response) => {
    const parseResult = ListQuerySchema.safeParse(req.query);
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

    const { query, level, limit, offset } = parseResult.data;
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    if (query) {
      // Safe literal escaping for regex search (API-04 injection safety)
      const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { areaId: { $regex: sanitized, $options: 'i' } }
      ];
    }

    try {
      const total = await db.collection('areas').countDocuments(filter);
      const docs = await db
        .collection('areas')
        .find(filter, { projection: { _id: 0 } })
        .sort({ areaId: 1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      const validated = docs.map((d) => AreaSchema.parse(normalizeArea(d)));
      res.json({ data: validated, count: validated.length, total });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query areas',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  // ── GET /areas/:areaId ─────────────────────────────────────────────────────
  router.get('/areas/:areaId', async (req: Request, res: Response) => {
    const areaId = req.params.areaId;
    // API-04 input format validation
    if (!/^[A-Z]{2}-\d{1,2}$/.test(areaId)) {
      res.status(404).json({
        error: {
          code: 'AREA_NOT_FOUND',
          message: `Area '${areaId}' not found`,
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
      const doc = await db.collection('areas').findOne({ areaId }, { projection: { _id: 0 } });

      if (!doc) {
        res.status(404).json({
          error: {
            code: 'AREA_NOT_FOUND',
            message: `Area '${areaId}' not found in registry`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }

      res.json(AreaSchema.parse(normalizeArea(doc)));
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query area details',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  // ── GET /areas/:areaId/series ──────────────────────────────────────────────
  router.get('/areas/:areaId/series', async (req: Request, res: Response) => {
    const areaId = req.params.areaId;
    if (!/^[A-Z]{2}-\d{1,2}$/.test(areaId)) {
      res.status(404).json({
        error: {
          code: 'AREA_NOT_FOUND',
          message: `Area '${areaId}' not found`,
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    const parseResult = SeriesQuerySchema.safeParse(req.query);
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
      // Confirm area exists
      const areaExists = await db
        .collection('areas')
        .findOne({ areaId }, { projection: { _id: 1 } });
      if (!areaExists) {
        res.status(404).json({
          error: {
            code: 'AREA_NOT_FOUND',
            message: `Area '${areaId}' not found in registry`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }

      const { from, to, limit } = parseResult.data;
      const filter: Record<string, unknown> = { areaId };
      if (from || to) {
        const weekStartFilter: Record<string, string> = {};
        if (from) weekStartFilter.$gte = from;
        if (to) weekStartFilter.$lte = to;
        filter.weekStart = weekStartFilter;
      }

      const obsDocs = await db
        .collection('dengue_weekly')
        .find(filter, { projection: { _id: 0 } })
        .sort({ weekStart: 1 })
        .limit(limit)
        .toArray();

      const points = obsDocs.map((o) => ({
        weekStart: o.weekStart,
        weekEnd: o.weekEnd || o.weekStart,
        cases: o.cases ?? null,
        reportedAt: o.reportedAt ?? null,
        qualityFlags: o.qualityFlags || []
      }));

      const response = AreaSeriesResponseSchema.parse({
        areaId,
        data: points,
        count: points.length
      });

      res.json(response);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query area series',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  // ── GET /areas/:areaId/forecast ────────────────────────────────────────────
  router.get('/areas/:areaId/forecast', async (req: Request, res: Response) => {
    const areaId = req.params.areaId;
    if (!/^[A-Z]{2}-\d{1,2}$/.test(areaId)) {
      res.status(404).json({
        error: {
          code: 'AREA_NOT_FOUND',
          message: `Area '${areaId}' not found`,
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
      return;
    }

    const parseResult = ForecastQuerySchema.safeParse(req.query);
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
      const areaDoc = await db.collection('areas').findOne({ areaId }, { projection: { _id: 0 } });
      if (!areaDoc) {
        res.status(404).json({
          error: {
            code: 'AREA_NOT_FOUND',
            message: `Area '${areaId}' not found in registry`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }

      let targetIssueDate = parseResult.data.issueDate;
      const modelVersion = parseResult.data.modelVersion;

      const predFilter: Record<string, unknown> = { areaId };
      if (modelVersion) predFilter.modelVersion = modelVersion;

      if (!targetIssueDate) {
        const latestPred = await db
          .collection('predictions')
          .find(predFilter, { projection: { issueDate: 1 } })
          .sort({ issueDate: -1 })
          .limit(1)
          .toArray();

        targetIssueDate =
          latestPred.length > 0 && latestPred[0].issueDate
            ? latestPred[0].issueDate
            : new Date().toISOString().slice(0, 10);
      }
      predFilter.issueDate = targetIssueDate;

      const predDoc = await db
        .collection('predictions')
        .findOne(predFilter, { projection: { _id: 0 } });

      let prediction;
      if (predDoc) {
        prediction = PredictionSchema.parse(predDoc);
      } else {
        prediction = PredictionSchema.parse({
          areaId,
          geographicLevel: areaDoc.level || 'district',
          issueDate: targetIssueDate,
          targetWeek: targetIssueDate,
          asOfDate: targetIssueDate,
          modelVersion: modelVersion || 'fallback',
          status: 'WITHHELD',
          confidenceStatus: 'NOT_AVAILABLE',
          pointForecast: null,
          interval: null,
          riskProbability: null,
          qualityFlags: ['INSUFFICIENT_HISTORY'],
          sourceSnapshotIds: []
        });
      }

      // Feature snapshot lookup for drivers & baselines
      const featDoc = await db
        .collection('feature_snapshots')
        .findOne({ areaId, issueDate: targetIssueDate }, { projection: { _id: 0, features: 1 } });

      let seasonalMedian = null;
      const drivers: Array<{
        feature: string;
        impact: number;
        direction: 'positive' | 'negative' | 'neutral';
      }> = [];

      if (featDoc && featDoc.features) {
        seasonalMedian = featDoc.features.seasonal_historical_median ?? null;
        const c1 = featDoc.features.cases_lag_1;
        const g1 = featDoc.features.growth_1w;
        if (c1 !== undefined) {
          drivers.push({
            feature: 'cases_lag_1',
            impact: Number(c1),
            direction: Number(c1) > 50 ? 'positive' : 'neutral'
          });
        }
        if (g1 !== undefined) {
          drivers.push({
            feature: 'growth_1w',
            impact: Number(g1),
            direction: Number(g1) > 0 ? 'positive' : 'negative'
          });
        }
      }

      const response = AreaForecastResponseSchema.parse({
        areaId,
        areaName: areaDoc.name || areaId,
        prediction,
        historicalBaseline: {
          seasonalMedian,
          hotspotThreshold: seasonalMedian ? seasonalMedian * 1.25 : null
        },
        featureDrivers: drivers,
        nonCausalDisclaimer: NON_CAUSAL_DISCLAIMER
      });

      res.json(response);
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query area forecast',
          requestId: (req as Request & { requestId?: string }).requestId
        }
      });
    }
  });

  return router;
}
