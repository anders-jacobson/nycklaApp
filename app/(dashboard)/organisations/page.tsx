import { getCurrentUser } from '@/lib/auth-utils';
import { listUserOrganisations } from '@/app/actions/organisation';
import { OrganisationCards } from '@/components/organisations/organisation-cards';
import { CreateOrganisationDialog } from '@/components/organisations/create-organisation-dialog';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';

export default async function OrganisationsPage() {
  const user = await getCurrentUser();
  const organisationsResult = await listUserOrganisations();
  
  const organisations = organisationsResult.success ? organisationsResult.data || [] : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
            <p className="text-muted-foreground">
              Manage your organisations and switch between them
            </p>
          </div>
          <CreateOrganisationDialog>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Organisation
            </Button>
          </CreateOrganisationDialog>
        </div>

        {/* Organisation Cards */}
        <OrganisationCards 
          organisations={organisations}
          activeOrganisationId={user.activeOrganisationId}
        />
      </div>
    </div>
  );
}






