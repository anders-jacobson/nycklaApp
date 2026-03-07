/**
 * Pure borrower utility functions — no server dependencies.
 * Safe to import in both client and server components.
 */

export const PLACEHOLDER_EMAIL_DOMAIN = '@placeholder.com';

export function generatePlaceholderEmail(name: string): string {
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return `${cleanName}${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

export function isValidEmail(email: string): boolean {
  if (isPlaceholderEmail(email)) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizePhoneNumber(phone: string): string {
  return phone
    .replace(/[^\d\s\-\(\)\+]/g, '')
    .trim()
    .substring(0, 20);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  const cleanPhone = sanitizePhoneNumber(phone);
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digitCount = cleanPhone.replace(/\D/g, '').length;
  return phoneRegex.test(cleanPhone) && digitCount >= 7;
}

export function formatBorrowerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getEmailDisplayText(email: string): string {
  if (isPlaceholderEmail(email)) {
    return `${email} (placeholder - needs real email)`;
  }
  return email;
}

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

export function validateBorrowerData(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  borrowerPurpose?: string;
}): BorrowerValidationResult {
  const errors: Record<string, string> = {};

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

  const email = data.email?.trim().toLowerCase();
  if (!email) {
    errors.email = 'Email is required';
  } else if (email.length > borrowerValidation.email.maxLength) {
    errors.email = `Email must be less than ${borrowerValidation.email.maxLength} characters`;
  } else if (!isValidEmail(email)) {
    errors.email = borrowerValidation.email.message;
  }

  const phone = data.phone?.trim();
  const sanitizedPhone = phone ? sanitizePhoneNumber(phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    errors.phone = borrowerValidation.phone.message;
  }

  const company = data.company?.trim();
  if (company && company.length > borrowerValidation.company.maxLength) {
    errors.company = `Affiliation must be less than ${borrowerValidation.company.maxLength} characters`;
  } else if (company && !borrowerValidation.company.pattern.test(company)) {
    errors.company = borrowerValidation.company.message;
  }

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
