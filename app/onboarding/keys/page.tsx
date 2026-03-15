import { redirect } from 'next/navigation';
import { getCurrentUserOrNull } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export default async function OnboardingPage() {
  // Use getCurrentUserOrNull (doesn't throw if no orgs)
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect('/auth/login');
  }

  const entityId = user.activeOrganisationId || user.organisations[0]?.organisationId;

  if (!entityId) {
    redirect('/no-organization');
  }

  // Check if organization has a name
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: { name: true },
  });

  // If organization has a name, skip Step 1 and go to Step 2 (Access Areas)
  if (entity?.name) {
    redirect('/onboarding/keys/step-2');
  }

  // Otherwise, start at Step 1 to collect organization name
  redirect('/onboarding/keys/step-1');
}
