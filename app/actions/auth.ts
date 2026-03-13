'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Google OAuth sign-in
export async function signInWithOAuth(provider: 'google', inviteToken?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    // Store inviteToken in a short-lived httpOnly cookie — Google does not forward
    // unknown query params, so queryParams: { inviteToken } silently drops the token.
    if (inviteToken) {
      const cookieStore = await cookies();
      cookieStore.set('invite_token', inviteToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });
    }
    redirect(data.url);
  }
}

// Send OTP code (hybrid: magic link + 6-digit code in same email)
// Following Supabase Auth CAPTCHA docs: https://supabase.com/docs/guides/auth/auth-captcha
export async function sendOtpCode(
  email: string,
  captchaToken?: string,
  inviteToken?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Magic link redirect
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // Auto-create user if doesn't exist
      shouldCreateUser: true,
      // Pass CAPTCHA token (required if CAPTCHA enabled in Supabase dashboard)
      captchaToken,
      // Pass invitation token in user_metadata (for callback to process)
      data: inviteToken ? { inviteToken } : undefined,
    },
  });

  if (error) {
    // Log full error for debugging (remove in production)
    console.error('Supabase OTP Error:', error);

    // Supabase global CAPTCHA gives specific error messages
    if (error.message.toLowerCase().includes('captcha')) {
      return {
        success: false,
        error: `Security verification failed: ${error.message}`,
      };
    }
    if (error.message.toLowerCase().includes('rate limit')) {
      return { success: false, error: 'Too many attempts. Please wait a moment and try again.' };
    }
    return {
      success: false,
      error: `Could not send email: ${error.message}`,
    };
  }

  return { success: true };
}

// Verify OTP code (for users who don't click the magic link)
export async function verifyOtpCode(
  email: string,
  token: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    if (error.message.toLowerCase().includes('expired')) {
      return { success: false, error: 'Code has expired. Request a new code.' };
    }
    if (
      error.message.toLowerCase().includes('invalid') ||
      error.message.toLowerCase().includes('token')
    ) {
      return {
        success: false,
        error: 'Invalid code. Please check that you entered the correct digits.',
      };
    }
    return { success: false, error: 'Verification failed. Please try again.' };
  }

  // Session is now set - revalidate and continue to callback
  revalidatePath('/', 'layout');
  return { success: true };
}

// Logout
export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/auth/login');
}
