/**
 * Migration script: Convert from per-user cooperative model to entity-based multi-tenant model
 * 
 * This script:
 * 1. Extracts unique cooperatives from User table
 * 2. Creates Entity records with encryption keys
 * 3. Migrates users to entities (first user becomes OWNER)
 * 4. Migrates Borrower, KeyType, IssueRecord ownership to entities
 * 5. Re-encrypts PII data with entity-specific keys
 * 6. Verifies data integrity
 * 
 * Usage: tsx scripts/migrate-to-entities.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateEntityKey, encryptEntityKey, getEntityKey } from '../lib/entity-encryption';
import { encryptWithEntityKey, decryptField } from '../lib/encryption';

// Create a separate Prisma client for migration (without middleware)
const prisma = new PrismaClient();

interface MigrationStats {
  entitiesCreated: number;
  usersMigrated: number;
  borrowersMigrated: number;
  keyTypesMigrated: number;
  issueRecordsMigrated: number;
  piiRecordsReEncrypted: number;
  errors: string[];
}

const stats: MigrationStats = {
  entitiesCreated: 0,
  usersMigrated: 0,
  borrowersMigrated: 0,
  keyTypesMigrated: 0,
  issueRecordsMigrated: 0,
  piiRecordsReEncrypted: 0,
  errors: [],
};

async function main() {
  console.log('🔄 Starting migration to entity-based model...\n');
  
  try {
    // Step 1: Extract unique cooperatives
    console.log('📊 Step 1: Analyzing current data...');
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true,
        cooperative: true,
        auth_id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }, // First user becomes OWNER
    });
    
    if (users.length === 0) {
      console.log('✅ No users found - nothing to migrate');
      return;
    }
    
    const cooperatives = new Map<string, typeof users>();
    for (const user of users) {
      if (!cooperatives.has(user.cooperative)) {
        cooperatives.set(user.cooperative, []);
      }
      cooperatives.get(user.cooperative)!.push(user);
    }
    
    console.log(`   Found ${users.length} users in ${cooperatives.size} cooperatives\n`);
    
    // Step 2: Create entities for each cooperative
    console.log('🏢 Step 2: Creating entity records...');
    const entityMap = new Map<string, string>(); // cooperative -> entityId
    
    for (const [cooperativeName, cooperativeUsers] of cooperatives) {
      try {
        // Generate encryption key for this entity
        const entityKey = generateEntityKey();
        const encryptedKey = encryptEntityKey(entityKey);
        
        // Create entity
        const entity = await prisma.entity.create({
          data: {
            name: cooperativeName,
            encryptionKey: encryptedKey,
          },
        });
        
        entityMap.set(cooperativeName, entity.id);
        stats.entitiesCreated++;
        
        console.log(`   ✅ Created entity: "${entity.name}" (${cooperativeUsers.length} users)`);
      } catch (error) {
        const message = `Failed to create entity for "${cooperativeName}": ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    console.log(`   Created ${stats.entitiesCreated} entities\n`);
    
    // Step 3: Migrate users to entities
    console.log('👤 Step 3: Migrating users to entities...');
    
    for (const [cooperativeName, cooperativeUsers] of cooperatives) {
      const entityId = entityMap.get(cooperativeName);
      if (!entityId) {
        console.log(`   ⚠️  Skipping users for "${cooperativeName}" - no entity created`);
        continue;
      }
      
      for (let i = 0; i < cooperativeUsers.length; i++) {
        const user = cooperativeUsers[i];
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              entityId,
              role: i === 0 ? 'OWNER' : 'MEMBER', // First user is OWNER
              // cooperative field will be removed in schema migration
            },
          });
          stats.usersMigrated++;
        } catch (error) {
          const message = `Failed to migrate user ${user.email}: ${error}`;
          console.error(`   ❌ ${message}`);
          stats.errors.push(message);
        }
      }
      
      console.log(`   ✅ Migrated ${cooperativeUsers.length} users to "${cooperativeName}"`);
    }
    
    console.log(`   Migrated ${stats.usersMigrated} users\n`);
    
    // Step 4: Migrate Borrowers
    console.log('📇 Step 4: Migrating borrowers to entities...');
    
    const borrowers = await prisma.borrower.findMany({
      select: { 
        id: true, 
        userId: true,
      },
    });
    
    for (const borrower of borrowers) {
      try {
        const user = users.find(u => u.id === borrower.userId);
        if (!user) {
          stats.errors.push(`Borrower ${borrower.id} references non-existent user`);
          continue;
        }
        
        const entityId = entityMap.get(user.cooperative);
        if (!entityId) {
          stats.errors.push(`No entity found for borrower ${borrower.id}`);
          continue;
        }
        
        await prisma.borrower.update({
          where: { id: borrower.id },
          data: { entityId },
        });
        stats.borrowersMigrated++;
      } catch (error) {
        const message = `Failed to migrate borrower ${borrower.id}: ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    console.log(`   Migrated ${stats.borrowersMigrated} borrowers\n`);
    
    // Step 5: Migrate KeyTypes
    console.log('🔑 Step 5: Migrating key types to entities...');
    
    const keyTypes = await prisma.keyType.findMany({
      select: { 
        id: true, 
        userId: true,
      },
    });
    
    for (const keyType of keyTypes) {
      try {
        const user = users.find(u => u.id === keyType.userId);
        if (!user) {
          stats.errors.push(`KeyType ${keyType.id} references non-existent user`);
          continue;
        }
        
        const entityId = entityMap.get(user.cooperative);
        if (!entityId) {
          stats.errors.push(`No entity found for keyType ${keyType.id}`);
          continue;
        }
        
        await prisma.keyType.update({
          where: { id: keyType.id },
          data: { entityId },
        });
        stats.keyTypesMigrated++;
      } catch (error) {
        const message = `Failed to migrate keyType ${keyType.id}: ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    console.log(`   Migrated ${stats.keyTypesMigrated} key types\n`);
    
    // Step 6: Migrate IssueRecords
    console.log('📋 Step 6: Migrating issue records to entities...');
    
    const issueRecords = await prisma.issueRecord.findMany({
      select: { 
        id: true, 
        userId: true,
      },
    });
    
    for (const record of issueRecords) {
      try {
        const user = users.find(u => u.id === record.userId);
        if (!user) {
          stats.errors.push(`IssueRecord ${record.id} references non-existent user`);
          continue;
        }
        
        const entityId = entityMap.get(user.cooperative);
        if (!entityId) {
          stats.errors.push(`No entity found for issueRecord ${record.id}`);
          continue;
        }
        
        await prisma.issueRecord.update({
          where: { id: record.id },
          data: { 
            entityId,
            // Keep userId for audit trail (now nullable)
          },
        });
        stats.issueRecordsMigrated++;
      } catch (error) {
        const message = `Failed to migrate issueRecord ${record.id}: ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    console.log(`   Migrated ${stats.issueRecordsMigrated} issue records\n`);
    
    // Step 7: Re-encrypt PII with entity-specific keys
    console.log('🔐 Step 7: Re-encrypting PII with entity-specific keys...');
    console.log('   ⚠️  NOTE: This assumes existing PII is encrypted with the global key');
    console.log('   If PII is currently plain text, this step will encrypt it for the first time\n');
    
    // Re-encrypt ResidentBorrower PII
    const residentBorrowers = await prisma.$queryRaw<any[]>`
      SELECT rb.id, rb.name, rb.email, rb.phone, b."entityId"
      FROM "ResidentBorrower" rb
      INNER JOIN "Borrower" b ON b."residentBorrowerId" = rb.id
    `;
    
    for (const rb of residentBorrowers) {
      try {
        // Decrypt with global key (old), encrypt with entity key (new)
        const entityKey = await getEntityKey(rb.entityId);
        
        const decryptedName = decryptField(rb.name);
        const decryptedEmail = decryptField(rb.email);
        const decryptedPhone = rb.phone ? decryptField(rb.phone) : null;
        
        const reEncryptedName = encryptWithEntityKey(decryptedName, entityKey);
        const reEncryptedEmail = encryptWithEntityKey(decryptedEmail, entityKey);
        const reEncryptedPhone = decryptedPhone ? encryptWithEntityKey(decryptedPhone, entityKey) : null;
        
        await prisma.$executeRaw`
          UPDATE "ResidentBorrower"
          SET name = ${reEncryptedName}, 
              email = ${reEncryptedEmail},
              phone = ${reEncryptedPhone}
          WHERE id = ${rb.id}::uuid
        `;
        
        stats.piiRecordsReEncrypted++;
      } catch (error) {
        const message = `Failed to re-encrypt ResidentBorrower ${rb.id}: ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    // Re-encrypt ExternalBorrower PII
    const externalBorrowers = await prisma.$queryRaw<any[]>`
      SELECT eb.id, eb.name, eb.email, eb.phone, eb.address, eb.company, eb."borrowerPurpose", b."entityId"
      FROM "ExternalBorrower" eb
      INNER JOIN "Borrower" b ON b."externalBorrowerId" = eb.id
    `;
    
    for (const eb of externalBorrowers) {
      try {
        const entityKey = await getEntityKey(eb.entityId);
        
        const decryptedName = decryptField(eb.name);
        const decryptedEmail = decryptField(eb.email);
        const decryptedPhone = eb.phone ? decryptField(eb.phone) : null;
        const decryptedAddress = eb.address ? decryptField(eb.address) : null;
        const decryptedCompany = eb.company ? decryptField(eb.company) : null;
        const decryptedPurpose = eb.borrowerPurpose ? decryptField(eb.borrowerPurpose) : null;
        
        const reEncryptedName = encryptWithEntityKey(decryptedName, entityKey);
        const reEncryptedEmail = encryptWithEntityKey(decryptedEmail, entityKey);
        const reEncryptedPhone = decryptedPhone ? encryptWithEntityKey(decryptedPhone, entityKey) : null;
        const reEncryptedAddress = decryptedAddress ? encryptWithEntityKey(decryptedAddress, entityKey) : null;
        const reEncryptedCompany = decryptedCompany ? encryptWithEntityKey(decryptedCompany, entityKey) : null;
        const reEncryptedPurpose = decryptedPurpose ? encryptWithEntityKey(decryptedPurpose, entityKey) : null;
        
        await prisma.$executeRaw`
          UPDATE "ExternalBorrower"
          SET name = ${reEncryptedName}, 
              email = ${reEncryptedEmail},
              phone = ${reEncryptedPhone},
              address = ${reEncryptedAddress},
              company = ${reEncryptedCompany},
              "borrowerPurpose" = ${reEncryptedPurpose}
          WHERE id = ${eb.id}::uuid
        `;
        
        stats.piiRecordsReEncrypted++;
      } catch (error) {
        const message = `Failed to re-encrypt ExternalBorrower ${eb.id}: ${error}`;
        console.error(`   ❌ ${message}`);
        stats.errors.push(message);
      }
    }
    
    console.log(`   Re-encrypted ${stats.piiRecordsReEncrypted} PII records\n`);
    
    // Step 8: Verification
    console.log('✅ Step 8: Verifying migration...');
    
    const verificationChecks = {
      entitiesCreated: await prisma.entity.count(),
      usersWithEntity: await prisma.user.count({ where: { entityId: { not: null } } }),
      borrowersWithEntity: await prisma.borrower.count({ where: { entityId: { not: null } } }),
      keyTypesWithEntity: await prisma.keyType.count({ where: { entityId: { not: null } } }),
      issueRecordsWithEntity: await prisma.issueRecord.count({ where: { entityId: { not: null } } }),
    };
    
    console.log('   Verification counts:');
    console.log(`   - Entities: ${verificationChecks.entitiesCreated}`);
    console.log(`   - Users with entity: ${verificationChecks.usersWithEntity}/${users.length}`);
    console.log(`   - Borrowers with entity: ${verificationChecks.borrowersWithEntity}/${borrowers.length}`);
    console.log(`   - KeyTypes with entity: ${verificationChecks.keyTypesWithEntity}/${keyTypes.length}`);
    console.log(`   - IssueRecords with entity: ${verificationChecks.issueRecordsWithEntity}/${issueRecords.length}\n`);
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Migration complete!\n');
    console.log('Summary:');
    console.log(`   - Entities created: ${stats.entitiesCreated}`);
    console.log(`   - Users migrated: ${stats.usersMigrated}`);
    console.log(`   - Borrowers migrated: ${stats.borrowersMigrated}`);
    console.log(`   - Key types migrated: ${stats.keyTypesMigrated}`);
    console.log(`   - Issue records migrated: ${stats.issueRecordsMigrated}`);
    console.log(`   - PII records re-encrypted: ${stats.piiRecordsReEncrypted}`);
    console.log(`   - Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    console.log('\n🎉 Next steps:');
    console.log('   1. Run: npx prisma migrate dev --name add-entity-model');
    console.log('   2. Remove "cooperative" field from User model in schema.prisma');
    console.log('   3. Remove "userId" field from Borrower/KeyType models');
    console.log('   4. Generate new Prisma client: npx prisma generate');
    console.log('   5. Update application code to use entityId instead of userId');
    console.log('   6. Test thoroughly before deploying to production');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });











