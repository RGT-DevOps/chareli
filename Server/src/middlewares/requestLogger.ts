import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl, ip } = req;
  logger.http(`${method} ${originalUrl} - Request received from ${ip}`);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 400 ? 'error' : 'http';
    logger[level](
      `${method} ${originalUrl} - Response: ${statusCode} - ${duration}ms`
    );
  });
  
  next();
};
