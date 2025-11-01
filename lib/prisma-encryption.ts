/**
 * Prisma middleware for automatic encryption/decryption of sensitive PII fields
 * This middleware automatically encrypts data on write and decrypts on read
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { encryptField, decryptField, isEncrypted } from '@/lib/encryption';

/**
 * Fields that should be encrypted per model
 * Only PII fields are encrypted - structural/metadata fields remain plain
 */
const ENCRYPTION_FIELDS = {
  ResidentBorrower: ['name', 'email', 'phone'] as const,
  ExternalBorrower: ['name', 'email', 'phone', 'address', 'borrowerPurpose'] as const,
  // Add more models as needed
} as const;

type ModelName = keyof typeof ENCRYPTION_FIELDS;

/**
 * Encrypt sensitive fields before database write operations
 */
function encryptSensitiveFields(params: any, model: string): any {
  const fieldsToEncrypt = ENCRYPTION_FIELDS[model as ModelName];
  
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
    return params;
  }
  
  // Recursively encrypt fields in nested objects
  function encryptObject(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    const encrypted: any = { ...obj };
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        // Only encrypt if not already encrypted (safety during migration)
        if (!isEncrypted(encrypted[field])) {
          encrypted[field] = encryptField(encrypted[field]);
        }
      }
    }
    return encrypted;
  }
  
  // Handle Prisma query params for different operation types
  if (params.data) {
    params.data = encryptObject(params.data);
  }
  if (params.create) {
    params.create = encryptObject(params.create);
  }
  if (params.update) {
    params.update = encryptObject(params.update);
  }
  if (params.createMany?.data) {
    params.createMany.data = params.createMany.data.map((item: any) => encryptObject(item));
  }
  
  // Handle nested create in relations
  if (params.data?.create) {
    params.data.create = Array.isArray(params.data.create)
      ? params.data.create.map((item: any) => encryptObject(item))
      : encryptObject(params.data.create);
  }
  
  return params;
}

/**
 * Decrypt sensitive fields after database read operations
 */
function decryptSensitiveFields(result: any, model: string): any {
  const fieldsToDecrypt = ENCRYPTION_FIELDS[model as ModelName];
  
  if (!fieldsToDecrypt || fieldsToDecrypt.length === 0) {
    return result;
  }
  
  // Recursively decrypt fields
  function decryptObject(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(decryptObject);
    }
    
    const decrypted: any = { ...obj };
    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = decryptField(decrypted[field]);
      }
    }
    
    return decrypted;
  }
  
  return decryptObject(result);
}

// Track if middleware has been initialized to prevent double initialization
let middlewareInitialized = false;

/**
 * Initialize Prisma encryption middleware
 * This middleware automatically encrypts on write and decrypts on read
 */
export function initializeEncryptionMiddleware() {
  // Prevent double initialization
  if (middlewareInitialized) {
    return;
  }
  
  // Check for encryption key - allow graceful fallback for tests/dev
  const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
  
  if (!hasEncryptionKey) {
    // In development/test, allow running without encryption key
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  ENCRYPTION_KEY not set - encryption middleware disabled');
      middlewareInitialized = true;
      return;
    }
    // Production must have encryption key
    throw new Error('ENCRYPTION_KEY is required in production');
  }
  
  // Register middleware for automatic encryption/decryption
  prisma.$use(async (params, next) => {
    // Encrypt before write operations
    if (['create', 'update', 'upsert', 'createMany'].includes(params.action)) {
      params.args = encryptSensitiveFields(params.args, params.model || '');
    }
    
    // Execute query
    const result = await next(params);
    
    // Decrypt after read operations
    if (['findUnique', 'findFirst', 'findMany', 'aggregate'].includes(params.action)) {
      return decryptSensitiveFields(result, params.model || '');
    }
    
    return result;
  });
  
  middlewareInitialized = true;
}

