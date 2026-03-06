# Multi-Tenant Schema Impact Analysis

## Overview

Analyzing the impact of transitioning from a per-user cooperative model to a multi-tenant entity/organization model with support for multiple users per cooperative.

---

## 🔍 Current Schema Analysis

### **Current Structure**

```
User Table:
├── email (unique identifier)
├── cooperative (string - "Testgården BF")
├── auth_id (Supabase auth)
└── Relations:
    ├── borrowers (many)
    ├── keyTypes (many)
    └── issueRecords (many)

Problem:
❌ One user = one cooperative
❌ Cooperative is just a string, not normalized
❌ No way to have multiple users per organization
❌ Users can't be replaced without data loss
```

### **Data Ownership Flow**

```
Current:
Borrower → userId → User (cooperative: "ABC")
KeyType → userId → User (cooperative: "ABC")

If User A leaves and User B joins same cooperative:
❌ Must manually reassign all borrowers
❌ Must manually reassign all keyTypes
❌ No way to transfer ownership cleanly
❌ Issue records lose connection to original user
```

---

## 🎯 Proposed Multi-Tenant Structure

### **New Entity-Centric Model**

```
Entity Table (NEW):
├── id (UUID)
├── name ("Testgården Bostadsrättsförening")
├── encryptionKey (encrypted per-entity key)
└── Relations:
    ├── users[] (many)
    ├── borrowers[] (many)
    ├── keyTypes[] (many)
    └── issueRecords[] (many)

User Table (REFACTORED):
├── email (unique identifier)
├── name
├── auth_id
├── entityId → Entity (many-to-one)
├── role (OWNER/ADMIN/MEMBER)
└── Relations:
    └── issueRecords[] (track who did what)

Benefits:
✅ Multiple users per entity
✅ Entity owns all data
✅ Users can be added/removed independently
✅ Role-based access control
✅ Audit trail of user actions
```

---

## 🔄 Impact Analysis

### **1. Schema Changes Required**

#### **New Tables**

```prisma
model Entity {
  id            String    @id @default(uuid())
  name          String    @unique  // Cooperative name
  encryptionKey String    // Per-entity encryption key
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  users         User[]
  borrowers     Borrower[]
  keyTypes      KeyType[]
  issueRecords  IssueRecord[]
  
  @@index([name])
}
```

**New Enum**:

```prisma
enum UserRole {
  OWNER   // Full control, delete entity, manage users
  ADMIN   // Manage keys/borrowers, invite users
  MEMBER  // View and issue keys only
}
```

#### **Modified Tables**

**User**:
- ✅ Add: `entityId` (required foreign key)
- ✅ Add: `role` (enum)
- ❌ Remove: `cooperative` (string)
- ❌ Remove: `borrowers` (direct relation)
- ❌ Remove: `keyTypes` (direct relation)

**Borrower**:
- ❌ Remove: `userId`
- ✅ Add: `entityId` (FK to Entity)

**KeyType**:
- ❌ Remove: `userId`
- ✅ Add: `entityId` (FK to Entity)

**IssueRecord**:
- ✅ Add: `entityId` (required FK)
- ✅ Keep: `userId` (optional, for audit)

---

### **2. Migration Complexity**

#### **Data Migration Required**

```
Step 1: Create Entity records
  - Extract unique cooperatives from User table
  - Create Entity for each cooperative
  - Generate per-entity encryption keys

Step 2: Migrate User → Entity relationship
  - Set User.entityId based on cooperative string
  - Set first user per cooperative as OWNER
  - Remove cooperative string field

Step 3: Migrate Data Ownership
  - Borrower.userId → Borrower.entityId
  - KeyType.userId → KeyType.entityId
  - IssueRecord: Add entityId, keep userId

Step 4: RLS Policy Migration
  - Update all 18 policies to filter by entityId
  - Change from userId to entityId comparisons
  - Add role-based policy checks

Step 5: Re-encrypt with per-entity keys
  - Decrypt all PII with old shared key
  - Re-encrypt with entity-specific keys
  - Verify data integrity
```

**Migration Risk**: **HIGH** ⚠️  
**Estimated Time**: 2-3 weeks  
**Breaking Changes**: YES  

---

### **3. Application Code Impact**

#### **Changes Required**

**Server Actions** (High Impact):
- `getCurrentUserId()` → `getCurrentEntityId()`
- Update all queries to use `entityId` instead of `userId`
- Add role-based permission checks
- Update RLS policy usage

**Components** (Medium Impact):
- Update context providers
- Add role-based UI elements
- User management components

**Authentication** (Low Impact):
- Add entity context to auth flow
- Invitation system for new users

**Estimated Files to Change**: 30-50 files  
**Lines of Code**: 2,000-3,000 lines  

---

### **4. Security & Isolation**

#### **RLS Policy Changes**

**Current**:
```sql
-- Example: Only user sees their borrowers
CREATE POLICY "Users see own borrowers"
ON "Borrower" FOR SELECT
USING (auth.uid() = (
  SELECT auth_id FROM "User" WHERE id = borrower.userId
));
```

**New**:
```sql
-- Example: Users in same entity see entity's borrowers
CREATE POLICY "Users see entity borrowers"
ON "Borrower" FOR SELECT
USING (entityId IN (
  SELECT entityId FROM "User" WHERE auth_id = auth.uid()
));

-- Role-based: Only OWNER/ADMIN can create
CREATE POLICY "Admins can create borrowers"
ON "Borrower" FOR INSERT
WITH CHECK (
  entityId IN (
    SELECT entityId FROM "User" 
    WHERE auth_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);
```

**Policy Impact**: 
- ✅ Same number of policies (18)
- ⚠️ More complex logic (role checks)
- ✅ Better isolation per entity
- ✅ Audit trail via userId in IssueRecord

---

### **5. User Replacement Scenario**

#### **Current Model Problem**

```
Scenario: Key manager retires, new person takes over

Current Issue:
❌ Must create new User account
❌ All borrowers point to old userId
❌ All keyTypes point to old userId
❌ Must manually update hundreds of records
❌ Issue records lose connection to original user
❌ No way to transfer ownership cleanly
```

#### **New Model Solution**

```
Scenario: Key manager retires, new person takes over

New Solution:
✅ Create new User account in same Entity
✅ Give new user OWNER role
✅ All data stays with Entity (no changes needed)
✅ Issue records track userId for audit
✅ Old user can be removed or demoted to MEMBER
✅ No data migration required
✅ Clean transfer of ownership
```

---

### **6. Encryption Impact**

#### **Simple vs Advanced Approaches**

**Simple Approach (Current)**:
```
All Entities:
  ├── Share same ENCRYPTION_KEY
  └── RLS provides isolation

User Replacement:
  ✅ No impact - key stays same
  ❌ Key compromise affects all entities
```

**Advanced Approach (Proposed)**:
```
Each Entity:
  ├── Has own encryptionKey (encrypted with master)
  └── Total isolation from other entities

User Replacement:
  ✅ Entity key stays same
  ✅ Removed users lose access immediately
  ✅ Key compromise isolated to one entity
```

---

## 📋 Task Breakdown

### **Phase 1: Schema Migration** (1 week)

**Tasks**:
1. Create Entity model in schema
2. Add UserRole enum
3. Refactor User, Borrower, KeyType, IssueRecord
4. Generate Prisma migrations
5. Test migrations on staging

**Files**:
- `prisma/schema.prisma` - Major changes
- Migration files - New migrations

**Risk**: Medium (data migration)  
**Dependencies**: None

---

### **Phase 2: Data Migration** (3-5 days)

**Tasks**:
1. Create migration script
2. Extract cooperatives → Entity records
3. Migrate User relationships
4. Migrate Borrower/KeyType/IssueRecord ownership
5. Verify data integrity

**Files**:
- `prisma/migrations/migrate-to-entity.ts`
- `scripts/migrate-entities.ts`

**Risk**: High (data loss if incorrect)  
**Dependencies**: Phase 1 complete

---

### **Phase 3: RLS Policy Update** (2-3 days)

**Tasks**:
1. Update all 18 policies to use entityId
2. Add role-based policy checks
3. Test isolation between entities
4. Verify cross-entity access prevention

**Files**:
- SQL migration for RLS updates
- RLS test scripts

**Risk**: High (security if policies broken)  
**Dependencies**: Phase 2 complete

---

### **Phase 4: Application Code Updates** (1-2 weeks)

**Tasks**:
1. Update `getCurrentUserId()` → `getCurrentEntityId()`
2. Refactor all server actions
3. Update queries to use entityId
4. Add role-based checks
5. Update components
6. Add user management UI

**Files**:
- All action files (20+ files)
- Many component files (30+ files)
- Context providers
- UI components

**Risk**: Medium (bugs in refactoring)  
**Dependencies**: Phase 3 complete

---

### **Phase 5: Encryption Layer** (if advanced approach) (1 week)

**Tasks**:
1. Implement per-entity key generation
2. Update middleware for entity keys
3. Migrate encryption to per-entity
4. Test encryption/decryption

**Files**:
- `lib/entity-encryption.ts`
- `lib/prisma-encryption.ts`
- Migration script

**Risk**: Medium (data loss if keys wrong)  
**Dependencies**: Phase 4 complete

---

### **Phase 6: Testing & Validation** (1 week)

**Tasks**:
1. Integration tests for entity isolation
2. User replacement scenarios
3. Role-based access tests
4. Encryption verification
5. Performance testing
6. Security audit

**Files**:
- New integration tests
- Updated existing tests
- Security test scenarios

**Risk**: Low  
**Dependencies**: All phases complete

---

## 🔒 Security Considerations

### **Data Isolation**

**Current**:
- RLS filters by userId → User → cooperative (string)
- Single shared encryption key
- Isolation via RLS only

**New**:
- RLS filters by entityId
- Per-entity encryption keys (advanced)
- Isolation via RLS + encryption
- Role-based access control

### **User Removal Security**

**Current**:
- Removing user: Complex data reassignment
- No clean removal path
- Orphaned data possible

**New**:
- Remove user: Cascade to Entity if last user
- Clean removal: Just delete User record
- No data loss: Entity owns all data

---

## 📊 Complexity Assessment

| Aspect | Simple Approach | Advanced Approach |
|--------|----------------|-------------------|
| **Schema Changes** | ❌ None | ✅ Significant |
| **Migration** | ❌ None | ⚠️ Complex |
| **Code Changes** | ❌ None | ✅ Extensive |
| **Risk** | ✅ Low | ⚠️ High |
| **Testing** | ✅ Simple | ⚠️ Complex |
| **Timeline** | ✅ 0 weeks | ⚠️ 4-6 weeks |
| **Breaking Changes** | ✅ None | ❌ Yes |

---

## 💡 Recommendation

### **Start Simple, Upgrade When Needed**

**Why**:
1. Current cooperatives have **1 key manager** ✅
2. Simple approach works **now** ✅
3. Migration is **complex and risky** ⚠️
4. Upgrading later is **possible** ✅
5. No data loss during upgrade ✅

**Suggested Plan**:

**Phase 1 (Now)**:
- Deploy simple encryption approach
- Ship to production
- Validate with real users

**Phase 2 (When Needed)**:
- If demand for multi-user emerges
- Implement entity model
- Migrate existing data
- Add user management features

**Upgrade Triggers**:
- Cooperative requests multiple admins
- Need for role-based access
- Compliance requires per-entity keys
- User replacement becomes frequent

---

## 🎯 Answer to Your Questions

### **1. "Is that complicated?"**

**Yes, quite complex**:
- 4-6 weeks development time
- Data migration required
- 30-50 files to change
- RLS policy updates
- Testing overhead
- Risk of data loss

### **2. "How does that affect keys and entities?"**

**Borrowers & KeyTypes**: 
- Change from `userId` → `entityId`
- Owned by Entity now
- Multiple users can access same data

**Issue Records**:
- Track both `entityId` and `userId`
- Entity owns the record
- User tracked for audit trail

### **3. "User replacement scenario?"**

**Current**: Nightmare ❌
- Manual data reassignment
- Risk of data loss
- Broken audit trail

**New**: Seamless ✅
- No data changes needed
- Entity owns all data
- Clean user addition/removal
- Perfect audit trail

### **4. "Separate into tasks?"**

**Absolutely YES!** ✅

**Recommended Task Order**:

1. **Encryption Simple** (current branch) - Ship first
2. **Entity Model** (separate branch) - 2-3 weeks
3. **Multi-User Features** (separate branch) - 1 week
4. **Per-Entity Encryption** (separate branch) - 1 week

**Why separate**:
- Smaller, testable increments
- Lower risk per task
- Can ship value incrementally
- Easier rollback if issues
- Clear validation points

---

## 📝 Next Steps

### **Decision Point**

Choose your path:

**Option A: Deploy Simple Now**
- Branch: `feature/data-encryption-pii-protection` (current)
- Timeline: Deploy today
- Risk: Low
- Value: Immediate encryption

**Option B: Build Multi-Tenant**
- Branch: `feature/entity-multi-user` (new)
- Timeline: 4-6 weeks
- Risk: Medium-high
- Value: True multi-user support

**Option C: Both (Recommended)**
- Deploy simple now ✅
- Design multi-tenant 📐
- Implement when needed ⏳

---

**My strong recommendation**: Start with Option C. Deploy simple encryption now, then implement multi-tenant architecture when you have demand or better requirements clarity.

