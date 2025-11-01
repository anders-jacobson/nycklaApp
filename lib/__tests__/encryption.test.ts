/**
 * Unit tests for encryption utilities
 * Run with: npm test -- lib/__tests__/encryption.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encryptField, decryptField, isEncrypted, encryptFields, decryptFields } from '@/lib/encryption';

// Set up test encryption key before tests
const TEST_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';

beforeAll(() => {
  // Set test encryption key if not already set
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  }
});

describe('Encryption Utilities', () => {
  describe('encryptField', () => {
    it('should encrypt plain text data', () => {
      const plaintext = 'John Doe';
      const encrypted = encryptField(plaintext);
      
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted!.length).toBeGreaterThan(plaintext.length);
    });
    
    it('should handle null values', () => {
      expect(encryptField(null)).toBeNull();
    });
    
    it('should handle undefined values', () => {
      expect(encryptField(undefined)).toBeNull();
    });
    
    it('should encrypt empty string as null', () => {
      // Empty strings are treated as falsy and return null
      const encrypted = encryptField('');
      expect(encrypted).toBeNull();
    });
    
    it('should encrypt special characters', () => {
      const specialChars = 'åäö ÅÄÖ +46-70-123-4567';
      const encrypted = encryptField(specialChars);
      expect(encrypted).not.toBe(specialChars);
    });
  });
  
  describe('decryptField', () => {
    it('should decrypt encrypted data correctly', () => {
      const plaintext = 'John Doe';
      const encrypted = encryptField(plaintext);
      const decrypted = decryptField(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
    
    it('should handle null values', () => {
      expect(decryptField(null)).toBeNull();
    });
    
    it('should handle undefined values', () => {
      expect(decryptField(undefined)).toBeNull();
    });
    
    it('should handle empty string encryption as null', () => {
      // Empty strings are treated as null
      const encrypted = encryptField('');
      expect(encrypted).toBeNull();
      const decrypted = decryptField(encrypted);
      expect(decrypted).toBeNull();
    });
    
    it('should decrypt special characters correctly', () => {
      const specialChars = 'åäö ÅÄÖ +46-70-123-4567';
      const encrypted = encryptField(specialChars);
      const decrypted = decryptField(encrypted);
      expect(decrypted).toBe(specialChars);
    });
    
    it('should handle already encrypted values (migration safety)', () => {
      // This should be a valid encrypted value format
      const alreadyEncrypted = 'U2FsdGVkX1/example';
      const result = decryptField(alreadyEncrypted);
      // Should not throw, but may return plain text if decryption fails
      expect(result).toBeTruthy();
    });
  });
  
  describe('isEncrypted', () => {
    it('should detect encrypted values', () => {
      const encrypted = encryptField('test');
      expect(isEncrypted(encrypted!)).toBe(true);
    });
    
    it('should detect plain text values', () => {
      expect(isEncrypted('plaintext')).toBe(false);
      expect(isEncrypted('John Doe')).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });
    
    it('should handle null and undefined', () => {
      expect(isEncrypted(null as any)).toBe(false);
      expect(isEncrypted(undefined as any)).toBe(false);
    });
  });
  
  describe('encryptFields', () => {
    it('should encrypt multiple fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+46701234567',
      };
      
      const encrypted = encryptFields(data);
      
      expect(encrypted.name).not.toBe(data.name);
      expect(encrypted.email).not.toBe(data.email);
      expect(encrypted.phone).not.toBe(data.phone);
      
      expect(isEncrypted(encrypted.name!)).toBe(true);
      expect(isEncrypted(encrypted.email!)).toBe(true);
      expect(isEncrypted(encrypted.phone!)).toBe(true);
    });
    
    it('should handle null values in batch', () => {
      const data = {
        name: 'John Doe',
        email: null,
        phone: undefined,
      };
      
      const encrypted = encryptFields(data);
      
      expect(encrypted.name).not.toBe(data.name);
      expect(encrypted.email).toBeNull();
      expect(encrypted.phone).toBeNull();
    });
  });
  
  describe('decryptFields', () => {
    it('should decrypt multiple fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+46701234567',
      };
      
      const encrypted = encryptFields(data);
      const decrypted = decryptFields(encrypted);
      
      expect(decrypted.name).toBe(data.name);
      expect(decrypted.email).toBe(data.email);
      expect(decrypted.phone).toBe(data.phone);
    });
    
    it('should handle null values in batch', () => {
      const data = {
        name: 'John Doe',
        email: null,
        phone: undefined,
      };
      
      const encrypted = encryptFields(data);
      const decrypted = decryptFields(encrypted);
      
      expect(decrypted.name).toBe(data.name);
      expect(decrypted.email).toBeNull();
      expect(decrypted.phone).toBeNull();
    });
  });
  
  describe('Encryption/Decryption Round Trip', () => {
    it('should work for typical resident borrower data', () => {
      const data = {
        name: 'Gunhild Åberg',
        email: 'gunhild.aberg@example.com',
        phone: '+4670-123-4567',
      };
      
      const encrypted = encryptFields(data);
      const decrypted = decryptFields(encrypted);
      
      expect(decrypted).toEqual(data);
    });
    
    it('should work for external borrower with all fields', () => {
      const data = {
        name: 'Erik Sven-Eriksson',
        email: 'erik.sven@company.com',
        phone: '+46701234567',
        address: 'Storgatan 1, 123 45 Stockholm',
        company: 'Åkeri & Transport AB',
        borrowerPurpose: 'Needs basement key for storage access',
      };
      
      const encrypted = encryptFields(data);
      const decrypted = decryptFields(encrypted);
      
      expect(decrypted).toEqual(data);
    });
    
    it('should produce consistent encrypted output', () => {
      const data = 'John Doe';
      const encrypted1 = encryptField(data);
      const encrypted2 = encryptField(data);
      
      // Encrypted values should be different (due to salt/IV) but both decryptable
      expect(encrypted1).not.toBe(encrypted2);
      expect(decryptField(encrypted1)).toBe(data);
      expect(decryptField(encrypted2)).toBe(data);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'A'.repeat(1000);
      const encrypted = encryptField(longString);
      const decrypted = decryptField(encrypted);
      
      expect(decrypted).toBe(longString);
    });
    
    it('should handle Unicode characters', () => {
      const unicode = '你好 世界 🎉 ñoño';
      const encrypted = encryptField(unicode);
      const decrypted = decryptField(encrypted);
      
      expect(decrypted).toBe(unicode);
    });
    
    it('should handle multiline strings', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      const encrypted = encryptField(multiline);
      const decrypted = decryptField(encrypted);
      
      expect(decrypted).toBe(multiline);
    });
  });
});

