import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { IssueKeyWorkflow } from '@/components/workflow/issue-key-workflow';
import { getAvailableKeyTypes } from '@/app/actions/issueKey';

export default async function IssueKeyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  const t = await getTranslations({ locale: locale as 'sv' | 'en', namespace: 'issueKey' });
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
              <div className="text-sm text-muted-foreground">{t('loadingWorkflow')}</div>
            </div>
          </div>
        }
      >
        <IssueKeyWorkflow initialKeyTypes={keyTypes} />
      </Suspense>
    </div>
  );
}
