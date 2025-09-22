/**
 * Test script to verify the new borrower affiliation schema
 */

import { prisma } from './lib/prisma';
import { getBorrowerDetails } from './lib/borrower-utils';

async function testSchema() {
  console.log('🔍 Testing New Borrower Schema Structure...\n');

  try {
    // 1. Check total counts
    const counts = {
      borrowers: await prisma.borrower.count(),
      residents: await prisma.residentBorrower.count(),
      externals: await prisma.externalBorrower.count(),
      issueRecords: await prisma.issueRecord.count(),
    };

    console.log('📊 Database Counts:');
    console.log(`  Total Borrowers: ${counts.borrowers}`);
    console.log(`  Resident Borrowers: ${counts.residents}`);
    console.log(`  External Borrowers: ${counts.externals}`);
    console.log(`  Active Issue Records: ${counts.issueRecords}`);
    console.log(
      `  Sum Check: ${counts.residents + counts.externals} should equal ${counts.borrowers}\n`,
    );

    // 2. Check affiliation distribution
    const affiliationCounts = await prisma.borrower.groupBy({
      by: ['affiliation'],
      _count: { affiliation: true },
    });

    console.log('🏠 Affiliation Distribution:');
    affiliationCounts.forEach((group) => {
      console.log(`  ${group.affiliation}: ${group._count.affiliation}`);
    });
    console.log();

    // 3. Sample some borrowers with details
    const sampleBorrowers = await prisma.borrower.findMany({
      take: 5,
      include: {
        residentBorrower: true,
        externalBorrower: true,
        issueRecords: {
          where: { returnedDate: null },
          include: {
            keyCopy: {
              include: { keyType: true },
            },
          },
        },
      },
    });

    console.log('👥 Sample Borrowers with Details:');
    sampleBorrowers.forEach((borrower, index) => {
      const details = getBorrowerDetails(borrower);
      console.log(`  ${index + 1}. ${details.name} (${details.affiliation})`);
      console.log(`     Email: ${details.email}`);
      console.log(`     Phone: ${details.phone || 'N/A'}`);
      if (details.company) console.log(`     Company: ${details.company}`);
      if (details.address) console.log(`     Address: ${details.address}`);
      console.log(`     Active Loans: ${borrower.issueRecords.length}`);
      if (borrower.issueRecords.length > 0) {
        borrower.issueRecords.forEach((record) => {
          console.log(`       - ${record.keyCopy.keyType.label}-${record.keyCopy.copyNumber}`);
        });
      }
      console.log();
    });

    // 4. Check for data integrity issues
    console.log('🔍 Data Integrity Checks:');

    // Check for orphaned borrowers
    const orphanedBorrowers = await prisma.borrower.findMany({
      where: {
        AND: [{ residentBorrowerId: null }, { externalBorrowerId: null }],
      },
    });
    console.log(`  Orphaned borrowers (should be 0): ${orphanedBorrowers.length}`);

    // Check for borrowers with both types
    const duplicateBorrowers = await prisma.borrower.findMany({
      where: {
        AND: [{ residentBorrowerId: { not: null } }, { externalBorrowerId: { not: null } }],
      },
    });
    console.log(`  Borrowers with both types (should be 0): ${duplicateBorrowers.length}`);

    // Check for email uniqueness conflicts
    const residentEmails = await prisma.residentBorrower.findMany({
      select: { email: true },
    });
    const externalEmails = await prisma.externalBorrower.findMany({
      select: { email: true },
    });

    const residentSet = new Set(residentEmails.map((r) => r.email));
    const externalSet = new Set(externalEmails.map((e) => e.email));
    const overlap = [...residentSet].filter((email) => externalSet.has(email));

    console.log(`  Email conflicts between resident/external (should be 0): ${overlap.length}`);
    if (overlap.length > 0) {
      console.log(`    Conflicting emails: ${overlap.join(', ')}`);
    }

    console.log('\n✅ Schema test completed successfully!');
  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();

