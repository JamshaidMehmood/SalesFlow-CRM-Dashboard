import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getForecast } from '../controllers/forecastController.js';

const router = Router();

router.use(authenticate);
router.get('/', getForecast);

export default router;
