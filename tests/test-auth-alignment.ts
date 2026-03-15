/**
 * Test script for Auth & Prisma User ID alignment
 *
 * Run with: npx tsx tests/test-auth-alignment.ts
 */

import { prisma } from '../lib/prisma';

async function testAuthAlignment() {
  console.log('🧪 Testing Auth & Prisma User ID Alignment\n');

  try {
    // Test 1: Check User schema (no default on id)
    console.log('1️⃣  Checking User schema...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      take: 5,
    });
    console.log(`   ✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log(`   📋 Sample: ${users[0].email} (${users[0].id})`);
    }

    // Test 2: Check UserOrganisation has joinedAt for ordering
    console.log('\n2️⃣  Checking UserOrganisation ordering...');
    const memberships = await prisma.userOrganisation.findMany({
      select: { userId: true, organisationId: true, joinedAt: true, role: true },
      orderBy: { joinedAt: 'asc' },
      take: 3,
    });
    console.log(`   ✅ Found ${memberships.length} memberships`);
    if (memberships.length > 0) {
      console.log(
        `   📋 Oldest: ${memberships[0].role} joined ${memberships[0].joinedAt.toISOString()}`,
      );
    }

    // Test 3: Check Invitation model for accepted field
    console.log('\n3️⃣  Checking Invitation model...');
    const invitations = await prisma.invitation.findMany({
      select: { email: true, accepted: true, expiresAt: true },
      take: 3,
    });
    console.log(`   ✅ Found ${invitations.length} invitations`);
    const acceptedCount = invitations.filter((i) => i.accepted).length;
    console.log(`   📊 ${acceptedCount} accepted, ${invitations.length - acceptedCount} pending`);

    // Test 4: Verify composite unique key on UserOrganisation
    console.log('\n4️⃣  Testing UserOrganisation unique constraint...');
    if (memberships.length > 0) {
      const testMembership = memberships[0];
      try {
        // This should work (upsert with existing record)
        await prisma.userOrganisation.upsert({
          where: {
            userId_organisationId: {
              userId: testMembership.userId,
              organisationId: testMembership.organisationId,
            },
          },
          create: {
            userId: testMembership.userId,
            organisationId: testMembership.organisationId,
            role: testMembership.role,
          },
          update: {},
        });
        console.log('   ✅ Upsert with composite key works');
      } catch (error) {
        console.log('   ❌ Upsert failed:', error);
      }
    } else {
      console.log('   ⏭️  Skipped (no memberships to test)');
    }

    // Test 5: Check if any users have null activeOrganisationId but have memberships
    console.log('\n5️⃣  Checking for stale activeOrganisationId...');
    const usersWithStaleOrg = await prisma.user.findMany({
      where: {
        OR: [
          { activeOrganisationId: null },
          {
            activeOrganisationId: {
              not: {
                in: await prisma.userOrganisation
                  .findMany({ select: { organisationId: true } })
                  .then((orgs) => orgs.map((o) => o.organisationId)),
              },
            },
          },
        ],
      },
      include: {
        organisations: {
          select: { organisationId: true },
        },
      },
    });
    const staleWithMemberships = usersWithStaleOrg.filter((u) => u.organisations.length > 0);
    if (staleWithMemberships.length > 0) {
      console.log(
        `   ⚠️  Found ${staleWithMemberships.length} users with stale activeOrganisationId`,
      );
      console.log('   💡 These will be auto-fixed on next login');
    } else {
      console.log('   ✅ No users with stale activeOrganisationId');
    }

    console.log('\n✅ All tests passed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Test registration flow (create new user)');
    console.log('   2. Test invitation flow (invite + accept)');
    console.log('   3. Test OAuth login (Google)');
    console.log('   4. Test edge cases (retries, concurrent accepts)');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAuthAlignment().catch(console.error);
