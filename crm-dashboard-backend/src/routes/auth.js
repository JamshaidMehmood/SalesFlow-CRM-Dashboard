import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  register,
  login,
  googleAuth,
  getAuthConfig,
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  inviteUser,
} from '../controllers/authController.js';
import {
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  verifyTwoFactorLogin,
  adminDisableTwoFactor,
} from '../controllers/twoFactorController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/config', getAuthConfig);
router.post('/2fa/verify', verifyTwoFactorLogin);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

router.get('/2fa/status', authenticate, getTwoFactorStatus);
router.post('/2fa/setup', authenticate, setupTwoFactor);
router.post('/2fa/verify-setup', authenticate, verifyTwoFactorSetup);
router.post('/2fa/disable', authenticate, disableTwoFactor);

router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users/invite', authenticate, requireAdmin, inviteUser);
router.post('/users/:userId/disable-2fa', authenticate, requireAdmin, adminDisableTwoFactor);

export default router;
