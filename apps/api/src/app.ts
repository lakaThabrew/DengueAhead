import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { createHealthRouter } from './routes/health.route.js';
import { createSourcesRouter } from './routes/sources.route.js';
import { createAreasRouter } from './routes/areas.route.js';
import { createEvaluationRouter } from './routes/evaluation.route.js';
import { createPredictionsRouter } from './routes/predictions.route.js';
import type { DbClient } from './repositories/mongo.js';

export function createApp(db?: DbClient) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: env.API_BODY_LIMIT }));
  app.use(requestIdMiddleware);

  // Read-only guard: reject non-read methods
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      res.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only read methods are permitted on this API',
          requestId: (req as express.Request & { requestId?: string }).requestId
        }
      });
      return;
    }
    next();
  });

  // Mount routes under API_PREFIX
  app.use(env.API_PREFIX, createHealthRouter(db));
  app.use(env.API_PREFIX, createSourcesRouter(db));
  app.use(env.API_PREFIX, createAreasRouter(db));
  app.use(env.API_PREFIX, createEvaluationRouter(db));
  app.use(env.API_PREFIX, createPredictionsRouter(db));

  // Catch-all 404
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist',
        requestId: (req as express.Request & { requestId?: string }).requestId
      }
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
