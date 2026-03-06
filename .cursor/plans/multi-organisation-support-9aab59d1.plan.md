<!-- 9aab59d1-e65d-40cd-8f3b-56b1dd4c872c 601dd064-35ec-4e9c-8a09-68221551ebc1 -->
# Multi-Organisation Support Implementation

## Phase 1: Database Schema Changes

### 1.1 Create UserOrganisation Junction Table

**File:** `prisma/schema.prisma`

Replace the direct User → Entity relationship with many-to-many:

```prisma
model User {
  id                     String              @id @default(dbgenerated("gen_random_uuid()"))
  email                  String              @unique
  name                   String?
  activeOrganisationId   String?             @db.Uuid  // NEW: Track current org
  createdAt              DateTime            @default(now())
  updatedAt              DateTime            @updatedAt
  
  // Remove: entityId, role (moved to junction table)
  
  organisations          UserOrganisation[]  // NEW: Many-to-many
  activeOrganisation     Entity?             @relation("ActiveOrganisation", fields: [activeOrganisationId], references: [id])
  issueRecords           IssueRecord[]
  sentInvitations        Invitation[]
}

model UserOrganisation {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  userId         String   @db.Uuid
  organisationId String   @db.Uuid
  role           UserRole
  joinedAt       DateTime @default(now())
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organisation   Entity   @relation("OrganisationMembers", fields: [organisationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, organisationId])
  @@index([userId])
  @@index([organisationId])
}

model Entity {
  // Rename all references from "entity" to "organisation" in display
  id                String              @id @default(dbgenerated("gen_random_uuid()"))
  name              String              @db.VarChar(200)
  encryptionKey     String              @db.Text
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  members           UserOrganisation[]  @relation("OrganisationMembers")  // NEW
  activeForUsers    User[]              @relation("ActiveOrganisation")   // NEW
  borrowers         Borrower[]
  keyTypes          KeyType[]
  issueRecords      IssueRecord[]
  invitations       Invitation[]
  
  @@unique([name])
}
```

### 1.2 Update Invitation Model

```prisma
model Invitation {
  // Change entityId → organisationId (rename for consistency)
  organisationId String @db.Uuid
  organisation   Entity @relation(fields: [organisationId], references: [id])
}
```

## Phase 2: Migration Script

**File:** `prisma/migrations/xxx_multi_organisation_support.sql`

Create migration to:

1. Create `UserOrganisation` table
2. Migrate existing User records: copy (userId, entityId, role) → UserOrganisation
3. Set `activeOrganisationId` = current `entityId` for all users
4. Drop old columns: `User.entityId`, `User.role`

**File:** `scripts/migrate-to-multi-org.ts`

Verification script to ensure data integrity after migration.

## Phase 3: Update Auth Utilities

**File:** `lib/auth-utils.ts`

```typescript
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  activeOrganisationId: string;  // NEW: Current working org
  roleInActiveOrg: UserRole;      // NEW: Role in current org
  allOrganisations: Array<{       // NEW: All orgs user belongs to
    id: string;
    name: string;
    role: UserRole;
  }>;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) throw new Error('Not authenticated');
  
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      organisations: {
        include: {
          organisation: { select: { id: true, name: true } }
        }
      },
      activeOrganisation: { select: { id: true, name: true } }
    }
  });
  
  if (!dbUser) throw new Error('USER_NOT_IN_DB');
  if (!dbUser.activeOrganisationId) {
    // Set first org as active if none set
    const firstOrg = dbUser.organisations[0];
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { activeOrganisationId: firstOrg.organisationId }
    });
  }
  
  const activeOrgRelation = dbUser.organisations.find(
    o => o.organisationId === dbUser.activeOrganisationId
  );
  
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    activeOrganisationId: dbUser.activeOrganisationId!,
    roleInActiveOrg: activeOrgRelation!.role,
    allOrganisations: dbUser.organisations.map(o => ({
      id: o.organisationId,
      name: o.organisation.name,
      role: o.role
    }))
  };
}
```

## Phase 4: Organisation Switching

**File:** `app/actions/organisation.ts` (NEW)

```typescript
export async function switchOrganisation(organisationId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  
  // Verify user belongs to this org
  const membership = await prisma.userOrganisation.findUnique({
    where: { userId_organisationId: { userId: user.id, organisationId } }
  });
  
  if (!membership) {
    return { success: false, error: 'You are not a member of this organisation.' };
  }
  
  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrganisationId: organisationId }
  });
  
  revalidatePath('/');
  return { success: true };
}

export async function listUserOrganisations(): Promise<ActionResult<...>> {
  // Return all orgs user belongs to with roles
}
```

## Phase 5: Update Team Actions

**File:** `app/actions/team.ts`

Changes needed:

1. Update all queries: `entityId` → `user.activeOrganisationId`
2. Update `removeUser`: Check if last owner, require promotion first
3. Add `promoteToOwner` action
4. Add `leaveOrganisation` action with last-owner check
```typescript
export async function leaveOrganisation(): Promise<ActionResult> {
  const user = await getCurrentUser();
  
  // Check if user is owner
  const membership = await prisma.userOrganisation.findUnique({
    where: { 
      userId_organisationId: { 
        userId: user.id, 
        organisationId: user.activeOrganisationId 
      }
    }
  });
  
  if (membership?.role === 'OWNER') {
    // Count total owners
    const ownerCount = await prisma.userOrganisation.count({
      where: { 
        organisationId: user.activeOrganisationId,
        role: 'OWNER'
      }
    });
    
    if (ownerCount === 1) {
      return { 
        success: false, 
        error: 'You are the last owner. Promote another member to owner before leaving.' 
      };
    }
  }
  
  // Remove user from organisation
  await prisma.userOrganisation.delete({
    where: {
      userId_organisationId: {
        userId: user.id,
        organisationId: user.activeOrganisationId
      }
    }
  });
  
  // Switch to another org or redirect to create/join
  const otherOrgs = await prisma.userOrganisation.findFirst({
    where: { userId: user.id }
  });
  
  if (otherOrgs) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganisationId: otherOrgs.organisationId }
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganisationId: null }
    });
  }
  
  revalidatePath('/');
  return { success: true };
}
```


## Phase 6: Update Registration Flow

**File:** `app/actions/registerUser.ts`

Update to create UserOrganisation record instead of setting User.entityId:

```typescript
await prisma.$transaction(async (tx) => {
  const entity = await tx.entity.create({ data: { name: entityName, ... } });
  const user = await tx.user.create({ 
    data: { 
      email, 
      activeOrganisationId: entity.id  // Set as active
    } 
  });
  
  // Create membership as OWNER
  await tx.userOrganisation.create({
    data: {
      userId: user.id,
      organisationId: entity.id,
      role: 'OWNER'
    }
  });
});
```

## Phase 7: Update Team Switcher UI

**File:** `components/shared/team-switcher.tsx`

Show all organisations user belongs to, highlight active one, allow switching:

```typescript
export function TeamSwitcher({ allOrganisations, activeOrgId }: Props) {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>Organisations</DropdownMenuLabel>
      {allOrganisations.map(org => (
        <DropdownMenuItem 
          key={org.id}
          onClick={() => switchOrganisation(org.id)}
        >
          {org.name} {org.role.toLowerCase()}
          {org.id === activeOrgId && <IconCheck />}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <IconPlus /> Join Another Organisation
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
```

## Phase 8: Update All Server Actions

Update these files to use `user.activeOrganisationId` instead of `user.entityId`:

- `app/actions/keyTypes.ts`
- `app/actions/borrowers.ts`
- `app/actions/issueKey.ts`
- `app/actions/dashboard.ts`

Pattern: Replace `where: { entityId: user.entityId }` with `where: { entityId: user.activeOrganisationId }`

## Phase 9: Terminology Updates

Global find/replace in UI (components/pages):

- "Team" → "Organisation" (display text)
- "entity" → "organisation" (variable names in new code)
- Keep "Entity" model name in database for now (rename in future migration)

## Testing Checklist

- [ ] User can create new organisation (becomes owner)
- [ ] User can be invited to second organisation
- [ ] User can switch between organisations
- [ ] Data isolation: Keys/borrowers only visible in active org
- [ ] Owner can invite admins and members
- [ ] Admin can invite members only
- [ ] Last owner cannot leave without promoting
- [ ] Multiple owners can exist
- [ ] Owner can leave if others remain
- [ ] Sidebar shows active organisation
- [ ] Team switcher lists all organisations

### To-dos

- [ ] Create UserOrganisation junction table and update schema
- [ ] Write migration script to convert existing data
- [ ] Update getCurrentUser() to handle active organisation and all memberships
- [ ] Create organisation switching and listing actions
- [ ] Update team.ts with leave/promote logic and last-owner protection
- [ ] Update registerUser to create UserOrganisation record
- [ ] Update all server actions to use activeOrganisationId
- [ ] Update team-switcher component to show all orgs and enable switching
- [ ] Update UI terminology from 'Team' to 'Organisation'
- [ ] Test multi-org scenarios and data isolation