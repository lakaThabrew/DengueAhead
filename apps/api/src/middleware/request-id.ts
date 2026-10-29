import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  const incomingId = req.header('x-request-id');
  const id = incomingId && incomingId.trim().length > 0 ? incomingId : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
