import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured errors on failure.
 */
export const validateBody = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted = result.error.issues.map((issue: z.ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        error: 'Validation failed',
        details: formatted,
      });
      return;
    }
    req.body = result.data;
    next();
  };
};

/**
 * Middleware factory that validates req.params against a Zod schema.
 */
export const validateParams = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const formatted = result.error.issues.map((issue: z.ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        error: 'Invalid parameters',
        details: formatted,
      });
      return;
    }
    req.params = result.data as any;
    next();
  };
};
