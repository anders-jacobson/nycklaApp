'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { signInWithOAuth, sendOtpCode, verifyOtpCode } from '@/app/actions/auth';
import { validateInvitationToken } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconBrandGoogle, IconUserPlus } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useTranslations } from 'next-intl';

type Step = 'email' | 'waiting';

interface InvitationInfo {
  email: string;
  organizationName: string;
  role: string;
}

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  // Validate invitation token on mount
  useEffect(() => {
    if (inviteToken) {
      startTransition(async () => {
        const result = await validateInvitationToken(inviteToken);
        if (result.success) {
          setInvitationInfo(result.data!);
          setEmail(result.data!.email); // Pre-fill email
        } else {
          setMessage(result.error);
        }
      });
    }
  }, [inviteToken]);

  // Cooldown timer to prevent spam
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !isPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(null);
      startTransition(async () => {
        const result = await verifyOtpCode(email, code);

        if (!result.success) {
          setMessage(tErrors(result.error as Parameters<typeof tErrors>[0]));
          return;
        }

        // Session is set, redirect via callback for user upsert
        router.push('/auth/callback');
      });
    }
  }, [code, email, isPending, router, tErrors]);

  async function handleGoogleSignIn() {
    const result = await signInWithOAuth('google', inviteToken || undefined);
    if (result?.error) {
      setMessage(result.error);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setMessage(null);
    startTransition(async () => {
      // Pass captchaToken and inviteToken to server action
      const result = await sendOtpCode(email, captchaToken || undefined, inviteToken || undefined);

      if (!result.success) {
        setMessage(tErrors(result.error as Parameters<typeof tErrors>[0]));
        // Reset CAPTCHA on error
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      setStep('waiting');
      setCooldownSeconds(60); // 60s cooldown

      // Reset CAPTCHA after successful send
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    });
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await verifyOtpCode(email, code);

      if (!result.success) {
        setMessage(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return;
      }

      // Session is set, redirect via callback for user upsert
      router.push('/auth/callback');
    });
  }

  return (
    <div className="w-full space-y-6">
      {invitationInfo ? (
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <IconUserPlus className="h-4 w-4" />
            <span>{t('invitedBadge')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('invitedJoin')} <strong>{invitationInfo.organizationName}</strong> {t('invitedAs')}{' '}
            <strong>{invitationInfo.role}</strong>
          </p>
        </div>
      ) : (
        <h1 className="text-2xl font-bold">Log In</h1>
      )}

      {step === 'email' ? (
        <>
          {/* Email OTP - PRIMARY */}
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-base">
                {t('emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="h-11 text-base"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </div>

            {/* Turnstile CAPTCHA Widget */}
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => {
                  setCaptchaToken(null);
                  setMessage(t('captchaFailed'));
                }}
                onExpire={() => setCaptchaToken(null)}
                options={{
                  theme: 'light',
                  size: 'normal',
                }}
              />
            </div>

            {message && <p className="text-sm text-destructive">{message}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || cooldownSeconds > 0 || !captchaToken}
              size="lg"
            >
              {isPending
                ? t('sending')
                : cooldownSeconds > 0
                  ? t('cooldown', { seconds: cooldownSeconds })
                  : !captchaToken
                    ? t('captchaFirst')
                    : t('continueWithEmail')}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">{t('orDivider')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google OAuth - SECONDARY */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-11"
            variant="outline"
            size="lg"
          >
            <IconBrandGoogle className="mr-2 h-5 w-5" />
            {t('signInWithGoogle')}
          </Button>
        </>
      ) : (
        /* Waiting for email - simplified design */
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold">{t('codeSentHeading')}</h1>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground">
                {t.rich('codeSentBody', {
                  email,
                  strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                })}
              </p>
              <p className="text-sm text-muted-foreground">{t('checkSpam')}</p>
            </div>
          </div>

          {/* OTP Code Input */}
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="flex justify-center gap-3">
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('otpPlaceholder')}
                maxLength={6}
                className="h-16 text-2xl text-center tracking-[0.5em] font-mono"
                autoComplete="one-time-code"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            </div>

            {message && <p className="text-sm text-destructive text-center">{message}</p>}

            {/* Hidden submit button for enter key */}
            <button type="submit" className="hidden" />
          </form>

          {/* Email Client Links */}
          <div className="flex justify-center gap-6">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z" />
              </svg>
              <span className="text-sm">{t('openGmail')}</span>
            </a>

            <a
              href="https://outlook.live.com/mail"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5L12 0l4.5 6H23q.41 0 .7.3.3.29.3.7v5zm-6.5 8.5v-8H7.88v8zM12 8.5l-3.75-5H5.5v5h13V3.5h-2.75z" />
              </svg>
              <span className="text-sm">{t('openOutlook')}</span>
            </a>
          </div>

          {/* Resend Button */}
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('email');
                setCode('');
                setMessage(null);
              }}
              disabled={cooldownSeconds > 0}
            >
              {cooldownSeconds > 0 ? t('cooldown', { seconds: cooldownSeconds }) : t('sendNewCode')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
