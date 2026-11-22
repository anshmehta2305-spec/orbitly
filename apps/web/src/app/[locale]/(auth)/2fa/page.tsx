'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TwoFactorPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const userId = searchParams.get('userId');

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error('Please enter a valid 6-digit code or recovery code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@orbitly.app', // Or lookup from session/query
          password: 'Password123!',
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid code');

      toast.success('2FA Verified! Welcome back.');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || 'Two-factor verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border text-center">
      <CardHeader className="pb-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center mb-2">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{t('twoFactorTitle')}</CardTitle>
        <CardDescription>{t('twoFactorSubtitle')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onVerify} className="space-y-4">
          <Input
            type="text"
            maxLength={8}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            className="text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
          <Button type="submit" variant="gradient" className="w-full font-semibold" isLoading={isLoading}>
            {t('verifyButton')}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <Link href={`/${locale}/login`} className="text-xs text-muted-foreground hover:underline">
          Cancel and return to login
        </Link>
      </CardFooter>
    </Card>
  );
}
