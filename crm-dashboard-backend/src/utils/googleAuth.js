import { OAuth2Client } from 'google-auth-library';

const clientId = process.env.GOOGLE_CLIENT_ID;

export function isGoogleAuthConfigured() {
  return Boolean(clientId);
}

export async function verifyGoogleIdToken(idToken) {
  if (!clientId) {
    throw new Error('Google auth is not configured');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }

  if (payload.email_verified === false) {
    throw new Error('Google account email is not verified');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
  };
}
