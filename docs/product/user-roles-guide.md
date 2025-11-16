# User Roles Guide

**For End Users** - Understanding your permissions in the key management system

---

## Overview

Your organisation has three types of users with different levels of access. Your role determines what you can do in the system.

## The Three Roles

### 👑 Owner - Full Control

**Who should be an Owner?**

- Board members
- Property managers
- People who need full administrative access

**What Owners can do:**

- ✅ Everything that Admins and Members can do
- ✅ Edit the organisation name
- ✅ Invite new users with any role (Owner, Admin, or Member)
- ✅ Promote users to Owner
- ✅ Change user roles (make someone Admin or Member)
- ✅ Remove users from the organisation

**Important**: We recommend having **at least 2 Owners** in each organisation for backup.

---

### 🛡️ Admin - Operations Manager

**Who should be an Admin?**

- Key coordinators
- Office staff
- People who manage daily key operations

**What Admins can do:**

- ✅ Everything that Members can do
- ✅ Update existing key types
- ✅ Delete key types
- ✅ Add new key copies
- ✅ Mark keys as lost or found
- ✅ Invite new Members (but not Admins or Owners)
- ❌ Cannot edit organisation name
- ❌ Cannot promote users or change roles
- ❌ Cannot remove users

---

### 👤 Member - Basic User

**Who should be a Member?**

- Board members who occasionally need to lend keys
- Property staff
- Anyone who needs to issue and return keys

**What Members can do:**

- ✅ Issue keys to borrowers
- ✅ Return keys
- ✅ Create new key types
- ✅ View all keys and borrowers
- ✅ View team members
- ✅ Leave the organisation (via their profile menu)
- ❌ Cannot update or delete existing key types
- ❌ Cannot mark keys as lost/found
- ❌ Cannot invite other users
- ❌ Cannot manage the team

---

## Common Questions

### Can I belong to multiple organisations?

**Yes!** You can be invited to multiple organisations and switch between them using the dropdown in the top-left corner. You can have different roles in different organisations.

### How do I know what my role is?

Your role is shown:

- In the organisation switcher (top-left dropdown) next to your organisation name
- On the Settings → Organization page in the Members table

### Can I change my own role?

**No.** Only Owners can change user roles. This is a security feature to prevent accidental changes.

### What if I'm the last Owner?

If you're the only Owner in an organisation, you cannot:

- Leave the organisation
- Be removed by anyone
- Have your role changed

You must promote someone else to Owner first.

### Can we have multiple Owners?

**Yes, and it's recommended!** Having multiple Owners means:

- No single point of failure
- Others can manage the team if you're unavailable
- Shared responsibility for the organisation

---

## How to Manage Your Team

### For Owners

**To invite someone:**

1. Go to **Settings** (bottom of sidebar)
2. Click **Organization** tab
3. Scroll to the **Invite Section**
4. Enter their email and select their role
5. Click **Send Invitation**

**To change someone's role:**

1. Go to **Settings → Organization**
2. Find the person in the **Members** table
3. Click the menu (•••) next to their name
4. Select the new role option

**To remove someone:**

1. Go to **Settings → Organization**
2. Find the person in the **Members** table
3. Click the menu (•••) next to their name
4. Click **Remove from team**

### For Admins

You can only invite **Members**. To invite:

1. Go to **Settings → Organization**
2. Use the **Invite Section**
3. Enter their email and select "Member"
4. Click **Send Invitation**

### For Everyone

**To leave an organisation:**

1. Go to **Settings → Organization**
2. Find yourself in the **Members** table
3. Click the menu (•••) next to your name
4. Click **Leave organization**

---

## Need Help?

If you need your role changed or have questions about permissions:

- Contact an **Owner** in your organisation
- They can adjust your role or provide access to specific features

---

## Quick Reference Table

| What I want to do      | MEMBER | ADMIN | OWNER |
| ---------------------- | ------ | ----- | ----- |
| Issue/return keys      | ✅     | ✅    | ✅    |
| Create new key types   | ✅     | ✅    | ✅    |
| Update/delete keys     | ❌     | ✅    | ✅    |
| Mark keys lost/found   | ❌     | ✅    | ✅    |
| Invite members         | ❌     | ✅    | ✅    |
| Invite admins/owners   | ❌     | ❌    | ✅    |
| Change user roles      | ❌     | ❌    | ✅    |
| Edit organisation name | ❌     | ❌    | ✅    |
| Remove users           | ❌     | ❌    | ✅    |

---

**Last Updated**: November 2025  
**For technical details**, see: [RBAC Permissions Documentation](../security/rbac-permissions.md)
