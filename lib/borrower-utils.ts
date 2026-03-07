/**
 * Borrower utility functions — server-only (uses Prisma + encryption).
 * For pure/client-safe helpers, see lib/borrower-pure-utils.ts.
 */

import { prisma } from '@/lib/prisma';
import {
  BorrowerAffiliation,
  Borrower,
  ResidentBorrower,
  ExternalBorrower,
  Prisma,
} from '@prisma/client';
import { getEntityKey, encryptWithEntityKey, decryptWithEntityKey } from '@/lib/entity-encryption';

// Re-export pure helpers so existing server-side imports keep working
export {
  PLACEHOLDER_EMAIL_DOMAIN,
  generatePlaceholderEmail,
  isPlaceholderEmail,
  isValidEmail,
  sanitizePhoneNumber,
  isValidPhone,
  formatBorrowerName,
  getEmailDisplayText,
  borrowerValidation,
  validateBorrowerData,
  type BorrowerValidationResult,
} from '@/lib/borrower-pure-utils';

/**
 * Create a borrower with the new affiliation-based structure (with encryption)
 */
export async function createBorrowerWithAffiliation(
  data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    borrowerPurpose?: string;
    isExternal?: boolean;
  },
  entityId: string,
  tx?: Prisma.TransactionClient,
) {
  const prismaClient = tx || prisma;
  const { name, email, phone, company, address, borrowerPurpose, isExternal } = data;

  // Get entity encryption key
  const entityKey = await getEntityKey(entityId);

  // Determine if this should be an external borrower
  const shouldBeExternal = isExternal || !!company || !!address || !!borrowerPurpose;

  if (shouldBeExternal) {
    // Create external borrower with encrypted data
    const externalBorrower = await prismaClient.externalBorrower.create({
      data: {
        name: encryptWithEntityKey(name, entityKey)!,
        email: encryptWithEntityKey(email, entityKey)!,
        phone: encryptWithEntityKey(phone, entityKey),
        company: encryptWithEntityKey(company, entityKey),
        address: encryptWithEntityKey(address, entityKey),
        borrowerPurpose: encryptWithEntityKey(borrowerPurpose, entityKey),
      },
    });

    return await prismaClient.borrower.create({
      data: {
        affiliation: BorrowerAffiliation.EXTERNAL,
        externalBorrowerId: externalBorrower.id,
        entityId,
      },
      include: {
        externalBorrower: true,
      },
    });
  } else {
    // Create resident borrower with encrypted data
    const residentBorrower = await prismaClient.residentBorrower.create({
      data: {
        name: encryptWithEntityKey(name, entityKey)!,
        email: encryptWithEntityKey(email, entityKey)!,
        phone: encryptWithEntityKey(phone, entityKey),
      },
    });

    return await prismaClient.borrower.create({
      data: {
        affiliation: BorrowerAffiliation.RESIDENT,
        residentBorrowerId: residentBorrower.id,
        entityId,
      },
      include: {
        residentBorrower: true,
      },
    });
  }
}

/**
 * Find existing borrower by email with new structure
 * NOTE: Emails are encrypted with a random salt — SQL comparison is impossible.
 * We must fetch all borrowers for the entity and decrypt in memory.
 */
export async function findBorrowerByEmail(email: string, entityId: string) {
  const entityKey = await getEntityKey(entityId);
  const normalizedEmail = email.trim().toLowerCase();

  const borrowers = await prisma.borrower.findMany({
    where: { entityId },
    include: {
      residentBorrower: true,
      externalBorrower: true,
    },
  });

  return (
    borrowers.find((b) => {
      const encryptedEmail = b.residentBorrower?.email ?? b.externalBorrower?.email;
      if (!encryptedEmail) return false;
      const decrypted = decryptWithEntityKey(encryptedEmail, entityKey);
      return decrypted?.toLowerCase() === normalizedEmail;
    }) ?? null
  );
}

/**
 * Get borrower details for display (with decryption)
 */
export async function getBorrowerDetails(
  borrower: Borrower & {
    residentBorrower?: ResidentBorrower | null;
    externalBorrower?: ExternalBorrower | null;
  },
  entityId: string,
) {
  // Get entity encryption key
  const entityKey = await getEntityKey(entityId);

  if (borrower.affiliation === BorrowerAffiliation.RESIDENT && borrower.residentBorrower) {
    return {
      id: borrower.id,
      name: decryptWithEntityKey(borrower.residentBorrower.name, entityKey) || '',
      email: decryptWithEntityKey(borrower.residentBorrower.email, entityKey) || '',
      phone: decryptWithEntityKey(borrower.residentBorrower.phone, entityKey) || null,
      affiliation: BorrowerAffiliation.RESIDENT,
      company: null,
      address: null,
      borrowerPurpose: null,
    };
  } else if (borrower.affiliation === BorrowerAffiliation.EXTERNAL && borrower.externalBorrower) {
    return {
      id: borrower.id,
      name: decryptWithEntityKey(borrower.externalBorrower.name, entityKey) || '',
      email: decryptWithEntityKey(borrower.externalBorrower.email, entityKey) || '',
      phone: decryptWithEntityKey(borrower.externalBorrower.phone, entityKey) || null,
      affiliation: BorrowerAffiliation.EXTERNAL,
      company: decryptWithEntityKey(borrower.externalBorrower.company, entityKey) || null,
      address: decryptWithEntityKey(borrower.externalBorrower.address, entityKey) || null,
      borrowerPurpose:
        decryptWithEntityKey(borrower.externalBorrower.borrowerPurpose, entityKey) || null,
    };
  }

  throw new Error('Invalid borrower data structure');
}
