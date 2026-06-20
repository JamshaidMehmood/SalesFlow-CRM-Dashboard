import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  reorderPipelineStages,
  deletePipelineStage,
} from '../controllers/pipelineStagesController.js';

const router = Router();

router.get('/', authenticate, getPipelineStages);

router.post('/', authenticate, requireAdmin, createPipelineStage);
router.put('/reorder', authenticate, requireAdmin, reorderPipelineStages);
router.put('/:id', authenticate, requireAdmin, updatePipelineStage);
router.delete('/:id', authenticate, requireAdmin, deletePipelineStage);

export default router;
