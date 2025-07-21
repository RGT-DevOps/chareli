import { Router } from 'express';
import {
  trackGameSession,
  updateGameSession,
  linkToUser,
  markAsVerified
} from '../controllers/anonymousActivityController';
import {
  getUniqueAnonymousUsers,
  getAnonymousGameSessions,
  getConversionFunnel,
  getTopConvertingGames,
  getDeviceCountryBreakdown,
  getUserJourney
} from '../controllers/anonymousAnalyticsController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.post('/track-game-session', trackGameSession);
router.put('/update-game-session/:id', updateGameSession);
router.post('/link-to-user', linkToUser);
router.post('/mark-verified', markAsVerified);


router.get('/analytics/unique-users', authenticate, isAdmin, getUniqueAnonymousUsers);
router.get('/analytics/game-sessions', authenticate, isAdmin, getAnonymousGameSessions);
router.get('/analytics/conversion-funnel', authenticate, isAdmin, getConversionFunnel);
router.get('/analytics/top-games', authenticate, isAdmin, getTopConvertingGames);
router.get('/analytics/demographics', authenticate, isAdmin, getDeviceCountryBreakdown);
router.get('/analytics/user-journey/:sessionId', authenticate, isAdmin, getUserJourney);

export default router;
