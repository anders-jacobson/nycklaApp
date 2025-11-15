# Role-Based Access Control (RBAC) Permissions

## Overview

The application implements role-based access control with three roles: OWNER, ADMIN, and MEMBER. Each role has specific permissions for data access and operations.

## Role Hierarchy

```
OWNER (Level 3) - Full control over organisation
  ↓
ADMIN (Level 2) - Manage keys and invite members
  ↓
MEMBER (Level 1) - Basic operations only
```

## Permission Matrix

| Action/Feature | MEMBER | ADMIN | OWNER | Implementation File |
|---------------|--------|-------|-------|-------------------|
| **Key Operations** |
| Issue keys | ✅ | ✅ | ✅ | `issueKey.ts` |
| Return keys | ✅ | ✅ | ✅ | `issueKey.ts` |
| View key types | ✅ | ✅ | ✅ | `keyTypes.ts` |
| Create key types | ✅ | ✅ | ✅ | `keyTypes.ts` |
| Update key types | ❌ | ✅ | ✅ | `keyTypes.ts:66` |
| Delete key types | ❌ | ✅ | ✅ | `keyTypes.ts:107` |
| Add key copies | ❌ | ✅ | ✅ | `keyTypes.ts:135` |
| Mark keys as lost (available) | ❌ | ✅ | ✅ | `keyTypes.ts:215` |
| Mark keys as found | ❌ | ✅ | ✅ | `keyTypes.ts:242` |
| Mark issued key as lost | ❌ | ✅ | ✅ | `issueKey.ts:376` |
| **Borrower Management** |
| View borrowers | ✅ | ✅ | ✅ | N/A (read-only) |
| Create borrowers (via issue) | ✅ | ✅ | ✅ | `issueKey.ts` |
| Update borrower affiliation | ✅ | ✅ | ✅ | `borrowers.ts` |
| **Team Management** |
| View team members | ✅ | ✅ | ✅ | `team.ts:164` |
| Invite MEMBER | ❌ | ✅ | ✅ | `team.ts:63` |
| Invite ADMIN | ❌ | ❌ | ✅ | `team.ts:63` |
| View pending invitations | ❌ | ✅ | ✅ | `team.ts:214` |
| Cancel invitations | ❌ | ✅ | ✅ | `team.ts:277` |
| Change user roles | ❌ | ❌ | ✅ | `team.ts:319` |
| Remove users | ❌ | ❌ | ✅ | `team.ts:365` |
| Leave organisation | ✅ | ✅ | ✅* | `team.ts:428` |
| **Organisation Settings** |
| View org details | ✅ | ✅ | ✅ | `organisation.ts` |
| Update org name | ❌ | ❌ | ✅ | `organisation.ts:151` |
| Switch organisation | ✅ | ✅ | ✅ | `organisation.ts:15` |
| Create new organisation | ✅ | ✅ | ✅ | `organisation.ts:200` |

\* Cannot leave if last OWNER

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

## Security Notes

1. **Organisation Isolation**: All queries MUST filter by `entityId` to prevent cross-org data access
2. **Self-Modification Prevention**: Users cannot change their own role or remove themselves (use "Leave Organisation")
3. **Last Owner Protection**: Cannot remove/demote last OWNER of an organisation
4. **Role Hierarchy**: Higher roles inherit all lower role permissions
5. **Multi-Tenant Safety**: Role checks happen AFTER getCurrentUser(), which enforces org context

## Testing

See `__tests__/role-based-permissions.test.ts` for comprehensive role permission tests.

## Related Documentation

- [Team Features Implementation](../development/TEAM-FEATURES-IMPLEMENTATION.md)
- [Multi-Tenant Architecture](../development/multi-tenant-architecture.md)
- [Security Overview](./security-overview.md)



