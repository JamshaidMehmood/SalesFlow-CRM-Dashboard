import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getOnboarding, dismissOnboarding } from '../controllers/onboardingController.js';

const router = Router();

router.use(authenticate);
router.get('/', getOnboarding);
router.post('/dismiss', dismissOnboarding);

export default router;
