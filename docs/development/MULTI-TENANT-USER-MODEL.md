# Multi-Tenant User Model Design

## 🏢 Current Architecture

### Entity (Tenant/Organization)
```prisma
model Entity {
  id              String   @id @default(uuid())
  name            String   @unique  // "Brf Solrosen"
  encryptionKey   String   // Per-entity encryption
  users           User[]   // Multiple users per entity
  keyTypes        KeyType[]
  borrowers       Borrower[]
  issueRecords    IssueRecord[]
}
```

### User (Team Member)
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique  // Global uniqueness
  name         String?
  entityId     String   // Which organization they belong to
  role         UserRole // OWNER | ADMIN | MEMBER
  entity       Entity   @relation(...)
}

enum UserRole {
  OWNER   // Full control, can delete entity, manage billing
  ADMIN   // Can manage keys, users, settings
  MEMBER  // Can view and issue keys
}
```

## 🎯 Key Design Decisions

### 1. **Email Uniqueness: Global vs Per-Entity**

#### Current: Global Unique ✅
```prisma
email String @unique  // One email = one user across entire system
```

**Scenario**:
- `anders@gmail.com` → User in "Brf Solrosen"
- `anders@gmail.com` → **Cannot** join "Brf Ekeby" with same email

**Pros**:
- ✅ Simple Supabase auth integration (1 auth account = 1 user)
- ✅ User logs in once, sees their entity
- ✅ No email collision issues
- ✅ Standard SaaS pattern

**Cons**:
- ❌ User can't belong to multiple entities
- ❌ Same person needs different emails for different entities

#### Alternative: Per-Entity Unique ⚠️
```prisma
email    String
entityId String

@@unique([email, entityId])  // Same email allowed in different entities
```

**Scenario**:
- `anders@gmail.com` → User in "Brf Solrosen" (OWNER)
- `anders@gmail.com` → User in "Brf Ekeby" (MEMBER)

**Pros**:
- ✅ User can belong to multiple entities
- ✅ Single login shows entity switcher
- ✅ More flexible for consultants/managers

**Cons**:
- ❌ Complex auth mapping (1 Supabase user → multiple DB users)
- ❌ Need entity context on every request
- ❌ More complex UI (entity switcher)

### 2. **Standard Multi-Tenant Patterns**

#### Pattern A: Single Entity per User (Current) ✅

```
User 1:1 Entity
└─ One user belongs to ONE entity
└─ Simplest model
└─ Common for small businesses
```

**Example**:
```typescript
// User always has exactly one entity
const { entityId } = await getCurrentUser();
const keys = await prisma.keyType.findMany({
  where: { entityId },  // Automatic data isolation
});
```

**Use cases**:
- Housing cooperatives (users don't switch between buildings)
- Small businesses with dedicated staff
- Simple permission model

#### Pattern B: Many-to-Many (Future enhancement) 🔄

```prisma
model User {
  id           String
  email        String @unique
  memberships  EntityMembership[]
}

model EntityMembership {
  id       String
  userId   String
  entityId String
  role     UserRole
  user     User     @relation(...)
  entity   Entity   @relation(...)
  
  @@unique([userId, entityId])
}

model Entity {
  id          String
  name        String
  memberships EntityMembership[]
}
```

**Example**:
```typescript
// User can belong to multiple entities
const user = await getCurrentUser();
const memberships = await prisma.entityMembership.findMany({
  where: { userId: user.id },
  include: { entity: true },
});

// Select active entity from UI
const currentEntityId = session.get('activeEntityId');
```

**Use cases**:
- Consultants managing multiple cooperatives
- Property managers overseeing multiple buildings
- Users with multiple roles in different organizations

## 🎯 Recommended Approach for Your Use Case

### Keep Current Model (Pattern A) ✅

**Why**:
1. **Housing cooperatives** - Residents typically belong to ONE building
2. **Simpler UX** - No entity switching needed
3. **Better security** - Clear data boundaries
4. **Supabase alignment** - 1 auth user = 1 DB user = 1 entity

### User Roles Hierarchy

```typescript
enum UserRole {
  OWNER   // Can do EVERYTHING
  ADMIN   // Can manage operations
  MEMBER  // Can use the system
}

// Role hierarchy
const roleHierarchy = {
  OWNER: 3,   // Highest
  ADMIN: 2,
  MEMBER: 1,  // Lowest
};
```

#### OWNER Permissions
- ✅ Add/remove users
- ✅ Change entity settings
- ✅ Delete entity
- ✅ Manage billing (future)
- ✅ View audit logs
- ✅ All ADMIN permissions

#### ADMIN Permissions
- ✅ Manage keys and key types
- ✅ Issue/return keys
- ✅ Manage borrowers
- ✅ View reports
- ✅ All MEMBER permissions

#### MEMBER Permissions
- ✅ View keys
- ✅ Issue/return keys (basic operations)
- ✅ View borrower list
- ❌ Cannot manage key types
- ❌ Cannot manage users

### Implementation Example

```typescript
// lib/auth-utils.ts
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) throw new Error('Not authenticated');

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },  // Global unique lookup
    select: { 
      id: true, 
      email: true,
      entityId: true,  // User's organization
      role: true,      // User's role in that organization
      entity: {
        select: { name: true }
      }
    },
  });
  
  if (!dbUser) throw new Error('USER_NOT_IN_DB');
  return dbUser;
}

// Usage in server actions
export async function deleteKeyType(id: string) {
  const user = await getCurrentUser();
  
  // Check role
  if (!['OWNER', 'ADMIN'].includes(user.role)) {
    return { success: false, error: 'Permission denied' };
  }
  
  // Delete with entity isolation
  await prisma.keyType.delete({
    where: { 
      id,
      entityId: user.entityId,  // Ensure user owns this data
    },
  });
  
  return { success: true };
}
```

## 📊 Comparison Table

| Aspect | Global Unique Email | Per-Entity Unique |
|--------|-------------------|-------------------|
| **Auth Model** | 1 Supabase user = 1 DB user | 1 Supabase user = N DB users |
| **Complexity** | Simple | Complex |
| **Entity Switching** | Not needed | Required |
| **Use Case** | Single organization membership | Multiple organization membership |
| **Data Isolation** | Automatic via entityId | Manual via context |
| **Our Scenario** | ✅ Perfect fit | ❌ Over-engineered |

## 🎯 Final Schema Recommendation

```prisma
model Entity {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String        @unique
  encryptionKey   String        @db.Text
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  users           User[]
  borrowers       Borrower[]
  keyTypes        KeyType[]
  issueRecords    IssueRecord[]
}

model User {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String        @unique  // ← Global unique (Supabase email)
  name         String?
  entityId     String        @db.Uuid
  role         UserRole      @default(MEMBER)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  entity       Entity        @relation(fields: [entityId], references: [id], onDelete: Cascade)
  issueRecords IssueRecord[] // Audit trail of who issued keys

  @@index([entityId])
}

enum UserRole {
  OWNER   // First user, full control
  ADMIN   // Can manage everything except billing/users
  MEMBER  // Can use the system
}
```

**Key Points**:
1. ✅ Remove `auth_id` field (not needed)
2. ✅ Keep email globally unique
3. ✅ One user = one entity (simple model)
4. ✅ Role-based permissions within entity
5. ✅ First registered user becomes OWNER

## 🚀 User Invitation Flow (Future)

When you want to add users to an existing entity:

```typescript
// Step 1: OWNER creates invitation
await prisma.invitation.create({
  data: {
    entityId: owner.entityId,
    email: 'newuser@example.com',
    role: 'MEMBER',
    token: generateToken(),
    expiresAt: addDays(new Date(), 7),
  },
});

// Step 2: Send invitation email with link
// /auth/accept-invitation?token=abc123

// Step 3: User registers with that email
// Registration checks for pending invitation
const invitation = await prisma.invitation.findFirst({
  where: { 
    email: user.email,
    expiresAt: { gt: new Date() },
    accepted: false,
  },
});

if (invitation) {
  // Join existing entity
  await prisma.user.create({
    data: {
      email: user.email,
      entityId: invitation.entityId,
      role: invitation.role,
    },
  });
} else {
  // Create new entity (first user scenario)
  const entity = await createNewEntity();
  await prisma.user.create({
    data: {
      email: user.email,
      entityId: entity.id,
      role: 'OWNER',
    },
  });
}
```

## 📝 Summary

**For your housing cooperative use case:**

✅ **Keep it simple**:
- Global unique email
- One user = one entity
- Role-based permissions
- Remove `auth_id` field
- Email lookup only

This matches standard SaaS patterns and works perfectly for your domain where residents belong to one building.

**Future enhancement**: If you need multi-entity support later (e.g., for property management companies), implement the `EntityMembership` junction table. But start simple!




