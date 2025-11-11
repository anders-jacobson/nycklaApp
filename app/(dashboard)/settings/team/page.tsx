import { getCurrentUser } from '@/lib/auth-utils';
import { listTeamMembers, listPendingInvitations } from '@/app/actions/team';
import { Separator } from '@/components/ui/separator';
import { TeamOverview } from '@/components/settings/team-overview';
import { TeamMembersSection } from '@/components/settings/team-members-section';
import { TeamInviteSection } from '@/components/settings/team-invite-section';

export default async function TeamSettingsPage() {
  const user = await getCurrentUser();

  // Get organization name
  const { prisma } = await import('@/lib/prisma');
  const entity = await prisma.entity.findUnique({
    where: { id: user.activeOrganisationId },
    select: { name: true, createdAt: true },
  });

  const membersResult = await listTeamMembers();
  const invitationsResult =
    user.roleInActiveOrg !== 'MEMBER' ? await listPendingInvitations() : null;

  const members = membersResult.success ? membersResult.data : [];
  const invitations = invitationsResult?.success ? invitationsResult.data : [];
  const canInvite = ['OWNER', 'ADMIN'].includes(user.roleInActiveOrg);

  return (
    <div className="max-w-4xl space-y-6">
      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Organization</h2>
          <p className="text-sm text-muted-foreground">Your housing cooperative</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-sm mt-1 font-medium">{entity?.name || 'Loading...'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <p className="text-sm mt-1">
              {entity?.createdAt
                ? new Date(entity.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Loading...'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Members</label>
            <p className="text-sm mt-1">
              {members.length} team member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <TeamOverview user={user} />

      <Separator />

      <TeamMembersSection members={members} currentUser={user} canInvite={canInvite} />

      {canInvite && (
        <>
          <Separator />
          <TeamInviteSection userRole={user.role} invitations={invitations} />
        </>
      )}
    </div>
  );
}
