# Architecture Decision Record: Multi-Tenant Entity Model

## Status: PROPOSED

**Date**: February 2025  
**Decision Type**: Architectural Change  
**Impact**: High - Affects entire application  

---

## Context

The application currently uses a **per-user cooperative model** where:
- Each user is directly tied to their cooperative (stored as string)
- All data (borrowers, keys, issues) is owned by individual users
- No support for multiple users per organization
- User replacement requires complex data migration

**Stakeholders need**:
- Multiple key managers per cooperative
- Clean user addition/removal
- Better audit trails
- Enhanced data isolation

---

## Decision

### **Proposed**: Multi-Tenant Entity Model

**Transition from**:
```
User → directly owns → Borrowers, Keys, Issues
  (cooperative: "ABC")
```

**Transition to**:
```
Entity (Cooperative) → owns → Borrowers, Keys, Issues
    ↑
    └── Users[] (multiple users per entity)
        ├── Role: OWNER/ADMIN/MEMBER
        └── Audit trail via IssueRecord.userId
```

---

## Implications

### **Schema Changes**

**New Entity Model**:
- Entity table with id, name, encryptionKey
- User belongs to Entity (not owns)
- All data owned by Entity
- Users have roles

**Relation Changes**:
- Borrower: `userId` → `entityId`
- KeyType: `userId` → `entityId`
- IssueRecord: Add `entityId`, keep `userId`

### **Migration Complexity**

- **4-6 weeks** development time
- **2,000-3,000** lines of code changes
- **30-50** files to modify
- **Complex data migration** required
- **Risk of data loss** if errors

### **Security**

**Current**: RLS filters by userId → cooperative string  
**New**: RLS filters by entityId + role checks

**Encryption**:
- **Simple**: Shared key, RLS isolates (implemented)
- **Advanced**: Per-entity keys, total isolation (designed)

### **User Replacement**

**Current**: Nightmare ❌ Manual data reassignment  
**New**: Seamless ✅ Just add/remove User from Entity

---

## Options Considered

### **Option A: Keep Current Model** ✅ RECOMMENDED

**Pros**:
- Zero migration overhead
- Works for single-user organizations (most common)
- Encryption already implemented
- Can deploy today

**Cons**:
- No multi-user support
- Complex user replacement

**Decision**: Ship this first

### **Option B: Full Entity Model**

**Pros**:
- True multi-user support
- Clean user management
- Better audit trails
- Per-entity encryption possible

**Cons**:
- 4-6 weeks development
- Complex migration
- High risk
- Breaking changes

**Decision**: Implement when demand emerges

### **Option C: Hybrid Approach**

**Phase 1**: Deploy simple encryption  
**Phase 2**: Add entity model when needed  
**Phase 3**: Add per-entity encryption  

**Pros**: Best of both worlds  
**Decision**: **RECOMMENDED** ✅

---

## Recommended Approach

### **Phase 1: Ship Simple Encryption** (NOW)

- Use current branch: `feature/data-encryption-pii-protection`
- One shared encryption key
- RLS provides isolation
- Perfect for single-user organizations
- Deploy to production

### **Phase 2: Add Entity Model** (WHEN NEEDED)

- Create new branch: `feature/entity-multi-user`
- Implement Entity table
- Migrate data
- Update all code
- Add role-based access

### **Phase 3: Per-Entity Encryption** (OPTIONAL)

- Only if required by compliance
- Re-encrypt with per-entity keys
- Enhanced isolation

---

## User Replacement Comparison

### **Current Model (Simple)**

```
Scenario: User A leaves, User B joins "Testgården" cooperative

Process:
1. Create User B account with cooperative="Testgården"
2. User B cannot access User A's borrowers
3. Must manually migrate:
   - Update ALL Borrower.userId = B
   - Update ALL KeyType.userId = B
   - IssueRecord.userId stays pointing to A
4. User A account becomes orphaned
5. No clean handover process

Result: ❌ Data fragmentation, manual work, potential data loss
```

### **Entity Model**

```
Scenario: User A leaves, User B joins "Testgården" Entity

Process:
1. Create User B in same Entity
2. Give User B role = OWNER
3. User B automatically sees all Entity data
4. No data migration needed
5. Demote or remove User A
6. IssueRecord.userId tracks actual user

Result: ✅ Clean handover, zero data migration, perfect audit trail
```

---

## Migration Complexity Breakdown

| Task | Effort | Risk | Dependencies |
|------|--------|------|--------------|
| Create Entity schema | 1 day | Low | None |
| Data migration script | 3 days | **High** | Schema ready |
| Update RLS policies | 2 days | **High** | Migration done |
| Refactor server actions | 1 week | Medium | RLS done |
| Update components | 1 week | Medium | Actions done |
| Per-entity encryption | 1 week | Medium | All above |
| Testing & validation | 1 week | Low | All above |

**Total**: 4-6 weeks, significant risk

---

## Recommendation

### **Ship Simple Encryption Now**

**Reasons**:
1. Most cooperatives have **1 key manager**
2. Immediate security value
3. Zero migration risk
4. Can upgrade later seamlessly

**When to Upgrade**:
- Organization requests multiple admins
- Need for role-based access control
- Compliance requires per-entity keys
- User replacement becomes frequent

---

## Consequences

### **If We Don't Do This**

- Remain single-user only
- User replacement stays complex
- Limited scalability
- No audit trail of who did what

### **If We Do This**

- True multi-user support
- Clean user management
- Better audit trails
- Scalable architecture
- BUT: 4-6 weeks development
- BUT: Complex migration
- BUT: Breaking changes

### **Hybrid Approach**

- Ship encryption now ✅
- Add entity model when needed ✅
- Best of both worlds ✅

---

## Next Actions

1. **Review this ADR** with stakeholders
2. **Decide**: Simple vs Advanced vs Hybrid
3. **If Hybrid**: Deploy simple encryption branch
4. **Plan**: Entity model implementation timeline
5. **Validate**: User demand for multi-user features

---

**Recommendation**: Deploy simple encryption now, implement entity model when demand emerges.

**Reviewed By**: [Pending]  
**Approved**: [Pending]  
**Status**: Awaiting decision

