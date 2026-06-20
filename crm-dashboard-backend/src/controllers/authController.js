import prisma from '../utils/prisma.js';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken, signTempToken } from '../utils/jwt.js';
import { isDbConnectionError, dbConnectionErrorResponse } from '../utils/dbErrors.js';
import { completeOnboardingStep, ONBOARDING_STEPS } from '../utils/onboarding.js';
import { getOnboardingStatus } from '../utils/onboarding.js';
import { isGoogleAuthConfigured, verifyGoogleIdToken } from '../utils/googleAuth.js';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  twoFactorEnabled: true,
  onboardingCompletedSteps: true,
  onboardingDismissed: true,
};

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'sales_rep',
      },
      select: profileSelect,
    });

    const token = signToken(user);
    const onboarding = await getOnboardingStatus(user);
    res.status(201).json({ user, token, onboarding });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        tempToken: signTempToken(user.id),
      });
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
      select: profileSelect,
    });
    const onboarding = await getOnboardingStatus(fullUser);

    const token = signToken(safeUser);
    res.json({ user: safeUser, token, onboarding });
  } catch (err) {
    console.error('Login error:', err);
    if (isDbConnectionError(err)) return dbConnectionErrorResponse(res);
    res.status(500).json({ error: 'Login failed' });
  }
}

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function issueAuthResponse(user, res, statusCode = 200) {
  const safeUser = toSafeUser(user);
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: profileSelect,
  });
  const onboarding = await getOnboardingStatus(fullUser);
  const token = signToken(safeUser);

  if (statusCode === 201) {
    return res.status(201).json({ user: safeUser, token, onboarding });
  }

  return res.json({ user: safeUser, token, onboarding });
}

export async function googleAuth(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({ error: 'Google sign-in is not configured on this server' });
    }

    const googleUser = await verifyGoogleIdToken(credential);

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    let isNewUser = false;

    if (user) {
      if (user.googleId && user.googleId !== googleUser.googleId) {
        return res.status(409).json({ error: 'Email is linked to a different Google account' });
      }

      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.googleId },
        });
      }

      if (googleUser.name && user.name !== googleUser.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: googleUser.name },
        });
      }
    } else {
      isNewUser = true;
      const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          passwordHash,
          role: 'sales_rep',
        },
      });
      await completeOnboardingStep(user.id, ONBOARDING_STEPS.PROFILE_SETUP);
    }

    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        tempToken: signTempToken(user.id),
      });
    }

    return issueAuthResponse(user, res, isNewUser ? 201 : 200);
  } catch (err) {
    console.error('Google auth error:', err);
    if (err.message?.includes('Invalid token') || err.message?.includes('Token used too late')) {
      return res.status(401).json({ error: 'Invalid or expired Google sign-in. Try again.' });
    }
    res.status(500).json({ error: 'Google sign-in failed' });
  }
}

export async function getAuthConfig(_req, res) {
  res.json({
    googleEnabled: isGoogleAuthConfigured(),
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  });
}

export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelect,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const onboarding = await getOnboardingStatus(user);
    res.json({ ...user, onboarding });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: profileSelect,
    });

    if (name || email) {
      await completeOnboardingStep(req.user.id, ONBOARDING_STEPS.PROFILE_SETUP);
    }

    const onboarding = await getOnboardingStatus(user);
    res.json({ ...user, onboarding });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await comparePassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export async function inviteUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'sales_rep',
      },
      select: profileSelect,
    });

    await completeOnboardingStep(req.user.id, ONBOARDING_STEPS.INVITE_TEAMMATE);

    res.status(201).json(user);
  } catch (err) {
    console.error('Invite user error:', err);
    res.status(500).json({ error: 'Failed to invite user' });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        teamId: true,
        team: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
