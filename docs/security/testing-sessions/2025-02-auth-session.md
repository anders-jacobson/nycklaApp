# 🔐 Authentication Testing Session

**Date**: February 2025  
**Purpose**: Complete authentication workflow testing before Phase 2 development  
**Server**: Running on http://localhost:3000

## 📋 **Testing Checklist**

### **Phase 1: User Registration Flow**

#### **A. Email/Password Registration**

- [ ] Navigate to `/auth/register`
- [ ] Test successful registration with valid data
- [ ] Test validation (weak password, empty fields)
- [ ] Test duplicate email handling
- [ ] Verify user creation in both Supabase Auth and Prisma
- [ ] Verify auth_id field is populated correctly

#### **B. Google OAuth Registration**

- [ ] Click "Sign in with Google" on register page
- [ ] Complete OAuth flow
- [ ] Test profile completion for new OAuth users
- [ ] Verify cooperative name storage

#### **C. Email Confirmation Process**

- [ ] Register with email/password
- [ ] Check email for confirmation link
- [ ] Click confirmation link
- [ ] Verify confirmation page loads
- [ ] Test login after email confirmation

---

### **Phase 2: Login/Logout Flow**

#### **A. Email/Password Login**

- [ ] Navigate to `/auth/login`
- [ ] Test successful login with confirmed account
- [ ] Test wrong password error handling
- [ ] Test unconfirmed email error handling
- [ ] Test non-existent email error handling
- [ ] Verify redirect to dashboard after login

#### **B. Google OAuth Login**

- [ ] Test OAuth login with existing Google account
- [ ] Test OAuth login with new Google account
- [ ] Verify proper redirects (dashboard vs profile completion)

#### **C. Logout Testing**

- [ ] Test logout from dashboard user menu
- [ ] Verify redirect to login page
- [ ] Verify session is completely cleared

---

### **Phase 3: Session Management & Security**

#### **A. Protected Route Access**

- [ ] Test dashboard access without login (should redirect)
- [ ] Test dashboard access with login (should work)
- [ ] Test direct URL access to protected routes

#### **B. Session Persistence**

- [ ] Login and refresh browser (should stay logged in)
- [ ] Login and open new tab to dashboard (should work)
- [ ] Close browser and reopen (should stay logged in for ~1 hour)

#### **C. Idle Logout (15-minute timeout)**

- [ ] Login to dashboard
- [ ] Wait 15+ minutes without activity
- [ ] Verify automatic logout and redirect
- [ ] Test activity reset (mouse movement should reset timer)

---

### **Phase 4: Row Level Security (RLS)**

#### **A. Multi-User Data Isolation**

- [ ] Create test user A with "Test Cooperative A"
- [ ] Create test user B with "Test Cooperative B"
- [ ] Login as user A - verify only sees Cooperative A data
- [ ] Login as user B - verify only sees Cooperative B data
- [ ] Verify no cross-cooperative data leakage

#### **B. Database Security Verification**

- [ ] Test that dashboard queries respect RLS policies
- [ ] Verify auth_id field is properly populated for all users
- [ ] Test CRUD operations respect cooperative boundaries

---

### **Phase 5: Edge Cases & Error Handling**

#### **A. Profile Completion Flow**

- [ ] New OAuth user gets redirected to complete-profile
- [ ] Profile completion works correctly
- [ ] Profile completion redirects to dashboard
- [ ] Existing OAuth users go directly to dashboard

#### **B. Error Scenarios**

- [ ] Test registration with invalid email format
- [ ] Test login with network disconnection
- [ ] Test OAuth cancellation/rejection
- [ ] Test profile completion with missing data

---

## 🎯 **Success Criteria**

For testing to be considered complete, all checkboxes above must be ✅ with:

- **Security**: No unauthorized access to protected content
- **Data Isolation**: Complete separation between cooperatives
- **User Experience**: Smooth flows for all authentication scenarios
- **Error Handling**: Clear, helpful error messages
- **Session Management**: Proper timeout and persistence behavior

## 🔧 **Testing Commands**

```bash
# Start fresh testing session
npm run dev

# Check database state
npx prisma studio

# Reset test data if needed
# (We'll create this as needed)

# Check logs for errors
# Browser developer console
```

## 📝 **Testing Notes**

_(Add notes as we test)_

---

**Testing Status**: 🔄 In Progress  
**Current**: Phase 1A - Email/Password Registration Testing  
**Server**: http://localhost:3000  
**Database Monitor**: http://localhost:5555 (Prisma Studio)
