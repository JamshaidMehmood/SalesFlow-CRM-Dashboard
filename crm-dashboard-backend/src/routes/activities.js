import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getActivities,
  createActivity,
  deleteActivity,
} from '../controllers/activitiesController.js';

const router = Router();

router.use(authenticate);

router.get('/', getActivities);
router.post('/', createActivity);
router.delete('/:id', deleteActivity);

export default router;
