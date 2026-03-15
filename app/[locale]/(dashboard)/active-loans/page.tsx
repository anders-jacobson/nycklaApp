import { setRequestLocale } from 'next-intl/server';
import { DataTable } from '@/components/active-loans/borrowers-table';
import OverdueChart from '@/components/active-loans/overdue-chart';
import { getBorrowersWithKeysGrouped, getOverdueSummary } from '@/app/actions/dashboard';

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<{ borrowerId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  // Await searchParams (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Fetch data for chart and table
  const [borrowersResult, overdueResult] = await Promise.all([
    getBorrowersWithKeysGrouped(),
    getOverdueSummary(),
  ]);

  const borrowersData = borrowersResult.success ? borrowersResult.data : [];
  const overdueSummary = overdueResult.success ? overdueResult.data : null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {overdueSummary && (
            <div className="px-4 lg:px-6">
              <OverdueChart data={overdueSummary} />
            </div>
          )}
          <div className="px-4 lg:px-6">
            <DataTable data={borrowersData} highlightBorrowerId={resolvedSearchParams.borrowerId} />
          </div>
        </div>
      </div>
    </div>
  );
}
