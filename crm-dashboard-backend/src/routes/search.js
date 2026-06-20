import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();

router.use(authenticate);
router.get('/', globalSearch);

export default router;
