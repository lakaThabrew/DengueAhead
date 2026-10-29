import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.route.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Mount routes under API_PREFIX
  app.use(env.API_PREFIX, healthRouter);

  // Catch-all 404
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist'
      }
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

