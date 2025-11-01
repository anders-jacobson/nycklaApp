/**
 * Encryption utility for sensitive borrower PII
 * Uses AES-256 encryption for secure data storage
 */

import CryptoJS from 'crypto-js';

/**
 * Get encryption key from environment variables
 * Generate with: openssl rand -base64 32
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate with: openssl rand -base64 32'
    );
  }
  
  return key;
}

/**
 * Encrypt sensitive data
 * @param value - Plain text value to encrypt
 * @returns Encrypted string or null if input is null/undefined
 */
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(value, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param encrypted - Encrypted string to decrypt
 * @returns Decrypted plain text or null if input is null/undefined
 */
export function decryptField(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails, plaintext will be empty
    // This handles migration scenario where data might still be plain text
    if (!plaintext) {
      // Assume plain text (backward compatibility during migration)
      console.warn('Decryption returned empty string, treating as plain text');
      return encrypted;
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, assume it's plain text (migration safety)
    return encrypted;
  }
}

/**
 * Check if a value is already encrypted (heuristic)
 * Encrypted values are Base64 strings starting with "U2FsdGVkX1..."
 * 
 * @param value - Value to check
 * @returns True if value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  // Encrypted values are Base64 strings starting with "U2FsdGVkX1..."
  return /^U2FsdGVkX1/.test(value);
}

/**
 * Batch encrypt multiple fields
 * @param data - Object with fields to encrypt
 * @returns Object with encrypted fields
 */
export function encryptFields<T extends Record<string, string | null | undefined>>(
  data: T
): Record<keyof T, string | null> {
  const encrypted: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;
  
  for (const [key, value] of Object.entries(data)) {
    encrypted[key as keyof T] = encryptField(value);
  }
  
  return encrypted;
}

/**
 * Batch decrypt multiple fields
 * @param data - Object with encrypted fields
 * @returns Object with decrypted fields
 */
export function decryptFields<T extends Record<string, string | null | undefined>>(
  data: T
): Record<keyof T, string | null> {
  const decrypted: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;
  
  for (const [key, value] of Object.entries(data)) {
    decrypted[key as keyof T] = decryptField(value);
  }
  
  return decrypted;
}
