import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v3';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
    details: err.issues.map((e: any) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
}
