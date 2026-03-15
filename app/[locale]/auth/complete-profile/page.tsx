'use client';
import { useState, useEffect } from 'react';
import { updateUser } from '@/app/actions/updateProfile';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompleteProfilePage() {
  const t = useTranslations('auth.completeProfile');
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [fetchingEmail, setFetchingEmail] = useState(true);

  useEffect(() => {
    async function fetchEmail() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setFetchingEmail(false);
    }
    fetchEmail();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!email) {
      setError(t('noEmail'));
      setLoading(false);
      return;
    }
    const result = await updateUser({ email, name });
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    // Success: redirect to dashboard
    router.replace('/active-loans');
  }

  if (fetchingEmail) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 text-center">
          <span className="text-lg">{t('loading')}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">{t('heading')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-lg font-medium">
              {t('nameLabel')}
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-lg"
              placeholder={t('namePlaceholder')}
            />
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t('saving') : t('saveAndContinue')}
          </Button>
        </form>
      </div>
    </main>
  );
}
