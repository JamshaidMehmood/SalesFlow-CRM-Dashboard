import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getTerritories,
  createTerritory,
  updateTerritory,
  deleteTerritory,
} from '../controllers/territoriesController.js';

const router = Router();

router.get('/', authenticate, getTerritories);
router.post('/', authenticate, requireAdmin, createTerritory);
router.put('/:id', authenticate, requireAdmin, updateTerritory);
router.delete('/:id', authenticate, requireAdmin, deleteTerritory);

export default router;
