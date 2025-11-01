# Entity-Based Multi-User Architecture with Per-Entity Encryption

## Overview

This document outlines the design for transitioning from per-user cooperative model to an **entity/organization model** with **per-entity encryption keys** for enhanced security and multi-user support.

---

## 🎯 Goals

1. **Multi-User Support**: Allow organizations to have multiple users
2. **Per-Entity Encryption**: Each entity has its own encryption key
3. **Better Isolation**: Enhanced security between organizations
4. **Scalability**: Support growing organizations
5. **Backward Compatible**: Migrate existing users seamlessly

---

## 🏗️ Architecture Overview

### **Current Model**

```
User (cooperative: "Testgården")
├── Direct ownership of borrowers
├── Direct ownership of key types
└── Direct ownership of issue records

Problem: No multi-user support, shared encryption key
```

### **New Model**

```
Entity (Organization/Cooperative)
├── Has its own encryption key (ENCrypted)
├── Owns all borrowers
├── Owns all key types
└── Has multiple Users (admins/members)

User
├── Belongs to Entity
├── Has role (OWNER, ADMIN, MEMBER)
└── Can access entity's encrypted data

Benefits: Multi-user, per-entity encryption, role-based access
```

---

## 📊 Database Schema Changes

### **New Models**

```prisma
// Organization/Cooperative model (renamed from current User concept)
model Entity {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @db.VarChar(200)  // "Testgården Bostadsrättsförening"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Per-entity encryption key (encrypted with master key)
  encryptionKey   String    @db.Text  // AES-256-GCM encrypted
  
  // Relations
  users           User[]
  borrowers       Borrower[]
  keyTypes        KeyType[]
  issueRecords    IssueRecord[]
  
  @@unique([name])
}

// User model (refactored)
model User {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email           String    @unique
  name            String?   @db.VarChar(100)
  auth_id         String?   @db.Uuid  // Supabase auth ID
  role            UserRole  @default(MEMBER)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Belongs to entity
  entityId        String    @db.Uuid
  
  // Relations
  entity          Entity    @relation(fields: [entityId], references: [id], onDelete: Cascade)
  issueRecords    IssueRecord[]  // Track which user performed actions
  
  @@index([entityId])
  @@index([auth_id])
}

enum UserRole {
  OWNER   // Can manage users, delete entity
  ADMIN   // Can manage keys/borrowers, invite users
  MEMBER  // Can view and issue keys only
}

// Updated models to point to Entity instead of User
model Borrower {
  id              String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  affiliation     BorrowerAffiliation
  createdAt       DateTime            @default(now())
  entityId        String              @db.Uuid  // Changed from userId
  
  // Polymorphic relations
  residentBorrowerId String? @unique @db.Uuid
  externalBorrowerId String? @unique @db.Uuid
  
  // Relations
  entity          Entity              @relation(fields: [entityId], references: [id], onDelete: Cascade)
  residentBorrower ResidentBorrower?  @relation(fields: [residentBorrowerId], references: [id], onDelete: Cascade)
  externalBorrower ExternalBorrower?  @relation(fields: [externalBorrowerId], references: [id], onDelete: Cascade)
  issueRecords    IssueRecord[]
  
  @@index([entityId])
}

model KeyType {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  label      String    @db.VarChar(2)
  function   String    @db.VarChar(100)
  accessArea String?
  createdAt  DateTime  @default(now())
  entityId   String    @db.Uuid  // Changed from userId
  keyCopies  KeyCopy[]
  
  entity     Entity    @relation(fields: [entityId], references: [id], onDelete: Cascade)
  
  @@index([entityId])
}

model IssueRecord {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  keyCopyId    String    @db.Uuid
  borrowerId   String    @db.Uuid
  issuedDate   DateTime  @default(now())
  dueDate      DateTime?
  idChecked    Boolean   @default(false)
  returnedDate DateTime?
  createdAt    DateTime  @default(now())
  
  // Track both entity and user
  entityId     String    @db.Uuid
  userId       String?   @db.Uuid  // Which user issued it
  
  // Relations
  borrower     Borrower  @relation(fields: [borrowerId], references: [id], onDelete: Cascade)
  keyCopy      KeyCopy   @relation(fields: [keyCopyId], references: [id], onDelete: Cascade)
  entity       Entity    @relation(fields: [entityId], references: [id])
  user         User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([entityId])
  @@index([userId])
}
```

---

## 🔑 Per-Entity Encryption Implementation

### **Key Management Architecture**

```
┌────────────────────────────────────────────────────────┐
│ Master Encryption Key (ENCRYPTION_KEY env var)        │
│ - Used to encrypt entity keys                         │
│ - Never changes, never exposed                        │
└────────────────────────────────────────────────────────┘
                      │
                      ├─── Encrypts ──┐
                                      │
┌───────────────────────────────────────────────────┐
│ Entity A                                          │
│ - Name: "Testgården BF"                          │
│ - Entity Key (ENC): "ZGVkZW... (encrypted)"      │
│                                                    │
│ Used to encrypt:                                  │
│   - Borrower PII                                  │
│   - User data                                     │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│ Entity B                                          │
│ - Name: "Demo Co-op"                             │
│ - Entity Key (ENC): "YWJjZGZ... (encrypted)"     │
│                                                    │
│ Used to encrypt:                                  │
│   - Borrower PII                                  │
│   - User data                                     │
└───────────────────────────────────────────────────┘
```

### **How It Works**

1. **Entity Creation**: Generate new encryption key for entity
2. **Encrypt Key**: Store encrypted in database using master key
3. **User Registration**: User joins entity, gets entity key access
4. **Data Operations**: Use entity's key for encryption/decryption

### **Implementation**

```typescript
// lib/entity-encryption.ts

const MASTER_KEY = process.env.ENCRYPTION_KEY!;

/**
 * Generate a new encryption key for an entity
 */
export function generateEntityKey(): string {
  const key = crypto.randomBytes(32).toString('base64');
  return key;
}

/**
 * Encrypt an entity's key with master key
 */
export function encryptEntityKey(entityKey: string): string {
  return encryptField(entityKey, MASTER_KEY);
}

/**
 * Decrypt an entity's key from storage
 */
export function decryptEntityKey(encryptedKey: string): string {
  return decryptField(encryptedKey, MASTER_KEY);
}

/**
 * Get entity encryption key (decrypted for use)
 */
export async function getEntityEncryptionKey(entityId: string): Promise<string> {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: { encryptionKey: true },
  });
  
  if (!entity) {
    throw new Error('Entity not found');
  }
  
  return decryptEntityKey(entity.encryptionKey);
}

// Updated encryption middleware
export function initializeEntityEncryptionMiddleware() {
  prisma.$use(async (params, next) => {
    // Get entity from user context
    const entityKey = await getEntityEncryptionKey(params.entityId);
    
    // Encrypt/decrypt with entity's key
    // ... encryption logic using entityKey
  });
}
```

---

## 🔄 Migration Strategy

### **Phase 1: Schema Update**

1. Create `Entity` model
2. Add `entityId` to `Borrower`, `KeyType`, `IssueRecord`
3. Migrate existing `cooperative` string to `Entity` records
4. Create migration scripts

### **Phase 2: User Migration**

1. Each existing user becomes entity owner
2. Their cooperative becomes entity name
3. Existing data links to new entity
4. Update RLS policies to use `entityId`

### **Phase 3: Encryption Migration**

1. Generate encryption key for each entity
2. Encrypt and store in database
3. Migrate existing PII data to encrypted format
4. Update middleware to use per-entity keys

### **Phase 4: Multi-User Features**

1. User invitation system
2. Role-based access control
3. Entity management UI
4. Audit logging

---

## 🔒 Security Benefits

### **Enhanced Isolation**

- **Before**: One compromised key affects all entities
- **After**: Compromising one entity key only affects that entity

### **Key Rotation**

- **Before**: Rotating key requires re-encrypting ALL data
- **After**: Rotate per-entity independently

### **Audit Trail**

- Track which user performed actions
- Enhanced logging and monitoring
- Better compliance support

---

## 📋 Implementation Checklist

### **Database Changes**

- [ ] Create `Entity` model
- [ ] Add `UserRole` enum
- [ ] Refactor `User` model (add entityId, role)
- [ ] Update `Borrower`, `KeyType`, `IssueRecord` to use `entityId`
- [ ] Add indexes for performance
- [ ] Create migration scripts

### **Encryption Layer**

- [ ] Create entity key generation
- [ ] Implement master key encryption
- [ ] Update middleware for per-entity keys
- [ ] Add key rotation utilities
- [ ] Update tests

### **Application Layer**

- [ ] Update registration flow (create entity)
- [ ] Add entity context to all queries
- [ ] Implement user invitation system
- [ ] Add role-based permissions
- [ ] Update UI for multi-user

### **RLS Policies**

- [ ] Update policies to use `entityId`
- [ ] Add user role checks
- [ ] Test isolation between entities
- [ ] Add audit logging

---

## 📊 Example Migration Script

```typescript
// scripts/migrate-to-entity-model.ts

async function migrateToEntityModel() {
  console.log('🔄 Migrating to entity-based model...');
  
  // Get all unique cooperatives
  const users = await prisma.user.findMany({
    select: { id: true, email: true, cooperative: true },
  });
  
  const cooperatives = new Set(users.map(u => u.cooperative));
  console.log(`Found ${cooperatives.size} unique cooperatives`);
  
  // Create entities for each cooperative
  for (const cooperative of cooperatives) {
    const cooperativeUsers = users.filter(u => u.cooperative === cooperative);
    
    // Generate encryption key
    const entityKey = generateEntityKey();
    const encryptedKey = encryptEntityKey(entityKey);
    
    // Create entity
    const entity = await prisma.entity.create({
      data: {
        name: cooperative,
        encryptionKey: encryptedKey,
      },
    });
    
    console.log(`✅ Created entity: ${entity.name}`);
    
    // Migrate users to entity
    for (const user of cooperativeUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          entityId: entity.id,
          role: 'OWNER', // First user becomes owner
        },
      });
    }
    
    // Migrate borrowers
    await prisma.borrower.updateMany({
      where: { userId: { in: cooperativeUsers.map(u => u.id) } },
      data: { entityId: entity.id },
    });
    
    // Migrate key types
    await prisma.keyType.updateMany({
      where: { userId: { in: cooperativeUsers.map(u => u.id) } },
      data: { entityId: entity.id },
    });
    
    console.log(`  Migrated ${cooperativeUsers.length} users to entity`);
  }
  
  console.log('✅ Migration complete!');
}
```

---

## 📚 Next Steps

1. **Review Design**: Validate approach with stakeholders
2. **Create Branch**: `feature/entity-based-multi-user`
3. **Implement Phases**: Follow checklist above
4. **Test Thoroughly**: Multi-entity isolation
5. **Deploy Gradual**: Staging → Production

---

**Questions?** This is a significant architectural change. Review carefully before implementation.

