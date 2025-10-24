/**
 * Test borrower creation functions with new affiliation structure
 */

import { prisma } from './lib/prisma';
import {
  createBorrowerWithAffiliation,
  findBorrowerByEmail,
  getBorrowerDetails,
} from './lib/borrower-utils';

async function testBorrowerCreation() {
  console.log('🧪 Testing Borrower Creation Functions...\n');

  // Get a test user ID (using the seed user)
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  console.log(`👤 Using test user: ${testUser.name} (${testUser.id})\n`);

  try {
    // Test 1: Create a resident borrower
    console.log('🏠 Test 1: Creating Resident Borrower');
    const residentData = {
      name: 'Test Resident User',
      email: 'test.resident@test.com',
      phone: '070-123-4567',
    };

    const residentBorrower = await createBorrowerWithAffiliation(residentData, testUser.id);

    const residentDetails = getBorrowerDetails(residentBorrower);
    console.log(`  ✅ Created: ${residentDetails.name} (${residentDetails.affiliation})`);
    console.log(`     Email: ${residentDetails.email}`);
    console.log(`     Phone: ${residentDetails.phone}`);
    console.log(`     Company: ${residentDetails.company || 'N/A'}`);
    console.log(`     Address: ${residentDetails.address || 'N/A'}\n`);

    // Test 2: Create an external borrower with company
    console.log('🏢 Test 2: Creating External Borrower with Company');
    const externalCompanyData = {
      name: 'Test External Company Rep',
      email: 'test.external@company.com',
      phone: '073-987-6543',
      company: 'Test Company AB',
      address: '123 Test Street, Stockholm',
    };

    const externalBorrower = await createBorrowerWithAffiliation(externalCompanyData, testUser.id);

    const externalDetails = getBorrowerDetails(externalBorrower);
    console.log(`  ✅ Created: ${externalDetails.name} (${externalDetails.affiliation})`);
    console.log(`     Email: ${externalDetails.email}`);
    console.log(`     Phone: ${externalDetails.phone}`);
    console.log(`     Company: ${externalDetails.company}`);
    console.log(`     Address: ${externalDetails.address}\n`);

    // Test 3: Create external borrower (explicit flag)
    console.log('🌐 Test 3: Creating External Borrower (explicit flag)');
    const externalFlagData = {
      name: 'Test External Individual',
      email: 'test.external.individual@test.com',
      phone: '076-555-1234',
      isExternal: true,
    };

    const externalIndividual = await createBorrowerWithAffiliation(externalFlagData, testUser.id);

    const externalIndividualDetails = getBorrowerDetails(externalIndividual);
    console.log(
      `  ✅ Created: ${externalIndividualDetails.name} (${externalIndividualDetails.affiliation})`,
    );
    console.log(`     Email: ${externalIndividualDetails.email}`);
    console.log(`     Phone: ${externalIndividualDetails.phone}`);
    console.log(`     Company: ${externalIndividualDetails.company || 'N/A'}`);
    console.log(`     Address: ${externalIndividualDetails.address || 'N/A'}\n`);

    // Test 4: Find existing borrowers
    console.log('🔍 Test 4: Testing Borrower Search');

    const foundResident = await findBorrowerByEmail(residentData.email, testUser.id);
    if (foundResident) {
      const foundDetails = getBorrowerDetails(foundResident);
      console.log(`  ✅ Found resident: ${foundDetails.name} (${foundDetails.affiliation})`);
    } else {
      console.log('  ❌ Resident not found');
    }

    const foundExternal = await findBorrowerByEmail(externalCompanyData.email, testUser.id);
    if (foundExternal) {
      const foundDetails = getBorrowerDetails(foundExternal);
      console.log(`  ✅ Found external: ${foundDetails.name} (${foundDetails.affiliation})`);
    } else {
      console.log('  ❌ External not found');
    }

    // Test 5: Test affiliation logic
    console.log('\n🧠 Test 5: Testing Affiliation Logic');

    const testCases = [
      {
        name: 'No company, no address, not external',
        data: { name: 'Test', email: 'test1@test.com' },
        expected: 'RESIDENT',
      },
      {
        name: 'With company',
        data: { name: 'Test', email: 'test2@test.com', company: 'Company' },
        expected: 'EXTERNAL',
      },
      {
        name: 'With address',
        data: { name: 'Test', email: 'test3@test.com', address: 'Address' },
        expected: 'EXTERNAL',
      },
      {
        name: 'Explicit external flag',
        data: { name: 'Test', email: 'test4@test.com', isExternal: true },
        expected: 'EXTERNAL',
      },
    ];

    for (const testCase of testCases) {
      const result = await createBorrowerWithAffiliation(testCase.data, testUser.id);
      const details = getBorrowerDetails(result);
      const passed = details.affiliation === testCase.expected;
      console.log(
        `  ${passed ? '✅' : '❌'} ${testCase.name}: ${details.affiliation} (expected: ${testCase.expected})`,
      );
    }

    console.log('\n✅ Borrower creation tests completed successfully!');

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.borrower.deleteMany({
      where: {
        userId: testUser.id,
        OR: [
          { residentBorrower: { email: { contains: '@test.com' } } },
          { externalBorrower: { email: { contains: '@test.com' } } },
        ],
      },
    });

    await prisma.residentBorrower.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    await prisma.externalBorrower.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Borrower creation test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBorrowerCreation();

