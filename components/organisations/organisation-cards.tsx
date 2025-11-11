'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCheck, IconUsers, IconCalendar } from '@tabler/icons-react';
import { switchOrganisation } from '@/app/actions/organisation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { UserRole } from '@prisma/client';

interface Organisation {
  id: string;
  name: string;
  role: UserRole;
  memberCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface OrganisationCardsProps {
  organisations: Organisation[];
  activeOrganisationId: string;
}

const roleColors = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export function OrganisationCards({ organisations, activeOrganisationId }: OrganisationCardsProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  async function handleSwitch(organisationId: string) {
    if (organisationId === activeOrganisationId) return;
    
    setSwitching(organisationId);
    try {
      const result = await switchOrganisation(organisationId);
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to switch:', result.error);
        alert(result.error);
      }
    } catch (error) {
      console.error('Error switching organisation:', error);
    } finally {
      setSwitching(null);
    }
  }

  if (organisations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organisations</CardTitle>
          <CardDescription>
            You don't belong to any organisations yet. Create one to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {organisations.map((org) => (
        <Card 
          key={org.id} 
          className={org.isActive ? 'border-primary' : ''}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {org.name}
                  {org.isActive && (
                    <Badge variant="outline" className="ml-auto">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </div>
            <CardDescription>
              <Badge className={roleColors[org.role]}>
                {org.role}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconUsers className="h-4 w-4" />
                <span>{org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconCalendar className="h-4 w-4" />
                <span>
                  Created {new Date(org.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {org.isActive ? (
              <Button 
                variant="outline" 
                className="w-full"
                disabled
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Current Organisation
              </Button>
            ) : (
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => handleSwitch(org.id)}
                disabled={switching === org.id}
              >
                {switching === org.id ? 'Switching...' : 'Switch to this Organisation'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}




