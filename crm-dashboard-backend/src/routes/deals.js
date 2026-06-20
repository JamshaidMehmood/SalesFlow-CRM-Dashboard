import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
} from '../controllers/dealsController.js';

const router = Router();

router.use(authenticate);

router.get('/', getDeals);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
