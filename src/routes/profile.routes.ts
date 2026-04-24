import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { completeOnboardingController, getMyProfileController } from '../controllers/profile.controller';

const router = Router();

router.post('/complete-onboarding', authMiddleware, completeOnboardingController);

router.get('/', authMiddleware, getMyProfileController);

export default router;