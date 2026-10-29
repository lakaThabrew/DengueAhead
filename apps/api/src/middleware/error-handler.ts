import { Response, NextFunction } from 'express';
import { RequestWithId } from './request-id.js';

export function errorHandler(
  err: unknown,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  const e = err as { status?: number; statusCode?: number; code?: string; message?: string };
  const status = e.status ?? e.statusCode ?? 500;
  const code = e.code ?? (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  // Never return stack traces to clients — log server-side only
  const message = status === 500 ? 'An unexpected error occurred' : (e.message ?? 'Request error');

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.requestId
    }
  });
}
