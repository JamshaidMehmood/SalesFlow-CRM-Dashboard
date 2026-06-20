import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function saveUploadedFile(buffer, originalName) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `${Date.now()}-${safeName}`;
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  await fs.writeFile(fullPath, buffer);
  return { storageKey, fullPath };
}

export async function deleteStoredFile(storageKey) {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, storageKey));
  } catch {
    // ignore missing files
  }
}

export function getStoredFilePath(storageKey) {
  return path.join(UPLOAD_DIR, storageKey);
}
