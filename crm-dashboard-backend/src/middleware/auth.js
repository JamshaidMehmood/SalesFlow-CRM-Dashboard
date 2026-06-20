import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';
import { loadDataScope } from '../utils/access.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const decoded = verifyToken(token);

    if (decoded.purpose === '2fa') {
      return res.status(401).json({ error: 'Complete two-factor authentication' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        teamId: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Session expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
      });
    }

    req.user = user;
    req.dataScope = await loadDataScope(user);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
