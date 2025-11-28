'use client';

import { useState, useActionState } from 'react';
import { inviteUser } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@prisma/client';
import { IconUserPlus } from '@tabler/icons-react';

async function inviteAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const role = formData.get('role') as UserRole;
  return await inviteUser(email, role);
}

export function InviteUserForm({ userRole }: { userRole: UserRole }) {
  const [state, formAction] = useActionState(inviteAction, { success: false, error: '' });
  const [role, setRole] = useState<UserRole>('MEMBER');

  const canInviteAdmin = userRole === 'OWNER';

  return (
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
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-green-600">✓ Invitation sent successfully!</p>}

      <Button type="submit" className="gap-1.5">
        <IconUserPlus className="h-4 w-4" />
        Send Invitation
      </Button>
    </form>
  );
}
