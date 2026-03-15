'use client';

import { useState, useActionState } from 'react';
import { inviteUser, cancelInvitation } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@prisma/client';
import { IconUserPlus, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
}

type InviteActionState =
  | { success: true; data?: { inviteId: string; token: string } }
  | { success: false; error: string };

async function inviteAction(
  prevState: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const email = formData.get('email') as string;
  const role = formData.get('role') as UserRole;
  return await inviteUser(email, role);
}

export function TeamInviteSection({
  userRole,
  invitations,
}: {
  userRole: UserRole;
  invitations: Invitation[];
}) {
  const t = useTranslations('settings');
  const [state, formAction] = useActionState<InviteActionState, FormData>(inviteAction, {
    success: false,
    error: '',
  });
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [loading, setLoading] = useState<string | null>(null);

  const canInviteAdmin = userRole === 'OWNER';

  async function handleCancel(id: string) {
    setLoading(id);
    const result = await cancelInvitation(id);
    setLoading(null);
    if (!result.success) alert(result.error);
    else location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t('inviteHeading')}</h2>
          <p className="text-sm text-muted-foreground">{t('inviteDescription')}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t('inviteEmailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('inviteEmailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('inviteRoleLabel')}</Label>
              <Select name="role" value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">{t('inviteRoleMember')}</SelectItem>
                  {canInviteAdmin && <SelectItem value="ADMIN">{t('inviteRoleAdmin')}</SelectItem>}
                  {canInviteAdmin && <SelectItem value="OWNER">{t('inviteRoleOwner')}</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'MEMBER' && t('inviteRoleMemberDesc')}
                {role === 'ADMIN' && t('inviteRoleAdminDesc')}
                {role === 'OWNER' && t('inviteRoleOwnerDesc')}
              </p>
            </div>
          </div>

          {!state.success && state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {state.success && (
            <p className="text-sm text-green-600 dark:text-green-400">{t('inviteSuccess')}</p>
          )}

          <Button type="submit" className="gap-1.5">
            <IconUserPlus className="h-4 w-4" />
            {t('inviteSend')}
          </Button>
        </form>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{t('invitePendingHeading')}</h3>
            <p className="text-sm text-muted-foreground">{t('invitePendingDescription')}</p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inviteEmailHeader')}</TableHead>
                  <TableHead>{t('inviteRoleHeader')}</TableHead>
                  <TableHead>{t('inviteInvitedByHeader')}</TableHead>
                  <TableHead>{t('inviteExpiresHeader')}</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  // eslint-disable-next-line react-hooks/purity
                  const now = Date.now();
                  const daysLeft = Math.ceil(
                    (new Date(inv.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24),
                  );

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.inviterName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            daysLeft <= 1
                              ? 'text-destructive text-sm'
                              : 'text-muted-foreground text-sm'
                          }
                        >
                          {t('inviteDaysLeft', { days: daysLeft })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleCancel(inv.id)}
                          disabled={loading === inv.id}
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
