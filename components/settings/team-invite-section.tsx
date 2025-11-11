'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { inviteUser, cancelInvitation } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
}

async function inviteAction(prevState: any, formData: FormData) {
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
  const [state, formAction] = useFormState(inviteAction, { success: false, error: '' });
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
          <h2 className="text-xl font-semibold">Invite Team Member</h2>
          <p className="text-sm text-muted-foreground">
            Send an invitation to join your organization
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="colleague@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  {canInviteAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                  {canInviteAdmin && <SelectItem value="OWNER">Owner</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'MEMBER' && 'Can manage keys and issue loans'}
                {role === 'ADMIN' && 'Can manage keys and invite members'}
                {role === 'OWNER' && 'Full access to organization settings'}
              </p>
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          {state.success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Invitation sent successfully!
            </p>
          )}

          <Button type="submit" className="gap-1.5">
            <IconUserPlus className="h-4 w-4" />
            Send Invitation
          </Button>
        </form>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Pending Invitations</h3>
            <p className="text-sm text-muted-foreground">
              Invitations waiting to be accepted
            </p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const daysLeft = Math.ceil(
                    (new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
                          {daysLeft}d left
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





