/**
 * Prisma Client Extension for automatic encryption/decryption of sensitive PII fields
 * This extension automatically encrypts data on write and decrypts on read
 * Uses per-entity encryption keys for multi-tenant data isolation
 */

import { Prisma } from '@prisma/client';
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
 * Create Prisma Client Extension for encryption
 * Uses Client Extensions API which works better with Next.js 16
 */
export function createEncryptionExtension(basePrisma: any) {
  // Check for encryption key - allow graceful fallback for tests/dev
  const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;
  
  if (!hasEncryptionKey) {
    // In development/test, allow running without encryption key
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  ENCRYPTION_KEY not set - encryption disabled');
      // Return identity extension (no-op)
      return Prisma.defineExtension({
        name: 'encryption-disabled',
      });
    }
    // Production must have encryption key
    throw new Error('ENCRYPTION_KEY is required in production');
  }

  return Prisma.defineExtension({
    name: 'encryption',
    query: {
      residentBorrower: {
        async create({ args, query }) {
          args.data = await encryptFields(args.data, 'ResidentBorrower', basePrisma);
          const result = await query(args);
          return await decryptFields(result, 'ResidentBorrower', basePrisma);
        },
        async update({ args, query }) {
          args.data = await encryptFields(args.data, 'ResidentBorrower', basePrisma);
          const result = await query(args);
          return await decryptFields(result, 'ResidentBorrower', basePrisma);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ResidentBorrower', basePrisma);
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ResidentBorrower', basePrisma);
        },
        async findMany({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ResidentBorrower', basePrisma);
        },
      },
      externalBorrower: {
        async create({ args, query }) {
          args.data = await encryptFields(args.data, 'ExternalBorrower', basePrisma);
          const result = await query(args);
          return await decryptFields(result, 'ExternalBorrower', basePrisma);
        },
        async update({ args, query }) {
          args.data = await encryptFields(args.data, 'ExternalBorrower', basePrisma);
          const result = await query(args);
          return await decryptFields(result, 'ExternalBorrower', basePrisma);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ExternalBorrower', basePrisma);
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ExternalBorrower', basePrisma);
        },
        async findMany({ args, query }) {
          const result = await query(args);
          return await decryptFields(result, 'ExternalBorrower', basePrisma);
        },
      },
    },
  });
}

/**
 * Encrypt sensitive fields before write
 */
async function encryptFields(data: any, modelName: ModelName, prisma: any): Promise<any> {
  if (!data) return data;
  
  const fieldsToEncrypt = ENCRYPTION_FIELDS[modelName];
  if (!fieldsToEncrypt || fieldsToEncrypt.length === 0) {
    return data;
  }
  
  // Get entityId from data or borrower relation
  let entityId: string | null = data.entityId || null;
  
  if (!entityId && data.borrower?.connect?.id) {
    const borrower = await prisma.borrower.findUnique({
      where: { id: data.borrower.connect.id },
      select: { entityId: true },
    });
    entityId = borrower?.entityId || null;
  }
  
  if (!entityId) {
    return data; // Skip encryption if no entity context
  }
  
  const entityKey = await getEntityKey(entityId);
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      if (!isEncrypted(encrypted[field])) {
        encrypted[field] = encryptWithEntityKey(encrypted[field], entityKey);
      }
    }
  }
  
  return encrypted;
}

/**
 * Decrypt sensitive fields after read
 */
async function decryptFields(result: any, modelName: ModelName, prisma: any): Promise<any> {
  if (!result) return result;
  
  const fieldsToDecrypt = ENCRYPTION_FIELDS[modelName];
  if (!fieldsToDecrypt || fieldsToDecrypt.length === 0) {
    return result;
  }
  
  // Handle arrays
  if (Array.isArray(result)) {
    return Promise.all(result.map((item) => decryptFields(item, modelName, prisma)));
  }
  
  // Get entityId from result or borrower relation
  let entityId: string | null = null;
  
  if (result.borrower?.entityId) {
    entityId = result.borrower.entityId;
  } else if (result.entityId) {
    entityId = result.entityId;
  } else if (result.id) {
    // Try to fetch borrower to get entityId
    const borrower = await prisma.borrower.findFirst({
      where: {
        OR: [
          { residentBorrowerId: result.id },
          { externalBorrowerId: result.id },
        ],
      },
      select: { entityId: true },
    });
    entityId = borrower?.entityId || null;
  }
  
  if (!entityId) {
    return result; // Skip decryption if no entity context
  }
  
  const entityKey = await getEntityKey(entityId);
  const decrypted = { ...result };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decryptWithEntityKey(decrypted[field], entityKey);
    }
  }
  
  return decrypted;
}

