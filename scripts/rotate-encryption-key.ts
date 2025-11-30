/**
 * Re-encrypt all entity encryption keys with new ENCRYPTION_KEY
 * 
 * Usage:
 * 1. Set OLD_ENCRYPTION_KEY=<your-old-key> in .env
 * 2. Set ENCRYPTION_KEY=<your-new-key> in .env
 * 3. Run: npx tsx scripts/rotate-encryption-key.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption utilities (same as lib/encryption.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function decrypt(encryptedData: string, password: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

function encrypt(text: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  return result.toString('base64');
}

async function rotateEncryptionKey() {
  const oldKey = process.env.OLD_ENCRYPTION_KEY;
  const newKey = process.env.ENCRYPTION_KEY;

  if (!oldKey || !newKey) {
    console.error('❌ Missing environment variables:');
    console.error('   OLD_ENCRYPTION_KEY - your current encryption key');
    console.error('   ENCRYPTION_KEY - your new encryption key');
    process.exit(1);
  }

  if (oldKey === newKey) {
    console.error('❌ OLD_ENCRYPTION_KEY and ENCRYPTION_KEY must be different');
    process.exit(1);
  }

  console.log('🔄 Starting encryption key rotation...\n');

  try {
    // Get all entities with encrypted keys
    const entities = await prisma.entity.findMany({
      where: {
        encryptionKey: { not: null },
      },
    });

    if (entities.length === 0) {
      console.log('✅ No entities with encryption keys found. Nothing to rotate.');
      return;
    }

    console.log(`📊 Found ${entities.length} entities to re-encrypt\n`);

    let successCount = 0;
    let failCount = 0;

    // Re-encrypt each entity key
    for (const entity of entities) {
      try {
        if (!entity.encryptionKey) continue;

        console.log(`🔐 Processing: ${entity.name} (${entity.id})`);

        // Decrypt with old key
        const decryptedKey = decrypt(entity.encryptionKey, oldKey);

        // Encrypt with new key
        const reencryptedKey = encrypt(decryptedKey, newKey);

        // Update in database
        await prisma.entity.update({
          where: { id: entity.id },
          data: { encryptionKey: reencryptedKey },
        });

        console.log(`   ✅ Successfully re-encrypted\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        failCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    if (failCount === 0) {
      console.log('\n🎉 All encryption keys rotated successfully!');
      console.log('\n⚠️  IMPORTANT: Remove OLD_ENCRYPTION_KEY from .env now');
    } else {
      console.log('\n⚠️  Some keys failed to rotate. Check errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rotateEncryptionKey();

