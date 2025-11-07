'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconTrash, IconShieldCheck, IconShield, IconUser } from '@tabler/icons-react';
import { changeUserRole, removeUser } from '@/app/actions/team';
import { useState } from 'react';
import type { UserRole } from '@prisma/client';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}

interface CurrentUser {
  id: string;
  role: UserRole;
}

const roleIcons = {
  OWNER: IconShieldCheck,
  ADMIN: IconShield,
  MEMBER: IconUser,
};

const roleColors = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-gray-100 text-gray-800',
};

export function TeamMembersTable({ members, currentUser }: { 
  members: TeamMember[]; 
  currentUser: CurrentUser;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const isOwner = currentUser.role === 'OWNER';

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setLoading(userId);
    const result = await changeUserRole(userId, newRole);
    setLoading(null);
    if (!result.success) alert(result.error);
    else location.reload();
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Remove ${email} from your organization?`)) return;
    setLoading(userId);
    const result = await removeUser(userId);
    setLoading(null);
    if (!result.success) alert(result.error);
    else location.reload();
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground">No team members yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {isOwner && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const Icon = roleIcons[member.role];
            const isSelf = member.id === currentUser.id;
            
            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    {member.name && <p className="text-sm text-muted-foreground">{member.email}</p>}
                    {isSelf && <Badge variant="outline" className="mt-1">You</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {isOwner && !isSelf ? (
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleRoleChange(member.id, role as UserRole)}
                      disabled={loading === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={roleColors[member.role]}>
                      <Icon className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {!isSelf && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(member.id, member.email)}
                        disabled={loading === member.id}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}




