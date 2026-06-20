import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getLeadSources,
  getAllLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  getLeadSourceAnalytics,
} from '../controllers/leadSourcesController.js';

const router = Router();

router.use(authenticate);
router.get('/', getLeadSources);
router.get('/analytics', getLeadSourceAnalytics);
router.get('/all', requireAdmin, getAllLeadSources);
router.post('/', requireAdmin, createLeadSource);
router.put('/:id', requireAdmin, updateLeadSource);
router.delete('/:id', requireAdmin, deleteLeadSource);

export default router;
