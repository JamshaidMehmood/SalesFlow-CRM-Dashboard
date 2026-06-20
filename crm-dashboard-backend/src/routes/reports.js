import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getReports } from '../controllers/reportsController.js';

const router = Router();

router.use(authenticate);
router.get('/', getReports);

export default router;
