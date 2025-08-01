# 🔑 Key Management Application

A secure, mobile-first web application for tracking physical keys in Swedish housing cooperatives (bostadsrättsföreningar).

## 🎯 **Quick Start**

### **Development**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### **First Time Setup**

1. **Read documentation**: [`docs/`](./docs/) - Complete project documentation
2. **Security first**: [`docs/security/`](./docs/security/) - Security setup and testing
3. **Current tasks**: [`docs/development/tasks.md`](./docs/development/tasks.md) - What to work on

## 📖 **Documentation**

All project documentation is organized in [`docs/`](./docs/):

- **[📖 Documentation Index](./docs/)** - Navigation to all documentation
- **[🔐 Security](./docs/security/)** - Authentication, RLS policies, testing procedures
- **[🛠️ Development](./docs/development/)** - Tasks, architecture, technical implementation
- **[📋 Product](./docs/product/)** - Requirements, user stories, product specifications

## 🚀 **Project Status**

### **✅ Completed**

- **Foundation**: Next.js 15, Supabase, Prisma, shadcn/ui
- **Security**: 18 RLS policies, server-side authentication
- **Dashboard**: Charts, tables, responsive layout
- **Authentication**: Email/password + Google OAuth

### **🔄 In Progress**

- **Key Management**: CRUD operations for key types
- **Testing**: Complete authentication workflow testing

### **⏳ Next Up**

- **Borrower System**: Contact management
- **Issuing Workflow**: Key issuing and return process

## 🛡️ **Security**

This application implements comprehensive security:

- **Row Level Security**: 18 policies across all database tables
- **EU Data Storage**: GDPR compliant hosting in Stockholm
- **Cooperative Isolation**: Complete data separation between organizations
- **Server-Side Authentication**: All operations use secure server clients

**Security Status**: See [`docs/security/security-overview.md`](./docs/security/security-overview.md)

## 🏗️ **Technology Stack**

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth + Database), Prisma ORM
- **Security**: Row Level Security, Server Actions
- **UI**: Mobile-first responsive design
- **Icons**: Tabler Icons exclusively

## 📱 **User Experience**

Designed for key managers in housing cooperatives:

- **Mobile-first**: Touch-friendly interface for daily use
- **Senior-friendly**: Large fonts, high contrast, simple navigation
- **Secure**: Complete data isolation between cooperatives
- **Efficient**: Quick key status lookup and issuing workflows

## 🔧 **Development**

### **Standards**

- **Components**: shadcn/ui only (no plain HTML elements)
- **Icons**: Tabler Icons exclusively
- **Authentication**: Server clients for all operations
- **Database**: Prisma ORM with RLS policies

### **Current Tasks**

Check [`docs/development/tasks.md`](./docs/development/tasks.md) for detailed task breakdown and priorities.

### **Contributing**

1. Review [Development Documentation](./docs/development/)
2. Check current tasks and priorities
3. Follow cursor rules in `.cursor/rules/`
4. Test security implications
5. Update documentation

## 📞 **Support**

- **Documentation**: [`docs/`](./docs/) for comprehensive guides
- **Security**: [`docs/security/`](./docs/security/) for security procedures
- **Development**: [`docs/development/`](./docs/development/) for technical details
- **Product**: [`docs/product/`](./docs/product/) for requirements and specifications

---

**Built with**: Next.js 15 • Supabase • Prisma • shadcn/ui • TypeScript  
**Security**: EU hosted • RLS policies • GDPR compliant
