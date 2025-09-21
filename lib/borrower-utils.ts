/**
 * Borrower utility functions for placeholder email handling and validation
 */

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
} as const;

export type BorrowerValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name: formatBorrowerName(name || ''),
      email: email || '',
      phone: sanitizedPhone,
      company: company || undefined,
    },
  };
}
