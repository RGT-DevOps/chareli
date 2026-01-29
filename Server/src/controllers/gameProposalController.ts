import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { GameProposal, GameProposalStatus, GameProposalType } from '../entities/GameProposal';
import { Game, GameStatus, GameProcessingStatus } from '../entities/Games';
import { File } from '../entities/Files';
import { User } from '../entities/User';
import { ApiError } from '../middlewares/errorHandler';
import { queueService } from '../services/queue.service';
import { storageService } from '../services/storage.service';
import { moveFileToPermanentStorage } from '../utils/fileUtils';
import { generateUniqueSlug } from '../utils/slugify';
import { DeepPartial } from 'typeorm';
import logger from '../utils/logger';

const proposalRepository = AppDataSource.getRepository(GameProposal);
const gameRepository = AppDataSource.getRepository(Game);
const fileRepository = AppDataSource.getRepository(File);

/**
 * Get all proposals (Admin/Superadmin)
 */
export const getProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const proposals = await proposalRepository.find({
      where,
      relations: ['editor', 'game', 'reviewer'],
      order: { createdAt: 'DESC' }
    });

    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my proposals (Editor)
 */
export const getMyProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const proposals = await proposalRepository.find({
      where: { editorId: userId },
      relations: ['game'],
      order: { createdAt: 'DESC' }
    });

    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a proposal
 */
export const approveProposal = async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = req.params;
    const proposal = await proposalRepository.findOne({
      where: { id },
      relations: ['game']
    });

    if (!proposal) {
      return next(ApiError.notFound('Proposal not found'));
    }

    if (proposal.status !== GameProposalStatus.PENDING) {
      return next(ApiError.badRequest('Proposal is not pending'));
    }

    const proposedData = proposal.proposedData || {};
    let game: Game;

    if (proposal.type === GameProposalType.CREATE) {
      // Create new game
      const slug = await generateUniqueSlug(proposedData.title);
      // Explicitly cast to simple object to avoid array type inference ambiguity
      const gameData = {
        ...proposedData,
        slug,
        createdById: proposal.editorId,
        status: proposedData.status || GameStatus.ACTIVE,
      } as unknown as DeepPartial<Game>;

      game = gameRepository.create(gameData);
      await queryRunner.manager.save(game);

      // If we have a game ID now, we update the proposal linked game
      proposal.gameId = game.id;
    } else {
      // Update existing game
      const existingGame = await queryRunner.manager.findOne(Game, { where: { id: proposal.gameId } });
      if (!existingGame) {
        throw new ApiError(404, 'Target game not found');
      }
      game = existingGame;

      // Merge data
      Object.assign(game, proposedData);
      await queryRunner.manager.save(game);
    }

    // Handle File Processing (Late Binding)
    // If proposedData contained file keys (which were saved to permanent storage during proposal creation),
    // we might need to Trigger Processing Jobs now.

    if (proposedData.gameFileKey) {
        // Update game processing status
        game.processingStatus = GameProcessingStatus.PENDING;
        game.status = GameStatus.DISABLED; // Disable while processing
        await queryRunner.manager.save(game);

        await queueService.addGameZipProcessingJob({
          gameId: game.id,
          gameFileKey: proposedData.gameFileKey,
          userId: proposal.editorId
        });
    }

    // Update Proposal Status
    proposal.status = GameProposalStatus.APPROVED;
    proposal.reviewedBy = req.user?.userId || null;
    proposal.adminFeedback = req.body.adminFeedback; // Optional comment

    await queryRunner.manager.save(proposal);
    await queryRunner.commitTransaction();

    res.status(200).json({ success: true, message: 'Proposal approved', gameId: game.id });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

/**
 * Decline a proposal
 */
export const declineProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback) {
      return next(ApiError.badRequest('Feedback is required for declining'));
    }

    const proposal = await proposalRepository.findOne({ where: { id } });

    if (!proposal) {
      return next(ApiError.notFound('Proposal not found'));
    }

    if (proposal.status !== GameProposalStatus.PENDING) {
      return next(ApiError.badRequest('Proposal is not pending'));
    }

    proposal.status = GameProposalStatus.DECLINED;
    proposal.reviewedBy = req.user?.userId || null;
    proposal.adminFeedback = feedback;

    await proposalRepository.save(proposal);

    res.status(200).json({ success: true, message: 'Proposal declined' });
  } catch (error) {
    next(error);
  }
};
