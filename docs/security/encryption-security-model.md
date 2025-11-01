# Encryption Security Model

## Overview

This document explains how the encryption system works with Row Level Security (RLS) to ensure that only authorized users can decrypt and view PII data.

---

## 🔐 How Encryption Works with Multi-User Access

### **Key Concept: Single Shared Encryption Key**

The application uses **one shared encryption key** (`ENCRYPTION_KEY`) stored in environment variables on the server. This key is **never exposed** to the database or to clients.

### **Why This Works**

The encryption key is only accessible by the **Next.js application server**, which runs your server-side code (server components and server actions). When a user makes a request:

1. **User authenticates** via Supabase Auth
2. **RLS policies enforce access control** at the database level
3. **Prisma middleware decrypts** only the data the user is authorized to see
4. **User receives** decrypted data in their browser

**Critical**: The encryption key **never leaves** the server. Users in the browser never see it.

---

## 🛡️ Multi-Layer Security Architecture

### **Layer 1: Authentication**

```
User → Supabase Auth → Valid Session Token
```

- Users must be authenticated to access any data
- Supabase manages user sessions securely
- Middleware protects all routes

### **Layer 2: Row Level Security (RLS)**

```
Database Query → RLS Policies Filter → Only User's Data Returned
```

**Current Implementation**:
- 18 RLS policies across all tables
- Users only see data for their cooperative
- Cooperative isolation enforced at database level
- Example policy: `WHERE userId = auth.uid()`

**How it works with encryption**:
1. Database stores encrypted blobs (e.g., `U2FsdGVkX18rbeUQSznH...`)
2. RLS filters rows before decryption
3. Only encrypted data matching user's cooperative is returned
4. Application decrypts only authorized data

### **Layer 3: Application Encryption**

```
Authorized Encrypted Data → Prisma Middleware → Decrypted Data → User Browser
```

**Process**:
1. Prisma fetches data (already filtered by RLS)
2. Middleware intercepts query results
3. Decryption runs on server-side only
4. Decrypted data sent to authenticated user
5. Encryption key never exposed to browser

---

## 👥 Multi-User Scenario Example

### **Scenario**: Two Cooperatives

**Setup**:
- **Cooperative A** (Testgården): Anders Jacobson (user A)
- **Cooperative B** (Demo Co-op): Demo User (user B)
- **Shared encryption key**: `ENCRYPTION_KEY` (same for both)

### **What Happens When User A Accesses Data**

```
Step 1: User A logs in
  → Supabase validates credentials
  → User A gets session token

Step 2: User A requests borrower list
  → Next.js server receives request with session token
  → Prisma queries: "Get all borrowers"

Step 3: RLS Policy Enforcement
  → Database receives query
  → RLS checks: userId = user A's ID
  → Returns ONLY encrypted data for Cooperative A
  → User B's data is NEVER returned (filtered out by RLS)

Step 4: Application Decryption
  → Prisma middleware receives authorized data only
  → Decrypts using ENCRYPTION_KEY
  → Returns decrypted data to user A's browser
  → User A sees only their cooperative's borrowers

User B's Data: NEVER SEEN
  → RLS filters it out before decryption
  → User A never receives any encrypted blobs for Cooperative B
```

### **Example Data Flow**

**Database State** (what's actually stored):

```
ResidentBorrower Table:
-------------------------------------------------------------------
id                                  | name (encrypted)            | email (encrypted)
-------------------------------------------------------------------
uuid-1 (Cooperative A)              | U2FsdGVkX1...              | U2FsdGVkX1...
uuid-2 (Cooperative A)              | U2FsdGVkX1...              | U2FsdGVkX1...
uuid-3 (Cooperative B)              | U2FsdGVkX1...              | U2FsdGVkX1...
-------------------------------------------------------------------
```

**User A's Query**:
```typescript
const borrowers = await prisma.residentBorrower.findMany({
  where: { userId: userA.id }
});
```

**What Happens**:
1. RLS filters to `uuid-1`, `uuid-2` only
2. Database returns encrypted blobs for those 2 rows
3. Middleware decrypts in application
4. User A receives: `[{ name: "John Doe", ... }, { name: "Jane Smith", ... }]`

**User B's Query**:
```typescript
const borrowers = await prisma.residentBorrower.findMany({
  where: { userId: userB.id }
});
```

**What Happens**:
1. RLS filters to `uuid-3` only
2. Database returns encrypted blob for that 1 row
3. Middleware decrypts in application
4. User B receives: `[{ name: "Mike Johnson", ... }]`

**User A never sees User B's encrypted data** because RLS prevents it from being returned.

---

## 🔍 Can Users See Each Other's Data?

### **Short Answer: NO**

Even with the same encryption key, users **cannot** see each other's data because:

1. **RLS enforces isolation** before decryption
2. **Users never receive** other users' encrypted blobs
3. **Decryption only happens** on data they're authorized to see

### **Attack Scenarios**

#### **Scenario 1: User Tries to Query Another User's Data**

```typescript
// User A attempts to read User B's borrowers
const unauthorizedBorrowers = await prisma.residentBorrower.findMany({
  where: { userId: userB.id }  // Different user's ID
});
```

**Result**: **EMPTY ARRAY**
- RLS policy checks: `WHERE userId = auth.uid()`
- User A's `auth.uid()` ≠ User B's `userId`
- Query returns 0 rows
- No encrypted data returned
- Nothing to decrypt

#### **Scenario 2: User Has Access to Database Directly**

If someone gets the Supabase service role key and tries to query the database directly:

```sql
-- Direct database query (bypasses RLS)
SELECT name, email FROM "ResidentBorrower" WHERE userId = 'some-user-id';
```

**Result**: **ENCRYPTED BLOBS**
- Returns: `U2FsdGVkX18rbeUQSznH...`
- Cannot decrypt without `ENCRYPTION_KEY`
- Encrypted blobs are useless without the key
- Key is stored on server, not in database

#### **Scenario 3: Database Breach**

If someone steals the entire database:

**What they get**:
- All encrypted blobs
- User structure (IDs, relationships)
- Metadata (dates, statuses)

**What they DON'T get**:
- Encryption key (stored on server, not in DB)
- Plain text PII
- Ability to decrypt data

**Protection**: **Strong encryption** makes stolen data useless without the key.

---

## 🔑 Encryption Key Management

### **Where the Key Lives**

```
Production Server (Vercel/Railway/etc)
├── Environment Variables
│   └── ENCRYPTION_KEY=<random-256-bit-key>
│
Database (Supabase)
└── Encrypted Data Blobs
    ├── Can only decrypt with ENCRYPTION_KEY
    └── Key NOT stored in database
```

### **Access Control**

**Who can access the encryption key?**:
- ✅ Next.js application server (automatic)
- ✅ Deployment platform environment (secure storage)
- ❌ Database users (never exposed)
- ❌ Browser clients (never sent)
- ❌ Application users (never accessible)

### **Key Security Best Practices**

1. **Never commit** encryption key to git
2. **Use different keys** for dev/staging/production
3. **Rotate keys periodically** (annually recommended)
4. **Store keys securely** in environment variables
5. **Limit key access** to deployment system only
6. **Backup keys securely** (password manager, secure vault)
7. **Never share keys** via insecure channels

---

## 📊 Security Model Summary

| Layer | What It Does | Who Enforces It |
|-------|-------------|-----------------|
| **Authentication** | Validates user identity | Supabase Auth |
| **RLS Policies** | Filters data by user/cooperative | PostgreSQL |
| **Encryption** | Protects data at rest | Application middleware |
| **HTTPS/TLS** | Protects data in transit | Network layer |

**Result**: **Defense in depth**
- If one layer fails, others still protect data
- Multiple layers ensure strong security
- Encryption adds protection even if database is breached

---

## 🧪 How We Tested This

Our integration tests verify:

1. ✅ Data is encrypted in database
2. ✅ Users can decrypt their own data
3. ✅ RLS policies prevent cross-user access
4. ✅ Different cooperatives are isolated
5. ✅ Encryption works with all CRUD operations

See: `tests/test-encryption-integration.ts`

---

## 🔄 Migration Scenario

**Question**: What if we have existing plain text data?

**Answer**: The system is **backward compatible**:

```typescript
// In lib/encryption.ts
export function decryptField(encrypted: string | null): string | null {
  try {
    // Try to decrypt
    const plaintext = decrypt(encrypted);
    return plaintext;
  } catch (error) {
    // If decryption fails, assume it's already plain text
    return encrypted;  // Backward compatibility
  }
}
```

**Migration process**:
1. Deploy encryption code
2. Old data remains plain text (system still works)
3. New data gets encrypted automatically
4. Run migration script to encrypt old data
5. All data encrypted, system unchanged

---

## 📝 Summary

**Key Takeaway**: 

Users **cannot** see each other's data because:

1. **RLS filters** data before decryption (users never receive other users' encrypted blobs)
2. **Encryption key** is never exposed to users or stored in database
3. **Application middleware** decrypts only authorized data
4. **Defense in depth** with multiple security layers

**One encryption key** is safe to use for all users because:
- The key never leaves the server
- RLS ensures users only get their own data
- Even if database is breached, encrypted blobs are useless without the key

---

**Questions?** See `docs/security/data-encryption-implementation.md` for technical details.

