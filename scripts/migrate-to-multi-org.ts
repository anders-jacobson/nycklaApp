/**
 * Migration Verification Script for Multi-Organisation Support
 *
 * This script verifies data integrity after migrating to multi-organisation model:
 * - Checks that all users have UserOrganisation records
 * - Verifies activeOrganisationId is set for all users
 * - Confirms role data integrity
 */

import { prisma } from '../lib/prisma';

interface MigrationStats {
  totalUsers: number;
  usersWithActiveOrg: number;
  usersWithoutActiveOrg: number;
  totalUserOrganisations: number;
  roleDistribution: Record<string, number>;
  issues: string[];
}

async function verifyMigration(): Promise<MigrationStats> {
  console.log('🔍 Starting migration verification...\n');

  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithActiveOrg: 0,
    usersWithoutActiveOrg: 0,
    totalUserOrganisations: 0,
    roleDistribution: { OWNER: 0, ADMIN: 0, MEMBER: 0 },
    issues: [],
  };

  try {
    // Count total users
    stats.totalUsers = await prisma.user.count();
    console.log(`📊 Total users: ${stats.totalUsers}`);

    // Check users with active organisation
    stats.usersWithActiveOrg = await prisma.user.count({
      where: { activeOrganisationId: { not: null } },
    });
    stats.usersWithoutActiveOrg = stats.totalUsers - stats.usersWithActiveOrg;

    console.log(`✅ Users with active organisation: ${stats.usersWithActiveOrg}`);
    console.log(`⚠️  Users without active organisation: ${stats.usersWithoutActiveOrg}`);

    // Count total UserOrganisation records
    stats.totalUserOrganisations = await prisma.userOrganisation.count();
    console.log(`📊 Total UserOrganisation records: ${stats.totalUserOrganisations}`);

    // Check role distribution
    const userOrgs = await prisma.userOrganisation.findMany({
      select: { role: true },
    });

    userOrgs.forEach((uo) => {
      stats.roleDistribution[uo.role]++;
    });

    console.log('\n📊 Role Distribution:');
    console.log(`   OWNER: ${stats.roleDistribution.OWNER}`);
    console.log(`   ADMIN: ${stats.roleDistribution.ADMIN}`);
    console.log(`   MEMBER: ${stats.roleDistribution.MEMBER}`);

    // Verify each user has at least one organisation
    const usersWithoutOrgs = await prisma.user.findMany({
      where: {
        organisations: { none: {} },
      },
      select: { id: true, email: true },
    });

    if (usersWithoutOrgs.length > 0) {
      stats.issues.push(`Found ${usersWithoutOrgs.length} users without any organisation`);
      console.log(`\n⚠️  Users without organisations:`);
      usersWithoutOrgs.forEach((user) => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }

    // Verify activeOrganisationId points to valid organisation membership
    const usersWithInvalidActiveOrg = await prisma.user.findMany({
      where: {
        AND: [
          { activeOrganisationId: { not: null } },
          {
            organisations: {
              none: {
                organisationId: { equals: prisma.user.fields.activeOrganisationId },
              },
            },
          },
        ],
      },
      select: { id: true, email: true, activeOrganisationId: true },
    });

    if (usersWithInvalidActiveOrg.length > 0) {
      stats.issues.push(
        `Found ${usersWithInvalidActiveOrg.length} users with activeOrganisationId not matching any membership`,
      );
      console.log(`\n⚠️  Users with invalid active organisation:`);
      usersWithInvalidActiveOrg.forEach((user) => {
        console.log(`   - ${user.email} (Active Org: ${user.activeOrganisationId})`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (stats.issues.length === 0) {
      console.log('✅ Migration verification PASSED');
      console.log('   All users have been migrated correctly');
    } else {
      console.log('⚠️  Migration verification found issues:');
      stats.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    console.log('='.repeat(50) + '\n');

    return stats;
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyMigration()
  .then((stats) => {
    if (stats.issues.length > 0) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });





