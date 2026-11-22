'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@orbitly/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to send reset instructions');
      setSubmitted(true);
      toast.success('Password reset instructions dispatched!');
    } catch (err: any) {
      toast.error(err.message || 'Error requesting reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">{t('forgotPassword')}</CardTitle>
        <CardDescription>
          Enter your registered work email and we will send you secure recovery instructions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <p className="text-sm font-medium">Check your email for the reset link.</p>
            <p className="text-xs text-muted-foreground">
              If running in dev, check Mailpit at <code className="bg-secondary px-1 py-0.5 rounded">http://localhost:8025</code>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{t('emailLabel')}</label>
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full font-semibold" isLoading={isLoading}>
              Send Recovery Link
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <Link href={`/${locale}/login`} className="text-xs text-primary hover:underline font-semibold">
          Return to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
