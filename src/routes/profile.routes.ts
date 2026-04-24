import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { completeOnboardingController, getMyProfileController, updateProfileController } from '../controllers/profile.controller';

const router = Router();

router.post('/complete-onboarding', authMiddleware, completeOnboardingController);

router.post('/', authMiddleware, updateProfileController);

router.get('/', authMiddleware, getMyProfileController);

export default router;