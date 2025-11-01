# Entity-Based Multi-User Migration Impact Analysis

## Overview

This document analyzes the impact of transitioning from the current per-user cooperative model to an entity-based multi-user architecture with per-entity encryption.

---

## 📊 Current vs Proposed Schema

### **Current Schema (Per-User Model)**

```prisma
model User {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String        @unique
  name         String?
  cooperative  String        // Org name stored here
  auth_id      String?       @db.Uuid
  borrowers    Borrower[]
  keyTypes     KeyType[]
  issueRecords IssueRecord[]
}

model Borrower {
  id          String              @id
  userId      String              @db.Uuid  // Points to User
  // ...
}

model KeyType {
  id         String    @id
  userId     String    @db.Uuid  // Points to User
  // ...
}

model IssueRecord {
  id         String    @id
  userId     String    @db.Uuid  // Points to User
  // ...
}
```

**Problem**: No way to have multiple users for same cooperative without duplicating data.

---

### **Proposed Schema (Entity-Based Model)**

```prisma
model Entity {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @unique @db.VarChar(200)
  encryptionKey   String    @db.Text  // Per-entity encryption key (encrypted)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  users           User[]
  borrowers       Borrower[]
  keyTypes        KeyType[]
  issueRecords    IssueRecord[]
}

model User {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email           String        @unique
  name            String?       @db.VarChar(100)
  auth_id         String?       @db.Uuid
  role            UserRole      @default(MEMBER)
  entityId        String        @db.Uuid  // Belongs to Entity
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  entity          Entity        @relation(fields: [entityId], references: [id], onDelete: Cascade)
  issueRecords    IssueRecord[]
  
  @@index([entityId])
  @@index([auth_id])
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
}

model Borrower {
  id          String              @id
  entityId    String              @db.Uuid  // Changed: Points to Entity
  // ...
}

model KeyType {
  id         String    @id
  entityId   String    @db.Uuid  // Changed: Points to Entity
  // ...
}

model IssueRecord {
  id         String    @id
  entityId   String    @db.Uuid  // Changed: Points to Entity
  userId     String?   @db.Uuid  // Track which user performed action (optional)
  // ...
}
```

---

## 🔄 Key Changes

### **What Changes**

| Aspect | Current | Proposed | Impact |
|--------|---------|----------|--------|
| **Organization** | `User.cooperative` (string) | `Entity` model | 🔴 Major |
| **Data ownership** | `userId` everywhere | `entityId` everywhere | 🔴 Major |
| **User structure** | Single user per org | Multiple users per entity | 🟠 Medium |
| **Encryption** | Shared key | Per-entity key | 🟠 Medium |
| **Auth lookup** | Same | Same | ✅ None |
| **RLS policies** | By userId | By entityId | 🟠 Medium |

---

## 📁 Files That Need Changes

### **🔴 Critical Changes (High Impact)**

#### **1. Database Schema**
- **File**: `prisma/schema.prisma`
- **Changes**:
  - Add `Entity` model
  - Add `UserRole` enum
  - Refactor `User` model (remove `cooperative`, add `entityId`, `role`)
  - Change `Borrower.userId` → `Borrower.entityId`
  - Change `KeyType.userId` → `KeyType.entityId`
  - Change `IssueRecord.userId` → `IssueRecord.entityId` (still keep for audit)
  - Add indexes for `entityId`
- **Impact**: Schema migration required

#### **2. RLS Policies**
- **Files**: All RLS policies in Supabase
- **Current**: `WHERE userId = auth.uid()`
- **New**: `WHERE entityId IN (SELECT entityId FROM User WHERE auth_id = auth.uid())`
- **Impact**: All 18 policies need updates

### **🟠 Medium Changes (Core Logic)**

#### **3. User Lookup Pattern**
- **Files**: `app/actions/*.ts`, `app/(dashboard)/**/*.tsx`
- **Current**:
```typescript
async function getCurrentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  
  const userRecord = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  return userRecord.id;
}
```

- **New**:
```typescript
async function getCurrentEntity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  
  const userRecord = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, entityId: true, role: true },
  });
  if (!userRecord) throw new Error('User not found');
  return userRecord; // Returns { id, entityId, role }
}

// Or just entityId
async function getCurrentEntityId() {
  const entity = await getCurrentEntity();
  return entity.entityId;
}
```

- **Impact**: ~15-20 files need updates

#### **4. Query Filters**
- **Files**: `app/actions/*.ts`
- **Current**: `where: { userId }`
- **New**: `where: { entityId }`
- **Pattern**: `where: { entityId }` replaces `where: { userId }`
- **Impact**: All query filters need updates (~50+ locations)

**Example Changes**:

```typescript
// BEFORE
const keyTypes = await prisma.keyType.findMany({
  where: { userId },
});

// AFTER
const keyTypes = await prisma.keyType.findMany({
  where: { entityId },
});
```

### **🟡 Low Changes (UI/Helpers)**

#### **5. Registration Flow**
- **Files**: `app/actions/registerUser.ts`, `app/auth/register/page.tsx`, `app/auth/complete-profile/page.tsx`
- **Current**: Create User with cooperative name
- **New**: Create Entity, then User linked to Entity
- **Impact**: Registration logic changes

```typescript
// BEFORE
await prisma.user.create({
  data: {
    email,
    cooperative, // Store org name here
    auth_id: authUserId,
  },
});

// AFTER
// 1. Create entity with encryption key
const entityKey = generateEntityKey();
const entity = await prisma.entity.create({
  data: {
    name: cooperative,
    encryptionKey: encryptEntityKey(entityKey),
  },
});

// 2. Create user linked to entity
await prisma.user.create({
  data: {
    email,
    entityId: entity.id,
    role: 'OWNER', // First user is owner
    auth_id: authUserId,
  },
});
```

#### **6. Dashboard Layout**
- **Files**: `app/(dashboard)/layout.tsx`
- **Current**: Fetches user, displays `user.cooperative`
- **New**: Fetch entity, display `entity.name`
- **Impact**: Display logic changes

```typescript
// BEFORE
const user = await prisma.user.findUnique({
  where: { email: userEmail },
  select: { cooperative: true },
});

// AFTER
const user = await prisma.user.findUnique({
  where: { email: userEmail },
  select: { 
    entity: {
      select: { name: true }
    }
  },
});
```

#### **7. Encryption Middleware**
- **Files**: `lib/prisma-encryption.ts`
- **Current**: Uses single `ENCRYPTION_KEY` from env
- **New**: Lookup entity's encryption key per operation
- **Impact**: Significant complexity increase

```typescript
// BEFORE
const encrypted = encryptField(value, ENCRYPTION_KEY);

// AFTER
const entityId = await getCurrentEntityId();
const entity = await prisma.entity.findUnique({
  where: { id: entityId },
  select: { encryptionKey: true },
});
const entityKey = decryptEntityKey(entity.encryptionKey);
const encrypted = encryptField(value, entityKey);
```

---

## 📊 Impact Summary by File Type

| File Type | Files | Changes | Complexity |
|-----------|-------|---------|------------|
| **Schema** | 1 | Add Entity, refactor relations | 🔴 High |
| **Actions** | 4-5 | Update getCurrentUser, filters | 🟠 Medium |
| **Pages** | 3-4 | Update layout, registration | 🟠 Medium |
| **Encryption** | 1 | Per-entity key lookup | 🔴 High |
| **RLS** | 18 | New policies | 🔴 High |
| **Tests** | 8-10 | Update test data | 🟠 Medium |
| **Utils** | 2-3 | Update helpers | 🟡 Low |

**Total Estimated**: ~40-50 files need modifications

---

## 🚨 Breaking Changes

### **What Breaks Immediately**

1. **Existing RLS policies** - Queries fail until policies updated
2. **All queries using `userId`** - Return no data until filters updated
3. **Registration flow** - New users can't sign up
4. **Encryption** - Won't work until per-entity key implementation
5. **Dashboard** - Can't display organization name
6. **All tests** - Query patterns change

### **Migration Strategy Required**

Since this touches core patterns, you need:

1. **Schema migration** + data migration
2. **Gradual rollout** (copy production to staging)
3. **Parallel running** (old queries still work during transition)
4. **Rollback plan** if issues occur

---

## 💡 Simpler Alternative Approach

### **Option: Keep Simple Model, Add Multi-User Later**

Instead of full Entity model, consider **gradual enhancement**:

#### **Phase 1: Minimal Multi-User (Start Here)**

```prisma
model User {
  id           String        @id
  email        String        @unique
  name         String?
  cooperative  String        // Keep for now
  role         UserRole      @default(ADMIN)  // Add role only
  auth_id      String?       @db.Uuid
  
  // New: Link users to same org
  organizationId  String?    @db.Uuid
  organization    Organization? @relation(fields: [organizationId], references: [id])
  
  borrowers    Borrower[]
  keyTypes     KeyType[]
  issueRecords IssueRecord[]
}

model Organization {
  id              String    @id
  name            String    @unique
  cooperative     String    // "Testgården BF"
  encryptionKey   String?   // Optional, can add later
  createdAt       DateTime  @default(now())
  
  users           User[]
}

enum UserRole {
  ADMIN   // Can do everything (current behavior)
  VIEWER  // Read-only (add later)
}
```

**Benefits**:
- ✅ Minimal schema changes
- ✅ Existing data works (backward compatible)
- ✅ Add encryption per-org later
- ✅ Gradual migration path
- ✅ Test multi-user demand first

**Query Changes**:
```typescript
// Get org data via user
const user = await getCurrentUser();
const borrowers = await prisma.borrower.findMany({
  where: { 
    user: {
      organizationId: user.organizationId  // Filter by org
    }
  },
});
```

---

## 🎯 Recommended Approach

### **Step 1: Test Multi-User Demand**

Before complex migration, **validate need**:

1. Deploy current encryption (simple approach)
2. Survey users: "Would you need multiple people managing keys?"
3. Wait 3-6 months
4. If demand exists → migrate to Entity model
5. If single admin works → keep it simple

### **Step 2: If Multi-User Needed**

**Gradual Migration Path**:

1. **Week 1**: Add `Organization` model (minimal)
2. **Week 2**: Migrate data, keep encryption simple
3. **Week 3**: Add role-based permissions
4. **Week 4**: Add per-entity encryption
5. **Week 5**: Testing and refinement

**V Alternative**: Do full Entity model in one migration (2-3 weeks)

---

## 📋 Decision Matrix

| Requirement | Simple Approach | Entity Approach | Hybrid |
|-------------|-----------------|-----------------|--------|
| **Encryption** | ✅ Shared key | ✅ Per-entity | ✅ Optional |
| **Multi-user** | ❌ No | ✅ Yes | ⚠️ Eventually |
| **Roles** | ❌ No | ✅ Yes | ⚠️ Eventually |
| **Migration** | ✅ None | 🔴 Full | 🟠 Gradual |
| **Complexity** | ✅ Low | 🔴 High | 🟠 Medium |
| **Timeline** | ✅ Now | ⏳ 2-3 weeks | ⏳ 1 week |

---

## 🚀 My Recommendation

**Start Simple, Evolve as Needed**

**Phase 1 (Now)**:
- Deploy shared encryption key
- RLS provides isolation
- Single admin per organization
- Monitor user feedback

**Phase 2 (If Needed)**:
- Add Organization model
- Support multiple users
- Keep encryption simple
- Add basic roles

**Phase 3 (Optional)**:
- Migrate to per-entity encryption
- Advanced role-based access
- Audit logging

**Why This Works**:
- ✅ Get encryption deployed NOW
- ✅ Validate multi-user demand
- ✅ Avoid over-engineering
- ✅ Easy to upgrade later
- ✅ No migration risk upfront

---

## 📚 Next Steps

1. **Review this analysis** - Understand the impact
2. **Choose approach** - Simple vs Entity
3. **If Entity**: Create detailed migration plan
4. **If Simple**: Add encryption key and deploy
5. **Monitor feedback** - Add features as needed

---

**Question**: Do you need multi-user support RIGHT NOW, or can you validate demand first?

