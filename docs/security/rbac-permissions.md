# Role-Based Access Control (RBAC) Permissions

**Last Updated**: November 2025  
**Status**: ✅ Implemented with multi-organisation support

## Overview

The application implements role-based access control with three roles: OWNER, ADMIN, and MEMBER. Each role has specific permissions for data access and operations within their active organisation.

**Key Features**:
- ✅ Multi-organisation support - users can belong to multiple organisations with different roles
- ✅ Multiple owners per organisation allowed
- ✅ Role hierarchy with permission inheritance
- ✅ Organisation-level data isolation
- ✅ Self-service team management UI

## Role Hierarchy

```
OWNER (Level 3) - Full control over organisation
  ↓ inherits all permissions
ADMIN (Level 2) - Manage operations and invite members
  ↓ inherits all permissions
MEMBER (Level 1) - Basic operations only
```

**Hierarchy Rules**:
- Higher roles inherit ALL permissions from lower roles
- Multiple OWNERs per organisation are allowed and encouraged
- Role checks use hierarchy: `roleLevel >= requiredLevel`

## Permission Matrix

| Action/Feature | MEMBER | ADMIN | OWNER | Notes |
|---------------|--------|-------|-------|-------|
| **Key Operations** | | | | `app/actions/` |
| Issue keys | ✅ | ✅ | ✅ | Anyone can issue/return |
| Return keys | ✅ | ✅ | ✅ | Anyone can issue/return |
| View key types | ✅ | ✅ | ✅ | Read-only access |
| Create key types | ✅ | ✅ | ✅ | Anyone can create (intended) |
| Update key types | ❌ | ✅ | ✅ | Enforced in `keyTypes.ts:69` |
| Delete key types | ❌ | ✅ | ✅ | Enforced in `keyTypes.ts:110` |
| Add key copies | ❌ | ✅ | ✅ | Enforced in `keyTypes.ts:138` |
| Mark keys as lost (available) | ❌ | ✅ | ✅ | Enforced in `keyTypes.ts:218` |
| Mark keys as found | ❌ | ✅ | ✅ | Enforced in `keyTypes.ts:245` |
| Mark issued key as lost | ❌ | ✅ | ✅ | Enforced in `issueKey.ts:389` |
| **Borrower Management** | | | | `app/actions/borrowers.ts` |
| View borrowers | ✅ | ✅ | ✅ | Read-only, org-filtered |
| Create borrowers | ✅ | ✅ | ✅ | Via issue workflow |
| Update borrower info | ✅ | ✅ | ✅ | Anyone can update |
| **Team Management** | | | | `app/actions/team.ts` |
| View team members | ✅ | ✅ | ✅ | All can see members |
| Invite MEMBER | ❌ | ✅ | ✅ | ADMIN can invite members |
| Invite ADMIN/OWNER | ❌ | ❌ | ✅ | OWNER only |
| View pending invitations | ❌ | ✅ | ✅ | ADMIN+ can see invites |
| Cancel invitations | ❌ | ✅ | ✅ | ADMIN+ can cancel |
| Promote to OWNER | ❌ | ❌ | ✅ | Multiple owners allowed |
| Change roles (Admin↔Member) | ❌ | ❌ | ✅ | OWNER only |
| Remove users | ❌ | ❌ | ✅ | OWNER only, not last owner |
| Leave organisation | ✅* | ✅* | ✅* | All can leave via menu |
| **Organisation Settings** | | | | `app/actions/organisation.ts` |
| View org details | ✅ | ✅ | ✅ | Read-only access |
| Update org name | ❌ | ❌ | ✅ | OWNER only |
| Switch organisation | ✅ | ✅ | ✅ | Via dropdown |
| Create new organisation | ✅ | ✅ | ✅ | Anyone (becomes owner) |

**Legend**:
- ✅ = Allowed and enforced (or intentionally open to all roles)
- ❌ = Not allowed (enforced in UI and server)
- \* = Cannot leave if last OWNER in organisation

**Design Notes**:
- MEMBERs can create key types and issue/return keys (core workflow)
- Only ADMIN/OWNER can modify or delete existing keys (destructive operations)
- All operations are organisation-isolated regardless of role

## Implementation Pattern

All protected actions follow this standard pattern:

```typescript
export async function protectedAction(params): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    
    // Role check - OWNER/ADMIN only
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can perform this action.' };
    }
    
    const { entityId } = user;
    
    // ... rest of implementation with entityId filtering
  } catch (error) {
    return { success: false, error: 'Action failed.' };
  }
}
```

## Helper Functions

Located in `lib/auth-utils.ts`:

### `getCurrentUser()`
Returns current user with role and organisation context:
```typescript
{
  id: string;
  email: string;
  name: string | null;
  entityId: string; // Active organisation ID
  roleInActiveOrg: UserRole; // Role in active org
  allOrganisations: Array<{
    id: string;
    name: string;
    role: UserRole;
  }>;
}
```

### `hasRole(requiredRole: UserRole)`
Checks if user has required role or higher in active org.

### `requireRole(requiredRole: UserRole)`
Throws error if user doesn't have required role (use in try/catch).

## User Interface

### Settings → Organization Page

Located at `/settings/organization`, this page provides:

**Overview Section** (All Users):
- View organisation name
- Edit name (OWNER only - input disabled for others)
- Save button (OWNER only)

**Members Table** (All Users):
- View all team members with roles and join dates
- Kebab menu (•••) on each row with contextual actions:

**For viewing your own row** (any role):
- "Leave organization" - disabled if you're the last OWNER

**For OWNER viewing other users**:
- "Promote to Owner" - makes user an OWNER (only shown for non-owners)
- "Change to Admin/Member" - toggles between ADMIN ↔ MEMBER
- "Remove from team" - kicks user out (disabled if last owner)

**For ADMIN/MEMBER viewing others**:
- No actions available (menu only shows for their own row)

**Invite Section** (ADMIN and OWNER):
- Email input and role selector
- Pending invitations table
- Cancel invitation option

### Organisation Switcher

Located in sidebar header:
- Shows current organisation name and your role
- Dropdown to switch between organisations you belong to
- Each org shows your role badge (OWNER/ADMIN/MEMBER)

## Security Rules

### Critical Protections

1. **Organisation Isolation**: All queries filter by `entityId` - users only see their org's data
2. **Self-Modification Prevention**: Cannot change own role or remove yourself
3. **Last Owner Protection**: Cannot remove/demote/leave if last OWNER
4. **Multiple Owners**: Multiple owners per org allowed and encouraged for redundancy
5. **Role Hierarchy Enforcement**: Higher roles inherit all lower permissions
6. **Multi-Tenant Safety**: Role checks happen AFTER `getCurrentUser()` enforces org context

### Implementation Status ✅

**All critical operations have role enforcement**:
- ✅ **Team management** - Fully protected (invite, promote, remove)
- ✅ **Organisation settings** - Fully protected (update name)
- ✅ **Key type management** - Destructive operations protected (update, delete, mark lost)
- ✅ **Key operations** - Create/issue/return open to all (by design for workflow)

**Security layers**:
1. **Role-based checks** - Enforced in server actions for destructive operations
2. **Organisation isolation** - All queries filtered by `entityId`
3. **Supabase RLS policies** - Database-level protection
4. **Middleware authentication** - Route protection

**Design Philosophy**:
- MEMBERs need to create keys and issue them (core daily workflow)
- Only privileged users (ADMIN/OWNER) can modify or destroy data
- Balance between usability and security

## Testing

Role-based permissions are tested through:
- Manual testing checklist: `__tests__/manual-testing-checklist.md`
- Multi-tenant isolation tests: `__tests__/multi-tenant-isolation.test.ts`
- UI testing: Verify disabled states and menu visibility by logging in with different roles

### Test Scenarios

**As MEMBER**:
- ✅ Can issue/return keys
- ❌ Cannot see invite section
- ❌ Cannot see actions for other users
- ✅ Can leave organisation

**As ADMIN**:
- ✅ All MEMBER permissions
- ✅ Can invite MEMBERS
- ✅ Can view/cancel invitations
- ❌ Cannot promote users or change roles
- ❌ Cannot edit organisation name

**As OWNER**:
- ✅ All ADMIN permissions
- ✅ Can invite any role (OWNER/ADMIN/MEMBER)
- ✅ Can promote users to OWNER
- ✅ Can change roles and remove users
- ✅ Can edit organisation name
- ❌ Cannot leave if last OWNER

## Related Documentation

- [Team Features Implementation](../development/TEAM-FEATURES-IMPLEMENTATION.md)
- [Multi-Organisation Implementation](../development/multi-organisation-implementation-complete.md)
- [Security Overview](./security-overview.md)
- [Multi-Tenant User Model](../development/MULTI-TENANT-USER-MODEL.md)

---

**Maintained by**: Development Team  
**Last Review**: November 2025  
**Next Review**: After adding full role enforcement to key operations



