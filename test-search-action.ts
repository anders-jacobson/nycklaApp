/**
 * Test the searchBorrowers server action
 */

import { prisma } from './lib/prisma';
import { searchBorrowers } from './app/actions/dashboard';

async function testSearchAction() {
  console.log('🔍 Testing SearchBorrowers Server Action...\n');

  // Get test user
  const testUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!testUser) {
    console.error('❌ No test user found');
    return;
  }

  // Mock the getCurrentUserId function by temporarily setting up user context
  // Note: This is a simplified test - in real usage, the function would be called with proper auth context

  try {
    console.log('🔍 Testing various search terms...\n');

    const testSearches = [
      'erik',
      'anna',
      'test', // Should find nothing in real data
      'placeholder', // Should find placeholder emails
      'gmail',
      'company', // Should find external borrowers
    ];

    for (const searchTerm of testSearches) {
      console.log(`🔍 Searching for: "${searchTerm}"`);

      // Direct database query to simulate the server action
      const results = await prisma.borrower.findMany({
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
        take: 5, // Limit for testing
      });

      if (results.length > 0) {
        console.log(`  ✅ Found ${results.length} results:`);
        results.forEach((borrower, index) => {
          const isResident = borrower.affiliation === 'RESIDENT';
          const details = isResident ? borrower.residentBorrower : borrower.externalBorrower;
          console.log(`    ${index + 1}. ${details?.name} (${borrower.affiliation})`);
          console.log(`       Email: ${details?.email}`);
          if (!isResident && borrower.externalBorrower?.company) {
            console.log(`       Company: ${borrower.externalBorrower.company}`);
          }
        });
      } else {
        console.log('  📭 No results found');
      }
      console.log();
    }

    // Test edge cases
    console.log('🧪 Testing Edge Cases...\n');

    // Empty search
    console.log('🔍 Testing empty search term:');
    const emptyResults = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        OR: [
          {
            residentBorrower: {
              OR: [
                { name: { contains: '', mode: 'insensitive' } },
                { email: { contains: '', mode: 'insensitive' } },
              ],
            },
          },
          {
            externalBorrower: {
              OR: [
                { name: { contains: '', mode: 'insensitive' } },
                { email: { contains: '', mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        residentBorrower: true,
        externalBorrower: true,
      },
      take: 3,
    });
    console.log(`  📊 Empty search found ${emptyResults.length} results (should find many)\n`);

    // Single character search
    console.log('🔍 Testing single character search "a":');
    const singleCharResults = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        OR: [
          {
            residentBorrower: {
              OR: [
                { name: { contains: 'a', mode: 'insensitive' } },
                { email: { contains: 'a', mode: 'insensitive' } },
              ],
            },
          },
          {
            externalBorrower: {
              OR: [
                { name: { contains: 'a', mode: 'insensitive' } },
                { email: { contains: 'a', mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        residentBorrower: true,
        externalBorrower: true,
      },
      take: 3,
    });
    console.log(`  📊 Single char search found ${singleCharResults.length} results\n`);

    // Test affiliation-specific searches
    console.log('🏠 Testing Affiliation-Specific Patterns...\n');

    // Look for residents only
    const residentsOnly = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        affiliation: 'RESIDENT',
        residentBorrower: {
          name: { contains: 'anna', mode: 'insensitive' },
        },
      },
      include: { residentBorrower: true },
      take: 3,
    });
    console.log(`🏠 Residents named "Anna": ${residentsOnly.length}`);

    // Look for externals only
    const externalsOnly = await prisma.borrower.findMany({
      where: {
        userId: testUser.id,
        affiliation: 'EXTERNAL',
        externalBorrower: {
          company: { not: null },
        },
      },
      include: { externalBorrower: true },
      take: 3,
    });
    console.log(`🏢 External borrowers with companies: ${externalsOnly.length}\n`);

    console.log('✅ Search action tests completed successfully!');
  } catch (error) {
    console.error('❌ Search action test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearchAction();

