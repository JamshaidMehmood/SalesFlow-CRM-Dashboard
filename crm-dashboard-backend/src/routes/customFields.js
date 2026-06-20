import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from '../controllers/customFieldsController.js';

const router = Router();

router.use(authenticate);
router.get('/', getCustomFields);
router.post('/', requireAdmin, createCustomField);
router.put('/reorder', requireAdmin, reorderCustomFields);
router.put('/:id', requireAdmin, updateCustomField);
router.delete('/:id', requireAdmin, deleteCustomField);

export default router;
