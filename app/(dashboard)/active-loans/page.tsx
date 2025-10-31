import { DataTable } from '@/components/active-loans/borrowers-table';
import OverdueChart from '@/components/active-loans/overdue-chart';
import { getBorrowersWithKeysGrouped, getOverdueSummary } from '@/app/actions/dashboard';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ borrowerId?: string }>;
}) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Fetch data for chart and table
  const [borrowersData, overdueSummary] = await Promise.all([
    getBorrowersWithKeysGrouped(),
    getOverdueSummary(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <OverdueChart data={overdueSummary} />
          </div>
          <div className="px-4 lg:px-6">
            <DataTable data={borrowersData} highlightBorrowerId={params.borrowerId} />
          </div>
        </div>
      </div>
    </div>
  );
}
