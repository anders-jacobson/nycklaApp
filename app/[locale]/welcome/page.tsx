import { setRequestLocale } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { WelcomeContent } from './content';

export default async function WelcomePage({
  searchParams,
  params: paramsPromise,
}: {
  searchParams: Promise<{ from?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await paramsPromise;
  setRequestLocale(locale as 'sv' | 'en');
  const params = await searchParams;
  const user = await getCurrentUser();

  // Determine which organization to show
  // getCurrentUser() returns entityId (which is the activeOrganisationId)
  // If somehow it's undefined (race condition), use first org from memberships
  const organisationId = user.entityId || user.allOrganisations[0]?.id;

  if (!organisationId) {
    // No organization found, redirect to no-org page
    redirect('/no-organization');
  }

  // Get organization details
  const organisation = await prisma.entity.findUnique({
    where: { id: organisationId },
    select: {
      name: true,
    },
  });

  if (!organisation) {
    // Organization doesn't exist anymore, redirect to no-org page
    redirect('/no-organization');
  }

  // Fetch quick stats for the organization
  const [keyTypeCount, keyCount, activeLoanCount] = await Promise.all([
    // Total key types
    prisma.keyType.count({
      where: { entityId: organisationId },
    }),
    // Total keys (copies)
    prisma.keyCopy.count({
      where: {
        keyType: {
          entityId: organisationId,
        },
      },
    }),
    // Active loans
    prisma.issueRecord.count({
      where: {
        entityId: organisationId,
        returnedDate: null,
      },
    }),
  ]);

  const from = params.from || 'join';

  return (
    <WelcomeContent
      organizationName={organisation.name}
      stats={{
        keyTypes: keyTypeCount,
        totalKeys: keyCount,
        activeLoans: activeLoanCount,
      }}
      from={from as 'create' | 'invitation' | 'join'}
    />
  );
}
