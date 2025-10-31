import { DataTable } from '@/components/active-loans/borrowers-table';
import { getBorrowersWithKeysGrouped } from '@/app/actions/dashboard';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ borrowerId?: string }>;
}) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Fetch grouped borrower data for table
  const borrowersData = await getBorrowersWithKeysGrouped();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <DataTable data={borrowersData} highlightBorrowerId={params.borrowerId} />
          </div>
        </div>
      </div>
    </div>
  );
}
