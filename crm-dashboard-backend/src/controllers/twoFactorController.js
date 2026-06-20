import prisma from '../utils/prisma.js';
import { comparePassword } from '../utils/password.js';
import { signToken, verifyTempToken } from '../utils/jwt.js';
import {
  generateTwoFactorSecret,
  getOtpAuthUrl,
  generateQrCodeDataUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptRecoveryCodes,
  verifyRecoveryCode,
} from '../utils/twoFactor.js';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  twoFactorEnabled: true,
};

export async function getTwoFactorStatus(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { twoFactorEnabled: true },
    });
    res.json({ enabled: user?.twoFactorEnabled ?? false });
  } catch (err) {
    console.error('2FA status error:', err);
    res.status(500).json({ error: 'Failed to fetch 2FA status' });
  }
}

export async function setupTwoFactor(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = generateTwoFactorSecret();
    const otpauthUrl = getOtpAuthUrl(user.email, secret);
    const qrCode = await generateQrCodeDataUrl(otpauthUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encryptSecret(secret) },
    });

    res.json({ qrCode, secret, otpauthUrl });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to start 2FA setup' });
  }
}

export async function verifyTwoFactorSetup(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Verification code is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'Start 2FA setup first' });
    }

    const secret = decryptSecret(user.twoFactorSecret);
    if (!verifyTotp(secret, code)) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const recoveryCodes = generateRecoveryCodes();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: encryptRecoveryCodes(recoveryCodes),
      },
    });

    res.json({ enabled: true, recoveryCodes });
  } catch (err) {
    console.error('2FA verify setup error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
}

export async function disableTwoFactor(req, res) {
  try {
    const { password, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    let verified = false;

    if (password && (await comparePassword(password, user.passwordHash))) {
      verified = true;
    } else if (code) {
      const secret = decryptSecret(user.twoFactorSecret);
      if (verifyTotp(secret, code)) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Password or authenticator code is incorrect' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    res.json({ enabled: false });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
}

export async function adminDisableTwoFactor(req, res) {
  try {
    const { userId } = req.params;

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    res.json({ message: '2FA disabled for user. They must re-enroll on next login.' });
  } catch (err) {
    console.error('Admin disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable user 2FA' });
  }
}

export async function verifyTwoFactorLogin(req, res) {
  try {
    const { tempToken, code, recoveryCode } = req.body;
    if (!tempToken) return res.status(400).json({ error: 'tempToken is required' });

    let decoded;
    try {
      decoded = verifyTempToken(tempToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired login session' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user?.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    let valid = false;

    if (recoveryCode) {
      const result = verifyRecoveryCode(user.twoFactorRecoveryCodes, recoveryCode);
      if (result.valid) {
        valid = true;
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: encryptRecoveryCodes(result.remaining) },
        });
      }
    } else if (code) {
      const secret = decryptSecret(user.twoFactorSecret);
      valid = verifyTotp(secret, code);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        onboardingCompletedSteps: true,
        onboardingDismissed: true,
      },
    });
    const { getOnboardingStatus } = await import('../utils/onboarding.js');
    const onboarding = await getOnboardingStatus(fullUser);

    res.json({ user: safeUser, token: signToken(safeUser), onboarding });
  } catch (err) {
    console.error('2FA login verify error:', err);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
}

export { safeUserSelect };
