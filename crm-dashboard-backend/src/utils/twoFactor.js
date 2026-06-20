import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { encrypt, decrypt } from './encryption.js';

export function generateTwoFactorSecret() {
  return generateSecret();
}

export function getOtpAuthUrl(email, secret) {
  return generateURI({
    issuer: 'SalesFlow CRM',
    label: email,
    secret,
  });
}

export async function generateQrCodeDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotp(secret, token) {
  const result = verifySync({
    secret,
    token,
    epochTolerance: 30,
  });
  return result.valid;
}

export function encryptSecret(secret) {
  return encrypt(secret);
}

export function decryptSecret(encrypted) {
  return decrypt(encrypted);
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

export function encryptRecoveryCodes(codes) {
  return encrypt(JSON.stringify(codes));
}

export function decryptRecoveryCodes(encrypted) {
  const raw = decrypt(encrypted);
  return raw ? JSON.parse(raw) : [];
}

export function verifyRecoveryCode(storedEncrypted, code) {
  const codes = decryptRecoveryCodes(storedEncrypted);
  const normalized = code.trim().toUpperCase();
  const index = codes.indexOf(normalized);
  if (index === -1) return { valid: false, remaining: codes };

  const remaining = codes.filter((_, i) => i !== index);
  return { valid: true, remaining };
}
