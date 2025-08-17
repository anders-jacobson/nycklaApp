'use client';
import { useState, useEffect } from 'react';
import { updateUser } from '@/app/actions/updateProfile';
import { createClient } from '@/lib/supabase/client';

export default function CompleteProfilePage() {
  const [cooperative, setCooperative] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [fetchingEmail, setFetchingEmail] = useState(true);

  useEffect(() => {
    async function fetchEmail() {
      setFetchingEmail(true);
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
      setError('Kunde inte hitta din e-post. Logga in igen.');
      setLoading(false);
      return;
    }
    const result = await updateUser({ email, cooperative });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    // Success: redirect to dashboard
    window.location.href = '/active-loans';
  }

  if (fetchingEmail) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 text-center">
          <span className="text-lg">Laddar...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Komplettera din profil</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cooperative" className="block text-lg font-medium mb-2">
              Bostadsrättsföreningens namn
            </label>
            <input
              id="cooperative"
              name="cooperative"
              type="text"
              required
              value={cooperative}
              onChange={(e) => setCooperative(e.target.value)}
              className="text-lg py-3 block w-full rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Brf Solrosen"
            />
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full text-lg py-3 bg-primary text-primary-foreground rounded-md"
            disabled={loading}
          >
            {loading ? 'Sparar...' : 'Spara och fortsätt'}
          </button>
        </form>
      </div>
    </main>
  );
}
