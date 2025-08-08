import redis from '../config/redisClient';
import logger from '../utils/logger';

export class CacheService {
  private static instance: CacheService;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.debug(`[Redis] Cache HIT for key: ${key}`);
        return JSON.parse(cached);
      }
      logger.debug(`[Redis] Cache MISS for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`[Redis] Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with expiration
   */
  async set(key: string, data: any, expirationSeconds: number = 600): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', expirationSeconds);
      logger.debug(`[Redis] Cache SET for key: ${key} (expires in ${expirationSeconds}s)`);
    } catch (error) {
      logger.error(`[Redis] Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete specific cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.debug(`[Redis] Cache DELETE for key: ${key}`);
    } catch (error) {
      logger.error(`[Redis] Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.debug(`[Redis] Cache DELETE by pattern: ${pattern} (${keys.length} keys deleted)`);
      }
    } catch (error) {
      logger.error(`[Redis] Error deleting cache by pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalidate all games-related cache
   */
  async invalidateGamesCache(): Promise<void> {
    try {
      await Promise.all([
        this.deleteByPattern('games:*'),
        this.deleteByPattern('categories:*'), // Categories include games data
        this.deleteByPattern('users:stats:*'), // User stats depend on games
      ]);
      logger.info('[Redis] Invalidated all games-related cache');
    } catch (error) {
      logger.error('[Redis] Error invalidating games cache:', error);
    }
  }

  /**
   * Invalidate specific game cache
   */
  async invalidateGameCache(gameId: string): Promise<void> {
    try {
      await Promise.all([
        this.delete(`games:id:${gameId}`),
        this.deleteByPattern('games:all:*'),
        this.deleteByPattern('categories:*'), // Categories include games data
        this.deleteByPattern('users:stats:*'), // User stats might be affected
      ]);
      logger.info(`[Redis] Invalidated cache for game: ${gameId}`);
    } catch (error) {
      logger.error(`[Redis] Error invalidating cache for game ${gameId}:`, error);
    }
  }

  /**
   * Invalidate all categories-related cache
   */
  async invalidateCategoriesCache(): Promise<void> {
    try {
      await Promise.all([
        this.deleteByPattern('categories:*'),
        this.deleteByPattern('games:all:*'), // Games queries might filter by category
      ]);
      logger.info('[Redis] Invalidated all categories-related cache');
    } catch (error) {
      logger.error('[Redis] Error invalidating categories cache:', error);
    }
  }

  /**
   * Invalidate specific category cache
   */
  async invalidateCategoryCache(categoryId: string): Promise<void> {
    try {
      await Promise.all([
        this.deleteByPattern(`categories:id:${categoryId}:*`),
        this.deleteByPattern('categories:all:*'),
        this.deleteByPattern('games:all:*'), // Games queries might filter by category
      ]);
      logger.info(`[Redis] Invalidated cache for category: ${categoryId}`);
    } catch (error) {
      logger.error(`[Redis] Error invalidating cache for category ${categoryId}:`, error);
    }
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.delete(`users:stats:${userId}`),
        this.deleteByPattern('users:all:*'),
      ]);
      logger.info(`[Redis] Invalidated cache for user: ${userId}`);
    } catch (error) {
      logger.error(`[Redis] Error invalidating cache for user ${userId}:`, error);
    }
  }

  /**
   * Invalidate all users cache
   */
  async invalidateAllUsersCache(): Promise<void> {
    try {
      await this.deleteByPattern('users:*');
      logger.info('[Redis] Invalidated all users cache');
    } catch (error) {
      logger.error('[Redis] Error invalidating all users cache:', error);
    }
  }

  /**
   * Invalidate analytics-related cache
   */
  async invalidateAnalyticsCache(): Promise<void> {
    try {
      await Promise.all([
        this.deleteByPattern('users:stats:*'),
        this.deleteByPattern('categories:*'), // Categories include analytics data
        this.deleteByPattern('games:*'), // Some game queries might include analytics
      ]);
      logger.info('[Redis] Invalidated analytics-related cache');
    } catch (error) {
      logger.error('[Redis] Error invalidating analytics cache:', error);
    }
  }

  /**
   * Invalidate system config cache
   */
  async invalidateSystemConfigCache(): Promise<void> {
    try {
      await this.deleteByPattern('system-configs:*');
      logger.info('[Redis] Invalidated system config cache');
    } catch (error) {
      logger.error('[Redis] Error invalidating system config cache:', error);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      await redis.flushdb();
      logger.warn('[Redis] Cleared ALL cache data');
    } catch (error) {
      logger.error('[Redis] Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
    try {
      const keys = await redis.keys('*');
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';
      
      return {
        totalKeys: keys.length,
        memoryUsage
      };
    } catch (error) {
      logger.error('[Redis] Error getting cache stats:', error);
      return { totalKeys: 0, memoryUsage: 'Error' };
    }
  }
}

export const cacheService = CacheService.getInstance();
