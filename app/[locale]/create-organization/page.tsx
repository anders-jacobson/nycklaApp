import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from './form';

export default async function CreateOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  // Check if user already has an organization
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    // Not authenticated, redirect to login
    redirect('/auth/login');
  }

  // Check if user has any organizations
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      organisations: {
        select: { organisationId: true },
        take: 1,
      },
    },
  });

  // If user already has an org, redirect to dashboard
  if (dbUser?.organisations && dbUser.organisations.length > 0) {
    redirect('/active-loans');
  }

  // User is authenticated and has no orgs - show form
  return <CreateOrganizationForm />;
}
