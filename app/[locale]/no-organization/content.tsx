'use client';

import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { IconBuilding, IconTicket } from '@tabler/icons-react';
import { logout } from '@/app/actions/auth';
import { acceptInvitation, validateInvitationToken } from '@/app/actions/team';

export function NoOrganizationContent() {
  const router = useRouter();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleJoinViaCode(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setMessage('Please enter an invitation code.');
      return;
    }

    setMessage(null);
    startTransition(async () => {
      // First validate the token
      const validateResult = await validateInvitationToken(inviteCode.trim());
      if (!validateResult.success) {
        setMessage(validateResult.error);
        return;
      }

      // Accept the invitation
      const acceptResult = await acceptInvitation(inviteCode.trim());
      if (!acceptResult.success) {
        setMessage(acceptResult.error);
        return;
      }

      // Success - redirect to welcome screen
      router.push('/welcome?from=invitation');
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-background">
          <IconBuilding className="h-10 w-10 text-foreground" />
        </div>

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Welcome to Nyckla</h1>
          <p className="text-base text-muted-foreground px-4">
            Your account is ready. Create a new organization or join an existing one with an
            invitation code.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link href="/create-organization" className="block">
            <Button className="w-full" size="lg">
              <IconBuilding className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setIsJoinDialogOpen(true)}
          >
            <IconTicket className="mr-2 h-4 w-4" />
            Join with Invitation Code
          </Button>

          <form action={logout}>
            <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Join via Invitation Dialog */}
      <ResponsiveDialog
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        title="Join Organization"
        description="Enter the invitation code you received via email"
      >
        <form onSubmit={handleJoinViaCode} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">Invitation Code</Label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter code here"
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          {message && <p className="text-sm text-destructive">{message}</p>}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsJoinDialogOpen(false);
                setInviteCode('');
                setMessage(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Joining...' : 'Join Organization'}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
