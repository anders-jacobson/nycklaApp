import KeyChart from '@/components/active-loans/chart-bar';
import TotalStatusPieChart from '@/components/active-loans/chart-pie';
import { DataTable } from '@/components/active-loans/borrowers-table';
import { getKeyStatusSummary, getBorrowersWithKeysGrouped } from '@/app/actions/dashboard';

export default async function Page() {
  // Fetch key status for charts and grouped borrower data for table
  const [keyChartData, borrowersData] = await Promise.all([
    getKeyStatusSummary(),
    getBorrowersWithKeysGrouped(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <TotalStatusPieChart data={keyChartData} />
              <KeyChart data={keyChartData} />
            </div>
          </div>
          <div className="px-4 lg:px-6">
            <DataTable data={borrowersData} />
          </div>
        </div>
      </div>
    </div>
  );
}
