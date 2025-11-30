/**
 * Database Seed Script for Key Management System
 *
 * This script generates comprehensive test data for the key management application:
 *
 * WHAT IT CREATES:
 * - Entity: "Testgården Bostadsrättsförening" with encryption keys
 * - User: anders.ebrev@gmail.com (ADMIN role)
 * - Supabase Auth user with password: TestPassword123!
 * - 6 Key Types: C (Fastighetsskötare), E (Sophämtning), G (Husmorsnyckel),
 *                L (Tvättstuga), M (Förråd Gökärtsvägen), N (Förråd Pilvägen)
 * - ~95 Key Copies with realistic status distribution (75% out, 20% available, 5% lost)
 * - ~50+ Borrowers (residents and external companies) with encrypted PII
 * - ~75 Active Issue Records with realistic dates and business logic
 *
 * KEY FEATURES:
 * - Checks for existing users/entities and updates them (idempotent)
 * - Creates/updates Supabase Auth user with default password
 * - Encrypts all borrower PII with entity-specific encryption keys
 * - Applies realistic business logic (e.g., G key holders often have M or N keys)
 * - Cleans old data but preserves entity and user records
 *
 * REQUIREMENTS:
 * - ENCRYPTION_KEY environment variable (master encryption key)
 * - NEXT_PUBLIC_SUPABASE_URL (for auth user creation)
 * - SUPABASE_SECRET_KEY (optional, for auth user password updates)
 *
 * USAGE:
 *   npx prisma db seed
 *
 * After running, login with:
 *   Email: anders.ebrev@gmail.com
 *   Password: TestPassword123!
 */

import { prisma } from '../lib/prisma';
import { KeyStatus, BorrowerAffiliation } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Swedish names for realistic data
const SWEDISH_NAMES = [
  'Erik Andersson',
  'Anna Johansson',
  'Lars Karlsson',
  'Maria Nilsson',
  'Nils Eriksson',
  'Karin Larsson',
  'Johan Olsson',
  'Astrid Persson',
  'Gustav Svensson',
  'Ingrid Gustafsson',
  'Björn Pettersson',
  'Margareta Jonsson',
  'Carl Lindberg',
  'Elisabet Hansson',
  'Magnus Jansson',
  'Agneta Bengtsson',
  'Per Mattsson',
  'Birgitta Fredriksson',
  'Ulf Henriksson',
  'Gunilla Sandberg',
  'Leif Forsberg',
  'Eva Lundin',
  'Sven Holm',
  'Inger Lindström',
  'Rolf Sjöberg',
  'Barbro Östlund',
  'Kent Blomqvist',
  'Britt Lundqvist',
  'Torbjörn Engström',
  'Gunvor Danielsson',
  'Bengt Håkansson',
  'Gunnel Martinsson',
  'Tommy Sköld',
  'Monica Samuelsson',
  'Kjell Holmberg',
  'Anita Axelsson',
  'Hans Nordström',
  'Ulla Viklund',
  'Stefan Lindqvist',
  'Margaretha Berg',
  'Christer Sundström',
  'Gun Hedström',
  'Göran Fransson',
  'Yvonne Strand',
  'Mats Eklund',
  'Sonja Nyström',
  'Lennart Wallin',
  'Maj-Britt Lund',
  'Bo Borg',
  'Gunhild Åberg',
  'Arne Holmgren',
  'Britta Lindahl',
];

const PHONE_PREFIXES = ['070', '072', '073', '076', '079'];
const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'telia.com', 'bredband.net', 'outlook.com'];

function generateSwedishPhone(): string {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const suffix = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return `${prefix}-${suffix.slice(0, 3)} ${suffix.slice(3)}`;
}

function generateEmail(name: string): string {
  const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)];
  const emailName = name
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z.]/g, '');
  return `${emailName}@${domain}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function createBorrower(
  name: string,
  entityId: string,
  entityKey: string,
  company?: string | null,
  isExternal: boolean = false,
) {
  const { encryptWithEntityKey } = await import('../lib/entity-encryption');

  const email =
    Math.random() > 0.1
      ? generateEmail(name)
      : `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;
  const phone = Math.random() > 0.05 ? generateSwedishPhone() : null;

  if (isExternal || company) {
    // Create external borrower with encryption
    const externalBorrower = await prisma.externalBorrower.create({
      data: {
        name: encryptWithEntityKey(name, entityKey)!,
        email: encryptWithEntityKey(email, entityKey)!,
        phone: encryptWithEntityKey(phone, entityKey),
        company: encryptWithEntityKey(company, entityKey),
        address: isExternal
          ? encryptWithEntityKey(
              `${Math.floor(Math.random() * 999 + 1)} Gatan, Stockholm`,
              entityKey,
            )
          : null,
      },
    });

    return await prisma.borrower.create({
      data: {
        affiliation: BorrowerAffiliation.EXTERNAL,
        externalBorrowerId: externalBorrower.id,
        entityId,
      },
    });
  } else {
    // Create resident borrower with encryption
    const residentBorrower = await prisma.residentBorrower.create({
      data: {
        name: encryptWithEntityKey(name, entityKey)!,
        email: encryptWithEntityKey(email, entityKey)!,
        phone: encryptWithEntityKey(phone, entityKey),
      },
    });

    return await prisma.borrower.create({
      data: {
        affiliation: BorrowerAffiliation.RESIDENT,
        residentBorrowerId: residentBorrower.id,
        entityId,
      },
    });
  }
}

async function main() {
  console.log('🧹 Cleaning existing key data...');
  // Clean up existing key data in correct order (but keep users!)
  await prisma.issueRecord.deleteMany({});
  await prisma.keyCopy.deleteMany({});
  await prisma.borrower.deleteMany({});
  await prisma.residentBorrower.deleteMany({});
  await prisma.externalBorrower.deleteMany({});
  await prisma.keyType.deleteMany({});

  console.log('👤 Setting up entity with fresh encryption key...');

  // Always recreate entity to ensure encryption key consistency
  const entityName = 'Testgården Bostadsrättsförening';

  // Delete existing entity if it exists (cascade will delete users too)
  const existingEntity = await prisma.entity.findUnique({
    where: { name: entityName },
  });

  if (existingEntity) {
    console.log('🗑️  Deleting existing entity for fresh start...');
    await prisma.entity.delete({
      where: { id: existingEntity.id },
    });
  }

  // Create fresh entity with new encryption key
  console.log('🏢 Creating entity with fresh encryption key...');
  const { generateEntityKey, encryptEntityKey } = await import('../lib/entity-encryption');
  const plainEntityKey = generateEntityKey();
  const encryptedEntityKey = encryptEntityKey(plainEntityKey);

  const entity = await prisma.entity.create({
    data: {
      name: entityName,
      encryptionKey: encryptedEntityKey,
    },
  });
  console.log(`✅ Created entity: ${entity.name}`);

  // Create Supabase Admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.log(
      '⚠️  WARNING: Supabase credentials not found. Skipping Supabase Auth user creation.',
    );
    console.log('   Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local');
  }

  const testEmail = 'anders.ebrev@gmail.com';
  const testPassword = 'TestPassword123!'; // Default password

  // Create or update Supabase Auth user
  if (supabaseUrl && supabaseSecretKey) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔐 Creating/updating Supabase Auth user...');

    // Check if auth user exists
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users.find((u) => u.email === testEmail);

    if (existingAuthUser) {
      console.log(`Found existing Supabase Auth user: ${testEmail}`);
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: testPassword, email_confirm: true },
      );

      if (updateError) {
        console.log(`⚠️  Error updating Supabase Auth user: ${updateError.message}`);
      } else {
        console.log(`✅ Updated Supabase Auth user password`);
      }
    } else {
      // Create new auth user
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      if (createError) {
        console.log(`⚠️  Error creating Supabase Auth user: ${createError.message}`);
      } else {
        console.log(`✅ Created Supabase Auth user: ${testEmail}`);
      }
    }
  }

  // Create fresh database user (entity was just created, so user doesn't exist)
  console.log('👤 Creating database user...');
  const existingUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Anders Jacobson',
      entityId: entity.id,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created database user: ${existingUser.email}`);

  const userId = existingUser.id;
  const entityId = entity.id;

  // Use the plainEntityKey we generated earlier (no need to decrypt)
  const entityKey = plainEntityKey;

  console.log(`Using user: ${existingUser.name || existingUser.email} (${userId})`);
  console.log(`✅ Using plain entity encryption key for borrower data`);

  console.log('🗝️ Creating key types...');
  // Create key types as specified
  const keyTypes = [
    {
      label: 'C',
      function: 'Fastighetsskötare',
      accessArea: 'Trapphus, Källare, Tvättstuga, Soprum, Cykelrum, Förråd',
      copies: 10,
    },
    {
      label: 'E',
      function: 'Sophämtning',
      accessArea: 'Soprum',
      copies: 5,
    },
    {
      label: 'G',
      function: 'Husmorsnyckel',
      accessArea: 'Källare, Tvättstuga',
      copies: 35,
    },
    {
      label: 'L',
      function: 'Tvättstuga',
      accessArea: 'Tvättstuga',
      copies: 15,
    },
    {
      label: 'M',
      function: 'Förråd Gökärtsvägen',
      accessArea: 'Förråd Gök',
      copies: 20,
    },
    {
      label: 'N',
      function: 'Förråd Pilvägen',
      accessArea: 'Förråd Pil',
      copies: 10,
    },
  ];

  const createdKeyTypes = [];
  for (const keyType of keyTypes) {
    const created = await prisma.keyType.create({
      data: {
        label: keyType.label,
        function: keyType.function,
        accessArea: keyType.accessArea,
        entityId: entityId,
      },
    });
    createdKeyTypes.push({ ...created, expectedCopies: keyType.copies });
  }

  console.log('📋 Creating key copies...');
  // Create key copies for each type
  const allKeyCopies = [];
  for (const keyType of createdKeyTypes) {
    for (let i = 1; i <= keyType.expectedCopies; i++) {
      // Randomize status with realistic distribution
      let status: KeyStatus;
      const rand = Math.random();
      if (rand < 0.05) {
        // 5% lost
        status = KeyStatus.LOST;
      } else if (rand < 0.8) {
        // 75% out (in use)
        status = KeyStatus.OUT;
      } else {
        // 20% available
        status = KeyStatus.AVAILABLE;
      }

      const keyCopy = await prisma.keyCopy.create({
        data: {
          keyTypeId: keyType.id,
          copyNumber: i,
          status: status,
        },
      });
      allKeyCopies.push({ ...keyCopy, keyTypeLabel: keyType.label });
    }
  }

  console.log('👥 Creating borrowers and lending records...');
  // Create borrowers and lending records based on business logic
  const shuffledNames = shuffleArray(SWEDISH_NAMES);
  let nameIndex = 0;

  // Get keys that are OUT (need borrowers)
  const outKeys = allKeyCopies.filter((key) => key.status === KeyStatus.OUT);

  // Group keys by type for business logic
  const gKeys = outKeys.filter((key) => key.keyTypeLabel === 'G');
  const mKeys = outKeys.filter((key) => key.keyTypeLabel === 'M');
  const nKeys = outKeys.filter((key) => key.keyTypeLabel === 'N');
  const otherKeys = outKeys.filter((key) => !['G', 'M', 'N'].includes(key.keyTypeLabel));

  // Business logic: Most people with G key also have M or N key
  const gKeyHolders = [];
  for (const gKey of gKeys) {
    if (nameIndex >= shuffledNames.length) break;

    const name = shuffledNames[nameIndex++];
    const isCompanyContact = Math.random() > 0.8; // 20% are company contacts
    const borrower = await createBorrower(
      name,
      entityId,
      entityKey,
      isCompanyContact ? 'Bostadsrättsföreningen' : null,
      false, // Residents are not external
    );

    gKeyHolders.push(borrower);

    // Create lending record for G key
    await prisma.issueRecord.create({
      data: {
        keyCopyId: gKey.id,
        borrowerId: borrower.id,
        issuedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        dueDate:
          Math.random() > 0.7
            ? new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
            : null, // 30% have end date
        idChecked: Math.random() > 0.1, // 90% ID checked
        returnedDate: null,
        entityId: entityId,
        userId: userId,
      },
    });
  }

  // Give M or N keys to G key holders (80% chance)
  const storageKeys = [...mKeys, ...nKeys];
  let storageKeyIndex = 0;

  for (const holder of gKeyHolders) {
    if (Math.random() < 0.8 && storageKeyIndex < storageKeys.length) {
      const storageKey = storageKeys[storageKeyIndex++];

      await prisma.issueRecord.create({
        data: {
          keyCopyId: storageKey.id,
          borrowerId: holder.id,
          issuedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          dueDate:
            Math.random() > 0.8
              ? new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
              : null,
          idChecked: Math.random() > 0.1,
          returnedDate: null,
          entityId: entityId,
          userId: userId,
        },
      });
    }
  }

  // Handle remaining storage keys and other keys
  const remainingKeys = [...storageKeys.slice(storageKeyIndex), ...otherKeys];

  for (const key of remainingKeys) {
    if (nameIndex >= shuffledNames.length) break;

    const name = shuffledNames[nameIndex++];
    const company =
      key.keyTypeLabel === 'E'
        ? 'Avfallshantering AB'
        : key.keyTypeLabel === 'C'
          ? 'Fastighetsskötsel Service'
          : null;

    const borrower = await createBorrower(
      name,
      entityId,
      entityKey,
      company,
      !!company, // External if they have a company
    );

    await prisma.issueRecord.create({
      data: {
        keyCopyId: key.id,
        borrowerId: borrower.id,
        issuedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        dueDate:
          key.keyTypeLabel === 'E'
            ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
            : Math.random() > 0.6
              ? new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
              : null,
        idChecked: Math.random() > 0.05,
        returnedDate: null,
        entityId: entityId,
        userId: userId,
      },
    });
  }

  console.log('📊 Seed data summary:');
  const keyTypeCounts = await prisma.keyType.findMany({
    include: {
      keyCopies: {
        include: {
          issueRecords: {
            where: { returnedDate: null },
          },
        },
      },
    },
  });

  for (const keyType of keyTypeCounts) {
    const total = keyType.keyCopies.length;
    const inUse = keyType.keyCopies.filter((copy) => copy.status === KeyStatus.OUT).length;
    const available = keyType.keyCopies.filter(
      (copy) => copy.status === KeyStatus.AVAILABLE,
    ).length;
    const lost = keyType.keyCopies.filter((copy) => copy.status === KeyStatus.LOST).length;

    console.log(
      `${keyType.label}: ${total} total (${inUse} in use, ${available} available, ${lost} lost)`,
    );
  }

  const totalBorrowers = await prisma.borrower.count();
  const totalIssueRecords = await prisma.issueRecord.count();

  console.log(`\n✅ Created ${totalBorrowers} borrowers and ${totalIssueRecords} issue records`);
  console.log('🎉 Comprehensive seed data created successfully!');

  console.log('\n═══════════════════════════════════════');
  console.log('🔑 TEST USER CREDENTIALS');
  console.log('═══════════════════════════════════════');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log('═══════════════════════════════════════');
  console.log('\n💡 You can now login at: http://localhost:3000\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
