'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export default function LogoutPage() {
  const t = useTranslations('auth.logout');
  const router = useRouter();
  useEffect(() => {
    async function signOut() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/auth/login');
    }
    signOut();
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 text-center">
        <span className="text-lg">{t('loggingOut')}</span>
      </div>
    </main>
  );
}
