import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AnonymousUserActivity } from '../entities/AnonymousUserActivity';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { Game } from '../entities/Games';
import { ApiError } from '../middlewares/errorHandler';
import { getCountryFromIP, extractClientIP } from '../utils/ipUtils';
import { IsNull, Not } from 'typeorm';

const anonymousUserActivityRepository = AppDataSource.getRepository(AnonymousUserActivity);
const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);
const gameRepository = AppDataSource.getRepository(Game);


function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (
    ua.includes('ipad') || 
    ua.includes('tablet') || 
    (ua.includes('android') && !ua.includes('mobi'))
  ) {
    return 'tablet';
  }
  
  if (
    ua.includes('mobi') || 
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * @swagger
 * /anonymous/track-game-session:
 *   post:
 *     summary: Track anonymous user game session start
 *     tags: [AnonymousActivity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - gameId
 *             properties:
 *               sessionId:
 *                 type: string
 *               gameId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Game session tracked successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Game not found
 */
export const trackGameSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, gameId, startedAt } = req.body;

    if (!sessionId || !gameId) {
      return next(ApiError.badRequest('SessionId and gameId are required'));
    }

    // Get game details for free time limit
    const game = await gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      return next(ApiError.notFound('Game not found'));
    }

    // Extract device and location info
    const ipAddress = extractClientIP(req.headers['x-forwarded-for'], req.socket.remoteAddress || req.ip || '');
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDeviceType(userAgent);
    const country = await getCountryFromIP(ipAddress);

    // Check if this sessionId belongs to a registered user
    const existingUser = await anonymousUserActivityRepository.findOne({
      where: { sessionId, convertedUserId: Not(IsNull()) }
    });

    // Determine user state
    let userState = 'anonymous';
    let convertedUserId = null;
    let isVerified = false;

    if (existingUser) {
      convertedUserId = existingUser.convertedUserId;
      isVerified = existingUser.isVerified;
      userState = 'registered_not_logged_in';
    }

    const activity = anonymousUserActivityRepository.create({
      sessionId,
      gameId,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      freeTimeLimitSeconds: game.config * 60, // Convert minutes to seconds
      deviceType,
      country: country || undefined,
      ipAddress,
      convertedUserId: convertedUserId || undefined,
      isVerified,
      userState
    });

    await anonymousUserActivityRepository.save(activity);

    res.status(201).json({
      success: true,
      data: {
        id: activity.id,
        sessionId: activity.sessionId,
        gameId: activity.gameId,
        freeTimeLimitSeconds: activity.freeTimeLimitSeconds
      }
    });
  } catch (error) {
    console.error('Failed to track game session:', error);
    next(error);
  }
};

/**
 * @swagger
 * /anonymous/update-game-session/{id}:
 *   put:
 *     summary: Update anonymous user game session (end time, popup shown, etc.)
 *     tags: [AnonymousActivity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endedAt:
 *                 type: string
 *                 format: date-time
 *               reachedTimeLimit:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Game session updated successfully
 *       404:
 *         description: Session not found
 */
export const updateGameSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { endedAt, reachedTimeLimit } = req.body;

    const activity = await anonymousUserActivityRepository.findOne({
      where: { id }
    });

    if (!activity) {
      return next(ApiError.notFound('Game session not found'));
    }

    // Update fields
    if (endedAt) {
      activity.endedAt = new Date(endedAt);
    }

    if (reachedTimeLimit !== undefined) {
      activity.reachedTimeLimit = reachedTimeLimit;
    }


    console.log("activity Date:::", activity)

    if (activity.startedAt && activity.endedAt) {
      const duration = Math.floor((activity.endedAt.getTime() - activity.startedAt.getTime()) / 1000);
      activity.durationSeconds = duration;

      if (duration < 30) {
        await anonymousUserActivityRepository.remove(activity);
        
        res.status(200).json({
          success: true,
          message: 'Anonymous activity removed due to insufficient duration (< 30 seconds)',
          data: null
        });
        return;
      }
    }

    await anonymousUserActivityRepository.save(activity);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Failed to update game session:', error);
    next(error);
  }
};

/**
 * @swagger
 * /anonymous/link-to-user:
 *   post:
 *     summary: Link anonymous user sessions to registered user
 *     tags: [AnonymousActivity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *             properties:
 *               sessionId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sessions linked successfully
 *       400:
 *         description: Missing required fields
 */
export const linkToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
      return next(ApiError.badRequest('SessionId and userId are required'));
    }

    // Update all anonymous activities for this session
    const updateResult = await anonymousUserActivityRepository.update(
      { sessionId, convertedUserId: IsNull() },
      {
        convertedUserId: userId,
        convertedAt: new Date(),
        userState: 'registered_not_logged_in'
      }
    );

    // Also update SignupAnalytics if exists
    await signupAnalyticsRepository.update(
      { sessionId, userId: IsNull() },
      { 
        userId,
        convertedToAccount: true
      }
    );

    res.status(200).json({
      success: true,
      data: {
        linkedRecords: updateResult.affected,
        sessionId,
        userId
      }
    });
  } catch (error) {
    console.error('Failed to link sessions to user:', error);
    next(error);
  }
};

/**
 * @swagger
 * /anonymous/mark-verified:
 *   post:
 *     summary: Mark user as verified (completed first login)
 *     tags: [AnonymousActivity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User marked as verified successfully
 *       400:
 *         description: Missing userId
 */
export const markAsVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return next(ApiError.badRequest('UserId is required'));
    }

    // Update all anonymous activities for this user
    const updateResult = await anonymousUserActivityRepository.update(
      { convertedUserId: userId },
      {
        isVerified: true,
        verifiedAt: new Date(),
        userState: 'logged_in'
      }
    );

    // Also update SignupAnalytics
    await signupAnalyticsRepository.update(
      { userId },
      { userVerified: true }
    );

    res.status(200).json({
      success: true,
      data: {
        updatedRecords: updateResult.affected,
        userId
      }
    });
  } catch (error) {
    console.error('Failed to mark user as verified:', error);
    next(error);
  }
};
