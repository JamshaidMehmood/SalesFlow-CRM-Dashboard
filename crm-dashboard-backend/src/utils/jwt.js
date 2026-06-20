import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signTempToken(userId) {
  return jwt.sign({ id: userId, purpose: '2fa' }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyTempToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== '2fa') {
    throw new Error('Invalid temp token');
  }
  return decoded;
}
