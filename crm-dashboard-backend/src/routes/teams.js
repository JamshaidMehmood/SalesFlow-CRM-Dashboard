import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getReps,
} from '../controllers/teamsController.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/', getTeams);
router.get('/reps', getReps);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:userId', removeTeamMember);

export default router;
