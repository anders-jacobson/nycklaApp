import { prisma } from '@/lib/prisma';
import { generateEntityKey, encryptEntityKey } from '@/lib/entity-encryption';

async function fixExistingUsers() {
  console.log('🔄 Fixing existing users without entities...\n');

  try {
    // Find all users without an entityId
    const usersWithoutEntity = await prisma.user.findMany({
      where: { entityId: null },
      select: { id: true, email: true, name: true },
    });

    if (usersWithoutEntity.length === 0) {
      console.log('✅ All users already have entities!');
      return;
    }

    console.log(`Found ${usersWithoutEntity.length} user(s) without entities:\n`);

    for (const user of usersWithoutEntity) {
      console.log(`📧 User: ${user.email}`);

      // Create a default entity name from email
      const defaultEntityName = user.email.split('@')[0] + "'s Organization";

      // Generate and encrypt entity key
      const entityKey = generateEntityKey();
      const encryptedKey = encryptEntityKey(entityKey);

      // Create entity and link user
      const entity = await prisma.entity.create({
        data: {
          name: defaultEntityName,
          encryptionKey: encryptedKey,
        },
      });

      // Update user with entityId and OWNER role
      await prisma.user.update({
        where: { id: user.id },
        data: {
          entityId: entity.id,
          role: 'OWNER',
        },
      });

      console.log(`  ✅ Created entity: "${entity.name}"`);
      console.log(`  ✅ Set user as OWNER\n`);
    }

    console.log('✅ All users now have entities!');
  } catch (error) {
    console.error('❌ Error fixing users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();










