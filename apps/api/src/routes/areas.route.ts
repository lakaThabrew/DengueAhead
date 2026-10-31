import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AreaSchema, PredictionSchema } from '@dengueahead/contracts';
import type { DbClient } from '../repositories/mongo.js';
import { createAreasRepository, isValidAreaId } from '../repositories/areas.repository.js';
import { createDengueRepository } from '../repositories/dengue.repository.js';
import { createPredictionsRepository } from '../repositories/predictions.repository.js';

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

const SeriesQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
    .optional(),
  limit: z.coerce.number().int().min(1).max(520).default(104)
});

const ForecastQuerySchema = z.object({
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be YYYY-MM-DD')
    .optional(),
  modelVersion: z.string().min(1).optional()
});

export function createAreasRouter(db?: DbClient): Router {
  const router = Router();

  // GET /areas — list all districts
  router.get('/areas', async (req: Request, res: Response) => {
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

    try {
      const repo = createAreasRepository(db);
      const { limit, offset } = parseResult.data;
      const docs = await repo.listAreas(limit, offset);
      const total = await db.collection('areas').countDocuments({});
      res.json({ data: docs, count: docs.length, total });
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query areas' }
      });
    }
  });

  // GET /areas/:areaId — single district profile
  router.get('/areas/:areaId', async (req: Request, res: Response) => {
    const { areaId } = req.params;

    if (!isValidAreaId(areaId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_AREA_ID',
          message: `areaId '${areaId}' is not a valid district ID (expected format LK-NN)`,
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
      const repo = createAreasRepository(db);
      const doc = await repo.getArea(areaId);
      if (!doc) {
        res.status(404).json({
          error: {
            code: 'AREA_NOT_FOUND',
            message: `Area '${areaId}' not found`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }
      const parsed = AreaSchema.safeParse(doc);
      res.json(parsed.success ? parsed.data : doc);
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query area' }
      });
    }
  });

  // GET /areas/:areaId/series — historical weekly observed cases
  router.get('/areas/:areaId/series', async (req: Request, res: Response) => {
    const { areaId } = req.params;

    if (!isValidAreaId(areaId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_AREA_ID',
          message: `areaId '${areaId}' is not valid`,
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
      const repo = createDengueRepository(db);
      const { from, to, limit } = parseResult.data;
      const data = await repo.getSeries(areaId, { from, to, limit });
      res.json({ areaId, data, count: data.length });
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query series' }
      });
    }
  });

  // GET /areas/:areaId/forecast — latest forecast with feature drivers
  router.get('/areas/:areaId/forecast', async (req: Request, res: Response) => {
    const { areaId } = req.params;

    if (!isValidAreaId(areaId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_AREA_ID',
          message: `areaId '${areaId}' is not valid`,
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
      const areasRepo = createAreasRepository(db);
      const predsRepo = createPredictionsRepository(db);

      const [areaDoc, predDoc] = await Promise.all([
        areasRepo.getArea(areaId),
        predsRepo.getLatestPrediction(
          areaId,
          parseResult.data.issueDate,
          parseResult.data.modelVersion
        )
      ]);

      if (!areaDoc) {
        res.status(404).json({
          error: {
            code: 'AREA_NOT_FOUND',
            message: `Area '${areaId}' not found`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }

      if (!predDoc) {
        res.status(404).json({
          error: {
            code: 'FORECAST_NOT_FOUND',
            message: `No forecast available for area '${areaId}'`,
            requestId: (req as Request & { requestId?: string }).requestId
          }
        });
        return;
      }

      const parsedArea = AreaSchema.safeParse(areaDoc);
      const parsedPred = PredictionSchema.safeParse(predDoc);

      if (!parsedPred.success) {
        res.status(503).json({
          error: {
            code: 'CONTRACT_VIOLATION',
            message: 'Stored prediction failed schema validation'
          }
        });
        return;
      }

      res.json({
        areaId,
        areaName: parsedArea.success ? parsedArea.data.name : areaId,
        prediction: parsedPred.data,
        historicalBaseline: null,
        featureDrivers: [],
        nonCausalDisclaimer:
          'Feature attributions indicate statistical association in historical surveillance data, not clinical or biological causation.'
      });
    } catch {
      res.status(503).json({
        error: { code: 'DATABASE_ERROR', message: 'Failed to query forecast' }
      });
    }
  });

  return router;
}
