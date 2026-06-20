import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotes, createNote, deleteNote } from '../controllers/notesController.js';

const router = Router();

router.use(authenticate);

router.get('/:contactId/notes', getNotes);
router.post('/:contactId/notes', createNote);
router.delete('/:contactId/notes/:id', deleteNote);

export default router;
