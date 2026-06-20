import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getAuditLogs, getEntityAuditLogs } from '../controllers/auditController.js';

const router = Router();

router.use(authenticate);
router.get('/', requireAdmin, getAuditLogs);
router.get('/entity/:entityType/:entityId', getEntityAuditLogs);

export default router;
