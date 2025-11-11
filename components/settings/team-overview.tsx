'use client';

import { Badge } from '@/components/ui/badge';
import { IconShieldCheck, IconShield, IconUser } from '@tabler/icons-react';
import type { UserRole } from '@prisma/client';

interface TeamOverviewProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    roleInActiveOrg: UserRole;
  };
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

export function TeamOverview({ user }: TeamOverviewProps) {
  const Icon = roleIcons[user.roleInActiveOrg];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your account information in this organisation
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="text-sm mt-1">{user.email}</p>
        </div>

        {user.name && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-sm mt-1">{user.name}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-muted-foreground">Role</label>
          <div className="mt-1">
            <Badge className={roleColors[user.roleInActiveOrg]}>
              <Icon className="h-3 w-3 mr-1" />
              {user.roleInActiveOrg}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
