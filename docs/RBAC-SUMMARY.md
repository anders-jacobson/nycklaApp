# RBAC System Summary

**Last Updated**: November 2025

## Quick Overview

The application has a **3-tier role-based access control** system:

```
OWNER (Level 3) → Full control
  ↓ inherits all
ADMIN (Level 2) → Operations + invite members  
  ↓ inherits all
MEMBER (Level 1) → Basic usage
```

## What Each Role Can Do

### 👑 OWNER - Full Control
- Everything ADMINs can do, PLUS:
- Edit organisation name
- Invite OWNERs/ADMINs (ADMINs can only invite MEMBERs)
- Promote users to OWNER
- Change any user's role
- Remove users from organisation
- **Multiple owners per organisation allowed** ✅

### 🛡️ ADMIN - Operations Manager
- Everything MEMBERs can do, PLUS:
- Create/update/delete key types
- Add key copies and mark as lost/found
- Invite MEMBER users
- View/cancel invitations

### 👤 MEMBER - Basic User
- Issue and return keys
- View keys, borrowers, and team members
- Leave organisation (via kebab menu)
- **Cannot** manage keys, users, or settings

## Where Users Manage This

### Settings → Organization (`/settings/organization`)

**Overview Section**:
- Organisation name (editable by OWNER only)
- Save button

**Members Table**:
- All members with roles and join dates
- Kebab menu (•••) on each row:
  - **Your own row**: "Leave organization" (disabled if last OWNER)
  - **OWNER viewing others**: Promote/Change role/Remove
  - **Non-owner**: Only see menu on own row

**Invite Section** (ADMIN/OWNER only):
- Email + role selector
- Pending invitations

### Organisation Switcher (Sidebar)
- Switch between organisations you belong to
- Shows your role in each org

## Current Status

### ✅ Fully Implemented

**All role-based access control is active:**
- ✅ Team management (invite, promote, remove)
- ✅ Organisation settings (update name)
- ✅ Multi-organisation support
- ✅ Key type destructive operations (update, delete, mark lost)
- ✅ UI with proper role-based visibility

**Design Philosophy:**
- **MEMBERs** can create keys and issue/return them (core daily workflow)
- **ADMIN/OWNER** required for destructive operations (update, delete, mark lost)
- Balance between usability and security

**Security Layers:**
1. **Role-based checks** - Enforced for all destructive operations
2. **Organisation isolation** - All queries filtered by `entityId`
3. **Supabase RLS policies** - Database-level protection
4. **Authentication middleware** - Route protection

## Documentation Location

Full details in **`docs/security/rbac-permissions.md`**

Includes:
- Complete permission matrix
- Implementation examples
- Security rules
- Testing scenarios
- UI screenshots/descriptions

---

**See also**:
- [Security README](./security/README.md) - Security overview
- [Multi-Organisation Guide](./development/multi-organisation-implementation-complete.md) - Architecture

