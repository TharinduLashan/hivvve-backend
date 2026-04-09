import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { completeOnboardingController } from '../controllers/profile.controller';

const router = Router();

router.post('/complete-onboarding', authMiddleware, completeOnboardingController);

export default router;