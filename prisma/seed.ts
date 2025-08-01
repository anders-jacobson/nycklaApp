import { prisma } from '../lib/prisma';
import { KeyStatus } from '@prisma/client';

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

async function main() {
  console.log('🧹 Cleaning existing key data...');
  // Clean up existing key data in correct order (but keep users!)
  await prisma.issueRecord.deleteMany({});
  await prisma.keyCopy.deleteMany({});
  await prisma.borrower.deleteMany({});
  await prisma.keyType.deleteMany({});

  console.log('👤 Finding or creating user...');
  // Find existing user or create one
  let existingUser = await prisma.user.findFirst({
    where: { cooperative: 'Testgården Bostadsrättsförening' },
  });

  if (!existingUser) {
    console.log('👤 Creating test user...');
    existingUser = await prisma.user.create({
      data: {
        email: 'anders.ebrev@gmail.com',
        name: 'Anders Jacobson',
        cooperative: 'Testgården Bostadsrättsförening',
      },
    });
  }

  const userId = existingUser.id;

  console.log(`Using specific user: ${existingUser.name || existingUser.email} (${userId})`);

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
        userId: userId,
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
    const borrower = await prisma.borrower.create({
      data: {
        name: name,
        email: Math.random() > 0.1 ? generateEmail(name) : null, // 90% have email
        phone: Math.random() > 0.05 ? generateSwedishPhone() : null, // 95% have phone
        company: Math.random() > 0.8 ? 'Bostadsrättsföreningen' : null, // 20% are company contacts
        userId: userId,
      },
    });

    gKeyHolders.push(borrower);

    // Create lending record for G key
    await prisma.issueRecord.create({
      data: {
        keyCopyId: gKey.id,
        borrowerId: borrower.id,
        issuedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        endDate:
          Math.random() > 0.7
            ? new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
            : null, // 30% have end date
        notes: Math.random() > 0.8 ? 'Boende i föreningen' : null,
        idChecked: Math.random() > 0.1, // 90% ID checked
        returnedDate: null,
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
          notes: Math.random() > 0.7 ? 'Förrådsplats' : null,
          idChecked: Math.random() > 0.1,
          returnedDate: null,
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
    const borrower = await prisma.borrower.create({
      data: {
        name: name,
        email: Math.random() > 0.15 ? generateEmail(name) : null,
        phone: Math.random() > 0.1 ? generateSwedishPhone() : null,
        company:
          key.keyTypeLabel === 'E'
            ? 'Avfallshantering AB'
            : key.keyTypeLabel === 'C'
              ? 'Fastighetsskötsel Service'
              : null,
        userId: userId,
      },
    });

    await prisma.issueRecord.create({
      data: {
        keyCopyId: key.id,
        borrowerId: borrower.id,
        issuedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        endDate:
          key.keyTypeLabel === 'E'
            ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
            : Math.random() > 0.6
              ? new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
              : null,
        notes:
          key.keyTypeLabel === 'E'
            ? 'Sophämtning torsdagar'
            : key.keyTypeLabel === 'C'
              ? 'Fastighetsskötsel'
              : key.keyTypeLabel === 'L'
                ? 'Tvättid bokad'
                : null,
        idChecked: Math.random() > 0.05,
        returnedDate: null,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
