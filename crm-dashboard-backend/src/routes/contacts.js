import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactsController.js';
import {
  exportContacts,
  importContacts,
} from '../controllers/contactsImportExportController.js';
import {
  checkDuplicates,
  listDuplicateGroups,
  getMergePreview,
  mergeContacts,
} from '../controllers/duplicatesController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/export', exportContacts);
router.post('/import', upload.single('file'), importContacts);
router.post('/check-duplicates', checkDuplicates);
router.get('/duplicates', listDuplicateGroups);
router.get('/merge/preview', getMergePreview);
router.post('/merge', mergeContacts);

router.get('/', getContacts);
router.post('/', createContact);
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
