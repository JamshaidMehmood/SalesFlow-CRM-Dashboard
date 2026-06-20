import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  getAttachments,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/attachmentsController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);
router.get('/', getAttachments);
router.post('/', upload.single('file'), uploadAttachment);
router.get('/:id/download', downloadAttachment);
router.delete('/:id', deleteAttachment);

export default router;
