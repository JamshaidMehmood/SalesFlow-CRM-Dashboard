import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getTags, createTag, deleteTag } from '../controllers/tagsController.js';

const router = Router();

router.use(authenticate);
router.get('/', getTags);
router.post('/', createTag);
router.delete('/:id', requireAdmin, deleteTag);

export default router;
