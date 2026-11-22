'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function MagicLinkVerifyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('http://localhost:4000/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Magic link expired or invalid');
        setStatus('success');
        toast.success('Successfully authenticated with Magic Link!');
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 1200);
      })
      .catch((err) => {
        setStatus('error');
        toast.error(err.message);
      });
  }, [token, router, locale]);

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border text-center py-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Magic Link Authentication</CardTitle>
        <CardDescription>
          {status === 'verifying' && 'Verifying your secure passwordless token...'}
          {status === 'success' && 'Authenticated! Redirecting to your dashboard...'}
          {status === 'error' && 'This link is invalid or has expired.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'verifying' && (
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        )}
      </CardContent>
    </Card>
  );
}
