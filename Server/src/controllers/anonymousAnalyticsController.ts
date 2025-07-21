import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AnonymousUserActivity } from '../entities/AnonymousUserActivity';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { ApiError } from '../middlewares/errorHandler';

const anonymousUserActivityRepository = AppDataSource.getRepository(AnonymousUserActivity);
const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);

/**
 * @swagger
 * /analytics/anonymous/unique-users:
 *   get:
 *     summary: Get count of unique anonymous users (never registered)
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unique anonymous users count
 */
export const getUniqueAnonymousUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, country, deviceType } = req.query;

    let query = anonymousUserActivityRepository
      .createQueryBuilder('aua')
      .select('COUNT(DISTINCT aua.sessionId)', 'uniqueUsers')
      .where('aua.userState = :userState', { userState: 'anonymous' });

    // Add filters
    if (startDate && endDate) {
      query = query.andWhere('aua.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    if (country) {
      query = query.andWhere('aua.country = :country', { country });
    }

    if (deviceType) {
      query = query.andWhere('aua.deviceType = :deviceType', { deviceType });
    }

    const result = await query.getRawOne();

    res.status(200).json({
      success: true,
      data: {
        uniqueAnonymousUsers: parseInt(result.uniqueUsers) || 0,
        filters: { startDate, endDate, country, deviceType }
      }
    });
  } catch (error) {
    console.error('Failed to get unique anonymous users:', error);
    next(error);
  }
};

/**
 * @swagger
 * /analytics/anonymous/game-sessions:
 *   get:
 *     summary: Get total game sessions by unregistered users
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game sessions count
 */
export const getAnonymousGameSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, country, deviceType } = req.query;

    let query = anonymousUserActivityRepository
      .createQueryBuilder('aua')
      .select([
        'COUNT(*) as totalSessions',
        'COUNT(CASE WHEN aua.reachedTimeLimit = true THEN 1 END) as sessionsWithPopup',
        'AVG(aua.durationSeconds) as avgDuration',
        'COUNT(DISTINCT aua.sessionId) as uniqueUsers'
      ])
      .where('aua.convertedUserId IS NULL');

    // Add filters
    if (startDate && endDate) {
      query = query.andWhere('aua.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    if (country) {
      query = query.andWhere('aua.country = :country', { country });
    }

    if (deviceType) {
      query = query.andWhere('aua.deviceType = :deviceType', { deviceType });
    }

    const result = await query.getRawOne();

    res.status(200).json({
      success: true,
      data: {
        totalGameSessions: parseInt(result.totalSessions) || 0,
        sessionsWithPopup: parseInt(result.sessionsWithPopup) || 0,
        avgDurationSeconds: parseFloat(result.avgDuration) || 0,
        uniqueUnregisteredUsers: parseInt(result.uniqueUsers) || 0,
        filters: { startDate, endDate, country, deviceType }
      }
    });
  } catch (error) {
    console.error('Failed to get anonymous game sessions:', error);
    next(error);
  }
};

/**
 * @swagger
 * /analytics/anonymous/conversion-funnel:
 *   get:
 *     summary: Get complete conversion funnel metrics
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversion funnel data
 */
export const getConversionFunnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, country, deviceType } = req.query;

    // Build base query conditions
    let whereConditions = '';
    const parameters: any = {};

    if (startDate && endDate) {
      whereConditions += ' AND aua.createdAt BETWEEN :startDate AND :endDate';
      parameters.startDate = new Date(startDate as string);
      parameters.endDate = new Date(endDate as string);
    }

    if (country) {
      whereConditions += ' AND aua.country = :country';
      parameters.country = country;
    }

    if (deviceType) {
      whereConditions += ' AND aua.deviceType = :deviceType';
      parameters.deviceType = deviceType;
    }

    // Get funnel metrics
    const funnelQuery = `
      SELECT 
        COUNT(DISTINCT aua.sessionId) as uniqueVisitors,
        COUNT(CASE WHEN aua.reachedTimeLimit = true THEN 1 END) as popupsShown,
        COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END) as registrations,
        COUNT(CASE WHEN aua.isVerified = true THEN 1 END) as verifiedUsers,
        
        -- Conversion rates
        ROUND(
          COUNT(CASE WHEN aua.reachedTimeLimit = true THEN 1 END) * 100.0 / 
          COUNT(DISTINCT aua.sessionId), 2
        ) as popupRate,
        
        ROUND(
          COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN aua.reachedTimeLimit = true THEN 1 END), 0), 2
        ) as signupRate,
        
        ROUND(
          COUNT(CASE WHEN aua.isVerified = true THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END), 0), 2
        ) as verificationRate,
        
        ROUND(
          COUNT(CASE WHEN aua.isVerified = true THEN 1 END) * 100.0 / 
          COUNT(DISTINCT aua.sessionId), 2
        ) as overallConversionRate
        
      FROM anonymous_user_activity aua
      WHERE 1=1 ${whereConditions}
    `;

    const funnelResult = await anonymousUserActivityRepository.query(funnelQuery, parameters);

    // Get signup clicks from SignupAnalytics
    let signupQuery = signupAnalyticsRepository
      .createQueryBuilder('sa')
      .select([
        'COUNT(*) as totalSignupClicks',
        'COUNT(CASE WHEN sa.type = :keepPlaying THEN 1 END) as gamePopupClicks',
        'COUNT(CASE WHEN sa.convertedToAccount = true THEN 1 END) as convertedClicks'
      ])
      .setParameter('keepPlaying', 'keep-playing');

    if (startDate && endDate) {
      signupQuery = signupQuery.andWhere('sa.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    if (country) {
      signupQuery = signupQuery.andWhere('sa.country = :country', { country });
    }

    if (deviceType) {
      signupQuery = signupQuery.andWhere('sa.deviceType = :deviceType', { deviceType });
    }

    const signupResult = await signupQuery.getRawOne();

    const funnel = funnelResult[0];

    res.status(200).json({
      success: true,
      data: {
        funnel: {
          uniqueVisitors: parseInt(funnel.uniquevisitors) || 0,
          popupsShown: parseInt(funnel.popupsshown) || 0,
          signupClicks: parseInt(signupResult.totalSignupClicks) || 0,
          gamePopupClicks: parseInt(signupResult.gamePopupClicks) || 0,
          registrations: parseInt(funnel.registrations) || 0,
          verifiedUsers: parseInt(funnel.verifiedusers) || 0
        },
        conversionRates: {
          popupRate: parseFloat(funnel.popuprate) || 0,
          signupRate: parseFloat(funnel.signuprate) || 0,
          verificationRate: parseFloat(funnel.verificationrate) || 0,
          overallConversionRate: parseFloat(funnel.overallconversionrate) || 0
        },
        filters: { startDate, endDate, country, deviceType }
      }
    });
  } catch (error) {
    console.error('Failed to get conversion funnel:', error);
    next(error);
  }
};

/**
 * @swagger
 * /analytics/anonymous/top-games:
 *   get:
 *     summary: Get games ranked by conversion effectiveness
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Top converting games
 */
export const getTopConvertingGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10, startDate, endDate, country, deviceType } = req.query;

    let query = anonymousUserActivityRepository
      .createQueryBuilder('aua')
      .leftJoinAndSelect('aua.game', 'game')
      .select([
        'game.id as gameId',
        'game.title as gameTitle',
        'game.config as freeTimeMinutes',
        'COUNT(DISTINCT aua.sessionId) as uniquePlayers',
        'COUNT(*) as totalSessions',
        'COUNT(CASE WHEN aua.reachedTimeLimit = true THEN 1 END) as popupsShown',
        'COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END) as registrations',
        'COUNT(CASE WHEN aua.isVerified = true THEN 1 END) as verifiedUsers',
        'AVG(aua.durationSeconds) as avgPlayTime',
        'ROUND(COUNT(CASE WHEN aua.isVerified = true THEN 1 END) * 100.0 / COUNT(DISTINCT aua.sessionId), 2) as conversionRate'
      ])
      .groupBy('game.id, game.title, game.config')
      .orderBy('verifiedUsers', 'DESC')
      .limit(parseInt(limit as string));

    // Add filters
    if (startDate && endDate) {
      query = query.andWhere('aua.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    if (country) {
      query = query.andWhere('aua.country = :country', { country });
    }

    if (deviceType) {
      query = query.andWhere('aua.deviceType = :deviceType', { deviceType });
    }

    const results = await query.getRawMany();

    res.status(200).json({
      success: true,
      data: {
        games: results.map(game => ({
          gameId: game.gameid,
          gameTitle: game.gametitle,
          freeTimeMinutes: game.freetimeminutes,
          uniquePlayers: parseInt(game.uniqueplayers) || 0,
          totalSessions: parseInt(game.totalsessions) || 0,
          popupsShown: parseInt(game.popupsshown) || 0,
          registrations: parseInt(game.registrations) || 0,
          verifiedUsers: parseInt(game.verifiedusers) || 0,
          avgPlayTimeSeconds: parseFloat(game.avgplaytime) || 0,
          conversionRate: parseFloat(game.conversionrate) || 0
        })),
        filters: { limit, startDate, endDate, country, deviceType }
      }
    });
  } catch (error) {
    console.error('Failed to get top converting games:', error);
    next(error);
  }
};

/**
 * @swagger
 * /analytics/anonymous/demographics:
 *   get:
 *     summary: Get device and country breakdown
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Demographics breakdown
 */
export const getDeviceCountryBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let baseQuery = anonymousUserActivityRepository.createQueryBuilder('aua');

    if (startDate && endDate) {
      baseQuery = baseQuery.where('aua.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    // Device breakdown
    const deviceQuery = baseQuery
      .clone()
      .select([
        'aua.deviceType as deviceType',
        'COUNT(DISTINCT aua.sessionId) as uniqueUsers',
        'COUNT(*) as totalSessions',
        'COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END) as registrations'
      ])
      .where('aua.deviceType IS NOT NULL')
      .groupBy('aua.deviceType')
      .orderBy('uniqueUsers', 'DESC');

    // Country breakdown
    const countryQuery = baseQuery
      .clone()
      .select([
        'aua.country as country',
        'COUNT(DISTINCT aua.sessionId) as uniqueUsers',
        'COUNT(*) as totalSessions',
        'COUNT(CASE WHEN aua.convertedUserId IS NOT NULL THEN 1 END) as registrations'
      ])
      .where('aua.country IS NOT NULL')
      .groupBy('aua.country')
      .orderBy('uniqueUsers', 'DESC')
      .limit(10);

    const [deviceResults, countryResults] = await Promise.all([
      deviceQuery.getRawMany(),
      countryQuery.getRawMany()
    ]);

    // Calculate percentages for devices
    const totalDeviceUsers = deviceResults.reduce((sum, device) => sum + parseInt(device.uniqueusers), 0);
    const deviceBreakdown = deviceResults.map(device => ({
      deviceType: device.devicetype,
      uniqueUsers: parseInt(device.uniqueusers) || 0,
      totalSessions: parseInt(device.totalsessions) || 0,
      registrations: parseInt(device.registrations) || 0,
      percentage: totalDeviceUsers > 0 ? parseFloat(((parseInt(device.uniqueusers) / totalDeviceUsers) * 100).toFixed(2)) : 0
    }));

    const countryBreakdown = countryResults.map(country => ({
      country: country.country,
      uniqueUsers: parseInt(country.uniqueusers) || 0,
      totalSessions: parseInt(country.totalsessions) || 0,
      registrations: parseInt(country.registrations) || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        deviceBreakdown,
        countryBreakdown,
        filters: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Failed to get demographics breakdown:', error);
    next(error);
  }
};

/**
 * @swagger
 * /analytics/anonymous/user-journey/{sessionId}:
 *   get:
 *     summary: Get complete user journey for a specific session
 *     tags: [AnonymousAnalytics]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User journey data
 *       404:
 *         description: Session not found
 */
export const getUserJourney = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const journey = await anonymousUserActivityRepository.find({
      where: { sessionId },
      relations: ['game', 'convertedUser'],
      order: { startedAt: 'ASC' }
    });

    if (journey.length === 0) {
      return next(ApiError.notFound('Session not found'));
    }

    // Get signup analytics for this session
    const signupEvents = await signupAnalyticsRepository.find({
      where: { sessionId },
      relations: ['game'],
      order: { createdAt: 'ASC' }
    });

    const journeyStats = {
      sessionId,
      totalGamesPlayed: journey.length,
      uniqueGamesPlayed: new Set(journey.map(j => j.gameId)).size,
      totalPlayTime: journey.reduce((sum, j) => sum + (j.durationSeconds || 0), 0),
      gamesReachedTimeLimit: journey.filter(j => j.reachedTimeLimit).length,
      signupClicks: signupEvents.length,
      isConverted: journey[0]?.convertedUserId ? true : false,
      isVerified: journey[0]?.isVerified || false,
      firstVisit: journey[0]?.startedAt,
      lastActivity: journey[journey.length - 1]?.startedAt,
      deviceType: journey[0]?.deviceType,
      country: journey[0]?.country
    };

    const gameSequence = journey.map(j => ({
      gameId: j.gameId,
      gameTitle: j.game?.title,
      startedAt: j.startedAt,
      endedAt: j.endedAt,
      durationSeconds: j.durationSeconds,
      reachedTimeLimit: j.reachedTimeLimit,
      freeTimeLimitSeconds: j.freeTimeLimitSeconds
    }));

    res.status(200).json({
      success: true,
      data: {
        journeyStats,
        gameSequence,
        signupEvents: signupEvents.map(se => ({
          type: se.type,
          gameId: se.gameId,
          gameTitle: se.game?.title,
          createdAt: se.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Failed to get user journey:', error);
    next(error);
  }
};
