/**
 * Prisma middleware for automatic encryption/decryption of sensitive PII fields
 * This middleware automatically encrypts data on write and decrypts on read
 * Uses per-entity encryption keys for multi-tenant data isolation
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { 
  getEntityKey, 
  encryptWithEntityKey, 
  decryptWithEntityKey, 
  isEncrypted 
} from '@/lib/entity-encryption';

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
 * Get entityId from query params or context
 * The entityId determines which encryption key to use
 */
async function getEntityIdFromParams(params: any, model: string): Promise<string | null> {
  // For Borrower model, check the args for entityId
  if (params.args?.where?.id) {
    const record = await prisma[model.toLowerCase() as 'borrower' | 'residentBorrower' | 'externalBorrower'].findUnique({
      where: { id: params.args.where.id },
      select: { entityId: true } as any,
    });
    return record?.entityId || null;
  }
  
  // For create operations, entityId might be in the data
  if (params.args?.data?.entityId) {
    return params.args.data.entityId;
  }
  
  // For nested operations through Borrower
  if (params.args?.data?.borrower?.connect?.id) {
    const borrower = await prisma.borrower.findUnique({
      where: { id: params.args.data.borrower.connect.id },
      select: { entityId: true },
    });
    return borrower?.entityId || null;
  }
  
  return null;
}

/**
 * Encrypt sensitive fields before database write operations
 * Uses per-entity encryption keys
 */
async function encryptSensitiveFields(params: any, model: string): Promise<any> {
  const fieldsToEncrypt = ENCRYPTION_FIELDS[model as ModelName];
  
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
    return params;
  }
  
  // Get entity ID to determine which key to use
  const entityId = await getEntityIdFromParams(params, model);
  if (!entityId) {
    // If no entity context, skip encryption (will be handled by validation)
    return params;
  }
  
  // Get entity-specific encryption key
  const entityKey = await getEntityKey(entityId);
  
  // Recursively encrypt fields in nested objects
  function encryptObject(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    const encrypted: any = { ...obj };
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        // Only encrypt if not already encrypted (safety during migration)
        if (!isEncrypted(encrypted[field])) {
          encrypted[field] = encryptWithEntityKey(encrypted[field], entityKey);
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
 * Uses per-entity encryption keys
 */
async function decryptSensitiveFields(result: any, model: string): Promise<any> {
  const fieldsToDecrypt = ENCRYPTION_FIELDS[model as ModelName];
  
  if (!fieldsToDecrypt || fieldsToDecrypt.length === 0) {
    return result;
  }
  
  if (!result) return result;
  
  // Get entityId from result to determine which key to use
  async function getEntityIdFromResult(obj: any): Promise<string | null> {
    // For Borrower model, entityId is directly on the record
    if (obj?.borrower?.entityId) {
      return obj.borrower.entityId;
    }
    
    // For direct borrower queries
    if (obj?.entityId) {
      return obj.entityId;
    }
    
    // For nested operations, try to find the borrower
    if (obj?.id) {
      const borrower = await prisma.borrower.findUnique({
        where: { 
          residentBorrowerId: obj.id 
        },
        select: { entityId: true },
      });
      if (borrower) return borrower.entityId;
      
      const externalBorrower = await prisma.borrower.findUnique({
        where: { 
          externalBorrowerId: obj.id 
        },
        select: { entityId: true },
      });
      if (externalBorrower) return externalBorrower.entityId;
    }
    
    return null;
  }
  
  // Recursively decrypt fields with entity key
  async function decryptObject(obj: any): Promise<any> {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(decryptObject));
    }
    
    // Get entity key for this record
    const entityId = await getEntityIdFromResult(obj);
    if (!entityId) {
      // No entity context, return as-is
      return obj;
    }
    
    const entityKey = await getEntityKey(entityId);
    
    const decrypted: any = { ...obj };
    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = decryptWithEntityKey(decrypted[field], entityKey);
      }
    }
    
    return decrypted;
  }
  
  return await decryptObject(result);
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
    // Encrypt before write operations (async now for entity key lookup)
    if (['create', 'update', 'upsert', 'createMany'].includes(params.action)) {
      params.args = await encryptSensitiveFields(params.args, params.model || '');
    }
    
    // Execute query
    const result = await next(params);
    
    // Decrypt after read operations (async now for entity key lookup)
    if (['findUnique', 'findFirst', 'findMany', 'aggregate'].includes(params.action)) {
      return await decryptSensitiveFields(result, params.model || '');
    }
    
    return result;
  });
  
  middlewareInitialized = true;
}

