/**
 * Test dashboard queries with new borrower structure
 */

import { prisma } from './lib/prisma';
import { getBorrowerDetails } from './lib/borrower-utils';

async function testDashboardQueries() {
  console.log('📊 Testing Dashboard Queries...\n');

  // Get test user
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  try {
    // Test 1: Key Status Summary (like getKeyStatusSummary from dashboard.ts)
    console.log('📈 Test 1: Key Status Summary');

    const keyStatusSummary = await prisma.keyType.findMany({
      where: { userId: testUser.id },
      select: {
        id: true,
        label: true,
        function: true,
        keyCopies: {
          select: { status: true },
        },
      },
    });

    console.log(`  📊 Found ${keyStatusSummary.length} key types:`);
    keyStatusSummary.forEach((keyType) => {
      const total = keyType.keyCopies.length;
      const available = keyType.keyCopies.filter((copy) => copy.status === 'AVAILABLE').length;
      const out = keyType.keyCopies.filter((copy) => copy.status === 'OUT').length;
      const lost = keyType.keyCopies.filter((copy) => copy.status === 'LOST').length;

      console.log(
        `    ${keyType.label}: ${total} total (${available} available, ${out} out, ${lost} lost)`,
      );
    });
    console.log();

    // Test 2: Borrowed Keys Table Data (like getBorrowedKeysTableData)
    console.log('📋 Test 2: Borrowed Keys Table Data');

    const borrowedKeysData = await prisma.issueRecord.findMany({
      where: { userId: testUser.id },
      include: {
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
        keyCopy: {
          include: {
            keyType: true,
          },
        },
      },
      orderBy: { issuedDate: 'desc' },
      take: 10, // Limit for testing
    });

    console.log(`  📊 Found ${borrowedKeysData.length} recent issue records:`);
    borrowedKeysData.forEach((record, index) => {
      const borrowerDetails = getBorrowerDetails(record.borrower);
      const status = record.returnedDate ? 'Returned' : 'Active';

      console.log(
        `    ${index + 1}. ${record.keyCopy.keyType.label}-${record.keyCopy.copyNumber} → ${borrowerDetails.name}`,
      );
      console.log(`       Borrower: ${borrowerDetails.affiliation} | ${borrowerDetails.email}`);
      if (borrowerDetails.company) {
        console.log(`       Company: ${borrowerDetails.company}`);
      }
      console.log(`       Status: ${status} | Issued: ${record.issuedDate.toLocaleDateString()}`);
      if (record.returnedDate) {
        console.log(`       Returned: ${record.returnedDate.toLocaleDateString()}`);
      }
    });
    console.log();

    // Test 3: Borrowers with Keys Grouped (like getBorrowersWithKeysGrouped)
    console.log('👥 Test 3: Borrowers with Keys Grouped (Active Loans)');

    const activeIssueRecords = await prisma.issueRecord.findMany({
      where: {
        userId: testUser.id,
        returnedDate: null, // Only active loans
      },
      include: {
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
        keyCopy: {
          include: {
            keyType: true,
          },
        },
      },
    });

    // Group by borrower (simulating the getBorrowersWithKeysGrouped logic)
    const borrowerMap = new Map();

    activeIssueRecords.forEach((record) => {
      const borrowerId = record.borrower.id;

      if (!borrowerMap.has(borrowerId)) {
        const borrowerDetails = getBorrowerDetails(record.borrower);
        borrowerMap.set(borrowerId, {
          borrowerId: record.borrower.id,
          borrowerName: borrowerDetails.name,
          email: borrowerDetails.email ?? '',
          phone: borrowerDetails.phone ?? '',
          isResident: borrowerDetails.affiliation === 'RESIDENT',
          companyName: borrowerDetails.company ?? undefined,
          borrowedKeys: [],
          activeLoanCount: 0,
          hasOverdue: false,
        });
      }

      const borrower = borrowerMap.get(borrowerId);
      borrower.borrowedKeys.push({
        keyLabel: record.keyCopy.keyType.label,
        copyNumber: record.keyCopy.copyNumber,
        keyFunction: record.keyCopy.keyType.function,
        borrowedAt: record.issuedDate?.toISOString() ?? '',
        dueDate: record.dueDate?.toISOString() ?? '',
        issueId: record.id,
      });
      borrower.activeLoanCount++;

      // Check if overdue
      if (record.dueDate && record.dueDate < new Date()) {
        borrower.hasOverdue = true;
      }
    });

    const groupedBorrowers = Array.from(borrowerMap.values());
    console.log(`  📊 Found ${groupedBorrowers.length} borrowers with active loans:`);

    groupedBorrowers.forEach((borrower, index) => {
      console.log(
        `    ${index + 1}. ${borrower.borrowerName} (${borrower.isResident ? 'Resident' : 'External'})`,
      );
      console.log(`       Email: ${borrower.email}`);
      if (borrower.companyName) {
        console.log(`       Company: ${borrower.companyName}`);
      }
      console.log(
        `       Active Loans: ${borrower.activeLoanCount}${borrower.hasOverdue ? ' (OVERDUE)' : ''}`,
      );
      borrower.borrowedKeys.forEach((key) => {
        console.log(`         - ${key.keyLabel}-${key.copyNumber}: ${key.keyFunction}`);
      });
    });
    console.log();

    // Test 4: Search Functionality (like searchBorrowers)
    console.log('🔍 Test 4: Borrower Search Functionality');

    const searchTerm = 'erik'; // Search for common name
    const searchResults = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        OR: [
          {
            residentBorrower: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
          {
            externalBorrower: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        residentBorrower: true,
        externalBorrower: true,
      },
      take: 10,
    });

    console.log(`  🔍 Search for "${searchTerm}" found ${searchResults.length} borrowers:`);
    searchResults.forEach((borrower, index) => {
      const details = getBorrowerDetails(borrower);
      console.log(`    ${index + 1}. ${details.name} (${details.affiliation})`);
      console.log(`       Email: ${details.email}`);
      console.log(`       Phone: ${details.phone || 'N/A'}`);
      if (details.company) {
        console.log(`       Company: ${details.company}`);
      }
    });
    console.log();

    // Test 5: Affiliation Statistics
    console.log('📊 Test 5: Affiliation Statistics');

    const affiliationStats = await prisma.borrower.groupBy({
      by: ['affiliation'],
      where: { userId: testUser.id },
      _count: { affiliation: true },
    });

    // Count active loans by affiliation (simplified approach)
    const residentActiveLoans = activeIssueRecords.filter(
      (record) => getBorrowerDetails(record.borrower).affiliation === 'RESIDENT',
    ).length;

    const externalActiveLoans = activeIssueRecords.filter(
      (record) => getBorrowerDetails(record.borrower).affiliation === 'EXTERNAL',
    ).length;

    console.log('  📈 Borrower Distribution:');
    affiliationStats.forEach((stat) => {
      console.log(`    ${stat.affiliation}: ${stat._count.affiliation} borrowers`);
    });

    console.log('  📈 Active Loans Distribution:');
    console.log(`    RESIDENT: ${residentActiveLoans} active loans`);
    console.log(`    EXTERNAL: ${externalActiveLoans} active loans`);

    console.log('\n✅ Dashboard queries tests completed successfully!');
  } catch (error) {
    console.error('❌ Dashboard queries test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardQueries();
