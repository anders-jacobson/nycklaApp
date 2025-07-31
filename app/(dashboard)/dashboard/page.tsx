import KeyChart from '@/components/dashboard/chart-bar';
import TotalStatusPieChart from '@/components/dashboard/chart-pie';
import { DataTable } from '@/components/dashboard/data-table';
import { getKeyStatusSummary, getBorrowedKeysTableData, getBorrowersWithKeysGrouped } from '@/app/actions/dashboard';
import { columns } from '@/components/dashboard/columns';

export default async function Page() {
  // Fetch both individual loan data and grouped borrower data
  const [keyChartData, borrowedKeysData, groupedBorrowersData] = await Promise.all([
    getKeyStatusSummary(),
    getBorrowedKeysTableData(),
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
            <DataTable 
              columns={columns} 
              data={borrowedKeysData} 
              allBorrowersData={groupedBorrowersData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
