import { Router } from 'express';
import {
  getProposals,
  getMyProposals,
  approveProposal,
  declineProposal
} from '../controllers/gameProposalController';
import {
  authenticate,
  isAdmin,
  isEditor
} from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Admin Routes
router.get('/', isAdmin, getProposals);
router.post('/:id/approve', isAdmin, approveProposal);
router.post('/:id/decline', isAdmin, declineProposal);

// Editor Routes
router.get('/my', isEditor, getMyProposals);

export default router;
