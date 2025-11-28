/**
 * Entity-specific encryption utilities
 * Manages per-entity encryption keys for multi-tenant data isolation
 */

import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { prisma } from '@/lib/prisma';

/**
 * Get master encryption key from environment
 * This key encrypts all entity-specific keys
 */
function getMasterKey(): string {
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
 * Generate a new unique encryption key for an entity
 * Each entity gets its own 256-bit key for data encryption
 */
export function generateEntityKey(): string {
  // Generate 32 random bytes (256 bits) and encode as base64
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypt an entity's key with the master encryption key
 * This allows entity keys to be securely stored in the database
 * 
 * @param plainKey - Plain text entity key to encrypt
 * @returns Encrypted entity key (safe to store in database)
 */
export function encryptEntityKey(plainKey: string): string {
  const masterKey = getMasterKey();
  return CryptoJS.AES.encrypt(plainKey, masterKey).toString();
}

/**
 * Decrypt an entity's key using the master encryption key
 * 
 * @param encryptedKey - Encrypted entity key from database
 * @returns Plain text entity key (use for encrypting/decrypting PII)
 */
export function decryptEntityKey(encryptedKey: string): string {
  const masterKey = getMasterKey();
  const bytes = CryptoJS.AES.decrypt(encryptedKey, masterKey);
  const plainKey = bytes.toString(CryptoJS.enc.Utf8);
  
  if (!plainKey) {
    throw new Error('Failed to decrypt entity key - invalid master key or corrupted data');
  }
  
  return plainKey;
}

/**
 * Get an entity's encryption key from the database (decrypted and ready to use)
 * 
 * @param entityId - UUID of the entity
 * @returns Decrypted entity key for encrypting/decrypting PII
 */
export async function getEntityKey(entityId: string): Promise<string> {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: { encryptionKey: true },
  });
  
  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }
  
  return decryptEntityKey(entity.encryptionKey);
}

/**
 * Encrypt a field value using an entity's encryption key
 * 
 * @param value - Plain text value to encrypt
 * @param entityKey - Entity's encryption key (from getEntityKey)
 * @returns Encrypted value or null if input is null/undefined
 */
export function encryptWithEntityKey(
  value: string | null | undefined,
  entityKey: string
): string | null {
  if (!value) return null;
  
  try {
    return CryptoJS.AES.encrypt(value, entityKey).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data with entity key');
  }
}

/**
 * Decrypt a field value using an entity's encryption key
 * 
 * @param encrypted - Encrypted value from database
 * @param entityKey - Entity's encryption key (from getEntityKey)
 * @returns Decrypted plain text or null if input is null/undefined
 */
export function decryptWithEntityKey(
  encrypted: string | null | undefined,
  entityKey: string
): string | null {
  if (!encrypted) return null;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, entityKey);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    
    // Handle migration scenario where data might still be plain text
    if (!plaintext) {
      console.warn('Decryption returned empty string, treating as plain text');
      return encrypted;
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    // Safety fallback for migration - assume plain text
    return encrypted;
  }
}

/**
 * Check if a value is encrypted (heuristic)
 * 
 * @param value - Value to check
 * @returns True if value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  // AES encrypted strings from crypto-js start with "U2FsdGVkX1"
  return /^U2FsdGVkX1/.test(value);
}

/**
 * Rotate an entity's encryption key
 * WARNING: This requires re-encrypting ALL PII data for the entity
 * 
 * @param entityId - UUID of the entity
 * @returns New encrypted entity key
 */
export async function rotateEntityKey(entityId: string): Promise<string> {
  // Generate new key
  const newKey = generateEntityKey();
  const encryptedNewKey = encryptEntityKey(newKey);
  
  // Get old key for re-encryption
  const oldKey = await getEntityKey(entityId);
  
  // Update entity with new key
  await prisma.entity.update({
    where: { id: entityId },
    data: { encryptionKey: encryptedNewKey },
  });
  
  // TODO: Re-encrypt all PII data with new key
  // This would require:
  // 1. Fetch all borrower records for this entity
  // 2. Decrypt PII with old key
  // 3. Re-encrypt PII with new key
  // 4. Update records
  
  console.log(`Entity key rotated for entity ${entityId}`);
  return encryptedNewKey;
}














