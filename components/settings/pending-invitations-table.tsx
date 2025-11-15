'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconX } from '@tabler/icons-react';
import { cancelInvitation } from '@/app/actions/team';
import { useState } from 'react';
import type { UserRole } from '@prisma/client';

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
}

export function PendingInvitationsTable({ invitations }: { invitations: Invitation[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setLoading(id);
    const result = await cancelInvitation(id);
    setLoading(null);
    if (!result.success) alert(result.error);
    else location.reload();
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => {
            const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            return (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{inv.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{inv.inviterName}</TableCell>
                <TableCell>
                  <span className={daysLeft <= 1 ? 'text-destructive' : 'text-muted-foreground'}>
                    {daysLeft}d left
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancel(inv.id)}
                    disabled={loading === inv.id}
                  >
                    <IconX className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}











