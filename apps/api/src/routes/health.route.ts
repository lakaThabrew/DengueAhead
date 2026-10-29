import { Router, Request, Response } from 'express';
import { HealthResponse, ReadinessResponse } from '@dengueahead/contracts';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    apiVersion: '1.0.0',
    service: 'dengueahead-api',
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

healthRouter.get('/readiness', (_req: Request, res: Response) => {
  // During Phase 0, database connection readiness is scaffolded
  // Returns operational readiness status
  const response: ReadinessResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: 'ok',
        message: 'MongoDB connection ready or mocked for Phase 0'
      },
      dataFreshness: {
        status: 'ok',
        message: 'Awaiting Phase 1 ingestion initialization'
      }
    }
  };
  res.json(response);
});

