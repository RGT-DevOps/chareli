import { Express, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Initialize Sentry for error monitoring and performance tracking
 * DISABLED - This function does nothing to prevent Sentry errors
 * @param app Express application instance
 */
export const initializeSentry = (app: Express): void => {
  logger.info('Sentry is disabled - no initialization performed');
  // No-op: Do nothing to prevent any Sentry-related errors
};

/**
 * Create Sentry request handler middleware
 * DISABLED - Returns no-op middleware
 */
export const sentryRequestHandler = () => {
  // No-op: Always return pass-through middleware
  return (_req: Request, _res: Response, next: NextFunction) => next();
};

/**
 * Create Sentry tracing middleware
 * DISABLED - Returns no-op middleware
 */
export const sentryTracingHandler = () => {
  // No-op: Always return pass-through middleware
  return (_req: Request, _res: Response, next: NextFunction) => next();
};

/**
 * Create Sentry error handler middleware
 * DISABLED - Returns no-op middleware
 */
export const sentryErrorHandler = () => {
  // No-op: Always return pass-through error handler
  return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
};

/**
 * Capture and report an exception to Sentry
 * DISABLED - Does nothing
 * @param error Error to capture
 */
export const captureException = (error: Error): string => {
  // No-op: Always return empty string, never capture anything
  return '';
};

/**
 * Capture and report a message to Sentry
 * DISABLED - Does nothing
 * @param message Message to capture
 * @param level Severity level
 */
export const captureMessage = (message: string, level?: any): string => {
  // No-op: Always return empty string, never capture anything
  return '';
};

/**
 * Set user information for error context
 * DISABLED - Does nothing
 * @param user User information
 */
export const setUser = (user: any | null): void => {
  // No-op: Do nothing
};

/**
 * Set additional context for error reporting
 * DISABLED - Does nothing
 * @param name Context name
 * @param context Context data
 */
export const setContext = (name: string, context: Record<string, unknown>): void => {
  // No-op: Do nothing
};

/**
 * Set tag for error filtering and categorization
 * DISABLED - Does nothing
 * @param key Tag key
 * @param value Tag value
 */
export const setTag = (key: string, value: string): void => {
  // No-op: Do nothing
};
