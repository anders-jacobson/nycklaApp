import { getCurrentUser } from '@/lib/auth-utils';
import { listTeamMembers, listPendingInvitations } from '@/app/actions/team';
import { Separator } from '@/components/ui/separator';
import { TeamMembersSection } from '@/components/settings/team-members-section';
import { TeamInviteSection } from '@/components/settings/team-invite-section';
import { OrganizationOverview } from '@/components/settings/organization-overview';
import { DeleteOrganizationSection } from '@/components/settings/delete-organization-section';

// Revalidate every 30 seconds - balance freshness vs performance
// On-demand revalidation happens via revalidatePath() in actions
export const revalidate = 30;

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser();

  // Get organization details
  const { prisma } = await import('@/lib/prisma');
  const entity = await prisma.entity.findUnique({
    where: { id: user.entityId },
    select: { name: true, createdAt: true },
  });

  const membersResult = await listTeamMembers();
  const invitationsResult =
    user.roleInActiveOrg !== 'MEMBER' ? await listPendingInvitations() : null;

  const members = membersResult.success ? (membersResult.data ?? []) : [];
  const invitations = invitationsResult?.success ? (invitationsResult.data ?? []) : [];
  const canInvite = ['OWNER', 'ADMIN'].includes(user.roleInActiveOrg);
  const isOwner = user.roleInActiveOrg === 'OWNER';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization and add or remove members
        </p>
      </div>

      <Separator />

      <OrganizationOverview 
        organizationName={entity?.name || ''} 
        isOwner={isOwner}
      />

      <Separator />

      <TeamMembersSection members={members} currentUser={user} />

      {canInvite && (
        <>
          <Separator />
          <TeamInviteSection userRole={user.roleInActiveOrg} invitations={invitations} />
        </>
      )}

      {isOwner && (
        <>
          <Separator />
          <DeleteOrganizationSection organizationName={entity?.name || ''} isOwner={isOwner} />
        </>
      )}
    </div>
  );
}

