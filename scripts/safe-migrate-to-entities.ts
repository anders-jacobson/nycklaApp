import { prisma } from '@/lib/prisma';
import { generateEntityKey, encryptEntityKey } from '@/lib/entity-encryption';

async function safeMigration() {
  console.log('🔄 Starting safe migration to entity model...\n');

  try {
    // Step 1: Check current state
    const totalUsers = await prisma.user.count();
    const usersWithEntity = await prisma.user.count({
      where: { entityId: { not: null } },
    });

    console.log(`📊 Current state:`);
    console.log(`  - Total users: ${totalUsers}`);
    console.log(`  - Users with entityId: ${usersWithEntity}`);
    console.log(`  - Users needing migration: ${totalUsers - usersWithEntity}\n`);

    if (usersWithEntity === totalUsers) {
      console.log('✅ All users already have entities! Migration complete.\n');
      return;
    }

    // Step 2: Dry run check
    const DRY_RUN = process.env.DRY_RUN === 'true';
    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Step 3: Find users without entities and group by cooperative
    const usersToMigrate = await prisma.user.findMany({
      where: { entityId: null },
      select: {
        id: true,
        email: true,
        name: true,
        cooperative: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (usersToMigrate.length === 0) {
      console.log('✅ No users to migrate!\n');
      return;
    }

    // Group by cooperative
    const cooperativeMap = new Map<string, typeof usersToMigrate>();
    for (const user of usersToMigrate) {
      const coop = user.cooperative || `${user.email.split('@')[0]}'s Organization`;
      if (!cooperativeMap.has(coop)) {
        cooperativeMap.set(coop, []);
      }
      cooperativeMap.get(coop)!.push(user);
    }

    console.log(`🏢 Found ${cooperativeMap.size} organizations to create:\n`);

    let migratedCount = 0;

    // Step 4: Process each cooperative
    for (const [cooperativeName, users] of cooperativeMap.entries()) {
      console.log(`📦 Processing: "${cooperativeName}"`);
      console.log(`   Users: ${users.map(u => u.email).join(', ')}`);

      if (!DRY_RUN) {
        try {
          await prisma.$transaction(async (tx) => {
            // Create entity
            const entityKey = generateEntityKey();
            const encryptedKey = encryptEntityKey(entityKey);

            const entity = await tx.entity.create({
              data: {
                name: cooperativeName,
                encryptionKey: encryptedKey,
              },
            });

            console.log(`   ✅ Created entity: ${entity.name}`);

            // Update users (first user becomes OWNER, rest are MEMBERS)
            for (let i = 0; i < users.length; i++) {
              await tx.user.update({
                where: { id: users[i].id },
                data: {
                  entityId: entity.id,
                  role: i === 0 ? 'OWNER' : 'MEMBER',
                },
              });
              console.log(`   ✅ Linked user ${users[i].email} as ${i === 0 ? 'OWNER' : 'MEMBER'}`);
            }

            // Migrate related data for all users in this cooperative
            const userIds = users.map(u => u.id);

            // Migrate Borrowers
            const borrowersCount = await tx.borrower.updateMany({
              where: { 
                userId: { in: userIds },
                entityId: null,
              },
              data: { entityId: entity.id },
            });
            if (borrowersCount.count > 0) {
              console.log(`   ✅ Migrated ${borrowersCount.count} borrowers`);
            }

            // Migrate KeyTypes
            const keyTypesCount = await tx.keyType.updateMany({
              where: { 
                userId: { in: userIds },
                entityId: null,
              },
              data: { entityId: entity.id },
            });
            if (keyTypesCount.count > 0) {
              console.log(`   ✅ Migrated ${keyTypesCount.count} key types`);
            }

            // Migrate IssueRecords
            const issueRecordsCount = await tx.issueRecord.updateMany({
              where: { 
                userId: { in: userIds },
                entityId: null,
              },
              data: { entityId: entity.id },
            });
            if (issueRecordsCount.count > 0) {
              console.log(`   ✅ Migrated ${issueRecordsCount.count} issue records`);
            }

            migratedCount += users.length;
          });

          console.log(`   ✅ Successfully migrated ${users.length} users\n`);
        } catch (error) {
          console.error(`   ❌ Error migrating "${cooperativeName}":`, error);
          throw error;
        }
      } else {
        console.log(`   [DRY RUN] Would create entity and migrate ${users.length} users\n`);
      }
    }

    // Step 5: Final verification
    if (!DRY_RUN) {
      const finalUsersWithEntity = await prisma.user.count({
        where: { entityId: { not: null } },
      });

      console.log('═══════════════════════════════════════════════');
      console.log('✅ MIGRATION COMPLETE!');
      console.log('═══════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`  - Total users migrated: ${migratedCount}`);
      console.log(`  - Users with entities: ${finalUsersWithEntity}/${totalUsers}`);
      console.log(`  - Organizations created: ${cooperativeMap.size}`);
      console.log('═══════════════════════════════════════════════\n');

      if (finalUsersWithEntity < totalUsers) {
        console.warn('⚠️  WARNING: Some users still without entities!');
        console.warn('Run migration again or investigate manually.\n');
      }
    } else {
      console.log('\n🔍 DRY RUN SUMMARY:');
      console.log(`  - Would create ${cooperativeMap.size} organizations`);
      console.log(`  - Would migrate ${usersToMigrate.length} users`);
      console.log('\nRun without DRY_RUN=true to apply changes.\n');
    }

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error('\n🔄 No changes were committed due to transaction rollback.');
    console.error('Fix the error and run again.\n');
    throw error;
  }
}

// Execute migration
safeMigration()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









