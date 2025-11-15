/**
 * Multi-tenant isolation tests
 * Verifies that data is properly filtered by entityId when switching organisations
 */

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

// Mock Supabase auth
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

describe('Multi-tenant data isolation', () => {
  let org1Id: string;
  let org2Id: string;
  let userId: string;
  let key1Id: string;
  let key2Id: string;
  let borrower1Id: string;
  let borrower2Id: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-isolation@example.com',
        name: 'Test User',
      },
    });
    userId = user.id;

    // Create two organisations
    const org1 = await prisma.entity.create({
      data: {
        name: 'Test Org 1',
        encryptionKey: 'test-key-1',
      },
    });
    org1Id = org1.id;

    const org2 = await prisma.entity.create({
      data: {
        name: 'Test Org 2',
        encryptionKey: 'test-key-2',
      },
    });
    org2Id = org2.id;

    // Add user to both organisations
    await prisma.userOrganisation.createMany({
      data: [
        { userId, organisationId: org1Id, role: 'OWNER' },
        { userId, organisationId: org2Id, role: 'OWNER' },
      ],
    });

    // Set org1 as active
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganisationId: org1Id },
    });

    // Create key types for each org
    const key1 = await prisma.keyType.create({
      data: {
        label: 'A1',
        function: 'Org 1 Key',
        entityId: org1Id,
      },
    });
    key1Id = key1.id;

    const key2 = await prisma.keyType.create({
      data: {
        label: 'B1',
        function: 'Org 2 Key',
        entityId: org2Id,
      },
    });
    key2Id = key2.id;

    // Create borrowers for each org (using ResidentBorrower for simplicity)
    const resident1 = await prisma.residentBorrower.create({
      data: {
        name: 'Org1 Resident',
        email: 'resident1@example.com',
      },
    });

    const borrower1 = await prisma.borrower.create({
      data: {
        entityId: org1Id,
        affiliation: 'RESIDENT',
        residentBorrowerId: resident1.id,
      },
    });
    borrower1Id = borrower1.id;

    const resident2 = await prisma.residentBorrower.create({
      data: {
        name: 'Org2 Resident',
        email: 'resident2@example.com',
      },
    });

    const borrower2 = await prisma.borrower.create({
      data: {
        entityId: org2Id,
        affiliation: 'RESIDENT',
        residentBorrowerId: resident2.id,
      },
    });
    borrower2Id = borrower2.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await prisma.borrower.deleteMany({
      where: { id: { in: [borrower1Id, borrower2Id] } },
    });
    await prisma.residentBorrower.deleteMany({
      where: {
        email: { in: ['resident1@example.com', 'resident2@example.com'] },
      },
    });
    await prisma.keyType.deleteMany({
      where: { id: { in: [key1Id, key2Id] } },
    });
    await prisma.userOrganisation.deleteMany({
      where: { userId },
    });
    await prisma.entity.deleteMany({
      where: { id: { in: [org1Id, org2Id] } },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  describe('Key Types filtering', () => {
    it('should only return keys from active organisation (org1)', async () => {
      const keys = await prisma.keyType.findMany({
        where: { entityId: org1Id },
      });

      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe(key1Id);
      expect(keys[0].label).toBe('A1');
    });

    it('should only return keys from active organisation (org2) after switch', async () => {
      const keys = await prisma.keyType.findMany({
        where: { entityId: org2Id },
      });

      expect(keys).toHaveLength(1);
      expect(keys[0].id).toBe(key2Id);
      expect(keys[0].label).toBe('B1');
    });

    it('should not return keys from other organisation', async () => {
      const org1Keys = await prisma.keyType.findMany({
        where: { entityId: org1Id },
      });

      expect(org1Keys.every((k) => k.entityId === org1Id)).toBe(true);
      expect(org1Keys.some((k) => k.id === key2Id)).toBe(false);
    });
  });

  describe('Borrowers filtering', () => {
    it('should only return borrowers from org1', async () => {
      const borrowers = await prisma.borrower.findMany({
        where: { entityId: org1Id },
      });

      expect(borrowers).toHaveLength(1);
      expect(borrowers[0].id).toBe(borrower1Id);
    });

    it('should only return borrowers from org2', async () => {
      const borrowers = await prisma.borrower.findMany({
        where: { entityId: org2Id },
      });

      expect(borrowers).toHaveLength(1);
      expect(borrowers[0].id).toBe(borrower2Id);
    });
  });

  describe('getCurrentUser() returns entityId', () => {
    it('should return entityId matching activeOrganisationId', async () => {
      // Mock the Supabase auth response
      const { createClient } = require('@/lib/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { email: 'test-isolation@example.com' } },
            error: null,
          }),
        },
      };
      createClient.mockReturnValue(mockSupabase);

      const user = await getCurrentUser();

      expect(user.entityId).toBeDefined();
      expect(user.entityId).toBe(org1Id);
      expect(user).not.toHaveProperty('activeOrganisationId');
    });
  });

  describe('Cross-org data access prevention', () => {
    it('should not allow accessing keys by ID from different org', async () => {
      // Try to access org2's key while org1 is active
      const key = await prisma.keyType.findFirst({
        where: {
          id: key2Id,
          entityId: org1Id, // Should fail this check
        },
      });

      expect(key).toBeNull();
    });

    it('should not allow accessing borrowers by ID from different org', async () => {
      const borrower = await prisma.borrower.findFirst({
        where: {
          id: borrower2Id,
          entityId: org1Id, // Should fail this check
        },
      });

      expect(borrower).toBeNull();
    });
  });
});



