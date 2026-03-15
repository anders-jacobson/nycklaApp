import { Suspense } from 'react';
import { IssueKeyWorkflow } from '@/components/workflow/issue-key-workflow';
import { getAvailableKeyTypes } from '@/app/actions/issueKey';

export default async function IssueKeyPage() {
  // Fetch initial data for the workflow
  const keyTypesResult = await getAvailableKeyTypes();
  const keyTypes = keyTypesResult.success ? keyTypesResult.data || [] : [];

  return (
    <div className="h-full flex flex-col">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-pulse h-4 w-32 bg-muted rounded mx-auto" />
              <div className="text-sm text-muted-foreground">Loading workflow...</div>
            </div>
          </div>
        }
      >
        <IssueKeyWorkflow initialKeyTypes={keyTypes} />
      </Suspense>
    </div>
  );
}
