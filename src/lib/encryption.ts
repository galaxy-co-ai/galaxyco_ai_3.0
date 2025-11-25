import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required for API key encryption');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt API keys for secure storage in database
 * Used for workspace API keys (OpenAI, Anthropic, etc.)
 */
export function encryptApiKey(apiKey: string): {
  encryptedKey: string;
  iv: string;
  authTag: string;
} {
  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt API keys from database
 */
export function decryptApiKey(
  encryptedKey: string,
  iv: string,
  authTag: string
): string {
  const encryptionKey = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    encryptionKey,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a new encryption key (for setup)
 * Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}






