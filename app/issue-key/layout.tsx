import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Issue Key - Key Management System',
  description: 'Issue keys to borrowers',
};

export default function IssueKeyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Full-screen workflow - no sidebar, no navigation */}
      <main className="h-screen overflow-hidden">{children}</main>
    </div>
  );
}
