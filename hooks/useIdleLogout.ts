'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default function useIdleLogout() {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  // useMemo ensures the client is created once per component mount, not on every render.
  // This also prevents the useEffect below from re-running on every render cycle.
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      router.push('/auth/login');
    };

    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(logout, IDLE_TIMEOUT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [router, supabase]);
}
