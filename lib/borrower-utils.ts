/**
 * Borrower utility functions for placeholder email handling and validation
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

export const PLACEHOLDER_EMAIL_DOMAIN = '@placeholder.com';

/**
 * Generate a placeholder email from a borrower's name
 * Format: firstname.lastname@placeholder.com
 */
export function generatePlaceholderEmail(name: string): string {
  const cleanName = name
    .toLowerCase()
    .trim()
    // Convert Swedish characters
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    // Remove special characters except spaces
    .replace(/[^a-z\s]/g, '')
    // Replace spaces with dots
    .replace(/\s+/g, '.')
    // Remove multiple dots
    .replace(/\.+/g, '.')
    // Remove leading/trailing dots
    .replace(/^\.+|\.+$/g, '');

  return `${cleanName}${PLACEHOLDER_EMAIL_DOMAIN}`;
}

/**
 * Check if an email is a placeholder email
 */
export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

/**
 * Validate email format (including placeholder emails)
 */
export function isValidEmail(email: string): boolean {
  if (isPlaceholderEmail(email)) {
    // Placeholder emails are always considered valid
    return true;
  }

  // Standard email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize phone number for security (prevent injection)
 */
export function sanitizePhoneNumber(phone: string): string {
  // Only allow: digits, spaces, hyphens, parentheses, plus sign
  return phone
    .replace(/[^\d\s\-\(\)\+]/g, '')
    .trim()
    .substring(0, 20);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional

  const cleanPhone = sanitizePhoneNumber(phone);
  // Must contain at least 7 digits and only allowed characters
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digitCount = cleanPhone.replace(/\D/g, '').length;

  return phoneRegex.test(cleanPhone) && digitCount >= 7;
}

/**
 * Format borrower name for display (capitalize each word)
 */
export function formatBorrowerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get display text for placeholder email
 */
export function getEmailDisplayText(email: string): string {
  if (isPlaceholderEmail(email)) {
    return `${email} (placeholder - needs real email)`;
  }
  return email;
}

/**
 * Borrower validation rules
 */
export const borrowerValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÅÄÖåäö\s\-'\.]+$/,
    message: 'Name must contain only letters, spaces, hyphens, and apostrophes',
  },
  email: {
    required: true,
    maxLength: 255,
    validate: isValidEmail,
    message: 'Please enter a valid email address',
  },
  phone: {
    required: false,
    maxLength: 20,
    validate: isValidPhone,
    sanitize: sanitizePhoneNumber,
    message: 'Phone number contains invalid characters',
  },
  company: {
    required: false,
    maxLength: 100,
    pattern: /^[a-zA-ZÅÄÖåäö\s\-'\.&0-9AB]+$/,
    message: 'Affiliation contains invalid characters',
  },
  borrowerPurpose: {
    required: false,
    maxLength: 500,
    pattern: /^[a-zA-ZÅÄÖåäö\s\-'\.,:;!?&0-9\n\r]+$/,
    message: 'Purpose description contains invalid characters',
  },
} as const;

export type BorrowerValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    borrowerPurpose?: string;
  };
};

/**
 * Comprehensive borrower data validation
 */
export function validateBorrowerData(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  borrowerPurpose?: string;
}): BorrowerValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  const name = data.name?.trim();
  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length < borrowerValidation.name.minLength) {
    errors.name = `Name must be at least ${borrowerValidation.name.minLength} characters`;
  } else if (name.length > borrowerValidation.name.maxLength) {
    errors.name = `Name must be less than ${borrowerValidation.name.maxLength} characters`;
  } else if (!borrowerValidation.name.pattern.test(name)) {
    errors.name = borrowerValidation.name.message;
  }

  // Validate email
  const email = data.email?.trim().toLowerCase();
  if (!email) {
    errors.email = 'Email is required';
  } else if (email.length > borrowerValidation.email.maxLength) {
    errors.email = `Email must be less than ${borrowerValidation.email.maxLength} characters`;
  } else if (!isValidEmail(email)) {
    errors.email = borrowerValidation.email.message;
  }

  // Validate phone (optional)
  const phone = data.phone?.trim();
  const sanitizedPhone = phone ? sanitizePhoneNumber(phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    errors.phone = borrowerValidation.phone.message;
  }

  // Validate affiliation (optional)
  const company = data.company?.trim();
  if (company && company.length > borrowerValidation.company.maxLength) {
    errors.company = `Affiliation must be less than ${borrowerValidation.company.maxLength} characters`;
  } else if (company && !borrowerValidation.company.pattern.test(company)) {
    errors.company = borrowerValidation.company.message;
  }

  // Validate borrower purpose (optional)
  const borrowerPurpose = data.borrowerPurpose?.trim();
  if (borrowerPurpose && borrowerPurpose.length > borrowerValidation.borrowerPurpose.maxLength) {
    errors.borrowerPurpose = `Purpose description must be less than ${borrowerValidation.borrowerPurpose.maxLength} characters`;
  } else if (borrowerPurpose && !borrowerValidation.borrowerPurpose.pattern.test(borrowerPurpose)) {
    errors.borrowerPurpose = borrowerValidation.borrowerPurpose.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name: formatBorrowerName(name || ''),
      email: email || '',
      phone: sanitizedPhone,
      company: company || undefined,
      borrowerPurpose: borrowerPurpose || undefined,
    },
  };
}

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
  tx?: Prisma.TransactionClient, // Prisma transaction
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
 */
export async function findBorrowerByEmail(email: string, entityId: string) {
  return await prisma.borrower.findFirst({
    where: {
      entityId,
      OR: [
        {
          residentBorrower: {
            email,
          },
        },
        {
          externalBorrower: {
            email,
          },
        },
      ],
    },
    include: {
      residentBorrower: true,
      externalBorrower: true,
    },
  });
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
      borrowerPurpose: decryptWithEntityKey(borrower.externalBorrower.borrowerPurpose, entityKey) || null,
    };
  }

  throw new Error('Invalid borrower data structure');
}
