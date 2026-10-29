import { Response, NextFunction } from 'express';
import { RequestWithId } from './request-id.js';

export function errorHandler(
  err: any,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.requestId,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}

