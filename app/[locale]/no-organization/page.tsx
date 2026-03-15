import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NoOrganizationContent } from './content';

export default async function NoOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  // Check auth without using getCurrentUser (which throws for no orgs)
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    // Not authenticated at all - go to login
    redirect('/auth/login');
  }

  // Check if user has any organizations (without throwing)
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      organisations: {
        select: { organisationId: true },
        take: 1,
      },
    },
  });

  // If user has an org, redirect to dashboard
  if (dbUser?.organisations && dbUser.organisations.length > 0) {
    redirect('/');
  }

  // User is authenticated but has no orgs - show this page
  return <NoOrganizationContent />;
}
