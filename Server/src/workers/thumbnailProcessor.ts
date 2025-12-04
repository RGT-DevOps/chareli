import { Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { Game } from '../entities/Games';
import { File } from '../entities/Files';
import {
  queueService,
  JobType,
  ThumbnailProcessingJobData,
} from '../services/queue.service';
import { storageService } from '../services/storage.service';
import { moveFileToPermanentStorage } from '../utils/fileUtils';
import logger from '../utils/logger';

const gameRepository = AppDataSource.getRepository(Game);
const fileRepository = AppDataSource.getRepository(File);

async function processThumbnail(
  job: Job<ThumbnailProcessingJobData>
): Promise<void> {
  const { gameId, tempKey, permanentFolder } = job.data;

  try {
    logger.info(`[THUMBNAIL WORKER] Processing thumbnail for game ${gameId}`);
    await job.updateProgress(10);

    // Move thumbnail to permanent storage
    logger.info(
      `[THUMBNAIL WORKER] Moving thumbnail from ${tempKey} to permanent storage`
    );
    const permanentThumbnailKey = await moveFileToPermanentStorage(
      tempKey,
      permanentFolder
    );
    await job.updateProgress(50);

    // Create thumbnail file record in the database
    logger.info(
      `[THUMBNAIL WORKER] Creating thumbnail file record in database`
    );
    const thumbnailFileRecord = fileRepository.create({
      s3Key: permanentThumbnailKey,
      type: 'thumbnail',
    });

    await fileRepository.save(thumbnailFileRecord);
    await job.updateProgress(80);

    // Update game with thumbnail file ID
    logger.info(
      `[THUMBNAIL WORKER] Updating game ${gameId} with thumbnail file ID`
    );
    const game = await gameRepository.findOne({ where: { id: gameId } });

    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    game.thumbnailFileId = thumbnailFileRecord.id;
    await gameRepository.save(game);
    await job.updateProgress(90);

    // Clean up temporary thumbnail file
    logger.info(`[THUMBNAIL WORKER] Cleaning up temporary thumbnail file`);
    try {
      await storageService.deleteFile(tempKey);
    } catch (cleanupError) {
      logger.warn(
        `[THUMBNAIL WORKER] Failed to clean up temporary thumbnail file:`,
        cleanupError
      );
    }

    await job.updateProgress(100);
    logger.info(
      `[THUMBNAIL WORKER] Successfully processed thumbnail for game ${gameId}`
    );
  } catch (error) {
    logger.error(
      `[THUMBNAIL WORKER] Error processing thumbnail for game ${gameId}:`,
      error
    );
    throw error;
  }
}

// Initialize the worker
export function initializeThumbnailWorker(): void {
  logger.info('Initializing thumbnail processing worker...');
  queueService.createWorker<ThumbnailProcessingJobData>(
    JobType.THUMBNAIL_PROCESSING,
    processThumbnail
  );
  logger.info('Thumbnail processing worker initialized');
}
