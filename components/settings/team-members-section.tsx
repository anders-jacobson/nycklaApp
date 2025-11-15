'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDots, IconShieldCheck, IconShield, IconUser } from '@tabler/icons-react';
import { changeUserRole, removeUser, leaveOrganisation } from '@/app/actions/team';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@prisma/client';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  joinedAt: Date;
}

interface CurrentUser {
  id: string;
  roleInActiveOrg: UserRole;
}

const roleIcons = {
  OWNER: IconShieldCheck,
  ADMIN: IconShield,
  MEMBER: IconUser,
};

const roleColors = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export function TeamMembersSection({
  members,
  currentUser,
}: {
  members: TeamMember[];
  currentUser: CurrentUser;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const isOwner = currentUser.roleInActiveOrg === 'OWNER';
  const ownerCount = members.filter((m) => m.role === 'OWNER').length;

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

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this organization?')) return;
    setLoading(currentUser.id);
    const result = await leaveOrganisation();
    setLoading(null);
    if (!result.success) {
      alert(result.error);
    } else {
      // If user needs to create a new organization, redirect them
      if (result.data?.needsOrganization) {
        router.push('/auth/complete-profile');
      } else {
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">People in your organization</p>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const Icon = roleIcons[member.role];
                const isSelf = member.id === currentUser.id;
                const isLastOwner = member.role === 'OWNER' && ownerCount === 1;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {member.email}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        {member.name && (
                          <p className="text-xs text-muted-foreground">{member.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role]} variant="secondary">
                        <Icon className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={loading === member.id}
                          >
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isSelf ? (
                            // Menu for current user (self)
                            <DropdownMenuItem
                              onClick={handleLeave}
                              disabled={isLastOwner}
                              className="text-destructive"
                            >
                              {isLastOwner ? 'Cannot leave (last owner)' : 'Leave organization'}
                            </DropdownMenuItem>
                          ) : isOwner ? (
                            // Menu for OWNER looking at other users
                            <>
                              {member.role !== 'OWNER' && (
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, 'OWNER')}
                                >
                                  Promote to Owner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(
                                    member.id,
                                    member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN',
                                  )
                                }
                              >
                                Change to {member.role === 'ADMIN' ? 'Member' : 'Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(member.id, member.email)}
                                disabled={isLastOwner}
                                className="text-destructive"
                              >
                                {isLastOwner ? 'Cannot remove (last owner)' : 'Remove from team'}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            // Non-owner users can only leave
                            <DropdownMenuItem onClick={handleLeave} className="text-destructive">
                              Leave organization
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
