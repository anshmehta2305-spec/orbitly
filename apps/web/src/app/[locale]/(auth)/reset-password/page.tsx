'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordInput } from '@orbitly/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  });

  const onReset = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Password reset failed');

      toast.success('Your password has been updated. Please sign in.');
      router.push(`/${locale}/login`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">{t('resetPasswordTitle')}</CardTitle>
        <CardDescription>Choose a new, strong password for your Orbitly account.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onReset)} className="space-y-4">
          <input type="hidden" {...register('token')} value={token} />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">New Password</label>
            <Input
              type="password"
              placeholder="Minimum 8 characters, uppercase, number"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full font-semibold" isLoading={isLoading}>
            Update Password
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <Link href={`/${locale}/login`} className="text-xs text-primary hover:underline font-semibold">
          Return to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
