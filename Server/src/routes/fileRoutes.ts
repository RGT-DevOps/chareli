import { Router } from 'express';
import {
  getAllFiles,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
  uploadFile,
  uploadFileForUpdate
} from '../controllers/fileController';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import { setCloudFrontCookies } from '../middlewares/authMiddleware';
import {
  createFileSchema,
  updateFileSchema,
  fileIdParamSchema,
  fileQuerySchema
} from '../validation';

const router = Router();

// Apply API rate limiter to all file routes
router.use(apiLimiter);

// GET routes that need AWS access - use CloudFront middleware
router.get('/', setCloudFrontCookies, validateQuery(fileQuerySchema), getAllFiles);
router.get('/:id', setCloudFrontCookies, validateParams(fileIdParamSchema), getFileById);
router.post('/', uploadFile, createFile);
router.put('/:id', validateParams(fileIdParamSchema), uploadFileForUpdate, updateFile);
router.delete('/:id', validateParams(fileIdParamSchema), deleteFile);

export default router;
