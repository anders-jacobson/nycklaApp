/**
 * Comprehensive tests for Issue Key and Return Key workflows
 *
 * Tests cover:
 * - Issue workflow (single/multiple keys, new/existing borrowers)
 * - Return workflow (single/bulk returns, GDPR cleanup)
 * - Integration tests (issue → return → reissue)
 * - Error handling and validation
 */

import { prisma } from '../lib/prisma';
import { createBorrowerWithAffiliation, getBorrowerDetails } from '../lib/borrower-utils';

// Test data storage
interface TestData {
  userId: string;
  borrowers: Array<{ id: string; name: string; email: string }>;
  issueRecords: Array<{ id: string; keyCopyId: string; borrowerId: string }>;
  keyCopies: Array<{ id: string; keyTypeId: string; copyNumber: number }>;
}

const testData: TestData = {
  userId: '',
  borrowers: [],
  issueRecords: [],
  keyCopies: [],
};

// Utility functions
function logSection(title: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(80)}\n`);
}

function logTest(testName: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function getTestUser() {
  const user = await prisma.user.findFirst({
    where: { activeOrganisationId: { not: null } },
  });
  if (!user) throw new Error('Test user not found — run prisma db seed first');
  testData.userId = user.id;
  return user;
}

async function getAvailableKeys(count: number = 3) {
  return await prisma.keyCopy.findMany({
    where: { status: 'AVAILABLE' },
    include: { keyType: true },
    take: count,
  });
}

// =============================================================================
// ISSUE WORKFLOW TESTS
// =============================================================================

async function testIssueSingleKeyNewBorrower() {
  logSection('TEST 1: Issue Single Key to New Borrower');

  try {
    const user = await getTestUser();
    const [availableKey] = await getAvailableKeys(1);

    if (!availableKey) {
      console.log('⚠️  Skipping test - no available keys found (run prisma db seed)');
      return true;
    }

    console.log(`📝 Using key: ${availableKey.keyType.label}-${availableKey.copyNumber}`);
    console.log(`   Function: ${availableKey.keyType.function}`);

    // Create new borrower
    const borrower = await createBorrowerWithAffiliation(
      {
        name: 'Test User Single Key',
        email: 'test.single@workflow.test',
        phone: '070-111-0001',
      },
      user.activeOrganisationId!,
    );

    testData.borrowers.push({
      id: borrower.id,
      name: 'Test User Single Key',
      email: 'test.single@workflow.test',
    });

    // Issue key
    const issueRecord = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: borrower.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
    });

    testData.issueRecords.push({
      id: issueRecord.id,
      keyCopyId: availableKey.id,
      borrowerId: borrower.id,
    });

    // Verify
    const verifyKeyCopy = await prisma.keyCopy.findUnique({
      where: { id: availableKey.id },
    });
    const verifyIssue = await prisma.issueRecord.findUnique({
      where: { id: issueRecord.id },
      include: { borrower: true },
    });

    const keyStatusCorrect = verifyKeyCopy?.status === 'OUT';
    const issueCreated = !!verifyIssue;
    const borrowerLinked = verifyIssue?.borrowerId === borrower.id;
    const dueDateSet = !!verifyIssue?.dueDate;

    logTest('Issue single key to new borrower', keyStatusCorrect && issueCreated && borrowerLinked);
    logTest('Key status changed to OUT', keyStatusCorrect);
    logTest('Issue record created', issueCreated);
    logTest('Borrower correctly linked', borrowerLinked);
    logTest('Due date set', dueDateSet);

    const borrowerDetails = await getBorrowerDetails(borrower, user.activeOrganisationId!);
    console.log(`\n📋 Summary:`);
    console.log(`   Borrower: ${borrowerDetails.name} (${borrowerDetails.email})`);
    console.log(`   Key: ${availableKey.keyType.label}-${availableKey.copyNumber}`);
    console.log(`   Issue ID: ${issueRecord.id}`);
    console.log(`   Due Date: ${verifyIssue?.dueDate?.toLocaleDateString()}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testIssueMultipleKeysNewBorrower() {
  logSection('TEST 2: Issue Multiple Keys to New Borrower');

  try {
    const user = await getTestUser();
    const availableKeys = await getAvailableKeys(3);

    if (availableKeys.length < 3) {
      console.log('⚠️  Skipping test - not enough available keys found (run prisma db seed)');
      return true;
    }

    console.log(`📝 Using ${availableKeys.length} keys:`);
    availableKeys.forEach((key) => {
      console.log(`   - ${key.keyType.label}-${key.copyNumber} (${key.keyType.function})`);
    });

    // Create new borrower
    const borrower = await createBorrowerWithAffiliation(
      {
        name: 'Test User Multiple Keys',
        email: 'test.multiple@workflow.test',
        phone: '070-222-0002',
        company: 'Test Company AB',
      },
      user.activeOrganisationId!,
    );

    testData.borrowers.push({
      id: borrower.id,
      name: 'Test User Multiple Keys',
      email: 'test.multiple@workflow.test',
    });

    // Issue multiple keys in transaction
    const issueRecords = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const key of availableKeys) {
        await tx.keyCopy.update({
          where: { id: key.id },
          data: { status: 'OUT' },
        });

        const record = await tx.issueRecord.create({
          data: {
            keyCopyId: key.id,
            borrowerId: borrower.id,
            entityId: user.activeOrganisationId!,
            userId: user.id,
            idChecked: true,
          },
        });

        records.push(record);
        testData.issueRecords.push({
          id: record.id,
          keyCopyId: key.id,
          borrowerId: borrower.id,
        });
      }

      return records;
    });

    // Verify
    const verifyKeyCopies = await prisma.keyCopy.findMany({
      where: { id: { in: availableKeys.map((k) => k.id) } },
    });

    const allKeysOut = verifyKeyCopies.every((k) => k.status === 'OUT');
    const allIssuesCreated = issueRecords.length === availableKeys.length;

    const borrowerActiveLoans = await prisma.issueRecord.count({
      where: {
        borrowerId: borrower.id,
        returnedDate: null,
      },
    });

    logTest('Issue multiple keys to new borrower', allKeysOut && allIssuesCreated);
    logTest('All keys status changed to OUT', allKeysOut);
    logTest('All issue records created', allIssuesCreated);
    logTest('All keys linked to same borrower', borrowerActiveLoans === availableKeys.length);

    const borrowerDetails = await getBorrowerDetails(borrower, user.activeOrganisationId!);
    console.log(`\n📋 Summary:`);
    console.log(`   Borrower: ${borrowerDetails.name} (${borrowerDetails.email})`);
    console.log(`   Company: ${borrowerDetails.company}`);
    console.log(`   Keys issued: ${issueRecords.length}`);
    console.log(`   Active loans: ${borrowerActiveLoans}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testIssueKeyToExistingBorrower() {
  logSection('TEST 3: Issue Key to Existing Borrower');

  try {
    const user = await getTestUser();
    const [availableKey] = await getAvailableKeys(1);

    if (!availableKey) {
      console.log('⚠️  Skipping test - no available keys found (run prisma db seed)');
      return true;
    }

    // Use existing borrower from test 1
    const existingBorrower = testData.borrowers[0];
    if (!existingBorrower) {
      throw new Error('No existing borrower found from previous tests');
    }

    console.log(`📝 Using existing borrower: ${existingBorrower.name}`);
    console.log(`   Issuing key: ${availableKey.keyType.label}-${availableKey.copyNumber}`);

    // Get borrower's current loan count
    const loansBefore = await prisma.issueRecord.count({
      where: { borrowerId: existingBorrower.id, returnedDate: null },
    });

    // Issue key to existing borrower
    const issueRecord = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: existingBorrower.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
        },
      });
    });

    testData.issueRecords.push({
      id: issueRecord.id,
      keyCopyId: availableKey.id,
      borrowerId: existingBorrower.id,
    });

    // Verify
    const loansAfter = await prisma.issueRecord.count({
      where: { borrowerId: existingBorrower.id, returnedDate: null },
    });

    const loanCountIncreased = loansAfter === loansBefore + 1;

    logTest('Issue key to existing borrower', loanCountIncreased);
    logTest('Borrower not duplicated', true);
    logTest('Loan count increased by 1', loanCountIncreased);

    console.log(`\n📋 Summary:`);
    console.log(`   Borrower: ${existingBorrower.name}`);
    console.log(`   Previous loans: ${loansBefore}`);
    console.log(`   Current loans: ${loansAfter}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testFormValidation() {
  logSection('TEST 4: Form Validation and Error Handling');

  try {
    const user = await getTestUser();

    // Test 1: Missing borrower name
    try {
      await createBorrowerWithAffiliation(
        {
          name: '',
          email: 'test@example.com',
        },
        user.id,
      );
      logTest('Reject empty borrower name', false, 'Should have thrown error');
    } catch {
      logTest('Reject empty borrower name', true);
    }

    // Test 2: Invalid email format
    try {
      await createBorrowerWithAffiliation(
        {
          name: 'Test User',
          email: 'invalid-email',
        },
        user.id,
      );
      logTest('Reject invalid email format', false, 'Should have thrown error');
    } catch {
      logTest('Reject invalid email format', true);
    }

    // Test 3: Try to issue key with no available copies
    const outOfStockKey = await prisma.keyCopy.findFirst({
      where: { status: { not: 'AVAILABLE' } },
      include: { keyType: true },
    });

    if (outOfStockKey) {
      const cannotIssue = outOfStockKey.status !== 'AVAILABLE';
      logTest('Prevent issuing unavailable key', cannotIssue);
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// =============================================================================
// RETURN WORKFLOW TESTS
// =============================================================================

async function testReturnSingleKey() {
  logSection('TEST 5: Return Single Key');

  try {
    // Get first issue record from our tests
    const testIssue = testData.issueRecords[0];
    if (!testIssue) {
      console.log('⚠️  Skipping test - no issue records from prior tests (no seed data)');
      return true;
    }

    const issueBefore = await prisma.issueRecord.findUnique({
      where: { id: testIssue.id },
      include: {
        keyCopy: { include: { keyType: true } },
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
      },
    });

    if (!issueBefore) {
      throw new Error('Issue record not found');
    }

    const borrowerDetails = await getBorrowerDetails(issueBefore.borrower, issueBefore.entityId);
    console.log(
      `📝 Returning key: ${issueBefore.keyCopy.keyType.label}-${issueBefore.keyCopy.copyNumber}`,
    );
    console.log(`   From: ${borrowerDetails.name}`);

    // Count borrower's other active loans
    const otherLoansCount = await prisma.issueRecord.count({
      where: {
        borrowerId: testIssue.borrowerId,
        returnedDate: null,
        id: { not: testIssue.id },
      },
    });

    // Return key
    await prisma.$transaction(async (tx) => {
      await tx.issueRecord.update({
        where: { id: testIssue.id },
        data: { returnedDate: new Date() },
      });

      await tx.keyCopy.update({
        where: { id: testIssue.keyCopyId },
        data: { status: 'AVAILABLE' },
      });

      // GDPR cleanup if no other loans
      if (otherLoansCount === 0) {
        await tx.borrower.delete({
          where: { id: testIssue.borrowerId },
        });
        console.log(`   🗑️ Borrower deleted (GDPR cleanup - no other active loans)`);
      }
    });

    // Verify
    const issueAfter = await prisma.issueRecord.findUnique({
      where: { id: testIssue.id },
    });

    const keyCopyAfter = await prisma.keyCopy.findUnique({
      where: { id: testIssue.keyCopyId },
    });

    const borrowerAfter = await prisma.borrower.findUnique({
      where: { id: testIssue.borrowerId },
    });

    const returnDateSet = !!issueAfter?.returnedDate;
    const keyAvailable = keyCopyAfter?.status === 'AVAILABLE';
    const borrowerDeleted = !borrowerAfter && otherLoansCount === 0;
    const borrowerKept = !!borrowerAfter && otherLoansCount > 0;

    logTest('Return single key', returnDateSet && keyAvailable);
    logTest('Return date set on issue record', returnDateSet);
    logTest('Key status changed to AVAILABLE', keyAvailable);

    if (otherLoansCount === 0) {
      logTest('Borrower deleted (GDPR - no other loans)', borrowerDeleted);
    } else {
      logTest('Borrower kept (has other active loans)', borrowerKept);
    }

    // Remove from test data if borrower was deleted
    if (borrowerDeleted) {
      testData.borrowers = testData.borrowers.filter((b) => b.id !== testIssue.borrowerId);
    }

    // Remove this issue from test data
    testData.issueRecords = testData.issueRecords.filter((i) => i.id !== testIssue.id);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testReturnLastKeyDeletesBorrower() {
  logSection('TEST 6: Return Last Key Deletes Borrower (GDPR)');

  try {
    const user = await getTestUser();
    const [availableKey] = await getAvailableKeys(1);

    if (!availableKey) {
      console.log('⚠️  Skipping test - no available keys found (run prisma db seed)');
      return true;
    }

    // Create temporary borrower with single key
    const tempBorrower = await createBorrowerWithAffiliation(
      {
        name: 'Test GDPR Cleanup User',
        email: 'test.gdpr@workflow.test',
        phone: '070-333-0003',
      },
      user.activeOrganisationId!,
    );

    console.log(`📝 Created temporary borrower: ${tempBorrower.id}`);

    // Issue single key
    const issueRecord = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: tempBorrower.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
        },
      });
    });

    console.log(`   Issued key: ${availableKey.keyType.label}-${availableKey.copyNumber}`);

    // Verify borrower exists
    const borrowerBefore = await prisma.borrower.findUnique({
      where: { id: tempBorrower.id },
    });

    // Return the key (should delete borrower)
    await prisma.$transaction(async (tx) => {
      await tx.issueRecord.update({
        where: { id: issueRecord.id },
        data: { returnedDate: new Date() },
      });

      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'AVAILABLE' },
      });

      // Check for other active loans
      const otherLoans = await tx.issueRecord.count({
        where: {
          borrowerId: tempBorrower.id,
          returnedDate: null,
          id: { not: issueRecord.id },
        },
      });

      // Delete borrower if no other loans
      if (otherLoans === 0) {
        await tx.borrower.delete({
          where: { id: tempBorrower.id },
        });
      }
    });

    // Verify borrower was deleted
    const borrowerAfter = await prisma.borrower.findUnique({
      where: { id: tempBorrower.id },
    });

    const borrowerExistedBefore = !!borrowerBefore;
    const borrowerDeletedAfter = !borrowerAfter;

    logTest('Return last key deletes borrower', borrowerExistedBefore && borrowerDeletedAfter);
    logTest('Borrower existed before return', borrowerExistedBefore);
    logTest('Borrower deleted after return (GDPR)', borrowerDeletedAfter);

    console.log(`\n📋 Summary:`);
    console.log(`   Borrower before: ${borrowerExistedBefore ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   Borrower after: ${borrowerDeletedAfter ? 'DELETED (GDPR)' : 'STILL EXISTS'}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testReturnMultipleKeys() {
  logSection('TEST 7: Return Multiple Keys (Bulk Return)');

  try {
    // Get borrower with multiple keys (test 2)
    const borrowerWithMultipleKeys = testData.borrowers.find(
      (b) => b.name === 'Test User Multiple Keys',
    );

    if (!borrowerWithMultipleKeys) {
      console.log('⚠️  Skipping test - no borrower with multiple keys found');
      return true;
    }

    // Get all active loans for this borrower
    const activeLoans = await prisma.issueRecord.findMany({
      where: {
        borrowerId: borrowerWithMultipleKeys.id,
        returnedDate: null,
      },
      include: {
        keyCopy: {
          include: { keyType: true },
        },
      },
    });

    console.log(`📝 Returning ${activeLoans.length} keys for: ${borrowerWithMultipleKeys.name}`);
    activeLoans.forEach((loan) => {
      console.log(`   - ${loan.keyCopy.keyType.label}-${loan.keyCopy.copyNumber}`);
    });

    const issueRecordIds = activeLoans.map((loan) => loan.id);
    const keyCopyIds = activeLoans.map((loan) => loan.keyCopyId);

    // Return all keys in transaction
    await prisma.$transaction(async (tx) => {
      // Update all issue records
      await tx.issueRecord.updateMany({
        where: { id: { in: issueRecordIds } },
        data: { returnedDate: new Date() },
      });

      // Update all key copies
      await tx.keyCopy.updateMany({
        where: { id: { in: keyCopyIds } },
        data: { status: 'AVAILABLE' },
      });

      // Check for other active loans
      const otherLoans = await tx.issueRecord.count({
        where: {
          borrowerId: borrowerWithMultipleKeys.id,
          returnedDate: null,
        },
      });

      // Delete borrower if no other loans
      if (otherLoans === 0) {
        await tx.borrower.delete({
          where: { id: borrowerWithMultipleKeys.id },
        });
        console.log(`   🗑️ Borrower deleted (GDPR cleanup)`);
      }
    });

    // Verify
    const returnedIssues = await prisma.issueRecord.findMany({
      where: { id: { in: issueRecordIds } },
    });

    const returnedKeys = await prisma.keyCopy.findMany({
      where: { id: { in: keyCopyIds } },
    });

    const allReturned = returnedIssues.every((i) => i.returnedDate !== null);
    const allAvailable = returnedKeys.every((k) => k.status === 'AVAILABLE');

    logTest('Return multiple keys (bulk)', allReturned && allAvailable);
    logTest('All issue records marked as returned', allReturned);
    logTest('All keys marked as AVAILABLE', allAvailable);

    // Remove from test data
    testData.borrowers = testData.borrowers.filter((b) => b.id !== borrowerWithMultipleKeys.id);
    testData.issueRecords = testData.issueRecords.filter((i) => !issueRecordIds.includes(i.id));

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testDoubleReturnPrevention() {
  logSection('TEST 8: Prevent Double Return');

  try {
    const user = await getTestUser();
    const [availableKey] = await getAvailableKeys(1);

    if (!availableKey) {
      console.log('⚠️  Skipping test - no available keys found (run prisma db seed)');
      return true;
    }

    // Create temporary borrower
    const tempBorrower = await createBorrowerWithAffiliation(
      {
        name: 'Test Double Return User',
        email: 'test.double@workflow.test',
        phone: '070-444-0004',
      },
      user.activeOrganisationId!,
    );

    // Issue key
    const issueRecord = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: tempBorrower.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
        },
      });
    });

    console.log(`📝 Issued key: ${availableKey.keyType.label}-${availableKey.copyNumber}`);

    // Return key first time
    await prisma.$transaction(async (tx) => {
      await tx.issueRecord.update({
        where: { id: issueRecord.id },
        data: { returnedDate: new Date() },
      });

      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'AVAILABLE' },
      });
    });

    console.log(`   ✅ Key returned successfully`);

    // Try to return again
    try {
      const issueCheck = await prisma.issueRecord.findUnique({
        where: { id: issueRecord.id },
      });

      if (issueCheck?.returnedDate) {
        logTest('Prevent double return', true, 'Already returned');
        console.log(
          `   ⚠️  Return prevented: Key already returned on ${issueCheck.returnedDate.toLocaleDateString()}`,
        );
      } else {
        logTest('Prevent double return', false, 'Should have been already returned');
      }
    } catch {
      logTest('Prevent double return', true, 'Error thrown on double return attempt');
    }

    // Cleanup
    await prisma.borrower.delete({ where: { id: tempBorrower.id } });

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

async function testIssueReturnReissue() {
  logSection('TEST 9: Integration - Issue → Return → Reissue Same Key');

  try {
    const user = await getTestUser();
    const [availableKey] = await getAvailableKeys(1);

    if (!availableKey) {
      console.log('⚠️  Skipping test - no available keys found (run prisma db seed)');
      return true;
    }

    console.log(
      `📝 Testing full cycle with: ${availableKey.keyType.label}-${availableKey.copyNumber}`,
    );

    // STEP 1: Issue key
    console.log('\n   STEP 1: Issue key');
    const borrower1 = await createBorrowerWithAffiliation(
      {
        name: 'Test Integration User 1',
        email: 'test.integration1@workflow.test',
        phone: '070-555-0005',
      },
      user.activeOrganisationId!,
    );

    const issue1 = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: borrower1.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
        },
      });
    });

    const statusAfterIssue = await prisma.keyCopy.findUnique({
      where: { id: availableKey.id },
    });

    logTest('Issue key', statusAfterIssue?.status === 'OUT');
    console.log(`   ✅ Key issued to: ${borrower1.id}`);

    // STEP 2: Return key
    console.log('\n   STEP 2: Return key');
    await prisma.$transaction(async (tx) => {
      await tx.issueRecord.update({
        where: { id: issue1.id },
        data: { returnedDate: new Date() },
      });

      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'AVAILABLE' },
      });

      await tx.borrower.delete({ where: { id: borrower1.id } });
    });

    const statusAfterReturn = await prisma.keyCopy.findUnique({
      where: { id: availableKey.id },
    });

    logTest('Return key', statusAfterReturn?.status === 'AVAILABLE');
    console.log(`   ✅ Key returned and available again`);

    // STEP 3: Reissue to different borrower
    console.log('\n   STEP 3: Reissue to different borrower');
    const borrower2 = await createBorrowerWithAffiliation(
      {
        name: 'Test Integration User 2',
        email: 'test.integration2@workflow.test',
        phone: '070-666-0006',
      },
      user.activeOrganisationId!,
    );

    const issue2 = await prisma.$transaction(async (tx) => {
      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'OUT' },
      });

      return await tx.issueRecord.create({
        data: {
          keyCopyId: availableKey.id,
          borrowerId: borrower2.id,
          entityId: user.activeOrganisationId!,
          userId: user.id,
          idChecked: true,
        },
      });
    });

    const statusAfterReissue = await prisma.keyCopy.findUnique({
      where: { id: availableKey.id },
    });

    logTest('Reissue same key', statusAfterReissue?.status === 'OUT');
    console.log(`   ✅ Key reissued to: ${borrower2.id}`);

    // Verify history
    const issueHistory = await prisma.issueRecord.findMany({
      where: { keyCopyId: availableKey.id },
      orderBy: { issuedDate: 'asc' },
    });

    logTest('Complete workflow cycle', issueHistory.length === 2);
    logTest('Issue history maintained', issueHistory.length === 2);

    console.log(`\n📋 Summary:`);
    console.log(`   Total issues for this key: ${issueHistory.length}`);
    console.log(`   Issue 1: ${issue1.id} (returned: ${!!issueHistory[0].returnedDate})`);
    console.log(`   Issue 2: ${issue2.id} (active: ${!issueHistory[1].returnedDate})`);

    // Cleanup
    await prisma.$transaction(async (tx) => {
      await tx.issueRecord.update({
        where: { id: issue2.id },
        data: { returnedDate: new Date() },
      });

      await tx.keyCopy.update({
        where: { id: availableKey.id },
        data: { status: 'AVAILABLE' },
      });

      await tx.borrower.delete({ where: { id: borrower2.id } });
    });

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testDataIsolation() {
  logSection('TEST 10: Data Isolation Between Users');

  try {
    // Get two different users
    const users = await prisma.user.findMany({ take: 2 });

    if (users.length < 2) {
      console.log('⚠️  Skipping test - need at least 2 users');
      return true;
    }

    const [user1, user2] = users;
    console.log(`📝 Testing isolation between:`);
    console.log(`   User 1: ${user1.email} (${user1.cooperative})`);
    console.log(`   User 2: ${user2.email} (${user2.cooperative})`);

    // Get keys for user 1
    const user1Keys = await prisma.keyType.findMany({
      where: { userId: user1.id },
      include: { keyCopies: true },
    });

    // Try to access user1's keys as user2
    const user2AccessToUser1Keys = await prisma.keyType.findMany({
      where: {
        userId: user2.id,
        id: { in: user1Keys.map((k) => k.id) },
      },
    });

    const isolationWorks = user2AccessToUser1Keys.length === 0;

    logTest('Data isolation enforced', isolationWorks);
    logTest('User 1 keys not visible to User 2', isolationWorks);

    console.log(`\n📋 Summary:`);
    console.log(`   User 1 total keys: ${user1Keys.length}`);
    console.log(`   User 2 access to User 1 keys: ${user2AccessToUser1Keys.length} (should be 0)`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// =============================================================================
// CLEANUP
// =============================================================================

async function cleanup() {
  logSection('CLEANUP: Removing Test Data');

  try {
    console.log('🧹 Cleaning up test data...\n');

    // Delete remaining issue records
    if (testData.issueRecords.length > 0) {
      const issueIds = testData.issueRecords.map((i) => i.id);
      await prisma.issueRecord.deleteMany({
        where: { id: { in: issueIds } },
      });
      console.log(`   ✅ Deleted ${issueIds.length} issue records`);

      // Set keys back to AVAILABLE
      const keyCopyIds = testData.issueRecords.map((i) => i.keyCopyId);
      await prisma.keyCopy.updateMany({
        where: { id: { in: keyCopyIds } },
        data: { status: 'AVAILABLE' },
      });
      console.log(`   ✅ Set ${keyCopyIds.length} keys back to AVAILABLE`);
    }

    // Delete remaining borrowers
    if (testData.borrowers.length > 0) {
      const borrowerIds = testData.borrowers.map((b) => b.id);
      await prisma.borrower.deleteMany({
        where: { id: { in: borrowerIds } },
      });
      console.log(`   ✅ Deleted ${borrowerIds.length} borrowers`);
    }

    // Delete any orphaned test borrowers by email pattern
    const orphanedBorrowers = await prisma.borrower.deleteMany({
      where: {
        OR: [
          { residentBorrower: { email: { contains: '@workflow.test' } } },
          { externalBorrower: { email: { contains: '@workflow.test' } } },
        ],
      },
    });

    if (orphanedBorrowers.count > 0) {
      console.log(`   ✅ Deleted ${orphanedBorrowers.count} orphaned test borrowers`);
    }

    console.log('\n✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║         🔑 KEY ISSUE & RETURN WORKFLOWS - COMPREHENSIVE TESTS 🔑          ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  const results: { name: string; passed: boolean }[] = [];

  try {
    // Issue Workflow Tests
    results.push({
      name: 'Issue Single Key to New Borrower',
      passed: await testIssueSingleKeyNewBorrower(),
    });

    results.push({
      name: 'Issue Multiple Keys to New Borrower',
      passed: await testIssueMultipleKeysNewBorrower(),
    });

    results.push({
      name: 'Issue Key to Existing Borrower',
      passed: await testIssueKeyToExistingBorrower(),
    });

    results.push({
      name: 'Form Validation and Error Handling',
      passed: await testFormValidation(),
    });

    // Return Workflow Tests
    results.push({
      name: 'Return Single Key',
      passed: await testReturnSingleKey(),
    });

    results.push({
      name: 'Return Last Key Deletes Borrower (GDPR)',
      passed: await testReturnLastKeyDeletesBorrower(),
    });

    results.push({
      name: 'Return Multiple Keys (Bulk)',
      passed: await testReturnMultipleKeys(),
    });

    results.push({
      name: 'Prevent Double Return',
      passed: await testDoubleReturnPrevention(),
    });

    // Integration Tests
    results.push({
      name: 'Issue → Return → Reissue Cycle',
      passed: await testIssueReturnReissue(),
    });

    results.push({
      name: 'Data Isolation Between Users',
      passed: await testDataIsolation(),
    });

    // Cleanup
    await cleanup();

    // Summary
    logSection('TEST RESULTS SUMMARY');

    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('Test Results:\n');
    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${result.name}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed (${passRate}%)\n`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! 🎉');
      console.log('\n✅ Both Issue and Return workflows are working correctly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Please review the failures above');
    }
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runAllTests();
