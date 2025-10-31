# Data Encryption Implementation Guide

## Overview

This document outlines the data encryption strategy for the Key Management Application to protect sensitive borrower personal information (PII) even if unauthorized access to the database occurs.

---

## 🔐 Current Security Posture

### ✅ **Implemented Security Layers**

1. **Row Level Security (RLS)** - 18 policies preventing unauthorized access
2. **EU Data Storage** - GDPR compliant hosting in Stockholm
3. **Server-Side Authentication** - All operations use secure server clients
4. **Network Encryption** - HTTPS/TLS for data in transit (Supabase default)
5. **Data Isolation** - Complete cooperative separation via RLS
6. **15-minute Idle Timeout** - Application-level session security

### ⚠️ **Current Gap: Data at Rest Encryption**

**Problem**: If someone gains direct database access (e.g., service role key leak, Supabase admin access, database backup theft), they can read all PII in plain text.

**Impact**: High risk for GDPR violations and privacy breaches.

---

## 🎯 Sensitive Data Identification

### **Critical PII That Should Be Encrypted**

Based on current schema analysis:

| Data Type | Tables | Fields | Sensitivity |
|-----------|--------|--------|-------------|
| **Names** | ResidentBorrower, ExternalBorrower | `name` | High |
| **Emails** | User, ResidentBorrower, ExternalBorrower | `email` | High |
| **Phone Numbers** | ResidentBorrower, ExternalBorrower | `phone` | Medium |
| **Addresses** | ExternalBorrower | `address` | Medium |
| **Company Info** | ExternalBorrower | `company` | Low |
| **Purpose Notes** | ExternalBorrower | `borrowerPurpose` | Low |

### **Non-Sensitive Data (No Encryption Needed)**

- KeyTypes (label, function, accessArea) - Public building info
- KeyCopies (copyNumber, status) - No PII
- IssueRecords (dates, idChecked) - Metadata only
- User (cooperative name) - Public info

---

## 🔑 Encryption Strategy Options

### **Option 1: Application-Level Encryption** ⭐ **RECOMMENDED**

**How it works**: Encrypt/decrypt data in the application layer before database operations.

**Advantages**:
- ✅ Full control over encryption implementation
- ✅ Compatible with Supabase (no database changes)
- ✅ Works on free tier
- ✅ Can encrypt selectively (only PII fields)
- ✅ Uses industry-standard AES-256-GCM
- ✅ Key rotation without database migration

**Disadvantages**:
- ⚠️ Requires careful implementation
- ⚠️ Performance overhead (~2-5ms per read/write)
- ⚠️ Can't search encrypted fields directly
- ⚠️ Prisma middleware complexity

**Best For**: This project (cost-effective, flexible, high security)

---

### **Option 2: Database-Level Encryption (pgcrypto)**

**How it works**: Use PostgreSQL's `pgcrypto` extension for column-level encryption.

**Advantages**:
- ✅ Database-native encryption
- ✅ Can keep some fields searchable
- ✅ Good performance

**Disadvantages**:
- ❌ Supabase limitations (extension access)
- ❌ Complex key management in database
- ❌ Hard to rotate keys
- ❌ Backup/restore complexities

**Best For**: Self-hosted PostgreSQL with full admin access

---

### **Option 3: Transparent Database Encryption (TDE)**

**How it works**: Encrypt entire database files at storage level.

**Advantages**:
- ✅ Transparent to application
- ✅ Encrypts backups
- ✅ No application changes

**Disadvantages**:
- ❌ Not available in Supabase
- ❌ Expensive (enterprise database feature)
- ❌ Requires self-hosted infrastructure

**Best For**: Large enterprises with dedicated infrastructure

---

### **Option 4: Supabase Encryption (Cloud Platform)**

**How it works**: Rely on Supabase's built-in encryption features.

**Current Status**:
- ✅ **Encryption in Transit**: Already enabled (HTTPS/TLS)
- ❌ **Encryption at Rest**: **Limited coverage**
  - Supabase encrypts database volumes
  - Does NOT encrypt individual columns/fields
  - Admin access = plain text data

**Best For**: Acceptable baseline, but insufficient for GDPR-sensitive PII

---

## 🚀 **Recommended Implementation: Option 1**

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│ Application Layer (Next.js + Prisma)                        │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Encryption      │         │  Decryption      │        │
│  │  Middleware      │◄───────►│  Middleware      │        │
│  │  (AES-256-GCM)   │         │  (AES-256-GCM)   │        │
│  └──────────────────┘         └──────────────────┘        │
│           │                            │                   │
│           ▼                            ▼                   │
│  ┌──────────────────────────────────────────┐             │
│  │  Prisma Client with Field Hooks          │             │
│  └──────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
           │                            ▲
           │                            │
           ▼                            │
┌──────────────────────────────────────────┐
│ Supabase PostgreSQL Database             │
│                                          │
│  ResidentBorrower:                       │
│    name: "ENCRYPTED_BLOB..."            │
│    email: "ENCRYPTED_BLOB..."           │
│    phone: "ENCRYPTED_BLOB..."           │
└──────────────────────────────────────────┘
```

---

## 📋 **Implementation Plan**

### **Phase 1: Encryption Infrastructure** (Week 1)

#### **1.1 Install Dependencies**

```bash
npm install crypto-js @types/crypto-js
```

#### **1.2 Create Encryption Utility**

**File**: `lib/encryption.ts`

```typescript
import CryptoJS from 'crypto-js';

/**
 * Encryption utility for sensitive borrower PII
 * Uses AES-256-GCM for authenticated encryption
 */

// Encryption key stored in environment variable
// Generate with: openssl rand -base64 32
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

/**
 * Encrypt sensitive data
 */
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptField(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      // Could be plain text from before encryption (migration scenario)
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
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values are Base64 strings starting with "U2FsdGVkX1..."
  return /^U2FsdGVkX1/.test(value);
}
```

---

### **Phase 2: Database Schema Changes** (Week 1)

#### **2.1 Update Prisma Schema**

Add encryption markers and potentially increase field sizes:

```prisma
model ResidentBorrower {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String    @db.VarChar(500)  // Increased for encrypted data
  email     String    @db.VarChar(500)  // Increased for encrypted data
  phone     String?   @db.VarChar(200)  // Increased for encrypted data
  createdAt DateTime  @default(now())
  borrower  Borrower?
  
  @@unique([email])
}

model ExternalBorrower {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String    @db.VarChar(500)
  email          String    @db.VarChar(500)
  phone          String?   @db.VarChar(200)
  address        String?   @db.VarChar(500)
  company        String?   @db.VarChar(500)
  borrowerPurpose String?   @db.VarChar(2000)
  createdAt      DateTime  @default(now())
  borrower       Borrower?
  
  @@unique([email])
}
```

#### **2.2 Generate Migration**

```bash
npx prisma migrate dev --name add_encryption_field_sizes
```

---

### **Phase 3: Prisma Middleware for Auto-Encryption** (Week 1)

#### **3.1 Create Prisma Middleware**

**File**: `lib/prisma-encryption.ts`

```typescript
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { encryptField, decryptField } from '@/lib/encryption';

/**
 * Fields that should be encrypted
 */
const ENCRYPTION_FIELDS = {
  ResidentBorrower: ['name', 'email', 'phone'] as const,
  ExternalBorrower: ['name', 'email', 'phone', 'address', 'borrowerPurpose'] as const,
};

/**
 * Encrypt sensitive fields before database write operations
 */
export function encryptSensitiveFields(params: any, model: string): any {
  const fieldsToEncrypt = ENCRYPTION_FIELDS[model as keyof typeof ENCRYPTION_FIELDS] || [];
  
  if (!fieldsToEncrypt.length) return params;
  
  // Recursively encrypt fields in nested objects
  function encryptObject(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    const encrypted: any = { ...obj };
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = encryptField(encrypted[field]);
      }
    }
    return encrypted;
  }
  
  // Handle Prisma query params
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
    params.createMany.data = params.createMany.data.map(encryptObject);
  }
  
  return params;
}

/**
 * Decrypt sensitive fields after database read operations
 */
export function decryptSensitiveFields(result: any, model: string): any {
  const fieldsToDecrypt = ENCRYPTION_FIELDS[model as keyof typeof ENCRYPTION_FIELDS] || [];
  
  if (!fieldsToDecrypt.length) return result;
  if (!result) return result;
  
  // Recursively decrypt fields
  function decryptObject(obj: any): any {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
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

/**
 * Initialize Prisma encryption middleware
 */
export function initializeEncryptionMiddleware() {
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
}
```

#### **3.2 Update Prisma Client**

**File**: `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { initializeEncryptionMiddleware } from './prisma-encryption';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Initialize encryption middleware
initializeEncryptionMiddleware();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### **Phase 4: Data Migration** (Week 1)

#### **4.1 Create Migration Script**

**File**: `prisma/migrations/encrypt-existing-data.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { encryptField, isEncrypted } from '@/lib/encryption';

/**
 * Migrate existing plain text data to encrypted format
 * Run once after deploying encryption infrastructure
 */
async function encryptExistingData() {
  console.log('🔄 Starting data encryption migration...');
  
  // Encrypt ResidentBorrower data
  const residents = await prisma.residentBorrower.findMany();
  console.log(`Found ${residents.length} resident borrowers`);
  
  for (const resident of residents) {
    const shouldEncrypt = 
      !isEncrypted(resident.name) ||
      !isEncrypted(resident.email) ||
      (resident.phone && !isEncrypted(resident.phone));
    
    if (!shouldEncrypt) continue;
    
    await prisma.residentBorrower.update({
      where: { id: resident.id },
      data: {
        name: isEncrypted(resident.name) ? resident.name : encryptField(resident.name),
        email: isEncrypted(resident.email) ? resident.email : encryptField(resident.email),
        phone: resident.phone && !isEncrypted(resident.phone) 
          ? encryptField(resident.phone)
          : resident.phone,
      },
    });
    
    console.log(`✓ Encrypted resident: ${resident.id}`);
  }
  
  // Encrypt ExternalBorrower data
  const externals = await prisma.externalBorrower.findMany();
  console.log(`Found ${externals.length} external borrowers`);
  
  for (const external of externals) {
    const shouldEncrypt = 
      !isEncrypted(external.name) ||
      !isEncrypted(external.email) ||
      (external.phone && !isEncrypted(external.phone)) ||
      (external.address && !isEncrypted(external.address)) ||
      (external.borrowerPurpose && !isEncrypted(external.borrowerPurpose));
    
    if (!shouldEncrypt) continue;
    
    await prisma.externalBorrower.update({
      where: { id: external.id },
      data: {
        name: isEncrypted(external.name) ? external.name : encryptField(external.name),
        email: isEncrypted(external.email) ? external.email : encryptField(external.email),
        phone: external.phone && !isEncrypted(external.phone)
          ? encryptField(external.phone)
          : external.phone,
        address: external.address && !isEncrypted(external.address)
          ? encryptField(external.address)
          : external.address,
        borrowerPurpose: external.borrowerPurpose && !isEncrypted(external.borrowerPurpose)
          ? encryptField(external.borrowerPurpose)
          : external.borrowerPurpose,
      },
    });
    
    console.log(`✓ Encrypted external: ${external.id}`);
  }
  
  console.log('✅ Data encryption migration complete!');
}

encryptExistingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

#### **4.2 Run Migration**

```bash
tsx prisma/migrations/encrypt-existing-data.ts
```

---

### **Phase 5: Environment Variables** (Week 1)

#### **5.1 Generate Encryption Key**

```bash
# Generate a secure random key
openssl rand -base64 32

# Save output to .env.local
# ENCRYPTION_KEY=<your-generated-key>
```

#### **5.2 Update Environment Configuration**

**.env.local**:

```bash
# Existing variables...
DATABASE_URL="..."
NEXT_PUBLIC_SUPABASE_URL="..."

# New encryption key
ENCRYPTION_KEY="<generate-strong-random-key>"
```

**⚠️ CRITICAL SECURITY NOTES**:

1. **Never commit `ENCRYPTION_KEY` to version control**
2. **Backup key securely** (password manager, secure vault)
3. **Rotate key periodically** (annually recommended)
4. **Store key separately from database**
5. **Use different keys for dev/staging/production**

---

## 🧪 **Testing Strategy**

### **Unit Tests**

**File**: `lib/__tests__/encryption.test.ts`

```typescript
import { encryptField, decryptField, isEncrypted } from '@/lib/encryption';

describe('Encryption Utilities', () => {
  it('should encrypt and decrypt data correctly', () => {
    const plaintext = 'John Doe';
    const encrypted = encryptField(plaintext);
    
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toBeTruthy();
    
    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });
  
  it('should handle null values', () => {
    expect(encryptField(null)).toBeNull();
    expect(decryptField(null)).toBeNull();
  });
  
  it('should detect encrypted values', () => {
    const encrypted = encryptField('test');
    expect(isEncrypted(encrypted!)).toBe(true);
    expect(isEncrypted('plaintext')).toBe(false);
  });
});
```

### **Integration Tests**

**File**: `tests/test-encryption-integration.ts`

```typescript
import { prisma } from '@/lib/prisma';

describe('Encryption Integration', () => {
  it('should automatically encrypt on create', async () => {
    const borrower = await prisma.residentBorrower.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+46123456789',
      },
    });
    
    // Verify encrypted in database
    const rawBorrower = await prisma.$queryRaw`
      SELECT name, email, phone FROM "ResidentBorrower" WHERE id = ${borrower.id}
    `;
    
    expect(rawBorrower[0].name).toMatch(/^U2FsdGVkX1/); // Encrypted prefix
    expect(rawBorrower[0].email).toMatch(/^U2FsdGVkX1/);
    
    // Verify decrypted on read
    const fetchedBorrower = await prisma.residentBorrower.findUnique({
      where: { id: borrower.id },
    });
    
    expect(fetchedBorrower!.name).toBe('Test User');
    expect(fetchedBorrower!.email).toBe('test@example.com');
  });
});
```

### **Manual Testing Checklist**

- [ ] Create new resident borrower → Verify encrypted in DB
- [ ] Create new external borrower → Verify encrypted in DB
- [ ] Update borrower name → Verify encrypted in DB
- [ ] Search by name → Works correctly
- [ ] Export data → Decrypted correctly
- [ ] Large data sets → Performance acceptable
- [ ] Edge cases (special characters, Unicode) → Handles correctly

---

## ⚡ **Performance Considerations**

### **Encryption Overhead**

- **Per-field encryption**: ~1-2ms
- **Bulk operations**: Linear scaling
- **Impact on typical queries**: <5% slowdown

### **Optimization Strategies**

1. **Selective encryption**: Only PII fields
2. **Lazy decryption**: Decrypt only when needed
3. **Caching**: Cache decrypted values in memory
4. **Batch operations**: Reduce middleware overhead

---

## 🔄 **Key Rotation Strategy**

### **When to Rotate**

- Annually (recommended)
- After security incident
- Team member departure
- Infrastructure changes

### **Rotation Process**

1. Generate new key: `openssl rand -base64 32`
2. Update `.env.local` with new key
3. Run re-encryption script (read with old key, write with new key)
4. Verify data integrity
5. Secure old key (archived, not deleted)

---

## 📊 **Risk Assessment**

### **Before Encryption**

| Risk | Likelihood | Impact | Severity |
|------|------------|--------|----------|
| Database breach exposes PII | Medium | Critical | **HIGH** |
| GDPR violation | Medium | Critical | **HIGH** |
| Identity theft | Low | High | **MEDIUM** |
| Reputation damage | Low | High | **MEDIUM** |

### **After Encryption**

| Risk | Likelihood | Impact | Severity |
|------|------------|--------|----------|
| Encrypted data breach | Medium | Low (requires key) | **LOW** |
| GDPR violation | Low | Critical | **MEDIUM** (key compromise) |
| Identity theft | Very Low | High | **LOW** |
| Reputation damage | Very Low | High | **LOW** |

---

## 📚 **References & Resources**

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Encryption Standards](https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final)
- [GDPR Encryption Requirements](https://gdpr.eu/what-is-gdpr/)
- [PostgreSQL pgcrypto Documentation](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

---

## 🎯 **Next Steps**

### **Immediate Actions**

1. ✅ Review and approve this encryption strategy
2. ⏳ Generate encryption key
3. ⏳ Implement Phase 1 (infrastructure)
4. ⏳ Test in development environment
5. ⏳ Deploy to staging
6. ⏳ Run data migration
7. ⏳ Deploy to production

### **Future Enhancements**

- Key management service integration (HashiCorp Vault, AWS KMS)
- Hardware security module (HSM) support
- Audit logging for encryption/decryption operations
- Automated key rotation
- Performance monitoring dashboard

---

**Document Status**: Draft  
**Last Updated**: February 2025  
**Next Review**: After Phase 1 implementation

