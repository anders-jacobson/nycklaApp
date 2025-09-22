/**
 * Test key issuing workflow with direct database operations (bypassing auth)
 */

import { prisma } from './lib/prisma';
import { createBorrowerWithAffiliation, getBorrowerDetails } from './lib/borrower-utils';

async function testKeyIssuingDirect() {
  console.log('🔑 Testing Key Issuing Workflow (Direct DB)...\n');

  // Get test user
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  try {
    // Get an available key for testing
    const availableKeyCopy = await prisma.keyCopy.findFirst({
      where: { status: 'AVAILABLE' },
      include: { keyType: true },
    });

    if (!availableKeyCopy) {
      console.error('❌ No available keys for testing');
      return;
    }

    console.log(`📝 Using key: ${availableKeyCopy.keyType.label}-${availableKeyCopy.copyNumber}`);
    console.log(`   Function: ${availableKeyCopy.keyType.function}\n`);

    // Test 1: Simulate issuing key to resident borrower
    console.log('🏠 Test 1: Issue Key to Resident Borrower');

    const residentBorrower = await createBorrowerWithAffiliation(
      {
        name: 'Test Resident User',
        email: 'test.resident.direct@test.com',
        phone: '070-111-2222',
      },
      testUser.id,
    );

    // Create issue record
    const residentIssue = await prisma.$transaction(async (tx) => {
      // Mark key as OUT
      await tx.keyCopy.update({
        where: { id: availableKeyCopy.id },
        data: { status: 'OUT' },
      });

      // Create issue record
      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKeyCopy.id,
          borrowerId: residentBorrower.id,
          userId: testUser.id,
          notes: 'Test resident key issuing',
          idChecked: true,
        },
      });
    });

    const residentDetails = getBorrowerDetails(residentBorrower);
    console.log(`  ✅ Key issued to: ${residentDetails.name} (${residentDetails.affiliation})`);
    console.log(`     Email: ${residentDetails.email}`);
    console.log(`     Issue ID: ${residentIssue.id}\n`);

    // Test 2: Get another available key for external borrower
    const anotherAvailableKey = await prisma.keyCopy.findFirst({
      where: {
        status: 'AVAILABLE',
        id: { not: availableKeyCopy.id },
      },
      include: { keyType: true },
    });

    if (anotherAvailableKey) {
      console.log('🏢 Test 2: Issue Key to External Borrower');

      const externalBorrower = await createBorrowerWithAffiliation(
        {
          name: 'Test External Company Rep',
          email: 'test.external.direct@company.com',
          phone: '073-333-4444',
          company: 'Test Maintenance AB',
          address: '123 Test Street, Stockholm',
        },
        testUser.id,
      );

      const externalIssue = await prisma.$transaction(async (tx) => {
        await tx.keyCopy.update({
          where: { id: anotherAvailableKey.id },
          data: { status: 'OUT' },
        });

        return await tx.issueRecord.create({
          data: {
            keyCopyId: anotherAvailableKey.id,
            borrowerId: externalBorrower.id,
            userId: testUser.id,
            notes: 'External contractor access',
            idChecked: true,
          },
        });
      });

      const externalDetails = getBorrowerDetails(externalBorrower);
      console.log(`  ✅ Key issued to: ${externalDetails.name} (${externalDetails.affiliation})`);
      console.log(`     Email: ${externalDetails.email}`);
      console.log(`     Company: ${externalDetails.company}`);
      console.log(`     Address: ${externalDetails.address}`);
      console.log(`     Issue ID: ${externalIssue.id}\n`);
    }

    // Test 3: Verify data relationships
    console.log('🔍 Test 3: Verify Data Relationships');

    const issueRecordsWithDetails = await prisma.issueRecord.findMany({
      where: {
        borrower: {
          OR: [
            { residentBorrower: { email: { contains: '@test.com' } } },
            { externalBorrower: { email: { contains: '@company.com' } } },
          ],
        },
      },
      include: {
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
        keyCopy: {
          include: { keyType: true },
        },
      },
    });

    console.log(`  📊 Found ${issueRecordsWithDetails.length} test issue records:`);
    issueRecordsWithDetails.forEach((record, index) => {
      const borrowerDetails = getBorrowerDetails(record.borrower);
      console.log(
        `    ${index + 1}. ${record.keyCopy.keyType.label}-${record.keyCopy.copyNumber} → ${borrowerDetails.name}`,
      );
      console.log(`       Affiliation: ${borrowerDetails.affiliation}`);
      console.log(`       Email: ${borrowerDetails.email}`);
      if (borrowerDetails.company) {
        console.log(`       Company: ${borrowerDetails.company}`);
      }
      console.log(`       Issue Date: ${record.issuedDate.toLocaleDateString()}`);
      console.log(`       ID Checked: ${record.idChecked ? 'Yes' : 'No'}`);
    });

    // Test 4: Test borrower search across both types
    console.log('\n🔍 Test 4: Test Cross-Type Borrower Search');

    const searchResults = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        OR: [
          {
            residentBorrower: {
              OR: [
                { name: { contains: 'Test', mode: 'insensitive' } },
                { email: { contains: 'test', mode: 'insensitive' } },
              ],
            },
          },
          {
            externalBorrower: {
              OR: [
                { name: { contains: 'Test', mode: 'insensitive' } },
                { email: { contains: 'test', mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        residentBorrower: true,
        externalBorrower: true,
      },
    });

    console.log(`  🔍 Search for "test" found ${searchResults.length} borrowers:`);
    searchResults.forEach((borrower, index) => {
      const details = getBorrowerDetails(borrower);
      console.log(`    ${index + 1}. ${details.name} (${details.affiliation}) - ${details.email}`);
    });

    console.log('\n✅ Key issuing direct tests completed successfully!');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');

    const testBorrowerIds = issueRecordsWithDetails.map((r) => r.borrowerId);
    const testKeyCopyIds = issueRecordsWithDetails.map((r) => r.keyCopyId);

    // Delete issue records
    await prisma.issueRecord.deleteMany({
      where: { borrowerId: { in: testBorrowerIds } },
    });

    // Mark keys as available again
    await prisma.keyCopy.updateMany({
      where: { id: { in: testKeyCopyIds } },
      data: { status: 'AVAILABLE' },
    });

    // Delete borrowers
    await prisma.borrower.deleteMany({
      where: { id: { in: testBorrowerIds } },
    });

    // Delete sub-records
    await prisma.residentBorrower.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    await prisma.externalBorrower.deleteMany({
      where: { email: { contains: '@company.com' } },
    });

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Key issuing direct test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKeyIssuingDirect();

