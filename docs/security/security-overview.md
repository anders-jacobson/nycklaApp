# 🔐 Security Documentation - Key Management Application

## Overview

This document outlines the security configuration and best practices for the Swedish housing cooperative key management application.

## 🏗️ **Security Architecture**

### **Authentication Stack**

- **Supabase Auth** - Primary authentication provider
- **Next.js 15 Middleware** - Route protection and session management
- **Server Actions** - Secure form handling
- **Row Level Security (RLS)** - Database-level access control

### **Data Protection**

- **EU Data Storage** - Supabase hosted in EU North (Stockholm)
- **GDPR Compliance** - Data residency and privacy controls
- **Cooperative Data Isolation** - Complete separation using RLS

---

## 🎯 **Current Authentication Settings**

### **Supabase Project Details**

- **Project ID**: `dmibohhlaqrlfdytqvhd`
- **Project Name**: `ai-database`
- **Region**: `eu-north-1` (Stockholm)
- **Status**: `ACTIVE_HEALTHY`
- **Database**: PostgreSQL 17.4.1

### **⚠️ LIMITATION: Free Tier Session Settings**

**Current Issue**: Supabase free tier doesn't allow changing session timeouts

**🔧 Free Tier Defaults**:

- **Access Token Expiry**: 1 hour (cannot change without Pro plan)
- **Refresh Token Expiry**: 7 days (cannot change without Pro plan)
- **Pro Plan Required**: $25/month to customize these settings

**🛡️ Application-Level Security Mitigations**:
Since we can't change Supabase settings on free tier, we implement security at the application level:

1. **15-minute idle timeout**: Automatic logout after inactivity (✅ implemented)
2. **Client-side session management**: Additional security layers
3. **Middleware protection**: Route-level security checks (✅ implemented)
4. **Manual logout options**: Easy access to end sessions (✅ implemented)
5. **RLS policies**: Database-level access control (✅ implemented)

---

## 🛡️ **Row Level Security (RLS) Implementation**

### **Security Model**

Every cooperative's data is completely isolated using RLS policies based on the `auth_id` field.

### **RLS Status - ✅ IMPLEMENTED**

All tables have RLS enabled with optimized policies:

#### **User Table**

- **Policy**: `auth_id = auth.uid()` (UUID comparison - 94% faster than email)
- **Access**: Users can only see/modify their own profile
- **Status**: ✅ Implemented with auth_id field

#### **KeyType Table**

- **Policy**: Filter by cooperative through User relationship
- **Access**: Users see only their cooperative's key types
- **Status**: ✅ Implemented (4 policies)

#### **KeyCopy Table**

- **Policy**: Filter through KeyType → User chain
- **Access**: Users see only their cooperative's key copies
- **Status**: ✅ Implemented (4 policies)

#### **Borrower Table**

- **Policy**: Filter by cooperative through User relationship
- **Access**: Users see only their cooperative's borrowers
- **Status**: ✅ Implemented (4 policies)

#### **LendingRecord Table**

- **Policy**: Filter by cooperative through User relationship
- **Access**: Users see only their cooperative's lending records
- **Status**: ✅ Implemented (4 policies)

**Total RLS Policies**: 18 policies across 5 tables

---

## 🔒 **Authentication Flow Security**

### **Registration Process**

1. **Email/Password**: Supabase Auth handles secure registration
2. **Cooperative Name**: Collected during signup for data isolation
3. **Email Confirmation**: Required before account activation
4. **Profile Completion**: Links Supabase Auth to Prisma User table

### **Login Process**

1. **Server Actions**: All auth operations use server-side clients
2. **Middleware Protection**: Routes protected before reaching components
3. **Session Management**: Secure cookie handling with @supabase/ssr
4. **Idle Logout**: 15-minute client-side inactivity detection

### **OAuth Integration**

- **Google OAuth**: Configured for secure third-party authentication
- **Callback Handling**: Server-side OAuth callback processing
- **Profile Completion**: OAuth users complete cooperative information

### **JWT Signing Keys**

We use Supabase's modern JWT signing keys system with ES256 (P-256 Elliptic Curve) algorithm:

**Benefits:**
- **Performance**: JWT validation is local and fast (no Auth server in hot path)
- **Security**: Private key is not extractable from Supabase
- **Rotation**: Zero-downtime key rotation without signing out users
- **Compliance**: Aligns with SOC2, PCI-DSS, ISO27000 best practices

**Key Management:**
- **Algorithm**: ES256 (Elliptic Curve P-256)
- **Private Key**: Stored securely in Supabase (non-extractable)
- **Public Key**: Available via JWKS endpoint for verification
- **Rotation**: Can be performed anytime without downtime

**Migration from Legacy:**
- **Migrated**: November 28, 2025
- **Implementation**: All auth code uses `supabase.auth.getUser()` (no manual JWT verification)
- **Code Changes**: Zero - our implementation was already compatible
- **Documentation**: See `docs/development/JWT-SIGNING-KEYS-MIGRATION-READINESS.md`

---

## 🚨 **Security Checklist**

### **✅ Implemented Security Features**

- [x] **RLS Policies**: 18 policies across all tables
- [x] **EU Data Storage**: Supabase hosted in Stockholm
- [x] **Server-Side Auth**: All auth operations use server client
- [x] **Route Protection**: Middleware protects dashboard routes
- [x] **Cooperative Isolation**: Complete data separation
- [x] **Idle Logout**: 15-minute inactivity timeout
- [x] **OAuth Security**: Google OAuth with secure callbacks
- [x] **Email Confirmation**: Required for account activation
- [x] **UUID Comparison**: High-performance auth_id policies

### **⚠️ Pending Security Actions**

- [ ] **~~Update Session Timeouts~~**: Not possible on free tier (Pro plan required)
- [ ] **Enhanced Client-Side Security**: Implement additional session management (if needed)
- [ ] **Security Audit**: Review and test all RLS policies
- [ ] **Environment Variables**: Audit all environment variables
- [ ] **HTTPS Enforcement**: Ensure production uses HTTPS only

---

## 🔐 **Environment Variables Security**

### **Required Environment Variables**

```bash
# Supabase Configuration (Modern Keys)
NEXT_PUBLIC_SUPABASE_URL=https://dmibohhlaqrlfdytqvhd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... # Modern key (safe to expose)
SUPABASE_SECRET_KEY=sb_secret_... # NEVER expose - server-only, admin operations

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Update for production
DATABASE_URL=postgresql://... # Prisma database connection

# Production Additional
NEXTAUTH_SECRET=... # Random secret for production
```

### **Security Notes**

- **PUBLISHABLE_KEY** (`sb_publishable_...`): Safe to expose - designed for client/server auth
- **SECRET_KEY** (`sb_secret_...`): Never expose - bypasses RLS, admin operations only
- **SITE_URL**: Required for OAuth redirects
- **Database URL**: Keep secure - contains credentials

---

## 📊 **Security Monitoring**

### **Available Tools**

- **Supabase Dashboard**: Monitor auth events and usage
- **RLS Policy Testing**: Verify data isolation
- **MCP Integration**: Real-time security auditing
- **Performance Monitoring**: Track auth performance

### **Security Metrics to Monitor**

- Failed login attempts
- Session duration patterns
- RLS policy performance
- Data access patterns
- OAuth success rates

---

## 🎯 **Immediate Action Items**

### **1. ~~Update Supabase Auth Settings~~ (Not Available on Free Tier)**

```
❌ Cannot change on free tier:
- Access Token Expiry: Locked to 1 hour
- Refresh Token Expiry: Locked to 7 days
- Pro Plan Required: $25/month for customization
```

**Alternative**: Current application-level security is sufficient with:

- 15-minute idle timeout (more restrictive than Supabase)
- Middleware route protection
- Manual logout options

### **2. Test Authentication Flow**

- [ ] Register new test user
- [ ] Test login/logout
- [ ] Test OAuth flow
- [ ] Test idle logout (15 min)
- [ ] Test RLS data isolation

### **3. Security Audit**

- [ ] Review all RLS policies
- [ ] Test cross-cooperative data access
- [ ] Verify email confirmation flow
- [ ] Check session timeout behavior

---

## 📱 **Production Security Checklist**

When deploying to production:

- [ ] **HTTPS Only**: Enforce HTTPS in production
- [ ] **Environment Variables**: Use secure secret management
- [ ] **Session Security**: Verify timeouts work correctly
- [ ] **OAuth Configuration**: Update redirect URLs
- [ ] **Database Backups**: Ensure regular backups
- [ ] **Monitoring**: Set up security monitoring
- [ ] **Audit Logging**: Enable comprehensive logging

---

## 🔗 **Related Documentation**

- `AUTH_TESTING_GUIDE.md` - Authentication testing procedures
- `TASKS.md` - Implementation tasks and status
- `key_management_prd.md` - Product requirements and security requirements
- `.cursor/rules/` - Development standards and security patterns

---

## 📞 **Security Contact**

For security concerns or questions:

- Review this documentation
- Test using AUTH_TESTING_GUIDE.md
- Update TASKS.md with security findings
- Document any security issues or improvements needed

**Last Updated**: November 28, 2025  
**Next Review**: After JWT signing keys migration completion and final testing
