import crypto from 'crypto';
import { logger } from './logger';

/**
 * Encryption utilities for API keys and sensitive data
 * Uses AES-256-GCM encryption
 */

interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT SECURE for production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    logger.warn('ENCRYPTION_KEY not set - using default key (NOT SECURE for production)');
    // Default key for development only - MUST be changed in production
    return crypto.scryptSync('default-dev-key-change-in-production', 'salt', 32);
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // If provided as hex string, decode it; otherwise use scrypt to derive key
  if (key.length === 64) {
    // Assume hex-encoded 32-byte key
    return Buffer.from(key, 'hex');
  }

  // Derive key using scrypt
  return crypto.scryptSync(key, 'galaxyco-salt', 32);
}

/**
 * Encrypt API key or sensitive data
 * Returns encrypted data with IV and auth tag for secure storage
 */
export function encryptApiKey(plaintext: string): EncryptedData {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  } catch (error) {
    logger.error('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt API key or sensitive data
 * Takes encrypted data in format: "iv:authTag:encryptedKey" or separate parts
 */
export function decryptApiKey(encryptedData: string | EncryptedData): string {
  try {
    let iv: string;
    let authTag: string;
    let encryptedKey: string;

    // Handle both formats: string "iv:authTag:encryptedKey" or object
    if (typeof encryptedData === 'string') {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format. Expected "iv:authTag:encryptedKey"');
      }
      [iv, authTag, encryptedKey] = parts;
    } else {
      iv = encryptedData.iv;
      authTag = encryptedData.authTag;
      encryptedKey = encryptedData.encryptedKey;
    }

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', error);
    throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
  }
}

/**
 * Validate encryption key is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY || process.env.NODE_ENV === 'development';
}
