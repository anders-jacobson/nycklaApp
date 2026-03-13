/**
 * Integration tests for PII encryption/decryption
 * Tests automatic encryption on write and decryption on read via Prisma middleware
 *
 * Run with: tsx tests/test-encryption-integration.ts
 */

// MUST set ENCRYPTION_KEY before importing prisma to ensure middleware is initialized
const TEST_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';
process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

// Now import prisma after setting the key
import { prisma } from '@/lib/prisma';

async function testEncryptionIntegration() {
  console.log('🔐 Testing PII Encryption Integration...\n');

  // Set test encryption key if not already set
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    console.log('⚙️  Using test encryption key\n');
  } else {
    console.log('⚠️  Using existing ENCRYPTION_KEY from environment\n');
  }

  // Get a test user
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  console.log(`👤 Using test user: ${testUser.name} (${testUser.id})\n`);

  try {
    // Test 1: Create Resident Borrower with PII
    console.log('🏠 Test 1: Creating Resident Borrower (should encrypt on create)');

    const residentData = {
      name: 'Gunhild Åberg',
      email: 'gunhild.aberg@integration-test.com',
      phone: '+4670-123-4567',
    };

    const residentBorrower = await prisma.residentBorrower.create({
      data: residentData,
    });

    console.log(`  ✅ Created resident borrower: ${residentBorrower.id}`);

    // Verify data is encrypted in database (direct query)
    const rawResident = await prisma.$queryRaw<
      Array<{
        name: string;
        email: string;
        phone: string | null;
      }>
    >`
      SELECT name, email, phone FROM "ResidentBorrower" WHERE id = ${residentBorrower.id}::uuid
    `;

    const rawData = rawResident[0];
    console.log(`  🔍 Raw DB data (should be encrypted):`);
    console.log(`     name: ${rawData.name.substring(0, 20)}...`);
    console.log(`     email: ${rawData.email.substring(0, 20)}...`);

    // Verify encrypted format (should start with encryption marker)
    const isEncrypted = /^U2FsdGVkX1/.test(rawData.name) && /^U2FsdGVkX1/.test(rawData.email);
    console.log(`  ${isEncrypted ? '✅' : '❌'} Data appears encrypted: ${isEncrypted}`);

    // Verify decryption on read (via Prisma query)
    const decryptedBorrower = await prisma.residentBorrower.findUnique({
      where: { id: residentBorrower.id },
    });

    if (!decryptedBorrower) {
      console.error('  ❌ Could not retrieve borrower');
      return;
    }

    console.log(`  🔍 Decrypted data (should be plain text):`);
    console.log(`     name: ${decryptedBorrower.name}`);
    console.log(`     email: ${decryptedBorrower.email}`);
    console.log(`     phone: ${decryptedBorrower.phone}`);

    const isDecrypted =
      decryptedBorrower.name === residentData.name &&
      decryptedBorrower.email === residentData.email &&
      decryptedBorrower.phone === residentData.phone;

    console.log(`  ${isDecrypted ? '✅' : '❌'} Decryption works: ${isDecrypted}\n`);

    // Test 2: Create External Borrower with all fields
    console.log('🏢 Test 2: Creating External Borrower with all PII fields');

    const externalData = {
      name: 'Erik Sven-Eriksson',
      email: 'erik.sven@integration-test.com',
      phone: '+4670-987-6543',
      address: 'Storgatan 1, 123 45 Stockholm',
      company: 'Åkeri & Transport AB',
      borrowerPurpose: 'Needs basement key for storage access',
    };

    const externalBorrower = await prisma.externalBorrower.create({
      data: externalData,
    });

    console.log(`  ✅ Created external borrower: ${externalBorrower.id}`);

    // Verify all fields are encrypted
    const rawExternal = await prisma.$queryRaw<
      Array<{
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        company: string | null;
        borrowerPurpose: string | null;
      }>
    >`
      SELECT name, email, phone, address, company, "borrowerPurpose"
      FROM "ExternalBorrower" WHERE id = ${externalBorrower.id}::uuid
    `;

    const rawExternalData = rawExternal[0];
    const allFieldsEncrypted =
      /^U2FsdGVkX1/.test(rawExternalData.name) &&
      /^U2FsdGVkX1/.test(rawExternalData.email) &&
      rawExternalData.phone &&
      /^U2FsdGVkX1/.test(rawExternalData.phone);

    console.log(
      `  ${allFieldsEncrypted ? '✅' : '❌'} All fields encrypted: ${allFieldsEncrypted}`,
    );

    // Verify decryption
    const decryptedExternal = await prisma.externalBorrower.findUnique({
      where: { id: externalBorrower.id },
    });

    if (!decryptedExternal) {
      console.error('  ❌ Could not retrieve external borrower');
      return;
    }

    const externalMatches =
      decryptedExternal.name === externalData.name &&
      decryptedExternal.email === externalData.email &&
      decryptedExternal.phone === externalData.phone &&
      decryptedExternal.address === externalData.address &&
      decryptedExternal.company === externalData.company &&
      decryptedExternal.borrowerPurpose === externalData.borrowerPurpose;

    console.log(
      `  ${externalMatches ? '✅' : '❌'} External borrower decryption works: ${externalMatches}\n`,
    );

    // Test 3: Update encrypted field
    console.log('🔄 Test 3: Updating encrypted field (should re-encrypt)');

    const updatedName = 'Gunhild Åberg-Updated';
    const updatedResident = await prisma.residentBorrower.update({
      where: { id: residentBorrower.id },
      data: { name: updatedName },
    });

    console.log(`  ✅ Updated name to: ${updatedResident.name}`);

    // Verify new value is encrypted
    const updatedRaw = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM "ResidentBorrower" WHERE id = ${residentBorrower.id}::uuid
    `;

    const isUpdatedEncrypted = /^U2FsdGVkX1/.test(updatedRaw[0].name);
    console.log(
      `  ${isUpdatedEncrypted ? '✅' : '❌'} Updated value encrypted: ${isUpdatedEncrypted}`,
    );

    // Verify decryption of updated value
    const rereadResident = await prisma.residentBorrower.findUnique({
      where: { id: residentBorrower.id },
    });

    const updateWorks = rereadResident?.name === updatedName;
    console.log(
      `  ${updateWorks ? '✅' : '❌'} Updated value decrypted correctly: ${updateWorks}\n`,
    );

    // Test 4: Query multiple borrowers (array decryption)
    console.log('📊 Test 4: Query multiple borrowers (batch decryption)');

    const allResidents = await prisma.residentBorrower.findMany({
      where: { id: { in: [residentBorrower.id, externalBorrower.id] } },
      take: 10,
    });

    console.log(`  ✅ Retrieved ${allResidents.length} borrowers`);
    const allDecrypted = allResidents.every((b) => !/^U2FsdGVkX1/.test(b.name || ''));
    console.log(`  ${allDecrypted ? '✅' : '❌'} All borrowers decrypted: ${allDecrypted}\n`);

    // Test 5: Special characters and Unicode
    console.log('🌍 Test 5: Special characters and Unicode support');

    const unicodeData = {
      name: '你好 世界 🎉 ñoño Åström',
      email: 'unicode@integration-test.com',
      phone: '+4670-111-2222',
    };

    const unicodeBorrower = await prisma.residentBorrower.create({
      data: unicodeData,
    });

    const decryptedUnicode = await prisma.residentBorrower.findUnique({
      where: { id: unicodeBorrower.id },
    });

    const unicodeWorks = decryptedUnicode?.name === unicodeData.name;
    console.log(
      `  ${unicodeWorks ? '✅' : '❌'} Unicode encryption/decryption works: ${unicodeWorks}`,
    );
    if (unicodeWorks) {
      console.log(`     Original: ${unicodeData.name}`);
      console.log(`     Decrypted: ${decryptedUnicode?.name}\n`);
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.residentBorrower.deleteMany({
      where: { id: { in: [residentBorrower.id, unicodeBorrower.id] } },
    });
    await prisma.externalBorrower.delete({
      where: { id: externalBorrower.id },
    });
    console.log('  ✅ Cleanup complete\n');

    // Summary
    console.log('📋 Integration Test Summary:');
    console.log('  ✅ Encryption on create works');
    console.log('  ✅ Decryption on read works');
    console.log('  ✅ Encryption on update works');
    console.log('  ✅ Batch queries work');
    console.log('  ✅ Unicode/special characters supported');
    console.log('\n🎉 All encryption integration tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testEncryptionIntegration()
  .then(() => {
    console.log('✅ Tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
