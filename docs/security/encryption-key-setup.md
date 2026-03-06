# Encryption Key Setup Guide

## Overview

This guide explains how to set up and manage the `ENCRYPTION_KEY` environment variable for PII encryption in the Key Management Application.

---

## 🔑 Quick Setup

### **1. Generate Your Encryption Key**

Run this command to generate a secure random encryption key:

```bash
openssl rand -base64 32
```

**Example output** (your key will be different):
```
vmmdX4tWEefnCnMkxErBl8x5qQgj7AV8giMvRZtkZi8=
```

### **2. Store Your Key Securely**

**CRITICAL**: Store this key in multiple secure locations:
- ✅ Password manager (1Password, Bitwarden, etc.)
- ✅ Secure notes application
- ✅ Production deployment environment variables
- ❌ NEVER in git repository
- ❌ NEVER in code comments
- ❌ NEVER in public documentation

### **3. Add to Environment Variables**

#### **Development (.env.local)**

Create or update `.env.local` in the project root:

```bash
# Add this line with your generated key
ENCRYPTION_KEY=vmmdX4tWEefnCnMkxErBl8x5qQgj7AV8giMvRZtkZi8=
```

#### **Production (Deployment Platform)**

Add the key to your deployment platform's environment variables:

**Vercel**:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `ENCRYPTION_KEY` = `your-key-here`
4. Apply to: Production, Preview, Development

**Railway / Render**:
1. Go to project settings
2. Add environment variable: `ENCRYPTION_KEY`
3. Value: `your-key-here`
4. Save

**Other Platforms**:
- Use your platform's environment variable configuration
- Ensure key is available to all environments

---

## ✅ Verify Your Setup

### **Check Development Environment**

Run the integration tests to verify encryption works:

```bash
ENCRYPTION_KEY='your-key-here' npx tsx tests/test-encryption-integration.ts
```

Expected output:
```
✅ All encryption integration tests passed!
```

### **Check Application**

Start the development server:

```bash
npm run dev
```

Then create a new borrower through the UI. Check the database to verify the data is encrypted:

```sql
-- In Supabase SQL Editor or psql
SELECT name, email FROM "ResidentBorrower" 
WHERE name LIKE 'U2FsdGVkX1%' LIMIT 1;
```

If you see rows with encrypted blobs starting with `U2FsdGVkX1`, encryption is working!

---

## 🔄 Key Rotation

### **When to Rotate**

- Annually (recommended)
- After security incident
- After team member departure
- Infrastructure changes

### **How to Rotate**

1. **Generate new key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variables** (dev, staging, production)

3. **Re-encrypt existing data** (see migration guide below)

4. **Verify all data is accessible**

5. **Archive old key** (keep for potential disaster recovery)

---

## 📊 Security Checklist

Before deploying to production:

- [ ] Encryption key generated with `openssl rand -base64 32`
- [ ] Key stored in password manager
- [ ] Key added to `.env.local` for development
- [ ] Key added to production environment variables
- [ ] Key NOT committed to git repository
- [ ] Integration tests passing
- [ ] Key backed up in secure location
- [ ] Team members have access to key storage

---

## 🚨 Important Warnings

### **NEVER**

❌ Commit encryption key to git  
❌ Share key via email/Slack/unencrypted channels  
❌ Store key in plain text files that might be committed  
❌ Use the same key in dev/staging/production  
❌ Delete old keys before verifying migration

### **ALWAYS**

✅ Use different keys for each environment  
✅ Store keys in secure vault/password manager  
✅ Add `.env.local` to `.gitignore`  
✅ Verify encryption after deployment  
✅ Document key storage location for team

---

## 🆘 Disaster Recovery

### **What if You Lose Your Key?**

**Without the encryption key**:
- ❌ Existing encrypted data cannot be decrypted
- ❌ Users cannot access their data
- ❌ Database backups are useless

**Prevention**:
- Store keys in multiple secure locations
- Backup keys to secure vault
- Document key storage locations
- Test backup/restore procedures

**Recovery**:
- Retrieve key from secure backup
- Verify key decrypts existing data
- Update documentation
- Review backup procedures

---

## 📚 Related Documentation

- **Security Model**: `docs/security/encryption-security-model.md`
- **Implementation Guide**: `docs/security/data-encryption-implementation.md`
- **Testing**: `tests/test-encryption-integration.ts`
- **Security Overview**: `docs/security/security-overview.md`

---

## 💡 Questions?

If you have questions about encryption key setup or management:

1. Review the security model documentation
2. Check integration tests for examples
3. Test in development environment first
4. Consult with security team before production deployment

---

**Last Updated**: February 2025  
**Next Review**: After first production deployment

