/**
 * Test key issuing workflow with new borrower structure
 */

import { prisma } from './lib/prisma';
import { issueKey, getAvailableKeyTypes } from './app/actions/issueKey';
import { getBorrowerDetails } from './lib/borrower-utils';

async function testKeyIssuing() {
  console.log('🔑 Testing Key Issuing Workflow...\n');

  // Get test user
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  try {
    // Test 1: Get available key types
    console.log('📋 Test 1: Getting Available Key Types');
    const availableKeys = await getAvailableKeyTypes();

    if (!availableKeys.success) {
      console.error('❌ Failed to get available keys:', availableKeys.error);
      return;
    }

    console.log(`  ✅ Found ${availableKeys.data?.length} key types`);
    const availableKey = availableKeys.data?.find((k) => k.availableCopies > 0);

    if (!availableKey) {
      console.error('❌ No available keys for testing');
      return;
    }

    console.log(`  📝 Using key type: ${availableKey.label} - ${availableKey.function}`);
    console.log(
      `     Available copies: ${availableKey.availableCopies}/${availableKey.totalCopies}\n`,
    );

    // Test 2: Issue key to new resident borrower
    console.log('🏠 Test 2: Issue Key to New Resident Borrower');
    const residentFormData = new FormData();
    residentFormData.append('keyTypeId', availableKey.id);
    residentFormData.append('borrowerName', 'Test Resident Borrower');
    residentFormData.append('borrowerEmail', 'test.resident.issuing@test.com');
    residentFormData.append('borrowerPhone', '070-111-2222');
    // notes removed
    residentFormData.append('idChecked', 'true');

    const residentResult = await issueKey(residentFormData);

    if (residentResult.success) {
      console.log(`  ✅ Key issued successfully: ${residentResult.data?.keyInfo}`);
      console.log(`     To: ${residentResult.data?.borrowerName}`);
      console.log(`     Issue ID: ${residentResult.data?.issueId}`);

      // Verify borrower was created as resident
      const createdBorrower = await prisma.borrower.findFirst({
        where: {
          issueRecords: { some: { id: residentResult.data?.issueId } },
        },
        include: {
          residentBorrower: true,
          externalBorrower: true,
        },
      });

      if (createdBorrower) {
        const details = getBorrowerDetails(createdBorrower);
        console.log(`     Borrower affiliation: ${details.affiliation}`);
      }
    } else {
      console.error(`  ❌ Failed to issue key: ${residentResult.error}`);
    }
    console.log();

    // Test 3: Issue key to new external borrower (with company)
    console.log('🏢 Test 3: Issue Key to New External Borrower (Company)');
    const externalFormData = new FormData();
    externalFormData.append('keyTypeId', availableKey.id);
    externalFormData.append('borrowerName', 'Test External Company Rep');
    externalFormData.append('borrowerEmail', 'test.external.issuing@testcompany.com');
    externalFormData.append('borrowerPhone', '073-333-4444');
    externalFormData.append('borrowerCompany', 'Test Maintenance Company AB');
    // notes removed
    externalFormData.append('idChecked', 'true');

    const externalResult = await issueKey(externalFormData);

    if (externalResult.success) {
      console.log(`  ✅ Key issued successfully: ${externalResult.data?.keyInfo}`);
      console.log(`     To: ${externalResult.data?.borrowerName}`);
      console.log(`     Issue ID: ${externalResult.data?.issueId}`);

      // Verify borrower was created as external
      const createdExternalBorrower = await prisma.borrower.findFirst({
        where: {
          issueRecords: { some: { id: externalResult.data?.issueId } },
        },
        include: {
          residentBorrower: true,
          externalBorrower: true,
        },
      });

      if (createdExternalBorrower) {
        const details = getBorrowerDetails(createdExternalBorrower);
        console.log(`     Borrower affiliation: ${details.affiliation}`);
        console.log(`     Company: ${details.company}`);
      }
    } else {
      console.error(`  ❌ Failed to issue key: ${externalResult.error}`);
    }
    console.log();

    // Test 4: Issue another key to existing borrower
    console.log('🔄 Test 4: Issue Another Key to Existing Borrower');

    // Get another available key type
    const anotherAvailableKey = availableKeys.data?.find(
      (k) => k.availableCopies > 0 && k.id !== availableKey.id,
    );

    if (anotherAvailableKey) {
      const existingBorrowerFormData = new FormData();
      existingBorrowerFormData.append('keyTypeId', anotherAvailableKey.id);
      existingBorrowerFormData.append('borrowerName', 'Test Resident Borrower'); // Same name
      existingBorrowerFormData.append('borrowerEmail', 'test.resident.issuing@test.com'); // Same email
      existingBorrowerFormData.append('borrowerPhone', '070-111-2222');
      existingBorrowerFormData.append('notes', 'Second key for existing borrower');
      existingBorrowerFormData.append('idChecked', 'true');

      const existingResult = await issueKey(existingBorrowerFormData);

      if (existingResult.success) {
        console.log(`  ✅ Second key issued: ${existingResult.data?.keyInfo}`);
        console.log(`     To existing borrower: ${existingResult.data?.borrowerName}`);
      } else {
        console.error(`  ❌ Failed to issue second key: ${existingResult.error}`);
      }
    } else {
      console.log('  ⚠️ No other available key types for testing existing borrower');
    }
    console.log();

    // Test 5: Verify database state
    console.log('🔍 Test 5: Verify Database State After Issuing');

    const testIssueRecords = await prisma.issueRecord.findMany({
      where: {
        borrower: {
          OR: [
            { residentBorrower: { email: { contains: '@test.com' } } },
            { externalBorrower: { email: { contains: '@testcompany.com' } } },
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

    console.log(`  📊 Found ${testIssueRecords.length} test issue records:`);
    testIssueRecords.forEach((record, index) => {
      const borrowerDetails = getBorrowerDetails(record.borrower);
      console.log(`    ${index + 1}. ${borrowerDetails.name} (${borrowerDetails.affiliation})`);
      console.log(`       Key: ${record.keyCopy.keyType.label}-${record.keyCopy.copyNumber}`);
      console.log(`       Email: ${borrowerDetails.email}`);
      if (borrowerDetails.company) {
        console.log(`       Company: ${borrowerDetails.company}`);
      }
    });

    console.log('\n✅ Key issuing tests completed successfully!');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');

    // Delete issue records first (foreign key constraints)
    await prisma.issueRecord.deleteMany({
      where: { id: { in: testIssueRecords.map((r) => r.id) } },
    });

    // Update key status back to available
    const keyCopyIds = testIssueRecords.map((r) => r.keyCopyId);
    await prisma.keyCopy.updateMany({
      where: { id: { in: keyCopyIds } },
      data: { status: 'AVAILABLE' },
    });

    // Delete borrowers and their related records
    await prisma.borrower.deleteMany({
      where: {
        userId: testUser.id,
        OR: [
          { residentBorrower: { email: { contains: '@test.com' } } },
          { externalBorrower: { email: { contains: '@testcompany.com' } } },
        ],
      },
    });

    await prisma.residentBorrower.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    await prisma.externalBorrower.deleteMany({
      where: { email: { contains: '@testcompany.com' } },
    });

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Key issuing test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKeyIssuing();
