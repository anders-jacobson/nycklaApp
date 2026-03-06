'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function DonePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/keys');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
          <IconCheck className="h-12 w-12 text-primary-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Setup Complete!</h1>
          <p className="text-muted-foreground">
            Your key management system is ready. Redirecting you to the keys page...
          </p>
        </div>

        <Button onClick={() => router.push('/keys')} size="lg" className="h-12">
          Go to Keys Now
        </Button>
      </div>
    </div>
  );
}

