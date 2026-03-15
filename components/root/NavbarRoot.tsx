'use client';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export default function NavbarRoot() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check initial user
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          setLoggedIn(false);
        } else if (user) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

        setIsLoading(false);
      } catch {
        setLoggedIn(false);
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Force reload to clear any cached state
    window.location.reload();
  };

  if (isLoading) {
    return (
      <nav className="w-full border-b bg-background">
        <div className="max-w-[1140px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="font-bold text-lg tracking-tight text-primary">LOGO</div>
          <div className="flex gap-2">
            <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            <div className="w-16 h-9 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b bg-background">
      <div className="max-w-[1140px] mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="font-bold text-lg tracking-tight text-primary">LOGO</div>
        {/* Navigation actions */}
        <div className="flex gap-2">
          {loggedIn ? (
            <>
              <Link href="/active-loans">
                <Button variant="default">Dashboard</Button>
              </Link>
              <Button variant="secondary" onClick={handleLogout} type="button">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="default">Sign Up</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Log In</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
