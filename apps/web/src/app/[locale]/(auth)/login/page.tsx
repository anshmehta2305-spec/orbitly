'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, MagicLinkRequestSchema, MagicLinkRequestInput } from '@orbitly/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [activeTab, setActiveTab] = useState<'password' | 'magic-link'>('password');
  const [isLoading, setIsLoading] = useState(false);

  // Password Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: 'demo@orbitly.app',
      password: 'Password123!',
    },
  });

  // Magic Link Form
  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    formState: { errors: magicErrors },
  } = useForm<MagicLinkRequestInput>({
    resolver: zodResolver(MagicLinkRequestSchema),
  });

  const onLogin = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      // Calls Next.js relative endpoint - works seamlessly in local dev, Vercel preview, and production
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Login failed');
      }

      if (resData.tokens?.accessToken) {
        localStorage.setItem('orbitly_access_token', resData.tokens.accessToken);
        localStorage.setItem('orbitly_user', JSON.stringify(resData.user));
        document.cookie = `orbitly_access_token=${resData.tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
      }

      if (resData.requiresTwoFactor) {
        toast.info('Two-factor authentication code required');
        router.push(`/${locale}/2fa?userId=${resData.userId}`);
        return;
      }

      toast.success('Signed in successfully!');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSendMagicLink = async (data: MagicLinkRequestInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to send magic link');

      toast.success('Magic link dispatched! Check your inbox or dev Mailpit at :8025.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-card-foreground">{t('loginTitle')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('loginSubtitle')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'password'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('passwordTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('magic-link')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'magic-link'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('magicLinkTab')}
          </button>
        </div>

        {activeTab === 'password' ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t('emailLabel')}</label>
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
                {...registerLogin('email')}
                error={loginErrors.email?.message}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-foreground">{t('passwordLabel')}</label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                {...registerLogin('password')}
                error={loginErrors.password?.message}
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full font-semibold" isLoading={isLoading}>
              {t('signInButton')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagicSubmit(onSendMagicLink)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t('emailLabel')}</label>
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
                {...registerMagic('email')}
                error={magicErrors.email?.message}
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full font-semibold" isLoading={isLoading}>
              {t('sendMagicLink')}
            </Button>
          </form>
        )}

        {/* OAuth Buttons */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-medium gap-2"
            onClick={() => {
              const isConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
              if (!isConfigured) {
                toast.error('Google OAuth is not configured. Please configure GOOGLE_CLIENT_ID in environment.');
              } else {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                window.location.href = `${apiUrl}/auth/oauth/google`;
              }
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-medium gap-2"
            onClick={() => {
              const isConfigured = Boolean(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID);
              if (!isConfigured) {
                toast.error('GitHub OAuth is not configured. Please configure GITHUB_CLIENT_ID in environment.');
              } else {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                window.location.href = `${apiUrl}/auth/oauth/github`;
              }
            }}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {t('dontHaveAccount')}{' '}
          <Link href={`/${locale}/signup`} className="text-primary hover:underline font-semibold">
            {t('signUpButton')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
