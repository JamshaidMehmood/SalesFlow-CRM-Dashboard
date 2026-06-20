import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getQuotas,
  getQuotaProgress,
  upsertQuota,
  deleteQuota,
} from '../controllers/quotasController.js';

const router = Router();

router.use(authenticate);

router.get('/progress', getQuotaProgress);
router.get('/', requireAdmin, getQuotas);
router.post('/', requireAdmin, upsertQuota);
router.put('/', requireAdmin, upsertQuota);
router.delete('/:id', requireAdmin, deleteQuota);

export default router;
